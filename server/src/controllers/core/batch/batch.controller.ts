import { Request, Response } from "express";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
import { programBatches, programCatalogues, programs, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, desc, and, count } from "drizzle-orm";
import { createProgramBatchSchema, updateProgramBatchSchema } from "../../../utils/validators/lms-schemas/batchSchemas";
import { writeAuditLog } from "../../../utils/logs/writeAuditLog";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";
import { getNumberQueryParam, getStringQueryParam } from "../../../utils/validators/sanitizer/queryParams";

// Typescript type of a user row
type User = typeof users.$inferSelect;

export const checkDepartmentAccess = (
    user: User | null,
    resourceDepartment: DepartmentEnum | string,
    action: string = "perform this action"
) => {
    if (!user) {
        throw new Error("User not found");
    }

    const isAdmin = user.role === AudienceEnum.Admin;
    const isDeptHead = user.role === AudienceEnum.DepartmentHead;

    if (isAdmin) return; // Admins bypass access checks

    if (!isDeptHead) {
        throw new Error(`Only DepartmentHeads or Admins can ${action}`);
    }

    if (
        !user.department ||
        !Object.values(DepartmentEnum).includes(user.department as DepartmentEnum)
    ) {
        throw new Error("User does not belong to a valid department");
    }

    const userDept = String(user.department).trim().toLowerCase();
    const targetDept = String(resourceDepartment).trim().toLowerCase();

    if (userDept !== targetDept) {
        console.warn(
            `[ACCESS DENIED] DeptHead ${user.email} (dept: ${userDept}) tried to ${action} for ${targetDept}`
        );
        throw new Error(`DepartmentHead cannot ${action} outside their department`);
    }
};

export const createProgramBatch = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const parsed = createProgramBatchSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { programId, programCatalogueId, sessionYear } = parsed.data;

        // Load user, program, catalogue in parallel
        const [[user], [program], [catalogue]] = await Promise.all([
            db.select().from(users).where(eq(users.id, userId)),
            db.select().from(programs).where(eq(programs.id, programId)),
            db.select().from(programCatalogues).where(eq(programCatalogues.id, programCatalogueId)),
        ]);


        if (!user) return res.status(NOT_FOUND).json({ message: "User not found" });
        if (!program) return res.status(NOT_FOUND).json({ message: "Program not found" });
        if (!catalogue) return res.status(NOT_FOUND).json({ message: "Program Catalogue not found" });

        // Enforce department-level permission
        try {
            checkDepartmentAccess(user, program.departmentTitle, "create a program batch");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Ensure catalogue belongs to this program
        if (catalogue.programId !== program.id) {
            return res
                .status(BAD_REQUEST)
                .json({ message: "Catalogue does not belong to this program." });
        }

        // Prevent duplicates (program + sessionYear unique)
        const [exists] = await db
            .select()
            .from(programBatches)
            .where(and(eq(programBatches.programId, programId), eq(programBatches.sessionYear, sessionYear)));

        if (exists) {
            return res.status(FORBIDDEN).json({
                message: "A batch for this program and session year already exists.",
            });
        }

        // Insert new batch
        const [newBatch] = await db
            .insert(programBatches)
            .values({
                programId,
                programCatalogueId,
                sessionYear,
                createdBy: userId,
            })
            .returning();

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "PROGRAM_BATCH_CREATED",
            actorId: user.id,
            entityType: "programBatch",
            entityId: newBatch.id,
            metadata: {
                ip: req.ip,
                programId,
                programCatalogueId,
                sessionYear,
            },
        });

        return res.status(OK).json({
            message: "Program batch created successfully.",
        });
    } catch (error: any) {
        console.error("Error while creating program batch:", error.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating program batch",
            error: error.message
        });
    }
};

