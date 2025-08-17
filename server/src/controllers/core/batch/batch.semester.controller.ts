import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { activatedSemesters, programBatches, semesters, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, asc } from "drizzle-orm";
import { activateSemesterSchema, updateBatchSemesterSchema } from "../../../utils/validators/lms-schemas/batchSchemas";
import { checkDepartmentAccess } from "./batch.controller";

export const activateSemester = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const parsed = activateSemesterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { programBatchId, semesterNo, term, startedAt } = parsed.data;

        // Fetch user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Fetch batch + program
        const batch = await db.query.programBatches.findFirst({
            where: eq(programBatches.id, programBatchId),
            with: {
                program: true, // relation set in schema
            },
        });

        if (!batch) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found" });
        }

        try {
            checkDepartmentAccess(user, batch.program.departmentTitle, "activate a semester for this batch");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Check if semester exists in programCatalogue
        const semesterExists = await db.query.semesters.findFirst({
            where: and(
                eq(semesters.programCatalogueId, batch.programCatalogueId),
                eq(semesters.semesterNo, semesterNo),
            ),
        });

        if (!semesterExists) {
            return res.status(BAD_REQUEST).json({
                message: `Semester ${semesterNo} does not exist in this batch's catalogue`,
            });
        }

        // Prevent duplicate activation
        const alreadyActivated = await db.query.activatedSemesters.findFirst({
            where: and(
                eq(activatedSemesters.programBatchId, batch.id),
                eq(activatedSemesters.semesterNo, semesterNo),
                eq(activatedSemesters.term, term),
            ),
        });

        if (alreadyActivated) {
            return res.status(CONFLICT).json({
                message: `Semester ${semesterNo} is already activated for this batch`,
            });
        }

        // Prevent multiple active semesters in the same batch
        const existingActiveSemester = await db.query.activatedSemesters.findFirst({
            where: and(
                eq(activatedSemesters.programBatchId, batch.id),
                eq(activatedSemesters.isActive, true),
            ),
        });

        if (existingActiveSemester) {
            return res.status(BAD_REQUEST).json({
                message: "An active semester already exists for this batch. Please complete or deactivate it first.",
            });
        }

        // Insert new activated semester
        const [newActivatedSemester] = await db
            .insert(activatedSemesters)
            .values({
                programBatchId: batch.id,
                semesterNo,
                term,
                isActive: true,
                startedAt: startedAt ? new Date(startedAt) : new Date(),
            })
            .returning();

        return res.status(CREATED).json({
            message: `Semester ${semesterNo} activated successfully for this batch`,
            activatedSemester: newActivatedSemester,
        });

    } catch (err: any) {
        console.error("Error while activating semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while activating semester",
            error: err.message
        });
    }
};

export const getSemestersByBatch = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.params;
        const userId = req.userId;

        if (!batchId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid or missing batchId" });
        }

        // Validate user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Find batch with program
        const batch = await db.query.programBatches.findFirst({
            where: eq(programBatches.id, batchId),
            with: {
                program: true,
            },
        });

        if (!batch) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found" });
        }

        try {
            checkDepartmentAccess(
                user,
                batch.program.departmentTitle,
                "view semesters of this batch"
            );
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Fetch semesters sorted by semesterNo
        const semesters = await db.query.activatedSemesters.findMany({
            where: eq(activatedSemesters.programBatchId, batchId),
            orderBy: [asc(activatedSemesters.semesterNo)],
        });

        return res.status(OK).json({
            message: `Found ${semesters.length} semesters for this batch`,
            semesters,
        });

    } catch (err: any) {
        console.error("Error while fetching batch semesters:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching batch semesters",
            error: err.message
        });
    }
};

export const updateBatchSemester = async (req: Request, res: Response) => {
    try {
        const { batchSemesterId } = req.params;
        const userId = req.userId;

        if (!batchSemesterId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid batchSemesterId format" });
        }

        const updates = updateBatchSemesterSchema.safeParse(req.body);
        if (!updates.success) {
            return res.status(BAD_REQUEST).json({
                message: "Invalid data",
                errors: updates.error.flatten().fieldErrors,
            });
        }

        // Fetch user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Fetch batch semester with program
        const batchSemester = await db.query.activatedSemesters.findFirst({
            where: eq(activatedSemesters.id, batchSemesterId),
            with: {
                programBatch: {
                    with: {
                        program: true,
                    },
                },
            },
        });

        if (!batchSemester) {
            return res.status(NOT_FOUND).json({ message: "Batch semester not found" });
        }


        const program = batchSemester.programBatch?.program;
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Associated program not found" });
        }

        // Department access check
        try {
            checkDepartmentAccess(user, program.departmentTitle, "update this batch semester");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Transform updates
        const transformedUpdates: Partial<typeof activatedSemesters.$inferInsert> = {
            ...(updates.data.isActive !== undefined ? { isActive: updates.data.isActive } : {}),
            ...(updates.data.term !== undefined ? { term: updates.data.term } : {}),
            ...(updates.data.semesterNo !== undefined ? { semesterNo: updates.data.semesterNo } : {}),
            ...(updates.data.startedAt
                ? { startedAt: new Date(updates.data.startedAt) }
                : {}),
            ...(updates.data.endedAt
                ? { endedAt: new Date(updates.data.endedAt) }
                : {}),
            ...(updates.data.enrollmentDeadline
                ? { enrollmentDeadline: new Date(updates.data.enrollmentDeadline) }
                : {}),
            updatedAt: new Date(),
        };

        // Update
        const [updated] = await db
            .update(activatedSemesters)
            .set(transformedUpdates)
            .where(eq(activatedSemesters.id, batchSemesterId))
            .returning();

        return res.status(OK).json({
            message: "Batch semester updated successfully",
        });
    } catch (err: any) {
        console.error("Error while updating batch semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating batch semester",
            error: err.message
        });
    }
};

