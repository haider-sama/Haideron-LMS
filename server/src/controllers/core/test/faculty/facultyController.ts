import { Request, Response } from "express";
import User from "../../../models/auth/user.model";
import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { facultyRegisterSchema, updateFacultySchema } from "../../../utils/validators/lmsSchemas/facultySchemas";
import { Program } from "../../../models/lms/program/program.model";
import { ProgramBatch } from "../../../models/lms/program/program.batch.model";
import { ActivatedSemester, ActivatedSemesterDocument } from "../../../models/lms/semester/activated.semester.model";

export const registerFacultyMember = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = facultyRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid input",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { email, password, department, teacherInfo } = parsed.data;

    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (user.role !== AudienceEnum.DepartmentHead && user.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can register faculty"
            });
        }

        // Admin can assign any department; dept head can only assign their own
        if (user.role === AudienceEnum.DepartmentHead && user.department !== department) {
            return res.status(FORBIDDEN).json({
                message: "Department Heads can only register faculty in their own department",
            });
        }

        // Check department validity
        if (!Object.values(DepartmentEnum).includes(department)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid department" });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(CONFLICT).json({ message: "User already exists" });
        }

        // Create user with nested teacherInfo
        const newUser = await User.create({
            email,
            password,
            department,
            role: AudienceEnum.DepartmentTeacher,
            createdAt: new Date(),
            lastOnline: new Date(),
            isEmailVerified: false,
            teacherInfo: teacherInfo || {},
        });

        return res.status(CREATED).json({
            message: "Faculty member registered successfully!",
            user: newUser.omitPassword(),
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot register faculty member" });
    }
};

export async function updateFacultyMember(req: Request, res: Response) {
    const { teacherId } = req.params;
    const userId = req.userId;

    const parsed = updateFacultySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const {
        teacherInfo,
        firstName,
        lastName,
        city,
        country,
        address,
        department,
        role,
    } = parsed.data;

    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (user.role !== AudienceEnum.DepartmentHead && user.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can update faculty",
            });
        }

        const teacher = await User.findById(teacherId).select("-password");
        if (!teacher) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }

        if (teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(NOT_FOUND).json({ message: "User is not a teacher" });
        }

        if (
            user.role === AudienceEnum.DepartmentHead &&
            teacher.department !== user.department
        ) {
            return res
                .status(UNAUTHORIZED)
                .json({ message: "Teacher does not belong to your department" });
        }

        if (
            user.role === AudienceEnum.DepartmentHead &&
            (department !== undefined || role !== undefined)
        ) {
            return res.status(FORBIDDEN).json({
                message:
                    "Department Heads are not allowed to change department or role",
            });
        }

        // Build the update object
        const updateData: any = { teacherInfo };
        // Only update fields if they are present in body
        if (teacherInfo !== undefined) updateData.teacherInfo = teacherInfo;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (city !== undefined) updateData.city = city;
        if (country !== undefined) updateData.country = country;
        if (address !== undefined) updateData.address = address;
        if (department !== undefined) updateData.department = department;
        if (role !== undefined) updateData.role = role;

        const updatedUser = await User.findByIdAndUpdate(
            teacherId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }

        res.status(OK).json(updatedUser);
    } catch (err: any) {
        console.error("Error updating faculty:", err);
        res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Cannot update teacher info" });
    }
};

export async function fetchFacultyMemberById(req: Request, res: Response) {
    const teacherId = req.params.teacherId;
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select("-password");
        const teacher = await User.findById(teacherId).select('-password');

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }
        if (user.role !== AudienceEnum.DepartmentHead && user.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can view teacher info"
            });
        }

        if (!teacher) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }
        if (teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(NOT_FOUND).json({ message: "User is not a teacher" });
        }
        if (user.role === AudienceEnum.DepartmentHead &&
            teacher.department !== user.department) {
            return res.status(UNAUTHORIZED).json({ message: "Teacher does not belong to your department" });
        }

        res.status(OK).json(teacher);
    } catch (error: any) {
        console.error("Error while fetching teacher:", error);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot fetch teacher info" });
    }
};

