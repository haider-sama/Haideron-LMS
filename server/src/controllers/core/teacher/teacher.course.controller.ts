import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { activatedSemesters, clos, courseOfferings, courses, courseSectionTeachers, enrollments, programBatches, programs, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, sql, asc, inArray } from "drizzle-orm";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";
import { getStringQueryParam } from "../../../utils/validators/sanitizer/queryParams";

// export const getAssignedCourseOfferings = async (req: Request, res: Response) => {
//     const { activatedSemesterId } = req.params;
//     const teacherId = req.userId;

//     if (!isValidUUID(activatedSemesterId)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid activatedSemester ID" });
//     }

//     try {
//         // Validate semester exists
//         const semester = await db
//             .select()
//             .from(activatedSemesters)
//             .where(eq(activatedSemesters.id, activatedSemesterId))
//             .limit(1);

//         if (semester.length === 0) {
//             return res.status(NOT_FOUND).json({ message: "Activated semester not found" });
//         }

//         // Fetch offerings + join courses + join teacher assignments
//         const offerings = await db
//             .select({
//                 offeringId: courseOfferings.id,
//                 sectionSchedules: courseOfferings.sectionSchedules,
//                 capacityPerSection: courseOfferings.capacityPerSection,
//                 programBatchId: courseOfferings.programBatchId,
//                 activatedSemesterId: courseOfferings.activatedSemesterId,

//                 courseId: courses.id,
//                 courseTitle: courses.title,
//                 courseCode: courses.code,

//                 section: courseSectionTeachers.section,
//             })
//             .from(courseOfferings)
//             .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
//             .innerJoin(
//                 courseSectionTeachers,
//                 and(
//                     eq(courseSectionTeachers.courseId, courses.id),
//                     eq(courseSectionTeachers.teacherId, teacherId)
//                 )
//             )
//             .where(eq(courseOfferings.activatedSemesterId, activatedSemesterId));

//         // Group by offering and collect assigned sections
//         const offeringMap: Record<string, {
//             offeringId: string;
//             course: { id: string; title: string; code: string };
//             assignedSections: string[];
//             programBatchId: string;
//             activatedSemesterId: string;
//             sectionSchedules: any;
//             capacityPerSection: any;
//         }> = {};

//         for (const off of offerings) {
//             if (!offeringMap[off.offeringId]) {
//                 offeringMap[off.offeringId] = {
//                     offeringId: off.offeringId,
//                     course: {
//                         id: off.courseId,
//                         title: off.courseTitle,
//                         code: off.courseCode,
//                     },
//                     assignedSections: [],
//                     programBatchId: off.programBatchId,
//                     activatedSemesterId: off.activatedSemesterId,
//                     sectionSchedules: off.sectionSchedules,
//                     capacityPerSection: off.capacityPerSection,
//                 };
//             }
//             offeringMap[off.offeringId].assignedSections.push(off.section);
//         }

//         const assignedOfferings = Object.values(offeringMap);

//         return res.status(OK).json({ offerings: assignedOfferings });
//     } catch (err: any) {
//         console.error("Assigned course offerings error:", err);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while fetching assigned course offerings",
//             error: err.message,
//         });
//     }
// };

export const getAllAssignedCourseOfferings = async (req: Request, res: Response) => {
    const teacherId = req.userId;
    const semesterId = getStringQueryParam(req.query.semesterId);

    try {
        if (!semesterId || !isValidUUID(semesterId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid semester ID" });
        }

        // Fetch offerings + join courses + join teacher assignments
        const offerings = await db
            .select({
                offeringId: courseOfferings.id,
                sectionSchedules: courseOfferings.sectionSchedules,
                capacityPerSection: courseOfferings.capacityPerSection,
                programBatchId: courseOfferings.programBatchId,
                activatedSemesterId: courseOfferings.activatedSemesterId,

                courseId: courses.id,
                courseTitle: courses.title,
                courseCode: courses.code,
                courseDescription: courses.description,

                section: courseSectionTeachers.section,
            })
            .from(courseOfferings)
            .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
            .innerJoin(
                courseSectionTeachers,
                and(
                    eq(courseSectionTeachers.courseId, courses.id),
                    eq(courseSectionTeachers.teacherId, teacherId)
                )
            )
            .where(eq(courseOfferings.activatedSemesterId, semesterId));

        // Fetch all CLOs for these courses
        const courseIds = [...new Set(offerings.map((o) => o.courseId))];

        const closList = await db
            .select({
                id: clos.id,
                code: clos.code,
                title: clos.title,
                courseId: clos.courseId,
            })
            .from(clos)
            .where(inArray(clos.courseId, courseIds));

        // Map courseId -> CLOs
        const cloMap: Record<string, typeof closList> = {};
        for (const c of closList) {
            if (!cloMap[c.courseId]) cloMap[c.courseId] = [];
            cloMap[c.courseId].push(c);
        }

        // Group by offering and collect assigned sections
        const offeringMap: Record<string, any> = {};

        for (const off of offerings) {
            if (!offeringMap[off.offeringId]) {
                offeringMap[off.offeringId] = {
                    offeringId: off.offeringId,
                    course: {
                        id: off.courseId,
                        title: off.courseTitle,
                        code: off.courseCode,
                        description: off.courseDescription,
                        clos: cloMap[off.courseId] || [],
                    },
                    assignedSections: [],
                    activatedSemesterId: off.activatedSemesterId,
                    programBatchId: off.programBatchId,
                    sectionSchedules: off.sectionSchedules,
                    capacityPerSection: off.capacityPerSection,
                };
            }
            offeringMap[off.offeringId].assignedSections.push(off.section);
        }

        const assignedOfferings = Object.values(offeringMap);

        return res.status(OK).json({ offerings: assignedOfferings });
    } catch (err: any) {
        console.error("getAllAssignedCourseOfferings error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Internal server error while fetching assigned offerings",
            error: err.message,
        });
    }
};

