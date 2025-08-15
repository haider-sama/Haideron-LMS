import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { AudienceEnum } from "../../../shared/enums";
import { programBatches, programCatalogues, programs, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, desc, sql, and, ne, ilike, or, SQL } from "drizzle-orm";
import { createProgramCatalogueSchema, updateProgramCatalogueSchema } from "../../../utils/validators/lms-schemas/catalogueSchemas";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";

export async function getUserById(userId: string) {
    const [user] = await db
        .select({
            id: users.id,
            role: users.role,
            department: users.department,
        })
        .from(users)
        .where(eq(users.id, userId));

    return user || null;
}

export function isAdmin(user: { role: string }) {
    return user.role === AudienceEnum.Admin;
}

export function canManageDepartmentContent(
    user: { role: string; department: string | null },
    program: { departmentTitle: string }
) {
    const isAdminRole = user.role === AudienceEnum.Admin;
    const isDeptHead =
        user.role === AudienceEnum.DepartmentHead &&
        user.department === program.departmentTitle;

    return isAdminRole || isDeptHead;
}

export async function createProgramCatalogue(req: Request, res: Response) {
    try {
        const userId = req.userId;

        // Fetch user
        const [user] = await db
            .select({
                id: users.id,
                role: users.role,
                department: users.department,
            })
            .from(users)
            .where(eq(users.id, userId));

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const parsed = createProgramCatalogueSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { programId, catalogueYear } = parsed.data;

        const parsedYear = catalogueYear;
        const currentYear = new Date().getFullYear();
        if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 5) {
            return res.status(BAD_REQUEST).json({ message: "Invalid or unrealistic catalogue year" });
        }

        // Ensure program exists
        const [existingProgram] = await db
            .select({
                id: programs.id,
                departmentTitle: programs.departmentTitle,
            })
            .from(programs)
            .where(eq(programs.id, programId));

        if (!existingProgram) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === existingProgram.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to create catalogues for this program"
            });
        }

        // Check duplicates
        const [existingCatalogue] = await db
            .select()
            .from(programCatalogues)
            .where(
                and(
                    eq(programCatalogues.programId, programId),
                    eq(programCatalogues.catalogueYear, catalogueYear)
                )
            );

        if (existingCatalogue) {
            return res
                .status(CONFLICT)
                .json({ message: "Catalogue for this program and year already exists" });
        }

        // Insert new catalogue
        const [newCatalogue] = await db
            .insert(programCatalogues)
            .values({
                programId: programId,
                catalogueYear,
                createdBy: user.id,
            })
            .returning();

        res.status(CREATED).json({
            message: "Catalogue created successfully",
            catalogue: newCatalogue,
        });
    } catch (err: any) {
        console.error("Error creating catalogue:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating catalogue",
            error: err.message,
        });
    }
};

