import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { attendanceRecords, attendanceSessions, courseOfferings, courses, courseSectionTeachers, enrollments, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, desc, ne, inArray } from "drizzle-orm";
import { AudienceEnum } from "../../../shared/enums";
import { CreateAttendanceRecordSchema, CreateAttendanceSessionSchema, MarkAttendanceInput, MarkAttendanceSchema } from "../../../utils/validators/lms-schemas/attendanceSchemas";

export const createAttendanceSession = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId;

    try {
        // Validate request body
        const parsed = CreateAttendanceSessionSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { date } = parsed.data;

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || user.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(FORBIDDEN).json({ message: "Only teachers can create attendance sessions." });
        }

        // Fetch course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, courseOfferingId));

        if (!courseOffering || !courseOffering.isActive) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found or inactive." });
        }

        // Authorization: teacher must be assigned to at least one section
        const sectionAssignments = await db
            .select()
            .from(courseSectionTeachers)
            .where(
                and(
                    eq(courseSectionTeachers.courseId, courseOffering.courseId),
                    eq(courseSectionTeachers.teacherId, user.id)
                )
            );

        if (sectionAssignments.length === 0) {
            return res.status(FORBIDDEN).json({
                message: "You are not assigned to this course offering.",
            });
        }

        // Prevent duplicate attendance session on same day
        const [existing] = await db
            .select()
            .from(attendanceSessions)
            .where(
                and(
                    eq(attendanceSessions.courseOfferingId, courseOfferingId),
                    eq(attendanceSessions.date, new Date(date))
                )
            );

        if (existing) {
            return res.status(CONFLICT).json({ message: "Attendance session already exists for this date." });
        }

        // Create new attendance session
        const [newSession] = await db
            .insert(attendanceSessions)
            .values({
                courseOfferingId,
                date: new Date(date),
            })
            .returning();

        return res.status(CREATED).json({ message: "Attendance session created successfully." });
    } catch (error) {
        console.error("Create Attendance Session Error:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error while creating attendance session." });
    }
};

export const getAttendanceSessions = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId;

    try {
        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: "User not found." });
        }

        // Fetch course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, courseOfferingId));

        if (!courseOffering || !courseOffering.isActive) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found or inactive." });
        }

        // Authorization checks
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(
                    and(
                        eq(courseSectionTeachers.courseId, courseOffering.courseId),
                        eq(courseSectionTeachers.teacherId, user.id)
                    )
                );

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        if (user.role === AudienceEnum.Student) {
            const [enrollment] = await db
                .select()
                .from(enrollments)
                .where(
                    and(
                        eq(enrollments.courseOfferingId, courseOffering.id),
                        eq(enrollments.studentId, user.id)
                    )
                );

            if (!enrollment) {
                return res.status(FORBIDDEN).json({
                    message: "You are not enrolled in this course offering.",
                });
            }
        }

        // DepartmentHead has access to all sessions; no extra checks

        // Fetch attendance sessions
        const sessions = await db
            .select()
            .from(attendanceSessions)
            .where(eq(attendanceSessions.courseOfferingId, courseOfferingId))
            .orderBy(desc(attendanceSessions.date));

        return res.status(OK).json({
            message: "Attendance sessions fetched successfully",
            sessions,
        });
    } catch (error) {
        console.error("Error fetching attendance sessions:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Server error while fetching attendance sessions.",
            error,
        });
    }
};

export const markAttendanceRecords = async (req: Request, res: Response) => {
    const { id: sessionId } = req.params;
    const userId = req.userId;

    try {
        // Validate request body
        const parsed = MarkAttendanceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        // Tell TS that parsed.data is of type MarkAttendanceInput
        const { records }: MarkAttendanceInput = parsed.data;

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || user.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(UNAUTHORIZED).json({ message: "Only assigned teachers can mark attendance." });
        }

        // Fetch attendance session
        const [session] = await db
            .select()
            .from(attendanceSessions)
            .where(eq(attendanceSessions.id, sessionId));

        if (!session) {
            return res.status(NOT_FOUND).json({ message: "Attendance session not found." });
        }

        // Fetch course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, session.courseOfferingId));

        if (!courseOffering || !courseOffering.isActive) {
            return res.status(NOT_FOUND).json({ message: "Associated course offering not found or inactive." });
        }

        // Verify teacher is assigned
        const sectionAssignments = await db
            .select()
            .from(courseSectionTeachers)
            .where(
                and(
                    eq(courseSectionTeachers.courseId, courseOffering.courseId),
                    eq(courseSectionTeachers.teacherId, user.id)
                )
            );

        if (sectionAssignments.length === 0) {
            return res.status(FORBIDDEN).json({
                message: "You are not assigned to this course offering.",
            });
        }

        // Upsert attendance records
        const upsertPromises = records.map(({ studentId, present }) =>
            db.insert(attendanceRecords)
                .values({ attendanceSessionId: sessionId, studentId, present })
                .onConflictDoUpdate({
                    target: [attendanceRecords.attendanceSessionId, attendanceRecords.studentId],
                    set: { present },
                })
                .returning()
        );

        const result = await Promise.all(upsertPromises);

        return res.status(CREATED).json({
            message: "Attendance records updated successfully",
            updatedCount: result.length,
        });
    } catch (error) {
        console.error("Error marking attendance:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Server error while marking attendance records.",
            error,
        });
    }
};

export const getAttendanceRecords = async (req: Request, res: Response) => {
    const { id: sessionId } = req.params;
    const userId = req.userId;

    try {
        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: "User not found." });
        }

        // Fetch attendance session
        const [session] = await db
            .select()
            .from(attendanceSessions)
            .where(eq(attendanceSessions.id, sessionId));

        if (!session) {
            return res.status(NOT_FOUND).json({ message: "Attendance session not found." });
        }

        // Fetch course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, session.courseOfferingId));

        if (!courseOffering || !courseOffering.isActive) {
            return res.status(NOT_FOUND).json({ message: "Associated course offering not found or inactive." });
        }

        // Authorization checks
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(
                    and(
                        eq(courseSectionTeachers.courseId, courseOffering.courseId),
                        eq(courseSectionTeachers.teacherId, user.id)
                    )
                );

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        if (user.role === AudienceEnum.Student) {
            const [enrollment] = await db
                .select()
                .from(enrollments)
                .where(
                    and(
                        eq(enrollments.courseOfferingId, courseOffering.id),
                        eq(enrollments.studentId, user.id)
                    )
                );

            if (!enrollment) {
                return res.status(FORBIDDEN).json({
                    message: "You are not enrolled in this course offering.",
                });
            }
        }

        // DepartmentHead has access to all records; no extra checks

        // Fetch attendance records
        const records = await db
            .select()
            .from(attendanceRecords)
            .where(eq(attendanceRecords.attendanceSessionId, sessionId));

        return res.status(OK).json({
            message: "Attendance records fetched successfully",
            records,
        });
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Server error while fetching attendance records.",
            error,
        });
    }
};