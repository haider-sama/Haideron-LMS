import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { AudienceEnum, BatchEnrollmentStatus, FinalizedResultStatusEnum } from "../../../shared/enums";
import { activatedSemesters, courseOfferings, courses, enrollments, finalizedResultEntries, finalizedResults, programBatches, studentBatchEnrollments, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, sql } from "drizzle-orm";
import { enrollBodySchema } from "../../../utils/validators/lms-schemas/studentSchemas";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";

const PASSING_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D"];

export const enrollInCourse = async (req: Request, res: Response) => {
    const studentId = req.userId;
    const { courseOfferingId } = req.params;

    if (!isValidUUID(courseOfferingId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
    }

    const parsed = enrollBodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { section } = parsed.data;

    if (!studentId) {
        return res.status(NOT_FOUND).json({ message: "Missing user ID" });
    }

    try {
        // Validate student
        const student = await db.query.users.findFirst({
            where: eq(users.id, studentId),
        });

        if (!student || student.role !== AudienceEnum.Student) {
            return res.status(FORBIDDEN).json({ message: "Only students can enroll in courses." });
        }

        // Load offering with joins
        const offering = await db.query.courseOfferings.findFirst({
            where: eq(courseOfferings.id, courseOfferingId),
            with: {
                course: {
                    with: {
                        preRequisiteLinks: {
                            with: {
                                preReqCourse: true,
                            },
                        },
                        coRequisiteLinks: {
                            with: {
                                coReqCourse: true,
                            },
                        },
                    },
                },
                programBatch: {
                    with: {
                        program: true,
                    },
                },
                activatedSemester: true,
            },
        });

        if (!offering || !offering.isActive) {
            return res.status(BAD_REQUEST).json({ message: "Course offering is not available." });
        }

        const { course, activatedSemester, programBatch } = offering;
        const program = programBatch?.program;

        // Enrollment deadline check
        if (
            activatedSemester?.enrollmentDeadline &&
            new Date() > new Date(activatedSemester.enrollmentDeadline as any)
        ) {
            return res
                .status(FORBIDDEN)
                .json({ message: "Enrollment deadline has passed." });
        }

        // Department check
        if (!program || program.departmentTitle !== student.department) {
            return res.status(FORBIDDEN).json({
                message: "You can only enroll in courses from your own department.",
            });
        }

        // Section validity
        const sectionSchedules = offering.sectionSchedules || {};
        if (!Object.keys(sectionSchedules).includes(section)) {
            return res.status(BAD_REQUEST).json({
                message: "Invalid section for this course offering.",
            });
        }

        // Check student belongs to batch
        const studentBatch = await db.query.studentBatchEnrollments.findFirst({
            where: and(
                eq(studentBatchEnrollments.studentId, student.id),
                eq(studentBatchEnrollments.status, BatchEnrollmentStatus.Active)
            ),
        });

        if (!studentBatch || studentBatch.programBatchId !== offering.programBatchId) {
            return res
                .status(FORBIDDEN)
                .json({ message: "You cannot enroll in offerings from another batch." });
        }

        // Capacity check
        const capacityMap = offering.capacityPerSection as Record<string, number>;
        const capacity = capacityMap?.[section];
        const [{ count: enrolledCount }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(enrollments)
            .where(
                and(
                    eq(enrollments.courseOfferingId, offering.id),
                    eq(enrollments.section, section)
                )
            );

        if (capacity !== undefined && enrolledCount >= capacity) {
            return res
                .status(BAD_REQUEST)
                .json({ message: `Section ${section} is full.` });
        }

        // Already enrolled check (same course, any offering)
        const existingEnrollment = await db.query.enrollments.findFirst({
            where: eq(enrollments.studentId, student.id),
            with: {
                courseOffering: {
                    with: { course: true },
                },
            },
        });

        if (
            existingEnrollment?.courseOffering?.courseId &&
            existingEnrollment.courseOffering.courseId === course.id
        ) {
            return res
                .status(CONFLICT)
                .json({ message: "You are already enrolled in this course." });
        }

        // Prerequisite check
        if (course.preRequisiteLinks?.length) {
            // Get all finalized results where student passed
            const passedResults = await db.query.finalizedResults.findMany({
                where: eq(finalizedResults.status, FinalizedResultStatusEnum.Confirmed),
                with: {
                    courseOffering: {
                        with: {
                            course: true, // this ensures we have the related course
                        },
                    },
                },
            });

            // Collect passed course IDs for this student
            const passedCourseIds = passedResults.flatMap((r) =>
                (r.results as any[])
                    .filter(
                        (res) =>
                            res.studentId === student.id &&
                            PASSING_GRADES.includes(res.grade)
                    )
                    .map(() => r.courseOffering.course.id)
            );

            // Extract required prereq course IDs
            const requiredPreReqIds = course.preRequisiteLinks.map(
                (link) => link.preReqCourse.id
            );

            // Find unmet prerequisites
            const unmet = requiredPreReqIds.filter(
                (prId) => !passedCourseIds.includes(prId)
            );

            if (unmet.length > 0) {
                return res.status(BAD_REQUEST).json({
                    message: "You have not completed all prerequisite courses.",
                    missingPrerequisites: unmet,
                });
            }
        }

        // Insert enrollment
        await db.insert(enrollments).values({
            studentId: student.id,
            courseOfferingId: offering.id,
            section,
        });

        return res.status(CREATED).json({ message: `Enrolled in section ${section} successfully.` });
    } catch (err) {
        console.error("Enrolling error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
};

export const deEnrollFromCourse = async (req: Request, res: Response) => {
    const studentId = req.userId;
    const { courseOfferingId } = req.params;

    if (!isValidUUID(courseOfferingId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
    }

    const parsed = enrollBodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { section } = parsed.data;

    if (!studentId && !courseOfferingId) {
        return res.status(NOT_FOUND).json({ message: "Missing user or course offering ID" });
    }

    try {
        // Validate student
        const student = await db.query.users.findFirst({
            where: eq(users.id, studentId),
        });

        if (!student || student.role !== AudienceEnum.Student) {
            return res.status(FORBIDDEN).json({ message: "Only students can de-enroll from courses." });
        }

        // Load offering
        const offering = await db.query.courseOfferings.findFirst({
            where: eq(courseOfferings.id, courseOfferingId),
            with: {
                activatedSemester: true,
                programBatch: {
                    with: {
                        program: true,
                    },
                },
            },
        });

        if (!offering) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found" });
        }
        if (!offering.isActive) {
            return res.status(FORBIDDEN).json({
                message: "You cannot de-enroll from an inactive course offering.",
            });
        }

        const { activatedSemester, programBatch } = offering;
        const program = programBatch?.program;

        // Check semester deadline
        if (!activatedSemester?.enrollmentDeadline) {
            return res.status(BAD_REQUEST).json({ message: "Enrollment deadline is not set for this semester." });
        }
        if (new Date() > new Date(activatedSemester.enrollmentDeadline as any)) {
            return res.status(FORBIDDEN).json({ message: "De-enrollment deadline has passed." });
        }

        // Section validity
        const sectionSchedules = offering.sectionSchedules || {};
        if (!Object.keys(sectionSchedules).includes(section)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid section for this course offering." });
        }

        // Delete enrollment
        const deleted = await db
            .delete(enrollments)
            .where(
                and(
                    eq(enrollments.studentId, student.id),
                    eq(enrollments.courseOfferingId, offering.id),
                    eq(enrollments.section, section)
                )
            )
            .returning({ id: enrollments.id });

        if (!deleted.length) {
            return res.status(NOT_FOUND).json({ message: "You are not enrolled in this course." });
        }

        return res.json({ message: `Successfully de-enrolled from section ${section}.` });
    } catch (err) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
};

export const getEnrolledCourses = async (req: Request, res: Response) => {
    const studentId = req.userId;

    if (!isValidUUID(studentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid user ID" });
    }

    try {
        // Get all enrollments of this student with related offering + course
        const studentEnrollments = await db.query.enrollments.findMany({
            where: eq(enrollments.studentId, studentId),
            with: {
                courseOffering: {
                    with: {
                        course: {
                            with: {
                                preRequisiteLinks: {
                                    with: { preReqCourse: true },
                                },
                                coRequisiteLinks: {
                                    with: { coReqCourse: true },
                                },
                                sectionTeachers: true,
                            },
                        },
                        programBatch: true,
                        activatedSemester: true,
                    },
                },
            },
        });

        const response = [];

        for (const enrollment of studentEnrollments) {
            const offering = enrollment.courseOffering;
            const course = offering?.course;
            const section = enrollment.section;

            // Resolve section teacher
            let sectionTeacher = null;

            if (course?.sectionTeachers?.length) {
                // Convert array -> map
                const sectionTeachersMap = course.sectionTeachers.reduce<Record<string, string>>(
                    (acc, st) => {
                        acc[st.section] = st.teacherId;
                        return acc;
                    },
                    {}
                );

                const teacherId = sectionTeachersMap[section];

                if (teacherId) {
                    const teacher = await db.query.users.findFirst({
                        where: eq(users.id, teacherId),
                        columns: { firstName: true, lastName: true, email: true },
                    });

                    if (teacher) {
                        sectionTeacher = {
                            name: `${teacher.firstName} ${teacher.lastName}`,
                            email: teacher.email,
                        };
                    }
                }
            }

            response.push({
                id: enrollment.id,
                enrolledAt: enrollment.enrolledAt,
                section,
                sectionTeacher, // include section teacher
                courseOffering: {
                    id: offering.id,
                    programBatch: offering.programBatch,
                    activatedSemester: offering.activatedSemester,
                    sectionSchedules: (offering.sectionSchedules as Record<string, any>)?.[section] || [],
                    capacityPerSection: (offering.capacityPerSection as Record<string, number>)?.[section] || null,
                    course: {
                        ...course,
                        preRequisites: course?.preRequisiteLinks?.map((l) => ({
                            id: l.preReqCourse.id,
                            title: l.preReqCourse.title,
                            code: l.preReqCourse.code,
                        })),
                        coRequisites: course?.coRequisiteLinks?.map((l) => ({
                            id: l.coReqCourse.id,
                            title: l.coReqCourse.title,
                            code: l.coReqCourse.code,
                        })),
                    },
                    isActive: offering.isActive ?? true,
                    createdAt: offering.createdAt,
                    updatedAt: offering.updatedAt,
                },
            });
        }

        return res.status(OK).json(response);
    } catch (err) {
        console.error("Fetch enrolled courses error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
};

export const getStudentDashboardContext = async (req: Request, res: Response) => {
    const studentId = req.userId;

    if (!isValidUUID(studentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid user ID" });
    }

    try {
        // Get student enrollment + join programBatch + program
        const enrollment = await db.query.studentBatchEnrollments.findFirst({
            where: eq(studentBatchEnrollments.studentId, studentId),
            with: {
                programBatch: {
                    with: {
                        program: {
                            columns: { id: true, title: true, departmentTitle: true },
                        },
                    },
                },
            },
        });

        if (!enrollment) {
            return res.status(NOT_FOUND).json({ message: "Student is not enrolled in any batch" });
        }

        // Get activated semesters for that programBatch
        const semesters = await db.query.activatedSemesters.findMany({
            where: eq(activatedSemesters.programBatchId, enrollment.programBatchId),
        });

        return res.status(OK).json({
            program: enrollment.programBatch.program,
            programBatch: {
                id: enrollment.programBatch.id,
                sessionYear: enrollment.programBatch.sessionYear,
            },
            activatedSemesters: semesters,
        });
    } catch (err) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error" });
    }
};

export const getTranscript = async (req: Request, res: Response) => {
    const studentId = req.userId;

    if (!isValidUUID(studentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid user ID" });
    }

    try {
        // 1. Fetch all confirmed results for this student
        const results = await db
            .select({
                frId: finalizedResults.id,
                status: finalizedResults.status,
                grade: finalizedResultEntries.grade,
                gradePoint: finalizedResultEntries.gradePoint,

                // Flatten everything
                courseOfferingId: courseOfferings.id,
                courseId: courses.id,
                courseTitle: courses.title,
                courseCode: courses.code,
                courseCreditHours: courses.creditHours,
                activatedSemesterId: activatedSemesters.id,
                semesterNo: activatedSemesters.semesterNo,
                term: activatedSemesters.term,
                startedAt: activatedSemesters.startedAt,
                endedAt: activatedSemesters.endedAt,
                programBatchId: programBatches.id,
                sessionYear: programBatches.sessionYear,
            })
            .from(finalizedResults)
            .innerJoin(finalizedResultEntries, eq(finalizedResultEntries.finalizedResultId, finalizedResults.id))
            .innerJoin(courseOfferings, eq(courseOfferings.id, finalizedResults.courseOfferingId))
            .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
            .innerJoin(activatedSemesters, eq(activatedSemesters.id, courseOfferings.activatedSemesterId))
            .innerJoin(programBatches, eq(programBatches.id, activatedSemesters.programBatchId))
            .where(
                and(
                    eq(finalizedResultEntries.studentId, studentId),
                    eq(finalizedResults.status, FinalizedResultStatusEnum.Confirmed)
                )
            );

        const normalized = results.map(r => ({
            frId: r.frId,
            status: r.status,
            grade: r.grade,
            gradePoint: r.gradePoint,
            courseOffering: {
                id: r.courseOfferingId,
                course: {
                    id: r.courseId,
                    title: r.courseTitle,
                    code: r.courseCode,
                    creditHours: r.courseCreditHours,
                },
                activatedSemester: {
                    id: r.activatedSemesterId,
                    semesterNo: r.semesterNo,
                    term: r.term,
                    startedAt: r.startedAt,
                    endedAt: r.endedAt,
                    programBatch: {
                        id: r.programBatchId,
                        sessionYear: r.sessionYear,
                    },
                },
            },
        }));

        // 2. Latest attempt per course
        const latestAttemptPerCourse = new Map<string, any>();
        for (const r of normalized) {
            const { courseOffering, grade, gradePoint, status } = r;
            const course = courseOffering.course;
            const sem = courseOffering.activatedSemester;

            if (!course || !sem) continue;

            const courseId = course.id;
            const current = latestAttemptPerCourse.get(courseId);

            const newTimestamp = new Date(sem.startedAt || 0).getTime();
            const oldTimestamp = current ? new Date(current.activatedSemester.startedAt || 0).getTime() : 0;

            if (!current || newTimestamp > oldTimestamp) {
                latestAttemptPerCourse.set(courseId, {
                    courseOffering,
                    studentResult: { grade, gradePoint },
                    activatedSemester: sem,
                    status,
                });
            }
        }

        // 3. Organize by semester
        const semestersMap = new Map<number, any>();
        for (const { courseOffering, studentResult, activatedSemester, status } of latestAttemptPerCourse.values()) {
            const { semesterNo, term, startedAt, endedAt, programBatch } = activatedSemester;
            const course = courseOffering.course;
            const sessionYear = programBatch?.sessionYear;

            if (!semestersMap.has(semesterNo)) {
                semestersMap.set(semesterNo, {
                    semesterNo,
                    term,
                    sessionYear,
                    startedAt,
                    endedAt,
                    courses: [],
                    totalCredits: 0,
                    totalGradePoints: 0,
                });
            }

            const semester = semestersMap.get(semesterNo);
            semester.courses.push({
                courseTitle: course.title,
                courseCode: course.code,
                creditHours: course.creditHours,
                grade: studentResult.grade,
                gradePoint: studentResult.gradePoint,
                status,
            });

            semester.totalCredits += course.creditHours;
            semester.totalGradePoints += course.creditHours * studentResult.gradePoint;
        }

        // 4. Compute GPA + CGPA
        const semesters = Array.from(semestersMap.values()).sort((a, b) => a.semesterNo - b.semesterNo);

        let totalCredits = 0;
        let totalGradePoints = 0;
        for (const sem of semesters) {
            sem.gpa = sem.totalCredits > 0 ? (sem.totalGradePoints / sem.totalCredits).toFixed(2) : "0.00";
            totalCredits += sem.totalCredits;
            totalGradePoints += sem.totalGradePoints;
        }

        const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "0.00";

        return res.status(OK).json({ semesters, cgpa });
    } catch (err) {
        console.error("Transcript error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to compile transcript" });
    }
};