import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { programRegisterSchema, updateProgramSchema } from "../../../utils/validators/lms-schemas/programSchemas";
import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
import { programs, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, ilike, sql, desc, SQL, and, or } from "drizzle-orm";

export const registerProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Fetch user from DB (exclude password manually)
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

        const parsed = programRegisterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const {
            title,
            programLevel,
            departmentTitle,
            maxDurationYears,
            requirements,
            vision,
            mission,
        } = parsed.data;

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        if (!isAdmin && (!isDeptHead || user.department !== departmentTitle)) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to register a program for this department",
            });
        }

        // Attempt insert with ON CONFLICT DO NOTHING
        const insertedPrograms = await db
            .insert(programs)
            .values({
                title,
                programLevel,
                departmentTitle,
                maxDurationYears,
                minCreditHours: 0,
                maxCreditHours: 0,
                requirements,
                vision,
                mission,
                createdBy: user.id,
            })
            .onConflictDoNothing()
            .returning();

        if (insertedPrograms.length === 0) {
            return res.status(CONFLICT).json({ message: "Program with this title already exists" });
        }

        const newProgram = insertedPrograms[0];

        return res.status(CREATED).json({
            message: "Program registered successfully",
        });
    } catch (err: any) {
        console.error("Error while registering program:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while registering program. Please try again.",
            error: err.message
        });
    }
};

function buildProgramConditions(user: any, search?: string): SQL<boolean>[] {
    const conditions: SQL<boolean>[] = [];

    // Always exclude archived
    conditions.push(eq(programs.isArchived, false) as SQL<boolean>);

    // Restrict department for department heads
    if (user.role === AudienceEnum.DepartmentHead && user.department) {
        conditions.push(eq(programs.departmentTitle, user.department) as SQL<boolean>);
    }

    // Search handling
    if (search) {
        const searchTerm = `%${search}%`;

        conditions.push(
            or(
                ilike(programs.title, searchTerm),
                ilike(sql`${programs.departmentTitle}::text`, searchTerm),
                ilike(sql`coalesce(${users.firstName}, '')`, searchTerm),
                ilike(sql`coalesce(${users.lastName}, '')`, searchTerm),
                ilike(sql`coalesce(${users.email}, '')`, searchTerm)
            ) as SQL<boolean>
        );
    }

    return conditions;
}

export const getPrograms = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { programId } = req.params;
        const [user] = await db
            .select({ id: users.id, role: users.role, department: users.department })
            .from(users)
            .where(eq(users.id, userId));

        if (!user) {
            return res.status(BAD_REQUEST).json({ message: "User not found" });
        }

        if (
            user.role !== AudienceEnum.Admin &&
            (!user.department || !Object.values(DepartmentEnum).includes(user.department as DepartmentEnum))
        ) {
            return res.status(FORBIDDEN).json({
                message: "You can only get programs for your department",
            });
        }

        // SINGLE PROGRAM
        if (programId) {
            const conditions = [eq(programs.id, programId) as SQL<boolean>];
            if (user.role === AudienceEnum.DepartmentHead && user.department) {
                conditions.push(eq(programs.departmentTitle, user.department) as SQL<boolean>);
            }

            const [program] = await db
                .select({
                    id: programs.id,
                    title: programs.title,
                    programLevel: programs.programLevel,
                    departmentTitle: programs.departmentTitle,
                    maxDurationYears: programs.maxDurationYears,
                    minCreditHours: programs.minCreditHours,
                    maxCreditHours: programs.maxCreditHours,
                    requirements: programs.requirements,
                    vision: programs.vision,
                    mission: programs.mission,
                    createdAt: programs.createdAt,
                    updatedAt: programs.updatedAt,
                    createdByFirstName: users.firstName,
                    createdByLastName: users.lastName,
                })
                .from(programs)
                .leftJoin(users, eq(users.id, programs.createdBy))
                .where(and(...conditions));

            if (!program) {
                return res.status(NOT_FOUND).json({ message: "Program not found" });
            }

            return res.status(OK).json({
                message: "Program fetched successfully",
                program,
            });
        }

        // LIST PROGRAMS
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
        const offset = (page - 1) * limit;
        const search = req.query.search as string | undefined;

        const conditions = buildProgramConditions(user, search);

        // COUNT
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(programs)
            .leftJoin(users, eq(users.id, programs.createdBy))
            .where(and(...conditions));

        // LIST
        const programsList = await db
            .select({
                id: programs.id,
                title: programs.title,
                programLevel: programs.programLevel,
                departmentTitle: programs.departmentTitle,
                maxDurationYears: programs.maxDurationYears,
                minCreditHours: programs.minCreditHours,
                maxCreditHours: programs.maxCreditHours,
                requirements: programs.requirements,
                vision: programs.vision,
                mission: programs.mission,
                createdAt: programs.createdAt,
                updatedAt: programs.updatedAt,
                createdByFirstName: users.firstName,
                createdByLastName: users.lastName,
            })
            .from(programs)
            .leftJoin(users, eq(users.id, programs.createdBy))
            .where(and(...conditions))
            .orderBy(desc(programs.createdAt))
            .limit(limit)
            .offset(offset);

        return res.status(OK).json({
            message: "Programs fetched successfully",
            programs: programsList,
            page,
            totalPages: Math.ceil(count / limit),
            totalPrograms: count,
        });
    } catch (err: any) {
        console.error("Error while fetching programs:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching programs. Please try again.",
            error: err.message,
        });
    }
};

