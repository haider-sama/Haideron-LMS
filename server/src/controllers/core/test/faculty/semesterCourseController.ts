import { Request, Response } from "express";
import User from "../../../models/auth/user.model";
import { AudienceEnum, DepartmentEnum, StrengthEnum } from "../../../shared/enums";
import mongoose, { Types } from "mongoose";
import { Semester } from "../../../models/lms/semester/semester.model";
import Course, { CLO } from "../../../models/lms/course/course.model";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { createCourseSchema, facultyCourseUpdateSchema, updateCourseSchema } from "../../../utils/validators/lmsSchemas/semesterSchemas";
import { Program, ProgramDocument } from "../../../models/lms/program/program.model";

export const createCourse = async (req: Request, res: Response) => {
    try {
        const parsed = createCourseSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const data = parsed.data;

        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) return res.status(NOT_FOUND).json({ message: "User not found" });

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to create a course",
            });
        }
        // Create the course
        const newCourse = await Course.create({
            ...data,
            program: data.programId,
            programCatalogue: data.catalogueId,
            createdBy: user._id,
        });

        return res.status(CREATED).json({
            message: "Course created successfully",
            course: newCourse,
        });
    } catch (err: any) {
        if (err.code === 11000 && err.keyPattern?.code) {
            return res.status(BAD_REQUEST).json({
                message: `A course with the code "${err.keyValue?.code}" already exists.`,
                field: "code",
            });
        }

        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating course",
            error: err.message,
        });
    }
};

export const getCoursesInSemester = async (req: Request, res: Response) => {
    const { semesterId } = req.query;

    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user || !user.department || !Object.values(DepartmentEnum).includes(user.department)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to view courses",
            });
        }

        if (!semesterId || !mongoose.Types.ObjectId.isValid(String(semesterId))) {
            return res.status(BAD_REQUEST).json({ message: "Invalid or missing semesterId" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        const semester = await Semester.findById(semesterId).populate({
            path: "programCatalogue",
            populate: {
                path: "program",
                model: "Program",
                select: "departmentTitle",
            },
        }).lean();

        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Semester not found" });
        }

        const program = (semester.programCatalogue as any)?.program;
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found in ProgramCatalogue" });
        }

        if (!isAdmin && isDeptHead && String(program.departmentTitle) !== String(user.department)) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to access courses from another department.",
            });
        }

        const courseIds = semester.courses || [];

        if (!courseIds.length) {
            return res.status(OK).json({
                message: `No courses assigned to semester ${semester.semesterNo}`,
                courses: [],
                page: 1,
                totalPages: 0,
                totalCourses: 0,
            });
        }

        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Filters
        const {
            title,
            code,
            subjectLevel,
            subjectType,
            knowledgeArea,
            domain,
        } = req.query;

        const filter: any = {
            _id: { $in: courseIds },
        };

        if (title) filter.title = { $regex: title, $options: "i" };
        if (code) filter.code = { $regex: code, $options: "i" };
        if (subjectLevel) filter.subjectLevel = subjectLevel;
        if (subjectType) filter.subjectType = subjectType;
        if (knowledgeArea) filter.knowledgeArea = knowledgeArea;
        if (domain) filter.domain = domain;

        const [courses, totalCourses] = await Promise.all([
            Course.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Course.countDocuments(filter),
        ]);

        return res.status(OK).json({
            message: `Courses for semester ${semester.semesterNo}`,
            courses,
            page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses,
        });
    } catch (err: any) {
        console.error("Error while fetching courses in semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching courses in semester",
            error: err.message,
        });
    }
};

export const getAllCourses = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user || !user.department || !Object.values(DepartmentEnum).includes(user.department)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to view courses",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const {
            title,
            code,
            subjectLevel,
            subjectType,
            knowledgeArea,
            domain,
            isActive,
            programId,
        } = req.query;

        const filter: any = {};

        // Filter by program for admin (explicit), or department head (by departmentTitle → program)
        if (isAdmin && programId) {
            filter.program = programId;
        }

        if (isDeptHead) {
            const deptProgram = await Program.findOne({ departmentTitle: user.department });
            if (!deptProgram) {
                return res.status(OK).json({
                    message: "No program found for your department",
                    courses: [],
                    page,
                    totalPages: 0,
                    totalCourses: 0,
                });
            }

            filter.program = deptProgram._id;
        }

        // Apply optional filters
        if (title) filter.title = { $regex: title, $options: "i" };
        if (code) filter.code = { $regex: code, $options: "i" };
        if (subjectLevel) filter.subjectLevel = subjectLevel;
        if (subjectType) filter.subjectType = subjectType;
        if (knowledgeArea) filter.knowledgeArea = knowledgeArea;
        if (domain) filter.domain = domain;
        if (isActive !== undefined) filter.isActive = isActive === "true";

        const [courses, totalCourses] = await Promise.all([
            Course.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("preRequisites", "title code")
                .populate("coRequisites", "title code")
                .lean(),
            Course.countDocuments(filter),
        ]);

        return res.status(OK).json({
            message: "All courses",
            courses,
            page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses,
        });
    } catch (err: any) {
        console.error("Error while fetching all courses:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching all courses",
            error: err.message,
        });
    }
};