export const completeBatchSemester = async (req: Request, res: Response) => {
    try {
        const { batchSemesterId } = req.params;
        const userId = req.userId;

        if (batchSemesterId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid batchSemesterId format" });
        }

        // Get user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Get semester with program relation
        const batchSemester = await db.query.activatedSemesters.findFirst({
            where: eq(activatedSemesters.id, batchSemesterId),
            with: {
                programBatch: {
                    with: {
                        program: true,
                    },
                },
            },
        });

        if (!batchSemester) {
            return res.status(NOT_FOUND).json({ message: "Batch semester not found" });
        }

        const program = batchSemester.programBatch?.program;
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found for this batch" });
        }

        try {
            checkDepartmentAccess(user, program.departmentTitle, "mark this batch semester as complete");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Set inactive + add endedAt if missing
        const updates = {
            isActive: false,
            endedAt: batchSemester.endedAt ?? new Date(),
        };

        const [updated] = await db
            .update(activatedSemesters)
            .set(updates)
            .where(eq(activatedSemesters.id, batchSemesterId))
            .returning();

        return res.status(OK).json({
            message: "Semester marked as completed",
        });

    } catch (err: any) {
        console.error("Error while completing batch semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while completing batch semester",
            error: err.message
        });
    }
};

export const deleteBatchSemester = async (req: Request, res: Response) => {
    try {
        const { batchSemesterId } = req.params;
        const userId = req.userId;

        if (!batchSemesterId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid batchSemesterId format" });
        }

        // Fetch user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Fetch semester with programBatch -> program
        const batchSemester = await db.query.activatedSemesters.findFirst({
            where: eq(activatedSemesters.id, batchSemesterId),
            with: {
                programBatch: {
                    with: {
                        program: true,
                    },
                },
            },
        });

        if (!batchSemester) {
            return res.status(NOT_FOUND).json({ message: "Batch semester not found" });
        }

        const program = batchSemester.programBatch?.program;
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found for this batch" });
        }

        // Department-level access check
        try {
            checkDepartmentAccess(user, program.departmentTitle, "delete this batch semester");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Delete semester
        await db.delete(activatedSemesters).where(eq(activatedSemesters.id, batchSemesterId));

        return res.status(OK).json({
            message: "Batch semester deleted successfully",
        });
    } catch (err: any) {
        console.error("Error while deleting batch semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting batch semester",
            error: err.message,
        });
    }
};

export const getCatalogueCoursesForActivatedSemester = async (req: Request, res: Response) => {
    try {
        const { activatedSemesterId } = req.params;
        const userId = req.userId;

        if (!activatedSemesterId) {
            return res.status(BAD_REQUEST).json({ message: "Invalid activated semester ID" });
        }

        // Fetch activatedSemester with programBatch -> program
        const activatedSemester = await db.query.activatedSemesters.findFirst({
            where: eq(activatedSemesters.id, activatedSemesterId),
            with: {
                programBatch: {
                    with: {
                        program: true,
                        programCatalogue: true, // include catalogue relation
                    },
                },
            },
        });

        if (!activatedSemester) {
            return res.status(NOT_FOUND).json({ message: "Activated semester not found" });
        }

        // Validate user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Department-level access check
        try {
            checkDepartmentAccess(
                user,
                activatedSemester.programBatch?.program?.departmentTitle,
                "view catalogue courses"
            );
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Find corresponding catalogue semester
        const semesterWithCourses = await db.query.semesters.findFirst({
            where: and(
                eq(semesters.programCatalogueId, activatedSemester.programBatch!.programCatalogueId),
                eq(semesters.semesterNo, activatedSemester.semesterNo)
            ),
            with: {
                semesterCourses: {
                    with: {
                        course: true,
                    },
                },
            },
        });

        if (!semesterWithCourses) {
            return res.status(NOT_FOUND).json({
                message: "Corresponding catalogue semester not found",
            });
        }

        const courseList = semesterWithCourses.semesterCourses.map(sc => sc.course);

        return res.status(OK).json({
            message: `Found ${courseList.length} catalogue courses`,
            courses: courseList,
        });

    } catch (err: any) {
        console.error("Error fetching catalogue courses:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error fetching catalogue courses",
            error: err.message,
        });
    }
};