export async function getCatalogues(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const { programId, year, search, page = "1", limit = "20" } = req.query;

        // List
        if (!programId || typeof programId !== "string") {
            return res
                .status(BAD_REQUEST)
                .json({ message: "Missing or invalid programId" });
        }

        // Get program for permission check
        const [program] = await db
            .select({
                id: programs.id,
                departmentTitle: programs.departmentTitle,
            })
            .from(programs)
            .where(eq(programs.id, programId));

        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        if (!canManageDepartmentContent(user, program)) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to view catalogues for this program",
            });
        }

        const pageNum = Math.max(parseInt(page as string), 1);
        const pageSize = Math.min(parseInt(limit as string), 100);
        const offsetVal = (pageNum - 1) * pageSize;

        let conditions: SQL<boolean>[] = [
            eq(programCatalogues.programId, programId) as SQL<boolean>,
            eq(programCatalogues.isArchived, false) as SQL<boolean>,
        ];

        if (year) {
            conditions.push(eq(programCatalogues.catalogueYear, Number(year)) as SQL<boolean>);
        }

        if (search && typeof search === "string" && search.trim() !== "") {
            const term = `%${search.trim()}%`;

            // Wrap OR in sql<boolean> to satisfy TypeScript
            const searchCondition: SQL<boolean> = sql<boolean>`(
                ${ilike(sql`coalesce(${programCatalogues.catalogueYear}::text, '')`, term)}
                OR ${ilike(sql`coalesce(${programs.title}, '')`, term)}
                OR ${ilike(sql`coalesce(${programs.departmentTitle}::text, '')`, term)}
                OR ${ilike(sql`coalesce(${users.firstName}, '')`, term)}
                OR ${ilike(sql`coalesce(${users.lastName}, '')`, term)}
                OR ${ilike(sql`coalesce(${users.email}, '')`, term)}
            )`;

            conditions.push(searchCondition);
        }

        const catalogues = await db
            .select({
                id: programCatalogues.id,
                catalogueYear: programCatalogues.catalogueYear,
                createdAt: programCatalogues.createdAt,
                program: {
                    id: programs.id,
                    title: programs.title,
                    departmentTitle: programs.departmentTitle,
                },
                createdBy: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
            })
            .from(programCatalogues)
            .innerJoin(programs, eq(programCatalogues.programId, programs.id))
            .innerJoin(users, eq(programCatalogues.createdBy, users.id))
            .where(and(...conditions))
            .orderBy(desc(programCatalogues.catalogueYear))
            .limit(pageSize)
            .offset(offsetVal);

        const [{ count }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(programCatalogues)
            .innerJoin(programs, eq(programCatalogues.programId, programs.id))
            .innerJoin(users, eq(programCatalogues.createdBy, users.id))
            .where(and(...conditions));

        return res.status(OK).json({
            data: catalogues,
            page: pageNum,
            totalPages: Math.ceil(Number(count) / pageSize),
            totalCatalogues: Number(count),
        });
    } catch (err: any) {
        console.error("Error fetching catalogues:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error fetching catalogues",
            error: err.message,
        });
    }
};

export async function getCatalogueById(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const { catalogueId } = req.params;

        if (!catalogueId) {
            return res.status(BAD_REQUEST).json({ message: "Catalogue ID is required" });
        }

        // Fetch catalogue + program + createdBy details
        const [catalogue] = await db
            .select({
                id: programCatalogues.id,
                catalogueYear: programCatalogues.catalogueYear,
                createdAt: programCatalogues.createdAt,
                updatedAt: programCatalogues.updatedAt,
                program: {
                    id: programs.id,
                    title: programs.title,
                    departmentTitle: programs.departmentTitle,
                },
                createdBy: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                },
            })
            .from(programCatalogues)
            .innerJoin(programs, eq(programCatalogues.programId, programs.id))
            .innerJoin(users, eq(programCatalogues.createdBy, users.id))
            .where(and(
                eq(programCatalogues.id, catalogueId),
                eq(programCatalogues.isArchived, false) // reject archived
            ));

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Catalogue not found" });
        }

        // Department-level access control
        if (!canManageDepartmentContent(user, catalogue.program)) {
            return res.status(FORBIDDEN).json({
                message: "You cannot view catalogues outside your department",
            });
        }

        return res.status(OK).json({
            message: "Catalogue fetched successfully",
            catalogue,
        });
    } catch (err: any) {
        console.error("Error fetching catalogue by ID:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error fetching catalogue by ID",
            error: err.message,
        });
    }
};

