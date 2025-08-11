// src/controllers/student/studentEnrollmentController.ts
import { Request, Response } from "express";
import User from "../../../models/auth/user.model";
import { StudentBatchEnrollment } from "../../../models/lms/enrollment/student.batch.enrollment";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import mongoose from "mongoose";
import { ProgramBatch } from "../../../models/lms/program/program.batch.model";
import { checkDepartmentAccess } from "../faculty/batchController";
import { createEnrollmentSchema, defaultEnrollmentSchema } from "../../../utils/validators/lmsSchemas/studentEnrollmentSchemas";
import { AudienceEnum, BatchEnrollmentStatus } from "../../../shared/enums";
import { Program, ProgramDocument } from "../../../models/lms/program/program.model";
import { ProgramBatchDocument } from "../../../models/lms/program/program.batch.model";

export const createStudentBatchEnrollment = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = createEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { studentId, programBatchId, status } = parsed.data;

    try {
        const [requestingUser, student, rawProgramBatch] = await Promise.all([
            User.findById(userId),
            User.findById(studentId),
            ProgramBatch.findById(programBatchId).populate({
                path: "program",
                select: "departmentTitle",
            })
        ]);

        const programBatch = rawProgramBatch as unknown as ProgramBatchDocument & {
            program: Pick<ProgramDocument, "departmentTitle">;
        };

        if (!requestingUser) {
            return res.status(NOT_FOUND).json({ error: "Requesting user not found" });
        }

        if (!student || student.role !== AudienceEnum.Student) {
            return res.status(BAD_REQUEST).json({ error: "Provided user is not a student." });
        }

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ error: "Program batch not found." });
        }

        const program = programBatch.program;

        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "assign students to this batch");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ error: err.message });
        }

        if (String(student.department) !== String(program.departmentTitle)) {
            return res.status(BAD_REQUEST).json({
                error: "Student does not belong to the same department as the program batch."
            });
        }

        // Create or update enrollment (idempotent if needed)
        const enrollment = await StudentBatchEnrollment.findOneAndUpdate(
            { student: studentId, programBatch: programBatchId },
            {
                student: studentId,
                programBatch: programBatchId,
                status: status || BatchEnrollmentStatus.Active,
            },
            { new: true, upsert: true }
        );

        return res.status(OK).json(enrollment);
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to assign student to batch",
            error: err.message
        });
    }
};

