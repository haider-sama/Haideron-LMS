import { Request, Response } from "express";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { AudienceEnum, BatchEnrollmentStatus, DepartmentEnum } from "../../../shared/enums";
import { programBatches, programs, studentBatchEnrollments, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, inArray, sql, notInArray } from "drizzle-orm";
import { createEnrollmentSchema, defaultEnrollmentSchema } from "../../../utils/validators/lms-schemas/studentEnrollmentSchemas";
import { checkDepartmentAccess } from "./batch.controller";

export const createStudentBatchEnrollment = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = createEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { studentId, studentIds, programBatchId, status } = parsed.data;
    const allStudentIds = studentIds || (studentId ? [studentId] : []);

    try {
        // Load requesting user and program batch with program
        const [requestingUser, programBatch] = await Promise.all([
            db.query.users.findFirst({ where: eq(users.id, userId) }),
            db.query.programBatches.findFirst({
                where: eq(programBatches.id, programBatchId),
                with: { program: true },
            }),
        ]);

        if (!requestingUser) {
            return res.status(NOT_FOUND).json({ error: "Requesting user not found" });
        }

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ error: "Program batch not found" });
        }

        const program = programBatch.program;

        // Department access check
        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "assign students to this batch");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ error: err.message });
        }

        // Load all students in one query
        const students = await db.query.users.findMany({
            where: inArray(users.id, allStudentIds),
        });

        const results = [];

        for (const studentId of allStudentIds) {
            const student = students.find((s) => s.id === studentId);

            if (!student || student.role !== AudienceEnum.Student) {
                results.push({ studentId, status: "failed", reason: "Not a valid student" });
                continue;
            }

            if (String(student.department) !== String(program.departmentTitle)) {
                results.push({ studentId, status: "failed", reason: "Department mismatch" });
                continue;
            }

            // Upsert enrollment (idempotent)
            const [existing] = await db
                .select()
                .from(studentBatchEnrollments)
                .where(
                    and(
                        eq(studentBatchEnrollments.studentId, studentId),
                        eq(studentBatchEnrollments.programBatchId, programBatchId)
                    )
                );

            if (existing) {
                await db
                    .update(studentBatchEnrollments)
                    .set({ status: status || BatchEnrollmentStatus.Active })
                    .where(eq(studentBatchEnrollments.id, existing.id));
            } else {
                await db
                    .insert(studentBatchEnrollments)
                    .values({
                        studentId,
                        programBatchId,
                        status: status || BatchEnrollmentStatus.Active,
                    });
            }

            results.push({ studentId, status: "success" });
        }

        return res.status(OK).json({
            message: "Batch enrollment processed",
            results,
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to assign students to batch",
            error: err.message,
        });
    }
};

export const listStudentsInBatch = async (req: Request, res: Response) => {
    const { programBatchId } = req.params;
    const userId = req.userId;

    if (!programBatchId) {
        return res.status(BAD_REQUEST).json({ message: "Valid programBatchId is required." });
    }

    try {
        // Requesting user
        const requestingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        // ProgramBatch with program
        const programBatch = await db.query.programBatches.findFirst({
            where: eq(programBatches.id, programBatchId),
            with: {
                program: true,
            },
        });

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        const program = programBatch.program;

        // Department access check
        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "view students in this batch");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        // Get enrollments + join students
        const enrollments = await db.query.studentBatchEnrollments.findMany({
            where: eq(studentBatchEnrollments.programBatchId, programBatchId),
            with: {
                student: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        // exclude password & reset tokens
                    },
                },
            },
        });

        // Map response into clean shape
        const students = enrollments.map((e) => ({
            student: {
                id: e.student.id,
                firstName: e.student.firstName,
                lastName: e.student.lastName,
                email: e.student.email,
                role: e.student.role,
            },
            status: e.status,
        }));

        return res.status(OK).json({ students });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to list students in batch",
            error: err.message
        });
    }
};

