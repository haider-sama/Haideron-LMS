import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { ploSchema, updatePloSchema } from "../../../utils/validators/lms-schemas/programSchemas";
import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
import { peoPloMappings, plos, programs, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and } from "drizzle-orm";
import z from "zod";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";

export const addPLOsToProgram = async (req: Request, res: Response) => {
    try {
        const { programId } = req.params;
        const userId = req.userId;

        if (!isValidUUID(programId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
        }

        // Fetch program + user in one query
        const result = await db
            .select({
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
        const isDeptHead =
            userRole === AudienceEnum.DepartmentHead &&
            userDept === programDept;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to add PLOs to this program",
            });
        }

        const schema = z.object({
            plos: z.array(ploSchema).nonempty("PLOs must be a non-empty array")
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        // Prepare insert
        const plosWithProgram = parsed.data.plos.map((plo) => ({
            code: plo.code,
            title: plo.title,
            description: plo.description,
            programId: programId
        }));

        try {
            const insertedPLOs = await db
                .insert(plos)
                .values(plosWithProgram)
                .returning();

            return res.status(CREATED).json({
                message: "PLOs added successfully",
                plos: insertedPLOs
            });
        } catch (err: any) {
            if (err.code === "23505") {
                // unique constraint violation in Postgres
                return res.status(CONFLICT).json({
                    message: "Duplicate PLO code detected",
                    error: err.detail
                });
            }
            throw err;
        }

    } catch (err: any) {
        console.error("Error while adding PLOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while adding PLOs. Please try again.",
            error: err.message,
        });
    }
};

export const getPLOsForProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { programId } = req.params;

        if (!isValidUUID(programId)) {
            return res.status(NOT_FOUND).json({ message: "Invalid program ID" });
        }

        // Get user + program in one query
        const result = await db
            .select({
                userId: users.id,
                role: users.role,
                department: users.department,
                programId: programs.id,
                departmentTitle: programs.departmentTitle,
            })
            .from(users)
            .innerJoin(programs, eq(programs.id, programId))
            .where(eq(users.id, userId))
            .limit(1);

        if (!result.length) {
            // Either user or program not found
            return res.status(NOT_FOUND).json({ message: "User or program not found" });
        }

        const { role, department, departmentTitle } = result[0];

        // Role/department check
        if (
            role !== AudienceEnum.Admin &&
            (!department || !Object.values(DepartmentEnum).includes(department as DepartmentEnum))
        ) {
            return res.status(FORBIDDEN).json({
                message: "You can only get PLOs for your department",
            });
        }

        // Fetch PLOs for this program
        const programPLOs = await db
            .select({
                id: plos.id,
                code: plos.code,
                title: plos.title,
                description: plos.description,
            })
            .from(plos)
            .where(eq(plos.programId, programId));

        return res.status(OK).json({
            message: "PLOs fetched successfully",
            plos: programPLOs,
        });
    } catch (err: any) {
        console.error("Error while fetching PLOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching PLOs",
            error: err.message,
        });
    }
};

export const updatePLO = async (req: Request, res: Response) => {
    try {
        const { programId, ploId } = req.params;
        const userId = req.userId;

        if (!isValidUUID(programId) || !isValidUUID(ploId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program or PLO ID" });
        }

        // Fetch minimal needed program + user info in one go
        const result = await db
            .select({
                programDept: programs.departmentTitle,
                userRole: users.role,
                userDept: users.department
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
        const isDeptHead = userRole === AudienceEnum.DepartmentHead &&
            userDept === programDept;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to update PLOs of this program" });
        }

        const parsed = updatePloSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        // Check if PLO exists for this program
        const plo = await db.query.plos.findFirst({
            where: and(eq(plos.id, ploId), eq(plos.programId, programId)),
        });

        if (!plo) {
            return res.status(NOT_FOUND).json({ message: "PLO not found for this program" });
        }

        // Update + return updated PLO in one query
        const updatedPLO = await db
            .update(plos)
            .set(parsed.data)
            .where(and(eq(plos.id, ploId), eq(plos.programId, programId)))
            .returning();

        if (!updatedPLO.length) {
            return res.status(NOT_FOUND).json({ message: "PLO not found for this program" });
        }

        return res.status(OK).json({
            message: "PLO updated successfully",
            plo: updatedPLO[0],
        });

    } catch (err: any) {
        console.error("Error while updating PLOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating PLOs. Please try again.",
            error: err.message,
        });
    }
};

export const deletePLO = async (req: Request, res: Response) => {
    try {
        const { programId, ploId } = req.params;
        const userId = req.userId;

        if (!isValidUUID(programId) || !isValidUUID(ploId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID or PLO ID" });
        }

        // Fetch program + user in one query for auth check
        const result = await db
            .select({
                programDept: programs.departmentTitle,
                userRole: users.role,
                userDept: users.department
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
        const isDeptHead = userRole === AudienceEnum.DepartmentHead && userDept === programDept;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to delete PLOs of this program" });
        }

        // Remove all mappings for this PLO
        await db
            .delete(peoPloMappings)
            .where(eq(peoPloMappings.ploId, ploId));

        // Delete the PLO itself
        const deleted = await db
            .delete(plos)
            .where(and(eq(plos.id, ploId), eq(plos.programId, programId)))
            .returning();

        if (!deleted.length) {
            return res.status(NOT_FOUND).json({ message: "PLO not found for this program" });
        }

        return res.status(OK).json({
            message: "PLO deleted successfully",
        });

    } catch (err: any) {
        console.error("Error while deleting PLOs:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting PLOs. Please try again.",
            error: err.message,
        });
    }
};