export const listStudentsInBatch = async (req: Request, res: Response) => {
    const { programBatchId } = req.params;
    const userId = req.userId;

    if (!programBatchId || !mongoose.Types.ObjectId.isValid(programBatchId)) {
        return res.status(BAD_REQUEST).json({ message: "Valid programBatchId is required." });
    }

    try {
        const requestingUser = await User.findById(userId);
        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        const programBatch = await ProgramBatch.findById(programBatchId)
            .populate({
                path: "program",
                select: "departmentTitle"
            });
        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        const program: any = programBatch.program;

        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "view students in this batch");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        const enrollments = await StudentBatchEnrollment.find({ programBatch: programBatchId })
            .populate("student", "-password -resetPasswordToken -resetPasswordExpiresAt");

        const students = enrollments
            .filter(e => e.student) // ensure populated
            .map((e) => ({
                student: e.student,
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
    const { departmentTitle } = req.params;
    const userId = req.userId;

    if (!departmentTitle) {
        return res.status(BAD_REQUEST).json({ message: "Department title is required." });
    }

    try {
        const requestingUser = await User.findById(userId);
        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        // Check access
        try {
            checkDepartmentAccess(requestingUser, departmentTitle, "view students enrolled in this department");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        // Step 1: Find all programs with this departmentTitle
        const programs = await Program.find({ departmentTitle }).select("_id");

        const programIds = programs.map(p => p._id);

        // Step 2: Find all batches linked to these programs
        const programBatches = await ProgramBatch.find({ program: { $in: programIds } }).select("_id");
        const batchIds = programBatches.map(b => b._id);

        // Step 3: Find enrollments from those batches
        const enrollments = await StudentBatchEnrollment.find({
            programBatch: { $in: batchIds },
        }).populate("student", "-password -resetPasswordToken -resetPasswordExpiresAt");

        // Step 4: Deduplicate students
        const uniqueStudentsMap = new Map<string, { student: any; status: any }>();

        enrollments.forEach((enrollment) => {
            if (!enrollment.student) return; // Skip if student is null

            const sid = enrollment.student._id.toString();
            if (!uniqueStudentsMap.has(sid)) {
                uniqueStudentsMap.set(sid, {
                    student: enrollment.student,
                    status: enrollment.status,
                });
            }
        });

        const students = Array.from(uniqueStudentsMap.values());

        return res.status(OK).json({ students });
    } catch (err: any) {
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
        const [requestingUser, programBatch] = await Promise.all([
            User.findById(userId),
            ProgramBatch.findById(programBatchId).populate("program"),
        ]);

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        const program: any = programBatch.program;

        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "remove student from this batch");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        const result = await StudentBatchEnrollment.findOneAndDelete({
            student: studentId,
            programBatch: programBatchId,
        });

        if (!result) {
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
        const [requestingUser, programBatch] = await Promise.all([
            User.findById(userId),
            ProgramBatch.findById(programBatchId).populate("program"),
        ]);

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        const program: any = programBatch.program;

        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "soft-remove student from this batch");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        const enrollment = await StudentBatchEnrollment.findOneAndUpdate(
            { student: studentId, programBatch: programBatchId },
            { status: BatchEnrollmentStatus.Dropped },
            { new: true }
        );

        if (!enrollment) {
            return res.status(NOT_FOUND).json({ message: "Enrollment not found." });
        }

        return res.status(OK).json({
            message: "Student marked as 'dropped' from batch successfully.",
            updatedEnrollment: enrollment,
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
        const [requestingUser, programBatch] = await Promise.all([
            User.findById(userId),
            ProgramBatch.findById(programBatchId).populate("program"),
        ]);

        if (!requestingUser) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: User not found." });
        }

        if (!programBatch || !programBatch.program) {
            return res.status(NOT_FOUND).json({ message: "Program batch not found." });
        }

        const program: any = programBatch.program;

        try {
            checkDepartmentAccess(requestingUser, program.departmentTitle, "reinstate student in this batch");
        } catch (accessError: any) {
            return res.status(FORBIDDEN).json({ message: accessError.message });
        }

        const enrollment = await StudentBatchEnrollment.findOneAndUpdate(
            { student: studentId, programBatch: programBatchId },
            { status: BatchEnrollmentStatus.Active },
            { new: true }
        );

        if (!enrollment) {
            return res.status(NOT_FOUND).json({ message: "Enrollment not found." });
        }

        return res.status(OK).json({
            message: "Student reactivated in batch successfully.",
            updatedEnrollment: enrollment,
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

        const requestingUser = await User.findById(userId).select("role department");
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
        const skip = (page - 1) * limit;
        const search = (req.query.search as string || "").trim().toLowerCase();
        const department = req.query.department as string;
        const hideEnrolled = req.query.hideEnrolled === "true";

        // Admin can optionally filter by department
        // DepartmentHeads are restricted to their own department
        const departmentFilter = isAdmin
            ? (department) || undefined
            : String(requestingUser.department);

        if (!departmentFilter) {
            return res.status(BAD_REQUEST).json({ message: "Department is required" });
        }

        const searchQuery: any = {
            role: "Student",
            department: departmentFilter,
        };

        if (search) {
            searchQuery.$or = [
                { email: { $regex: search, $options: "i" } },
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { city: { $regex: search, $options: "i" } },
                { country: { $regex: search, $options: "i" } },
            ];
        }

        let enrolledStudentIds: string[] = [];

        if (hideEnrolled) {
            const programs = await Program.find({ departmentTitle: departmentFilter }).select("_id");
            const programIds = programs.map(p => p._id);

            const batches = await ProgramBatch.find({ program: { $in: programIds } }).select("_id");
            const batchIds = batches.map(b => b._id);

            const enrollments = await StudentBatchEnrollment.find({
                programBatch: { $in: batchIds },
            }).select("student");

            enrolledStudentIds = enrollments.map(e => e.student.toString());

            searchQuery._id = { $nin: enrolledStudentIds };
        }

        const [users, totalUsers] = await Promise.all([
            User.find(searchQuery)
                .skip(skip)
                .limit(limit)
                .select(
                    "_id email firstName lastName city country address avatarURL isEmailVerified role department lastOnline"
                )
                .lean(),
            User.countDocuments(searchQuery),
        ]);

        res.status(OK).json({
            data: users,
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch students", error: err.message });
    }
};
