import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { peoSchema, programRegisterSchema, updatePeoSchema, updateProgramSchema } from "../../../utils/validators/lms-schemas/programSchemas";
import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
import { peoPloMappings, peos, plos, programs, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, asc, inArray, sql } from "drizzle-orm";
import z from "zod";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";

export const addPEOsToProgram = async (req: Request, res: Response) => {
    try {
        const { programId } = req.params;
        const userId = req.userId;

        if (!isValidUUID(programId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID format" });
        }

        // Fetch program + user in one query
        const result = await db
            .select({
                programId: programs.id,
                programDept: programs.departmentTitle,
                userId: users.id,
                userRole: users.role,
                userDept: users.department,
            })
            .from(programs)
            .innerJoin(users, eq(users.id, userId))
            .where(eq(programs.id, programId))
            .limit(1);

        if (!result.length) {
            return res.status(NOT_FOUND).json({ message: "Program or user not found" });
        }

        const { programDept, userRole, userDept } = result[0];

        const isAdmin = userRole === AudienceEnum.Admin;
        const isDeptHead =
            userRole === AudienceEnum.DepartmentHead &&
            userDept === programDept;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to add PEOs to this program" });
        }

        const schema = z.object({
            peos: z.array(peoSchema).nonempty("PEOs must be a non-empty array")
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        // Validate PLO references
        const allPLOIds = Array.from(
            new Set(parsed.data.peos.flatMap(peo => peo.ploMapping.map(m => m.plo)))
        );

        const validPLOs = await db
            .select({ id: plos.id })
            .from(plos)
            .where(inArray(plos.id, allPLOIds));

        if (validPLOs.length !== allPLOIds.length) {
            return res.status(BAD_REQUEST).json({ message: "One or more PLO references are invalid" });
        }

        // Insert PEOs + mappings in a transaction
        const insertedPeos = await db.transaction(async (tx) => {
            const inserted = [];

            for (const peo of parsed.data.peos) {
                const [{ max }] = await tx
                    .select({ max: sql<number>`max(${peos.position})` })
                    .from(peos)
                    .where(eq(peos.programId, programId));

                const position = (max ?? -1) + 1;

                const [newPeo] = await tx
                    .insert(peos)
                    .values({
                        programId: programId,
                        title: peo.title,
                        description: peo.description,
                        position
                    })
                    .returning({ id: peos.id });

                if (peo.ploMapping && peo.ploMapping.length > 0) {
                    await tx.insert(peoPloMappings).values(
                        peo.ploMapping.map(m => ({
                            peoId: newPeo.id,
                            ploId: m.plo,
                            strength: m.strength,
                        }))
                    );
                }

                inserted.push(newPeo);
            }

            return inserted;
        });

        return res.status(CREATED).json({
            message: "PEOs added successfully",
            peos: insertedPeos,
        });

    } catch (err: any) {
        console.error("Error while adding PLOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while adding PEOs. Please try again.",
            error: err.message,
        });
    }
};

export const getPEOsForProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { programId } = req.params;

        if (!isValidUUID(programId)) {
            return res.status(NOT_FOUND).json({ message: "Invalid program ID" });
        }

        // Fetch user + program in one query
        const result = await db
            .select({
                userId: users.id,
                userRole: users.role,
                userDept: users.department,
                programId: programs.id,
                programTitle: programs.title,
                programDept: programs.departmentTitle,
            })
            .from(users)
            .innerJoin(programs, eq(programs.id, programId))
            .where(eq(users.id, userId))
            .limit(1);

        if (!result.length) {
            return res.status(NOT_FOUND).json({ message: "User or program not found" });
        }

        const { userRole, userDept, programDept } = result[0];

        // Role/department checks
        if (
            userRole !== AudienceEnum.Admin &&
            (!userDept || !Object.values(DepartmentEnum).includes(userDept as DepartmentEnum))
        ) {
            return res.status(FORBIDDEN).json({
                message: "You can only get PEOs for your department",
            });
        }

        if (
            userRole === AudienceEnum.DepartmentHead &&
            programDept !== userDept
        ) {
            return res.status(FORBIDDEN).json({
                message: "You can only access PEOs for programs in your department",
            });
        }

        // Fetch PEOs and their mapped PLOs
        const peosWithMappings = await db
            .select({
                id: peos.id,
                title: peos.title,
                description: peos.description,
                mappings: sql<
                    { ploId: string; ploCode: string; ploTitle: string; ploDescription: string; strength: number }[]
                >`json_agg(json_build_object(
                    'ploId', ${plos.id},
                    'ploCode', ${plos.code},
                    'ploTitle', ${plos.title},
                    'ploDescription', ${plos.description},
                    'strength', ${peoPloMappings.strength}
                )) FILTER (WHERE ${plos.id} IS NOT NULL)`,
            })
            .from(peos)
            .leftJoin(peoPloMappings, eq(peoPloMappings.peoId, peos.id))
            .leftJoin(plos, eq(plos.id, peoPloMappings.ploId))
            .where(eq(peos.programId, programId))
            .groupBy(peos.id);


        return res.status(OK).json({
            message: "PEOs fetched successfully",
            peos: peosWithMappings,
        });
    } catch (err: any) {
        console.error("Error while fetching PEOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching PEOs",
            error: err.message,
        });
    }
};