export const getEnrolledStudentsForCourse = async (req: Request, res: Response) => {
    const teacherId = req.userId;
    const { offeringId, section } = req.params;
    const { page = "1", limit = "20", search = "" } = req.query;

    const pageNum = parseInt(page as string);
    const pageSize = parseInt(limit as string);
    const searchQuery = (search as string).trim();

    if (!isValidUUID(offeringId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
    }

    try {
        // Get offering + courseId
        const offeringRes = await db
            .select({
                offeringId: courseOfferings.id,
                courseId: courseOfferings.courseId,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, offeringId))
            .limit(1);

        if (offeringRes.length === 0) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found" });
        }

        const offering = offeringRes[0];

        // Verify teacher is assigned to section
        const sectionTeacher = await db
            .select()
            .from(courseSectionTeachers)
            .where(
                and(
                    eq(courseSectionTeachers.courseId, offering.courseId),
                    eq(courseSectionTeachers.section, section),
                    eq(courseSectionTeachers.teacherId, teacherId)
                )
            )
            .limit(1);

        if (sectionTeacher.length === 0) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to view students for this section" });
        }

        // Query enrollments with students
        let whereClause = and(
            eq(enrollments.courseOfferingId, offeringId),
            eq(enrollments.section, section)
        );

        let searchFilter = undefined;
        if (searchQuery) {
            searchFilter = sql`${users.searchVector} @@ plainto_tsquery('simple', ${searchQuery})`;
            whereClause = and(whereClause, searchFilter);
        }

        const results = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                enrolledAt: enrollments.enrolledAt,
            })
            .from(enrollments)
            .innerJoin(users, eq(users.id, enrollments.studentId))
            .where(whereClause)
            .limit(pageSize)
            .offset((pageNum - 1) * pageSize);

        // Count total for pagination
        const totalRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(enrollments)
            .innerJoin(users, eq(users.id, enrollments.studentId))
            .where(whereClause);

        const total = Number(totalRes[0]?.count || 0);

        // Format response
        const students = results.map((r) => ({
            id: r.id,
            name: `${r.firstName} ${r.lastName}`,
            email: r.email,
            enrolledAt: r.enrolledAt,
        }));

        return res.status(OK).json({
            students,
            total,
            page: pageNum,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error: any) {
        console.error("Error fetching enrolled students:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error", error: error.message });
    }
};

export const getFacultyDashboardContext = async (req: Request, res: Response) => {
    const teacherId = req.userId;

    try {
        // Validate teacher
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, teacherId))
            .limit(1);

        if (user.length === 0 || user[0].role !== "DepartmentTeacher") {
            return res.status(NOT_FOUND).json({ message: "Teacher user not found" });
        }

        // Find any course offering where this teacher is assigned
        const offerings = await db
            .select({
                offeringId: courseOfferings.id,
                programBatchId: courseOfferings.programBatchId,
                courseId: courses.id,
                section: courseSectionTeachers.section,
            })
            .from(courseOfferings)
            .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
            .innerJoin(
                courseSectionTeachers,
                and(
                    eq(courseSectionTeachers.courseId, courses.id),
                    eq(courseSectionTeachers.teacherId, teacherId)
                )
            )
            .limit(1);

        if (offerings.length === 0) {
            return res.status(NOT_FOUND).json({ message: "No course offering assigned to this faculty" });
        }

        const matchedOffering = offerings[0];

        // Get programBatch
        const programBatchRes = await db
            .select()
            .from(programBatches)
            .where(eq(programBatches.id, matchedOffering.programBatchId))
            .limit(1);

        if (programBatchRes.length === 0) {
            return res.status(NOT_FOUND).json({ message: "No program batch found for offering" });
        }

        const programBatch = programBatchRes[0];

        // Get program
        const programRes = await db
            .select()
            .from(programs)
            .where(eq(programs.id, programBatch.programId))
            .limit(1);

        if (programRes.length === 0) {
            return res.status(NOT_FOUND).json({ message: "Associated program not found" });
        }

        const program = programRes[0];

        // Step 5: Get activated semesters for program batch
        const semesters = await db
            .select()
            .from(activatedSemesters)
            .where(eq(activatedSemesters.programBatchId, programBatch.id))
            .orderBy(asc(activatedSemesters.semesterNo));

        return res.status(OK).json({
            program,
            programBatch,
            activatedSemesters: semesters,
        });
    } catch (error: any) {
        console.error("Faculty dashboard context error:", error);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch faculty dashboard context",
            error: error.message,
        });
    }
};