export const listStudentsInAllBatches = async (req: Request, res: Response) => {
    const userId = req.userId;
    const departmentTitle = req.params.departmentTitle || req.query.department?.toString();

    if (!departmentTitle) {
        return res.status(BAD_REQUEST).json({ message: "Department title is required." });
    }

    try {
        // Requesting user
        const requestingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        // Department access check
        try {
            checkDepartmentAccess(requestingUser, departmentTitle, "view students enrolled in this department");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        // Find all programs with this departmentTitle
        const programList = await db.query.programs.findMany({
            where: eq(programs.departmentTitle, departmentTitle),
            columns: { id: true },
        });

        if (programList.length === 0) {
            return res.status(NOT_FOUND).json({ message: "No programs found in this department." });
        }

        const programIds = programList.map((p) => p.id);

        // Find all batches linked to these programs
        const batchList = await db.query.programBatches.findMany({
            where: inArray(programBatches.programId, programIds),
            columns: { id: true },
        });

        if (batchList.length === 0) {
            return res.status(NOT_FOUND).json({ message: "No program batches found for these programs." });
        }

        const batchIds = batchList.map((b) => b.id);

        // Find enrollments from those batches
        const enrollments = await db.query.studentBatchEnrollments.findMany({
            where: inArray(studentBatchEnrollments.programBatchId, batchIds),
            with: {
                student: true,
            },
        });

        // Deduplicate students
        const uniqueStudentsMap = new Map<
            string,
            {
                student: {
                    id: string;
                    firstName: string | null;
                    lastName: string | null;
                    email: string;
                    role: string;
                };
                status: string;
            }
        >();

        enrollments.forEach((enrollment) => {
            if (!enrollment.student) return;

            const sid = enrollment.student.id;

            if (!uniqueStudentsMap.has(sid)) {
                // inline mapping here
                const student = {
                    id: enrollment.student.id,
                    firstName: enrollment.student.firstName ?? null,
                    lastName: enrollment.student.lastName ?? null,
                    email: enrollment.student.email,
                    role: enrollment.student.role,
                };

                uniqueStudentsMap.set(sid, {
                    student,
                    status: enrollment.status,
                });
            }
        });

        const students = Array.from(uniqueStudentsMap.values());

        return res.status(OK).json({ students });
    } catch (err: any) {
        console.error("Error while listing students in all batches:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to list students enrolled in department",
            error: err.message,
        });
    }
};

export const removeStudentFromBatch = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = defaultEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { studentId, programBatchId } = parsed.data;

    try {
        // Load requesting user
        const requestingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        // Load program batch (with program relation)
        const programBatch = await db.query.programBatches.findFirst({
            where: eq(programBatches.id, programBatchId),
            with: {
                program: {
                    columns: { id: true, departmentTitle: true },
                },
            },
        });

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        // Check department access
        try {
            checkDepartmentAccess(
                requestingUser,
                programBatch.program.departmentTitle,
                "remove student from this batch"
            );
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        // Delete enrollment
        const result = await db
            .delete(studentBatchEnrollments)
            .where(
                and(
                    eq(studentBatchEnrollments.studentId, studentId),
                    eq(studentBatchEnrollments.programBatchId, programBatchId)
                )
            )
            .returning();

        if (result.length === 0) {
            return res.status(NOT_FOUND).json({ message: "Enrollment not found." });
        }

        return res.status(OK).json({ message: "Student removed from batch successfully." });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to remove student from batch",
            error: err.message
        });
    }
};

export const softRemoveStudentFromBatch = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = defaultEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { studentId, programBatchId } = parsed.data;

    try {
        // Load requesting user
        const requestingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        // Load program batch (with program relation)
        const programBatch = await db.query.programBatches.findFirst({
            where: eq(programBatches.id, programBatchId),
            with: {
                program: {
                    columns: { id: true, departmentTitle: true },
                },
            },
        });

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        // Department access check
        try {
            checkDepartmentAccess(
                requestingUser,
                programBatch.program.departmentTitle,
                "soft-remove student from this batch"
            );
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        // Update enrollment status to "Dropped"
        const updatedEnrollment = await db
            .update(studentBatchEnrollments)
            .set({ status: BatchEnrollmentStatus.Dropped })
            .where(
                and(
                    eq(studentBatchEnrollments.studentId, studentId),
                    eq(studentBatchEnrollments.programBatchId, programBatchId)
                )
            )
            .returning();

        if (updatedEnrollment.length === 0) {
            return res.status(NOT_FOUND).json({ message: "Enrollment not found." });
        }

        return res.status(OK).json({
            message: "Student marked as 'dropped' from batch successfully.",
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to update enrollment status",
            error: err.message
        });
    }
};

