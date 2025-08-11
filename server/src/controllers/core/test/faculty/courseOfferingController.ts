import { Request, Response } from "express";
import { ActivatedSemester } from "../../../models/lms/semester/activated.semester.model";
import CourseOffering from "../../../models/lms/course/course.offering.model";
import mongoose from "mongoose";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import User from "../../../models/auth/user.model";
import { ProgramBatchDocument } from "../../../models/lms/program/program.batch.model";
import { ProgramDocument } from "../../../models/lms/program/program.model";
import { checkDepartmentAccess } from "./batchController";
import { UpdateCourseOfferingSchema } from "../../../utils/validators/lmsSchemas/courseOfferingSchemas";

export const createCourseOfferings = async (req: Request, res: Response) => {
    const { activatedSemesterId } = req.params;
    const { offerings } = req.body; // Array of { courseId, sectionSchedules, capacityPerSection }
    const userId = req.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(activatedSemesterId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid activatedSemesterId format" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const activatedSemester = await ActivatedSemester.findById(activatedSemesterId).populate<{
            programBatch: ProgramBatchDocument & { program: ProgramDocument };
        }>({
            path: "programBatch",
            populate: { path: "program", select: "departmentTitle" },
        });

        if (!activatedSemester || !activatedSemester.isActive) {
            return res.status(NOT_FOUND).json({ message: "Activated semester not found or inactive" });
        }

        const program = activatedSemester.programBatch.program;
        try {
            checkDepartmentAccess(user, program.departmentTitle, "create course offerings");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        if (!Array.isArray(offerings) || offerings.length === 0) {
            return res.status(BAD_REQUEST).json({
                message: "Offerings array is required and cannot be empty"
            });
        }

        const createdOfferings = [];

        for (const offer of offerings) {
            const { courseId, sectionSchedules, capacityPerSection } = offer;

            const existing = await CourseOffering.findOne({
                activatedSemester: activatedSemesterId,
                course: courseId,
            });

            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                continue; // Skip invalid courseId
            }

            if (existing) continue;

            const exists = await CourseOffering.findOne({
                activatedSemester: activatedSemesterId,
                course: courseId,
            });

            if (exists) continue;

            const newOffering = new CourseOffering({
                activatedSemester: activatedSemesterId,
                programBatch: activatedSemester.programBatch._id,
                course: courseId,
                sectionSchedules,
                capacityPerSection,
            });

            await newOffering.save();
            createdOfferings.push(newOffering);
        }

        res.status(CREATED).json({ message: "Course offerings created", data: createdOfferings });
    } catch (err: any) {
        console.error("Error while creating offerings:", err); // ← Full error object
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating offerings",
            error: err.message
        });
    }
};

export const getCourseOfferings = async (req: Request, res: Response) => {
    const { activatedSemesterId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(activatedSemesterId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid activatedSemesterId format" });
        }

        const semester = await ActivatedSemester.findById(activatedSemesterId);
        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Activated semester not found" });
        }

        const offerings = await CourseOffering.find({ activatedSemester: activatedSemesterId })
            .populate({
                path: "course",
                populate: [
                    { path: "clos" },
                    { path: "preRequisites", select: "code title" },
                    { path: "coRequisites", select: "code title" },
                ],
            })
            .then(off => off.filter(o => o.course !== null));


        res.status(OK).json({ offerings });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching course offerings",
            error: err.message
        });
    }
};

export const updateCourseOffering = async (req: Request, res: Response) => {
    const { offeringId } = req.params;
    const userId = req.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(offeringId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid offeringId format" });
        }

        const parsed = UpdateCourseOfferingSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const offering = await CourseOffering.findById(offeringId)
            .populate({
                path: "activatedSemester",
                populate: {
                    path: "programBatch",
                    populate: {
                        path: "program",
                        select: "departmentTitle",
                    },
                },
            });

        if (!offering) {
            return res.status(NOT_FOUND).json({ message: "Course Offering not found" });
        }

        const program = (offering.activatedSemester as any)?.programBatch?.program as ProgramDocument;
        try {
            checkDepartmentAccess(user, program.departmentTitle, "update course offering");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        Object.assign(offering, parsed.data);


        await offering.save();

        res.status(OK).json({ message: "Course Offering updated", data: offering });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating course offering",
            error: err.message
        });
    }
};

export const deleteCourseOffering = async (req: Request, res: Response) => {
    const { offeringId } = req.params;
    const userId = req.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(offeringId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid offeringId format" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const offering = await CourseOffering.findById(offeringId)
            .populate({
                path: "activatedSemester",
                populate: {
                    path: "programBatch",
                    populate: {
                        path: "program",
                        select: "departmentTitle",
                    },
                },
            });

        if (!offering) {
            return res.status(NOT_FOUND).json({ message: "Course Offering not found" });
        }

        const program = (offering.activatedSemester as any)?.programBatch?.program as ProgramDocument;

        try {
            checkDepartmentAccess(user, program.departmentTitle, "delete course offering");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        await offering.deleteOne();

        res.status(OK).json({ message: "Course offering deleted successfully" });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting course offering",
            error
        });
    }
};