export async function updateCatalogueById(req: Request, res: Response) {
    const { catalogueId } = req.params;
    const userId = req.userId;

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!isValidUUID(catalogueId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid catalogue ID" });
        }

        // Get catalogue with program data
        const [catalogue] = await db
            .select({
                id: programCatalogues.id,
                catalogueYear: programCatalogues.catalogueYear,
                program: {
                    id: programs.id,
                    departmentTitle: programs.departmentTitle,
                },
            })
            .from(programCatalogues)
            .innerJoin(programs, eq(programCatalogues.programId, programs.id))
            .where(eq(programCatalogues.id, catalogueId));

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Catalogue not found" });
        }

        // 4. Permission check
        if (!canManageDepartmentContent(user, catalogue.program)) {
            return res.status(FORBIDDEN).json({
                message: "You cannot update catalogues from other departments",
            });
        }

        const parsed = updateProgramCatalogueSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { programId, catalogueYear } = parsed.data;

        // If program is updated, verify it exists
        let newProgramId = catalogue.program.id;
        if (programId && programId !== catalogue.program.id) {
            const [newProgram] = await db
                .select({
                    id: programs.id,
                    departmentTitle: programs.departmentTitle,
                })
                .from(programs)
                .where(eq(programs.id, programId));

            if (!newProgram) {
                return res.status(NOT_FOUND).json({ message: "Target program not found" });
            }

            // Permission check for new program
            if (!canManageDepartmentContent(user, newProgram)) {
                return res.status(FORBIDDEN).json({
                    message: "You cannot move catalogue to a program outside your department",
                });
            }

            newProgramId = newProgram.id;
        }

        // 7. Check for duplicates
        const [duplicate] = await db
            .select({ id: programCatalogues.id })
            .from(programCatalogues)
            .where(
                and(
                    eq(programCatalogues.programId, newProgramId),
                    eq(programCatalogues.catalogueYear, catalogueYear ?? catalogue.catalogueYear),
                    ne(programCatalogues.id, catalogueId)
                )
            );

        if (duplicate) {
            return res.status(CONFLICT).json({
                message: "A catalogue with this program and year already exists",
            });
        }

        // Update
        const updatedCatalogue = await db
            .update(programCatalogues)
            .set({
                programId: newProgramId,
                catalogueYear: catalogueYear ?? catalogue.catalogueYear,
            })
            .where(eq(programCatalogues.id, catalogueId));

        return res.status(OK).json({
            message: "Catalogue updated successfully",
            catalogue: updatedCatalogue,
        });

    } catch (err: any) {
        console.error("Error while updating catalogue:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating catalogue",
            error: err.message

        });
    }
};

export async function deleteCatalogueById(req: Request, res: Response) {
    const { catalogueId } = req.params;
    const userId = req.userId;

    try {
        // Get user
        const user = await getUserById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        //  Validate ID format
        if (!isValidUUID(catalogueId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid catalogue ID" });
        }

        // Get catalogue with program info
        const [catalogue] = await db
            .select({
                id: programCatalogues.id,
                isArchived: programCatalogues.isArchived,
                program: {
                    id: programs.id,
                    title: programs.title,
                    departmentTitle: programs.departmentTitle,
                },
            })
            .from(programCatalogues)
            .innerJoin(programs, eq(programCatalogues.programId, programs.id))
            .where(eq(programCatalogues.id, catalogueId));

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Catalogue not found" });
        }

        // Permission check
        if (!canManageDepartmentContent(user, catalogue.program)) {
            return res.status(FORBIDDEN).json({
                message: "You are not allowed to delete catalogues from other departments",
            });
        }

        // Check if already archived
        if (catalogue.isArchived) {
            return res.status(BAD_REQUEST).json({
                message: "Catalogue is already archived",
            });
        }

        // Prevent deletion if in use by ProgramBatch
        const [batch] = await db
            .select({ id: programBatches.id })
            .from(programBatches)
            .where(eq(programBatches.programCatalogueId, catalogueId))
            .limit(1);

        if (batch) {
            return res.status(CONFLICT).json({
                message: "Catalogue is in use by a ProgramBatch and cannot be archived",
            });
        }

        // Archive catalogue
        await db
            .update(programCatalogues)
            .set({
                isArchived: true,
                archivedAt: new Date(),
            })
            .where(eq(programCatalogues.id, catalogueId));

        // TODO: Audit log

        res.status(OK).json({ message: "Catalogue archived successfully" });
    } catch (error: any) {
        console.error("Error while archiving catalogue:", error);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while archiving catalogue",
            error: error.message,
        });
    }
}