export const getBatchesByProgram = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const programId = getStringQueryParam(req.query.programId);
        const page = getNumberQueryParam(req.query.page, 1);
        const limit = getNumberQueryParam(req.query.limit, 20);

        if (!programId || !isValidUUID(programId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
        }

        // Load user & program
        const [[user], [program]] = await Promise.all([
            db.select().from(users).where(eq(users.id, userId)),
            db.select().from(programs).where(eq(programs.id, programId)),
        ]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        // Enforce department-level permission
        try {
            checkDepartmentAccess(user, program.departmentTitle, "access program batches");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Pagination
        const pageNum = page && page > 0 ? page : 1;
        const pageSize = limit && limit > 0 ? Math.min(limit, 100) : 20;
        const offsetVal = (pageNum - 1) * pageSize;

        // Fetch batches with joins
        const batches = await db
            .select({
                id: programBatches.id,
                sessionYear: programBatches.sessionYear,
                isActive: programBatches.isActive,
                createdAt: programBatches.createdAt,
                updatedAt: programBatches.updatedAt,

                // related fields
                programTitle: programs.title,
                catalogueYear: programCatalogues.catalogueYear,
                createdByFirstName: users.firstName,
                createdByLastName: users.lastName,
            })
            .from(programBatches)
            .where(eq(programBatches.programId, programId))
            .leftJoin(programs, eq(programs.id, programBatches.programId))
            .leftJoin(programCatalogues, eq(programCatalogues.id, programBatches.programCatalogueId))
            .leftJoin(users, eq(users.id, programBatches.createdBy))
            .orderBy(desc(programBatches.sessionYear))
            .limit(pageSize)
            .offset(offsetVal);

        // Count total batches
        const [{ count: totalBatches }] = await db
            .select({ count: count() })
            .from(programBatches)
            .where(eq(programBatches.programId, programId));

        return res.status(OK).json({
            message: "Batches fetched successfully",
            batches,
            page: pageNum,
            totalPages: Math.ceil(Number(totalBatches) / pageSize),
            totalBatches: Number(totalBatches),
        });
    } catch (err: any) {
        console.error("Error while fetching batches:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching batches", error: err.message
        });
    }
};

export const getBatchById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { batchId } = req.params;

        if (!isValidUUID(batchId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid batch ID format" });
        }

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Fetch batch with joins
        const [batch] = await db
            .select({
                id: programBatches.id,
                sessionYear: programBatches.sessionYear,
                isActive: programBatches.isActive,
                createdAt: programBatches.createdAt,
                updatedAt: programBatches.updatedAt,

                // related fields
                programId: programs.id,
                programTitle: programs.title,
                programDepartment: programs.departmentTitle,

                catalogueYear: programCatalogues.catalogueYear,

                createdByFirstName: users.firstName,
                createdByLastName: users.lastName,
            })
            .from(programBatches)
            .where(eq(programBatches.id, batchId))
            .leftJoin(programs, eq(programs.id, programBatches.programId))
            .leftJoin(programCatalogues, eq(programCatalogues.id, programBatches.programCatalogueId))
            .leftJoin(users, eq(users.id, programBatches.createdBy));

        if (!batch) {
            return res.status(NOT_FOUND).json({ message: "Batch not found" });
        }

        if (!batch.programDepartment) {
            return res.status(BAD_REQUEST).json({ message: "Batch program has no department assigned" });
        }

        try {
            checkDepartmentAccess(user, batch.programDepartment, "view this batch");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        return res.status(OK).json({ batch });
    } catch (err: any) {
        console.error("Error while fetching batch:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching batch",
            error: err.message,
        });
    }
};

export const updateBatchById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { batchId } = req.params;

        if (!isValidUUID(batchId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid batch ID format" });
        }

        const parsed = updateProgramBatchSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { sessionYear, isActive } = parsed.data;

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }


        // Fetch batch + program (for department check)
        const [batch] = await db
            .select({
                id: programBatches.id,
                sessionYear: programBatches.sessionYear,
                isActive: programBatches.isActive,
                programDepartment: programs.departmentTitle,
            })
            .from(programBatches)
            .where(eq(programBatches.id, batchId))
            .leftJoin(programs, eq(programs.id, programBatches.programId));

        if (!batch) {
            return res.status(NOT_FOUND).json({ message: "Batch not found" });
        }

        // Department-level permission
        if (!batch.programDepartment) {
            return res.status(BAD_REQUEST).json({
                message: "Batch program has no department assigned",
            });
        }

        try {
            checkDepartmentAccess(user, batch.programDepartment, "update this batch");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Apply updates
        const updateData: Partial<typeof programBatches.$inferInsert> = {};
        if (sessionYear) updateData.sessionYear = sessionYear;
        if (typeof isActive === "boolean") updateData.isActive = isActive;

        if (Object.keys(updateData).length === 0) {
            return res.status(BAD_REQUEST).json({ message: "No valid fields to update" });
        }

        const [updatedBatch] = await db
            .update(programBatches)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(programBatches.id, batchId))
            .returning();

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "PROGRAM_BATCH_UPDATED",
            actorId: user.id,
            entityType: "programBatch",
            entityId: updatedBatch.id,
            metadata: {
                ip: req.ip,
                sessionYear: updatedBatch.sessionYear,
                isActive: updatedBatch.isActive,
            },
        });

        return res.status(OK).json({
            message: "Batch updated successfully",
            updatedBatch,
        });
    } catch (err: any) {
        console.error("Error while updating batch:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating batch",
            error: err.message,
        });
    }
};