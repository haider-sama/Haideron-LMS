// controllers/studentRegistrationController.ts

import { Request, Response } from "express";
import Enrollment from "../../../models/lms/enrollment/enrollment.model";
import { ActivatedSemester } from "../../../models/lms/semester/activated.semester.model";
import { Semester } from "../../../models/lms/semester/semester.model";
import CourseOffering from "../../../models/lms/course/course.offering.model";
import mongoose from "mongoose";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import User from "../../../models/auth/user.model";
import { checkDepartmentAccess } from "../faculty/batchController";

export const registerStudentToCourse = async (req: Request, res: Response) => {
    const activatedSemesterId = req.params.id;
    const { courseOfferingId, section, studentId } = req.body;
    const userId = req.userId;

    if (!courseOfferingId || !section || !studentId) {
        return res.status(BAD_REQUEST).json({ message: "courseOfferingId, section, and studentId are required." });
    }

    if (
        !mongoose.Types.ObjectId.isValid(activatedSemesterId) ||
        !mongoose.Types.ObjectId.isValid(courseOfferingId) ||
        !mongoose.Types.ObjectId.isValid(studentId)
    ) {
        return res.status(BAD_REQUEST).json({ message: "Invalid ID format." });
    }


    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== "Student") {
            return res.status(BAD_REQUEST).json({ message: "Provided user is not a valid student." });
        }

        const activatedSemester = await ActivatedSemester.findById(activatedSemesterId).populate("programBatch");
        if (!activatedSemester || !activatedSemester.isActive) {
            return res.status(400).json({ message: "Activated semester not found or inactive" });
        }

        const courseOffering = await CourseOffering.findById(courseOfferingId).populate({
            path: "course",
            populate: {
                path: "preRequisites", // Assuming the Course schema has a `preRequisites` field
                select: "_id title code",
            },
        });
        if (!courseOffering || !courseOffering.isActive) {
            return res.status(BAD_REQUEST).json({ message: "Course offering not found or inactive." });
        }

        const course: any = courseOffering.course;
        checkDepartmentAccess(user, course.department, "register a student to a course");

        const existingEnrollment = await Enrollment.findOne({ student: studentId, courseOffering: courseOfferingId });
        if (existingEnrollment) {
            return res.status(CONFLICT).json({ message: "Already registered for this course" });
        }

        // Ensure course belongs to same activated semester
        if (
            String(courseOffering.activatedSemester) !== String(activatedSemester._id) ||
            String(courseOffering.programBatch) !== String(activatedSemester.programBatch._id)
        ) {
            return res.status(BAD_REQUEST).json({
                message: "Course offering is not part of this activated semester."
            });
        }

        const validSections = courseOffering.sectionSchedules || {};
        if (!(section in validSections)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid section." });
        }

        const preRequisites = course?.preRequisites || [];

        if (preRequisites.length > 0) {
            const passedEnrollments = await Enrollment.find({
                student: studentId,
                grade: { $in: ["A", "A-", "B+", "B", "B-", "C+", "C"] }, // Passing grades
            }).populate({
                path: "courseOffering",
                populate: { path: "course", select: "_id" },
            });

            const passedCourseIds = passedEnrollments
                .map((e) => (e.courseOffering as any)?.course?._id?.toString())
                .filter(Boolean);

            const unmetPreReqs = preRequisites.filter(
                (pr: any) => !passedCourseIds.includes(pr._id.toString())
            );

            if (unmetPreReqs.length > 0) {
                return res.status(BAD_REQUEST).json({
                    message: "Student has not completed all prerequisites.",
                    unmetPreRequisites: unmetPreReqs.map((pr: any) => ({
                        _id: pr._id,
                        title: pr.title,
                        code: pr.code,
                    })),
                });
            }
        }

        const newEnrollment = new Enrollment({
            student: studentId,
            courseOffering: courseOfferingId,
            section,
        });

        await newEnrollment.save();

        return res.status(CREATED).json({ message: "Course registered successfully", enrollment: newEnrollment });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to register",
            error: err.message
        });
    }
};