export const getProgramById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId; // auth middleware sets this
        const { programId } = req.params;

        if (!programId) {
            return res.status(BAD_REQUEST).json({ message: "Program ID is required" });
        }

        // Fetch user info
        const [user] = await db
            .select({ id: users.id, role: users.role, department: users.department })
            .from(users)
            .where(eq(users.id, userId));

        if (!user) {
            return res.status(BAD_REQUEST).json({ message: "User not found" });
        }

        // Build program conditions based on permissions
        const programConditions: SQL<boolean>[] = [
            eq(programs.id, programId) as SQL<boolean>,
            eq(programs.isArchived, false) as SQL<boolean>,
        ];

        if (user.role === AudienceEnum.DepartmentHead && user.department) {
            programConditions.push(eq(programs.departmentTitle, user.department) as SQL<boolean>);
        } else if (user.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "You can only get programs for your department",
            });
        }

        // Fetch the program
        const [program] = await db
            .select()
            .from(programs)
            .where(and(...programConditions));

        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        return res.status(OK).json({
            message: "Program fetched successfully",
            program,
        });
    } catch (err: any) {
        console.error("Error fetching program by ID:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching program. Please try again.",
            error: err.message,
        });
    }
};

export const updateProgramById = async (req: Request, res: Response) => {
    const { programId } = req.params;

    try {
        if (!programId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
        }

        // Fetch program by id
        const [program] = await db
            .select()
            .from(programs)
            .where(eq(programs.id, programId));
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        // Fetch user by id
        const [user] = await db
            .select({ id: users.id, role: users.role, department: users.department })
            .from(users)
            .where(eq(users.id, req.userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to update this program" });
        }

        const parsed = updateProgramSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const updates = parsed.data;

        if (
            updates.departmentTitle &&
            user.role === AudienceEnum.DepartmentHead &&
            updates.departmentTitle !== user.department
        ) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to move this program to a different department",
            });
        }

        // Update program in DB
        const [updatedProgram] = await db
            .update(programs)
            .set({
                ...updates,
                updatedAt: new Date(), // update the timestamp
            })
            .where(eq(programs.id, programId))
            .returning();

        return res.status(OK).json({
            message: "Program updated successfully",
            updatedProgram,
        });
    } catch (err: any) {
        console.error("Error while updating program:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating program. Please try again.",
            error: err.message
        });
    }
};

export const deleteProgramById = async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const { programId } = req.params;

        // Validate ID format (Postgres UUID or integer depending on schema)
        if (!programId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
        }

        // Fetch program
        const [program] = await db
            .select()
            .from(programs)
            .where(eq(programs.id, programId));

        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        // Fetch user
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead
            && user.department === program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to archive this program" });
        }

        // Already archived?
        if (program.isArchived) {
            return res.status(BAD_REQUEST).json({ message: "Program is already archived" });
        }

        // Archive program
        await db
            .update(programs)
            .set({
                isArchived: true,
                archivedAt: new Date(),
            })
            .where(eq(programs.id, programId));

        // TODO: Log audit event

        return res.status(OK).json({ message: "Program archived successfully" });
    } catch (err: any) {
        console.error("Error while archiving program:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while archiving program. Please try again.",
            error: err.message
        });
    }
};