export const getCourseById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const courseId = req.params.courseId;

        const user = await User.findById(userId).select("-password");

        if (!user || !user.department || !Object.values(DepartmentEnum).includes(user.department)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to view course details",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isFaculty = user.role === AudienceEnum.DepartmentTeacher;

        const course = await Course.findById(courseId).lean();

        if (!course) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // Admin can always access
        if (isAdmin) {
            return res.status(OK).json({
                message: "Course fetched successfully",
                course,
            });
        }

        // Dept Head can access only their own created courses
        if (isDeptHead && String(course.createdBy) === String(user._id)) {
            return res.status(OK).json({
                message: "Course fetched successfully",
                course,
            });
        }

        // Faculty must be assigned to at least one section
        if (isFaculty) {
            const isAssigned = Object.values(course.sectionTeachers || {}).some(
                (teacherId) => String(teacherId) === String(user._id)
            );

            if (isAssigned) {
                return res.status(OK).json({
                    message: "Course fetched successfully",
                    course,
                });
            }
        }

        return res.status(OK).json({
            message: "Course fetched successfully",
            course,
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching course",
            error: err.message,
        });
    }
};

const toObjectId = (id?: any): Types.ObjectId =>
    id && Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : new Types.ObjectId();

export const updateCourse = async (req: Request, res: Response) => {
    const { courseId } = req.params;
    // console.log("RECEIVED BODY FROM FRONTEND:", JSON.stringify(req.body, null, 2));

    try {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid course ID" });
        }

        const user = await User.findById(req.userId);
        if (!user || !user.department || !Object.values(DepartmentEnum).includes(user.department)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to update a course.",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isFaculty = user.role === AudienceEnum.DepartmentTeacher;

        // Validate body based on role
        const parsed = isAdmin || isDeptHead
            ? updateCourseSchema.safeParse(req.body)
            : facultyCourseUpdateSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const updates = parsed.data;
        const course = await Course.findById(courseId).populate({
            path: "program",
            select: "departmentTitle",
        });

        if (!course) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        if (!course.program || !course.programCatalogue) {
            return res.status(BAD_REQUEST).json({
                message: "Course data incomplete: program and programCatalogue are required in DB.",
            });
        }

        const program = course.program as unknown as Pick<ProgramDocument, "departmentTitle">;

        if (!isAdmin && isDeptHead && String(user.department) !== String(program?.departmentTitle)) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to update this course.",
            });
        }

        if (isFaculty) {
            const sectionTeachersObj = course.sectionTeachers instanceof Map
                ? Object.fromEntries(course.sectionTeachers)
                : course.sectionTeachers || {};

            const isAssigned = Object.values(sectionTeachersObj).some(
                (teacherId) => String(teacherId) === String(user._id)
            );

            if (!isAssigned) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to update this course. You are not assigned to any section.",
                });
            }
        }

        // Apply all direct updates except program/programCatalogue (restricted for faculty)
        for (const key of Object.keys(updates)) {
            const value = updates[key as keyof typeof updates];
            if (
                value !== undefined &&
                value !== null &&
                !(["program", "programCatalogue"].includes(key) && isFaculty)
            ) {
                course.set(key, value);
            }
        }

        // Handle clos with ID preservation
        if (updates.clos) {
            const parsedClos: CLO[] = updates.clos.map((incomingCLO) => ({
                _id: toObjectId(incomingCLO._id),
                code: incomingCLO.code!,
                title: incomingCLO.title!,
                description: incomingCLO.description!,
                ploMapping: (incomingCLO.ploMapping || []).map((pm) => ({
                    _id: toObjectId(pm._id),
                    plo: toObjectId(pm.plo),
                    strength: pm.strength,
                })),
            }));

            course.clos = parsedClos;
            // console.log("Final CLOs being saved to course:", JSON.stringify(parsedClos, null, 2));
        }

        // console.log("Final full course document before save:", JSON.stringify(course.toObject(), null, 2));
        await course.save();

        return res.status(OK).json({
            message: "Course updated successfully",
            course,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating course",
            error: err.message,
        });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    const { courseId } = req.params;

    try {
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid course ID" });
        }

        const user = await User.findById(req.userId);
        if (!user || !user.department || !Object.values(DepartmentEnum).includes(user.department)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to delete a course.",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // Only the creator (DeptHead) or Admin can delete
        if (!isAdmin && isDeptHead && String(course.createdBy) !== String(user._id)) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to delete this course.",
            });
        }

        await course.deleteOne();

        return res.status(OK).json({
            message: "Course deleted successfully",
            courseId,
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting course",
            error: err.message,
        });
    }
};