export const updatePEO = async (req: Request, res: Response) => {
    try {
        const { programId, peoId } = req.params; // peoId replaces `index`
        const userId = req.userId;

        if (!isValidUUID(programId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID format" });
        }
        if (!isValidUUID(peoId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid PEO ID format" });
        }

        // Fetch program + user in one query
        const result = await db
            .select({
                programId: programs.id,
                programDept: programs.departmentTitle,
                userRole: users.role,
                userDept: users.department,
            })
            .from(programs)
            .innerJoin(users, eq(users.id, userId))
            .where(eq(programs.id, programId))
            .limit(1);

        if (!result.length) {
            return res.status(NOT_FOUND).json({ message: "Program or user not found" });
        }

        const { userRole, userDept, programDept } = result[0];

        const isAdmin = userRole === AudienceEnum.Admin;
        const isDeptHead = userRole === AudienceEnum.DepartmentHead && userDept === programDept;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to update PEOs to this program",
            });
        }

        const parsed = updatePeoSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        // Check PEO exists
        const [existingPeo] = await db
            .select()
            .from(peos)
            .where(eq(peos.id, peoId));

        if (!existingPeo) {
            return res.status(NOT_FOUND).json({ message: "PEO not found" });
        }

        // If ploMapping provided, validate them
        if (parsed.data.ploMapping) {
            const allPLOIds = parsed.data.ploMapping.map(m => m.plo);

            const validPLOs = await db
                .select({ id: plos.id })
                .from(plos)
                .where(inArray(plos.id, allPLOIds));

            if (validPLOs.length !== allPLOIds.length) {
                return res.status(BAD_REQUEST).json({ message: "One or more PLO references are invalid" });
            }
        }

        // Perform update in a transaction
        await db.transaction(async (tx) => {
            if (parsed.data.title || parsed.data.description) {
                await tx.update(peos)
                    .set({
                        ...(parsed.data.title ? { title: parsed.data.title } : {}),
                        ...(parsed.data.description ? { description: parsed.data.description } : {}),
                    })
                    .where(eq(peos.id, peoId));
            }

            if (parsed.data.ploMapping) {
                // Delete old mappings
                await tx.delete(peoPloMappings)
                    .where(eq(peoPloMappings.peoId, peoId));

                // Insert new mappings
                await tx.insert(peoPloMappings).values(
                    parsed.data.ploMapping.map(m => ({
                        peoId: peoId,
                        ploId: m.plo,
                        strength: m.strength,
                    }))
                );
            }
        });
        return res.status(OK).json({
            message: "PEO updated successfully",
        });

    } catch (err: any) {
        console.error("Error while updating PEOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating PEOs. Please try again.",
            error: err.message,
        });
    }
};

export const deletePEO = async (req: Request, res: Response) => {
    try {
        const { programId, index } = req.params;
        const userId = req.userId;

        if (!isValidUUID(programId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
        }

        // Fetch program + user in one query
        const result = await db
            .select({
                programId: programs.id,
                programDept: programs.departmentTitle,
                userRole: users.role,
                userDept: users.department,
            })
            .from(programs)
            .innerJoin(users, eq(users.id, userId))
            .where(eq(programs.id, programId))
            .limit(1);

        if (!result.length) {
            return res.status(NOT_FOUND).json({ message: "Program or user not found" });
        }

        const { userRole, userDept, programDept } = result[0];

        const isAdmin = userRole === AudienceEnum.Admin;
        const isDeptHead = userRole === AudienceEnum.DepartmentHead && userDept === programDept;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to delete PEOs for this program",
            });
        }

        const idx = parseInt(index, 10);
        if (isNaN(idx) || idx < 0) {
            return res.status(BAD_REQUEST).json({ message: "Invalid PEO index" });
        }

        // Get ordered PEOs for this program
        const peoList = await db
            .select({
                id: peos.id,
                title: peos.title,
                description: peos.description,
            })
            .from(peos)
            .where(eq(peos.programId, programId))
            .orderBy(asc(peos.position)) // order by pos

        if (idx >= peoList.length) {
            return res.status(BAD_REQUEST).json({ message: "Invalid PEO index" });
        }

        const peoToDelete = peoList[idx];

        // Delete PEO (and cascade PLO mappings if FK cascade is set)
        await db.delete(peos).where(eq(peos.id, peoToDelete.id));

        return res.status(OK).json({
            message: "PEO deleted successfully",
            deleted: peoToDelete,
        });

    } catch (err: any) {
        console.error("Error while deleting PEOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting PEOs. Please try again.",
            error: err.message,
        });
    }
};