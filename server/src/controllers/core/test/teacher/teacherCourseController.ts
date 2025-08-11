import mongoose, { Types } from "mongoose";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { Request, Response } from "express";
import { ActivatedSemester } from "../../../models/lms/semester/activated.semester.model";
import CourseOffering from "../../../models/lms/course/course.offering.model";
import { CourseDocument } from "../../../models/lms/course/course.model";
import User from "../../../models/auth/user.model";
import { Program } from "../../../models/lms/program/program.model";
import Enrollment from "../../../models/lms/enrollment/enrollment.model";

export const getAssignedCourseOfferings = async (req: Request, res: Response) => {
    const { activatedSemesterId } = req.params;
    const teacherId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(activatedSemesterId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid activatedSemesterId format" });
    }

    try {
        const semester = await ActivatedSemester.findById(activatedSemesterId);
        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Activated semester not found" });
        }

        const allOfferings = await CourseOffering.find({ activatedSemester: activatedSemesterId })
            .populate("course");

        const assignedOfferings = allOfferings
            .map(offering => {
                const course = offering.course;

                if (!course || typeof course !== 'object' || !('sectionTeachers' in course)) {
                    return null;
                }

                const courseDoc = course as unknown as CourseDocument;

                const assignedSections: string[] = [];

                const sectionTeachersMap = course.sectionTeachers as Map<string, Types.ObjectId>;

                for (const [section, teacher] of sectionTeachersMap.entries()) {
                    if (teacher?.toString() === teacherId) {
                        assignedSections.push(section);
                    }
                }

                if (assignedSections.length === 0) return null;

                return {
                    offeringId: offering._id,
                    course: {
                        _id: courseDoc._id,
                        title: courseDoc.title,
                        code: courseDoc.code,
                    },
                    assignedSections,
                    programBatch: offering.programBatch,
                    activatedSemester: offering.activatedSemester,
                    sectionSchedules: offering.sectionSchedules,
                    capacityPerSection: offering.capacityPerSection,
                };
            })
            .filter(Boolean); // remove nulls

        return res.status(OK).json({ offerings: assignedOfferings });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching assigned course offerings",
            error: err.message,
        });
    }
};

export const getAllAssignedCourseOfferings = async (req: Request, res: Response) => {
    const teacherId = req.userId;
    const semesterId = req.query.semesterId;

    try {
        if (!semesterId) {
            return res.status(400).json({ message: "Missing semesterId in query" });
        }

        // Fetch offerings for the specific semester
        const offerings = await CourseOffering.find({
            activatedSemester: semesterId,
        })
            .populate({
                path: "course",
                select: "title code clos sectionTeachers",
                populate: { path: "clos" }
            })
            .lean();

        const teacherIdStr = String(teacherId);

        const assignedOfferings = offerings
            .map((offering) => {
                const courseRaw = offering.course;

                if (!courseRaw || typeof courseRaw !== "object" || !("title" in courseRaw)) {
                    return null;
                }

                const course = courseRaw as unknown as CourseDocument;

                const assignedSections: string[] = [];

                const sectionTeachersMap = course.sectionTeachers;
                const sectionTeachers =
                    sectionTeachersMap instanceof Map
                        ? Object.fromEntries(sectionTeachersMap)
                        : sectionTeachersMap ?? {};

                for (const [section, teacher] of Object.entries(sectionTeachers)) {
                    if (String(teacher) === teacherIdStr) {
                        assignedSections.push(section);
                    }
                }

                if (assignedSections.length === 0) return null;

                return {
                    offeringId: offering._id,
                    course: {
                        _id: course._id,
                        title: course.title,
                        code: course.code,
                        clos: course.clos,
                    },
                    assignedSections,
                    activatedSemester: offering.activatedSemester,
                    programBatch: offering.programBatch,
                    sectionSchedules: offering.sectionSchedules,
                    capacityPerSection: offering.capacityPerSection,
                };
            })
            .filter(Boolean); // remove nulls

        return res.status(200).json({ offerings: assignedOfferings });
    } catch (err: any) {
        return res.status(500).json({
            message: "Internal server error while fetching assigned offerings",
            error: err.message,
        });
    }
};


export const getFacultyDashboardContext = async (req: Request, res: Response) => {
    const teacherId = req.userId;

    try {
        const user = await User.findById(teacherId);
        if (!user || user.role !== "DepartmentTeacher") {
            return res.status(NOT_FOUND).json({ message: "Teacher user not found" });
        }

        // Step 1: Find a course offering where this teacher is assigned to a section
        const offerings = await CourseOffering.find().populate("programBatch").populate("course");

        const matchedOffering = offerings.find(offering => {
            const course: any = offering.course;
            const sectionTeachersMap = course?.sectionTeachers;
            return sectionTeachersMap && Array.from(sectionTeachersMap.values())
                .some((val: any) => val?.toString() === teacherId);
        });

        if (!matchedOffering || !matchedOffering.programBatch) {
            return res.status(NOT_FOUND).json({ message: "No course offering or program batch assigned to this faculty" });
        }

        const programBatch = matchedOffering.programBatch as any;

        const program = await Program.findById(programBatch.program);
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Associated program not found" });
        }

        const activatedSemesters = await ActivatedSemester.find({
            programBatch: programBatch._id,
        }).sort({ semesterNo: 1 });

        return res.status(OK).json({
            program,
            programBatch,
            activatedSemesters,
        });
    } catch (error: any) {
        console.error("Faculty dashboard context error:", error);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch faculty dashboard context",
            error: error.message,
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

    if (!mongoose.Types.ObjectId.isValid(offeringId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
    }

    try {
        const offering = await CourseOffering.findById(offeringId).populate("course");
        if (!offering || !offering.course) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found" });
        }

        const course: any = offering.course;
        const sectionTeachers = course.sectionTeachers;

        const assignedTeacherId = sectionTeachers?.get?.(section) ?? sectionTeachers?.[section];
        if (!assignedTeacherId || assignedTeacherId.toString() !== teacherId) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to view students for this section" });
        }

        // Step 1: Get all enrollments for the offering + section
        const matchQuery: any = {
            courseOffering: offeringId,
            section,
        };

        const enrollments = await Enrollment.find(matchQuery)
            .populate({
                path: "student",
                select: "firstName lastName email",
                match: searchQuery
                    ? {
                        $or: [
                            { firstName: { $regex: searchQuery, $options: "i" } },
                            { lastName: { $regex: searchQuery, $options: "i" } },
                            { email: { $regex: searchQuery, $options: "i" } },
                        ],
                    }
                    : undefined,
            })
            .lean();

        // Step 2: Filter out null students (due to non-matching search)
        const filtered = enrollments.filter((enr) => enr.student);

        // Step 3: Paginate manually (because we're filtering in-memory)
        const total = filtered.length;
        const paginated = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

        // Step 4: Format response
        const students = paginated.map((enr) => {
            const student = enr.student as typeof enr.student & {
                firstName: string;
                lastName: string;
                email: string;
            };

            return {
                _id: student._id,
                name: `${student.firstName} ${student.lastName}`,
                email: student.email,
                enrolledAt: enr.enrolledAt,
            };
        });

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