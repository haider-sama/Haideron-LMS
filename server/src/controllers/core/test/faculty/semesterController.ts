import { Request, Response } from "express";
import User from "../../../models/auth/user.model";
import { AudienceEnum } from "../../../shared/enums";
import { ProgramDocument } from "../../../models/lms/program/program.model";
import mongoose, { Types } from "mongoose";
import { ProgramCatalogue } from "../../../models/lms/program/program.catalogue.model";
import { Semester } from "../../../models/lms/semester/semester.model";
import Course from "../../../models/lms/course/course.model";
import { FORBIDDEN, NOT_FOUND, BAD_REQUEST, CONFLICT, CREATED, INTERNAL_SERVER_ERROR, OK } from "../../../constants/http";
import { addSemesterSchema, updateSemesterSchema } from "../../../utils/validators/lmsSchemas/semesterSchemas";

export const addSemesterToCatalogue = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const parsed = addSemesterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { programCatalogue, semesterNo, courses } = parsed.data;

        const catalogue = await ProgramCatalogue.findById(programCatalogue)
            .populate<{ program: ProgramDocument }>("program");
        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Program catalogue not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to add semester to this catalogue"
            });
        }

        const existingSemester = await Semester.findOne({ programCatalogue, semesterNo });
        if (existingSemester) {
            return res.status(CONFLICT).json({
                message: `Semester number ${semesterNo} already exists in this catalogue`
            });
        }

        // Validate course existence
        let validCourses: Types.ObjectId[] = [];
        if (courses?.length) {
            const foundCourses = await Course.find({ _id: { $in: courses } });
            if (foundCourses.length !== courses.length) {
                return res.status(BAD_REQUEST).json({
                    message: "One or more course IDs are invalid or do not exist",
                });
            }
            validCourses = courses.map(id => new mongoose.Types.ObjectId(id));
        }

        const newSemester = await Semester.create({
            programCatalogue,
            semesterNo,
            courses: validCourses,
        });

        return res.status(CREATED).json({
            message: "Semester added to catalogue successfully",
            semester: newSemester,
        });
    } catch (err: any) {
        console.error("Error while adding semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while adding semester",
            error: err.message
        });
    }
};

export const getSemestersInCatalogue = async (req: Request, res: Response) => {
    const { catalogueId } = req.query;

    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!catalogueId || !mongoose.Types.ObjectId.isValid(String(catalogueId))) {
            return res.status(BAD_REQUEST).json({ message: "Invalid or missing catalogueId" });
        }

        const catalogue = await ProgramCatalogue.findById(catalogueId)
            .populate<{ program: ProgramDocument }>({
                path: "program",
                select: "departmentTitle"
            });
        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Program catalogue not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to view semesters of this catalogue"
            });
        }

        const semesters = await Semester.find({ programCatalogue: catalogueId })
            .populate("courses", "code title creditHours")
            .sort({ semesterNo: 1 });

        return res.status(OK).json({
            message: "Semesters fetched successfully",
            semesters,
        });
    } catch (err: any) {
        console.error("Error while fetching semesters:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching semesters",
            error: err.message
        });
    }
};

export const updateSemesterById = async (req: Request, res: Response) => {
    const { semesterId } = req.params;

    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const parsed = updateSemesterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { semesterNo, courses } = parsed.data;

        const semester = await Semester.findById(semesterId);
        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Semester not found" });
        }

        const catalogue = await ProgramCatalogue.findById(semester.programCatalogue)
            .populate<{ program: ProgramDocument }>({
                path: "program",
                select: "departmentTitle"
            });

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Related program catalogue not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to update this semester"
            });
        }

        // Validate semester number uniqueness within the catalogue
        if (semesterNo && semesterNo !== semester.semesterNo) {
            const existing = await Semester.findOne({
                programCatalogue: semester.programCatalogue,
                semesterNo
            });

            if (existing) {
                return res.status(CONFLICT).json({
                    message: `Semester number ${semesterNo} already exists in this catalogue`
                });
            }

            semester.semesterNo = semesterNo;
        }

        // Validate course IDs
        if (courses) {
            const foundCourses = await Course.find({ _id: { $in: courses } });
            if (foundCourses.length !== courses.length) {
                return res.status(BAD_REQUEST).json({
                    message: "One or more course IDs are invalid or not found",
                });
            }

            semester.courses = courses.map(id => new mongoose.Types.ObjectId(id));
        }

        await semester.save();

        return res.status(OK).json({
            message: "Semester updated successfully",
            semester
        });
    } catch (err: any) {
        console.error("Error while updating semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating semester",
            error: err.message
        });
    }
};

export const deleteSemesterById = async (req: Request, res: Response) => {
    const { semesterId } = req.params;

    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(semesterId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid semester ID" });
        }

        const semester = await Semester.findById(semesterId);
        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Semester not found" });
        }

        const catalogue = await ProgramCatalogue.findById(semester.programCatalogue)
            .populate<{ program: ProgramDocument }>({
                path: "program",
                select: "departmentTitle"
            });

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Associated program catalogue not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to delete semester of this catalogue"
            });
        }

        await semester.deleteOne();

        return res.status(OK).json({
            message: "Semester deleted successfully"
        });
    } catch (err: any) {
        console.error("Error while deleting semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting semester",
            error: err.message
        });
    }
};