export const reinstateStudentInBatch = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = defaultEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { studentId, programBatchId } = parsed.data;

    try {
        // Load requesting user
        const requestingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        // Load program batch (with program relation)
        const programBatch = await db.query.programBatches.findFirst({
            where: eq(programBatches.id, programBatchId),
            with: {
                program: {
                    columns: { id: true, departmentTitle: true },
                },
            },
        });

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        // Department access check
        try {
            checkDepartmentAccess(
                requestingUser,
                programBatch.program.departmentTitle,
                "reinstate student in this batch"
            );
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        // Update enrollment status back to "Active"
        const updatedEnrollment = await db
            .update(studentBatchEnrollments)
            .set({ status: BatchEnrollmentStatus.Active })
            .where(
                and(
                    eq(studentBatchEnrollments.studentId, studentId),
                    eq(studentBatchEnrollments.programBatchId, programBatchId)
                )
            )
            .returning();

        if (updatedEnrollment.length === 0) {
            return res.status(NOT_FOUND).json({ message: "Enrollment not found." });
        }

        return res.status(OK).json({
            message: "Student reactivated in batch successfully.",
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to reinstate student",
            error: err.message
        });
    }
};

export async function fetchPaginatedStudentsByDepartment(req: Request, res: Response) {
    try {
        const userId = req.userId;

        // Fetch requesting user (role + department)
        const requestingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                id: true,
                role: true,
                department: true,
            },
        });

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: user not found" });
        }

        const isAdmin = requestingUser.role === AudienceEnum.Admin;
        const isDeptHead = requestingUser.role === AudienceEnum.DepartmentHead;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "Access denied" });
        }

        const page = Math.max(parseInt(req.query.page as string) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offsetVal = (page - 1) * limit;

        const search = (req.query.search as string || "").trim();
        const department = req.query.department as string | undefined;
        const hideEnrolled = req.query.hideEnrolled === "true";

        // Admin can choose department, DeptHead restricted to own department
        const departmentFilter = isAdmin ? department ?? undefined : requestingUser.department;
        if (!departmentFilter) {
            return res.status(BAD_REQUEST).json({ message: "Department is required" });
        }

        // Search filter using tsvector if present
        let searchFilter;
        if (search && search.length > 0) {
            searchFilter = sql`${users.searchVector} @@ plainto_tsquery('simple', ${search})`;
        }

        // Base filter: role = Student + department match
        const baseFilters = [
            eq(users.role, AudienceEnum.Student),
            eq(users.department, departmentFilter as DepartmentEnum),
        ];

        if (searchFilter) {
            baseFilters.push(searchFilter);
        }

        // Get all enrolled student IDs for this department
        const enrolledRows = await db
            .select({ studentId: studentBatchEnrollments.studentId })
            .from(studentBatchEnrollments)
            .innerJoin(programBatches, eq(studentBatchEnrollments.programBatchId, programBatches.id))
            .innerJoin(programs, eq(programBatches.programId, programs.id))
            .where(eq(programs.departmentTitle, departmentFilter))
            .execute();

        const enrolledIds = new Set(enrolledRows.map(r => r.studentId));

        // If hideEnrolled, exclude enrolled students
        if (hideEnrolled && enrolledIds.size > 0) {
            baseFilters.push(notInArray(users.id, Array.from(enrolledIds)));
        }

        const finalFilter = and(...baseFilters);

        // Fetch paginated students
        const studentsList = await db
            .select({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                city: users.city,
                country: users.country,
                address: users.address,
                avatarURL: users.avatarURL,
                isEmailVerified: users.isEmailVerified,
                role: users.role,
                department: users.department,
                lastOnline: users.lastOnline,
            })
            .from(users)
            .where(finalFilter)
            .limit(limit)
            .offset(offsetVal)
            .execute();

        // Map each student to include `isAlreadyEnrolled`
        const studentsWithStatus = studentsList.map(student => ({
            ...student,
            isAlreadyEnrolled: enrolledIds.has(student.id),
        }));

        // Count total
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(finalFilter)
            .execute();

        const totalUsers = Number(count);

        return res.status(OK).json({
            data: studentsWithStatus,
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch students", error: err.message });
    }
};