export const getStudentRegistrations = async (req: Request, res: Response) => {
    const studentId = req.params.id;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid student ID format." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== "Student") {
            return res.status(NOT_FOUND).json({ message: "Student not found" });
        }

        // Enforce department-level access
        try {
            checkDepartmentAccess(user, student.department, "view this student's course registrations");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }


        const registrations = await Enrollment.find({ student: studentId })
            .populate({
                path: "courseOffering",
                populate: [
                    {
                        path: "course",
                        select: "code title creditHours preRequisites department",
                    },
                    {
                        path: "activatedSemester",
                        select: "semesterNo isActive startedAt endedAt",
                    },
                    {
                        path: "programBatch",
                        select: "title session program",
                        populate: {
                            path: "program",
                            select: "title department",
                        },
                    },
                ],
            })
            .sort({ createdAt: -1 });

        return res.status(OK).json(registrations);
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch registrations",
            error: err.message
        });
    }
};

export const dropStudentCourse = async (req: Request, res: Response) => {
    const registrationId = req.params.id;
    const { studentId } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(registrationId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid registrationId or studentId format." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Ensure user has the right to drop the course for this student
        const enrollment = await Enrollment.findOne({ _id: registrationId, student: studentId }).populate({
            path: "courseOffering",
            populate: {
                path: "course",
                select: "department",
            },
        });

        if (!enrollment) {
            return res.status(NOT_FOUND).json({ message: "Enrollment not found or not associated with the student" });
        }

        const course: any = (enrollment.courseOffering as any)?.course;
        if (!course) {
            return res.status(BAD_REQUEST).json({ message: "Enrollment does not contain valid course data." });
        }

        try {
            checkDepartmentAccess(user, course.department, "drop a course for this student");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        await Enrollment.findByIdAndDelete(enrollment._id);

        return res.status(200).json({ message: "Course dropped successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Failed to drop course", error: err });
    }
};

export const getAvailableCoursesForStudent = async (req: Request, res: Response) => {
    const activatedSemesterId = req.params.id;
    const { studentId } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(activatedSemesterId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid activatedSemesterId or studentId." });
    }

    try {

        const user = await User.findById(userId);
        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: "User not found" });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== "Student") {
            return res.status(BAD_REQUEST).json({ message: "Invalid student ID or user is not a student." });
        }

        try {
            checkDepartmentAccess(user, student.department, "fetch available courses for this student");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }
        const activatedSemester = await ActivatedSemester.findById(activatedSemesterId)
            .populate({
                path: "programBatch",
                populate: { path: "programCatalogue" }
            });

        if (!activatedSemester || !activatedSemester.isActive) {
            return res.status(400).json({ message: "Invalid or inactive semester" });
        }

        const programBatch = activatedSemester.programBatch as any;
        if (!programBatch?.programCatalogue) {
            return res.status(NOT_FOUND).json({ message: "Program batch or program catalogue not found." });
        }

        const semester = await Semester.findOne({
            programCatalogue: programBatch.programCatalogue._id,
            semesterNo: activatedSemester.semesterNo,
        }).populate("courses");

        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Semester not found in catalogue." });
        }

        const courseIds = semester.courses.map((c: any) => c._id);

        // Get active course offerings in the current semester
        const courseOfferings = await CourseOffering.find({
            activatedSemester: activatedSemester._id,
            programBatch: programBatch._id,
            course: { $in: courseIds },
            isActive: true,
        }).populate("course");

        const studentEnrollments = await Enrollment.find({
            student: studentId,
            courseOffering: { $in: courseOfferings.map(o => o._id) },
        }).select("courseOffering");

        const enrolledOfferingIds = new Set(studentEnrollments.map(e => e.courseOffering.toString()));

        const availableOfferings = courseOfferings.filter((offering) => {
            const id = offering._id;

            if (!id) return false; // skip if null or undefined

            return !enrolledOfferingIds.has(String(id));
        });

        return res.status(OK).json(availableOfferings);
    } catch (err: any) {
        console.error("Error in getAvailableCoursesForStudent:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch available courses",
            error: err.message
        });
    }
};