export async function fetchFacultyMembers(req: Request, res: Response) {
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }
        if (user.role !== AudienceEnum.DepartmentHead && user.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can view faculty list"
            });
        }
        if (!user.department) {
            return res.status(BAD_REQUEST).json({ message: "User is not assigned to any department" });
        }

        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        // Filters from query
        const {
            email,
            designation,
            facultyType,
            subjectOwner,
            name,
            joiningDateFrom,
            joiningDateTo,
        } = req.query;

        const filter: any = {
            role: AudienceEnum.DepartmentTeacher,
        };

        // If DepartmentHead, restrict to their own department
        if (user.role === AudienceEnum.DepartmentHead) {
            filter.department = user.department;
        }

        // If Admin and ?department=XYZ is passed, apply filter
        if (user.role === AudienceEnum.Admin && req.query.department) {
            filter.department = req.query.department;
        }

        // Fuzzy search
        if (email) {
            filter.email = { $regex: email, $options: "i" };
        }

        if (name) {
            filter.$or = [
                { "teacherInfo.firstName": { $regex: name, $options: "i" } },
                { "teacherInfo.lastName": { $regex: name, $options: "i" } },
            ];
        }

        // Exact match
        if (designation) {
            filter["teacherInfo.designation"] = designation;
        }

        if (facultyType) {
            filter["teacherInfo.facultyType"] = facultyType;
        }

        if (subjectOwner !== undefined) {
            filter["teacherInfo.subjectOwner"] = subjectOwner === "true";
        }

        // Optional joiningDate range
        if (joiningDateFrom || joiningDateTo) {
            filter["teacherInfo.joiningDate"] = {};
            if (joiningDateFrom) {
                filter["teacherInfo.joiningDate"].$gte = new Date(joiningDateFrom as string);
            }
            if (joiningDateTo) {
                filter["teacherInfo.joiningDate"].$lte = new Date(joiningDateTo as string);
            }
        }

        const [facultyMembers, totalFaculty] = await Promise.all([
            User.find(filter)
                .skip(skip)
                .limit(limit)
                .select("-password")
                .lean(),
            User.countDocuments(filter),
        ]);

        res.status(OK).json({
            data: facultyMembers,
            page,
            totalPages: Math.ceil(totalFaculty / limit),
            totalFaculty,
        });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot fetch faculty members" });
    }
};

export async function deleteFacultyMemberById(req: Request, res: Response) {
    try {
        const teacherId = req.params.teacherId;
        const userId = req.userId;

        const user = await User.findById(userId);
        const teacher = await User.findById(teacherId);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }
        if (user.role !== AudienceEnum.DepartmentHead && user.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can delete faculty members"
            });
        }

        if (!teacher) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }
        if (teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(NOT_FOUND).json({ message: "User is not a teacher" });
        }
        if (user.role === AudienceEnum.DepartmentHead &&
            teacher.department !== user.department) {
            return res.status(UNAUTHORIZED).json({ message: "Teacher does not belong to your department" });
        }

        await User.findByIdAndDelete(teacherId);

        res.status(OK).json({ message: "Teacher deleted successfully" });
    } catch (error: any) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Error while deleting teacher" });
    }
};

export const getDepartmentHeadDashboardContext = async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if (!user || user.role !== AudienceEnum.DepartmentHead) {
            return res.status(NOT_FOUND).json({ message: 'User not found or unauthorized' });
        }

        const program = await Program.findOne({ departmentTitle: user.department });
        if (!program) {
            return res.status(NOT_FOUND).json({ message: 'No program found for department' });
        }

        const programBatch = await ProgramBatch.findOne({ program: program._id }).sort({ createdAt: -1 });
        let activatedSemesters: ActivatedSemesterDocument[] = [];

        if (programBatch) {
            activatedSemesters = await ActivatedSemester.find({ programBatch: programBatch._id }).sort({ semesterNo: 1 });
        }

        return res.status(OK).json({
            program,
            programBatch,
            activatedSemesters,
        });
    } catch (err: any) {
        console.error('Department head dashboard context error:', err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch department head dashboard context',
            error: err.message,
        });
    }
};