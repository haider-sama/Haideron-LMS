import { Request, Response } from "express";
import {
    sendResetSuccessEmail,
} from "../../utils/email/emailService";
import dotenv from "dotenv";
import { AudienceEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../shared/enums";
import { hashValue } from "../../utils/bcrypt";
import { GLOBAL_EMAIL_DOMAIN } from "../../constants/env";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../constants/http";
import { adminUpdateUserSchema, bulkRegisterSchema, passwordOnlySchema } from "../../utils/validators/lms-schemas/authSchemas";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { forumProfiles, teacherInfo, users } from "../../db/schema";

dotenv.config();

export async function assertAdmin(
    req: Request,
    res: Response,
    targetUserId?: string
): Promise<true | Response> {
    // Find requester by req.userId
    const requester = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, req.userId))
        .limit(1)
        .execute()
        .then(rows => rows[0]);

    if (!requester || requester.role !== AudienceEnum.Admin) {
        return res.status(UNAUTHORIZED).json({ message: "Access denied. Admins only." });
    }

    // Optional extra check to prevent modifying/deleting another admin
    if (targetUserId) {
        const targetUser = await db
            .select({ role: users.role, id: users.id })
            .from(users)
            .where(eq(users.id, targetUserId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        if (
            targetUser?.role === AudienceEnum.Admin &&
            targetUser.id !== req.userId
        ) {
            return res.status(BAD_REQUEST).json({
                message: "Admins are not allowed to modify, view or delete other Admins.",
            });
        }
    }

    return true;
}

export async function bulkRegister(req: Request, res: Response) {
    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    const parsed = bulkRegisterSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid user data",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { users: usersData } = parsed.data;
    const results: { email: string; success: boolean; message: string }[] = [];

    for (const userData of usersData) {
        const { email, password, role, department,
            firstName, lastName, fatherName, city, country, address
        } = userData;

        try {
            // Check if user exists
            const userExists = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase().trim()))
                .limit(1)
                .execute()
                .then(rows => rows.length > 0);

            if (userExists) {
                results.push({ email, success: false, message: "User already exists" });
                continue;
            }

            const domain = email.split("@")[1];
            if (domain?.toLowerCase().trim() !== GLOBAL_EMAIL_DOMAIN.toLowerCase()) {
                throw new Error(`Email domain must be exactly ${GLOBAL_EMAIL_DOMAIN}`);
            }

            const hashedPassword = await hashValue(password);
            // Insert user
            const insertResult = await db
                .insert(users)
                .values({
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
                    role,
                    department: department || undefined,
                    firstName,
                    lastName,
                    fatherName,
                    city,
                    country,
                    address,
                    createdAt: new Date(),
                    lastOnline: new Date(),
                    isEmailVerified: false,
                })
                .returning({ id: users.id })
                .execute();

            const createdUser = insertResult[0];
            if (!createdUser) throw new Error("Failed to create user");

            // If DepartmentTeacher, insert teacherInfo
            if (role === AudienceEnum.DepartmentTeacher) {
                await db.insert(teacherInfo).values({
                    userId: createdUser.id,
                    designation: TeacherDesignationEnum.Lecturer,
                    joiningDate: new Date().toISOString().split('T')[0],
                    facultyType: FacultyTypeEnum.Contractual,
                    subjectOwner: false,
                }).execute();
            }

            results.push({ email, success: true, message: "User(s) created successfully." });
        } catch (err: any) {
            results.push({ email, success: false, message: err.message });
        }
    }

    return res.status(207).json({
        results,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
    }); // Multi-Status
};

export async function deleteUserById(req: Request, res: Response) {
    const { userId } = req.params;

    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    try {
        // Find the user by id
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Prevent deleting yourself
        if (user.id === req.userId) {
            return res.status(BAD_REQUEST).json({ message: "Admins cannot delete their own account." });
        }

        // Delete user by id
        await db
            .delete(users)
            .where(eq(users.id, userId))
            .execute();

        res.status(OK).json({ message: "User deleted successfully" });
    } catch (err: any) {
        console.error("Error deleting user:", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot delete user. Please try again." });
    }
};

export const adminResetUserPassword = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    const parsed = passwordOnlySchema.safeParse(req.body);

    if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;
        return res.status(BAD_REQUEST).json({
            success: false,
            message: "Invalid password data",
            errors,
        });
    }

    try {
        // Fetch user email by id
        const user = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ success: false, message: "User not found" });
        }

        const hashedPassword = await hashValue(parsed.data.password);

        // Update user password and reset fields
        await db
            .update(users)
            .set({
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiresAt: null,
            })
            .where(eq(users.id, userId))
            .execute();

        await sendResetSuccessEmail(user.email); // Optional: Notify user via email

        res.status(OK).json({ success: true, message: "Password Reset successfully by Admin" });
    } catch (error: any) {
        console.error("Error resetting password:", error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Cannot reset password. Please try again."
        });
    }
};

export async function fetchUserById(req: Request, res: Response) {
    const { userId } = req.params;

    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    try {
        // Fetch user joined with optional teacherInfo and forumProfile
        const user = await db
            .select({
                userId: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                fatherName: users.fatherName,
                address: users.address,
                city: users.city,
                country: users.country,
                avatarURL: users.avatarURL,
                department: users.department,
                isEmailVerified: users.isEmailVerified,
                lastOnline: users.lastOnline,
                role: users.role,

                // Optional related data
                // teacherInfoId: teacherInfo.id,
                // teacherDesignation: teacherInfo.designation,
                // teacherJoiningDate: teacherInfo.joiningDate,
                // teacherFacultyType: teacherInfo.facultyType,
                // teacherSubjectOwner: teacherInfo.subjectOwner,

                // forumProfileId: forumProfiles.id,
                // forumUsername: forumProfiles.username,
                // forumDisplayName: forumProfiles.displayName,
            })
            .from(users)
            // .leftJoin(teacherInfo, eq(teacherInfo.userId, users.id))
            // .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Prepare safe user object (exclude sensitive fields like password)
        const safeUser = {
            id: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fatherName: user.fatherName,
            address: user.address,
            city: user.city,
            country: user.country,
            avatarURL: user.avatarURL,
            department: user.department,
            isEmailVerified: user.isEmailVerified,
            lastOnline: user.lastOnline,
            role: user.role,

            // teacherInfo: user.teacherInfoId
            //     ? {
            //         designation: user.teacherDesignation,
            //         joiningDate: user.teacherJoiningDate,
            //         facultyType: user.teacherFacultyType,
            //         subjectOwner: user.teacherSubjectOwner,
            //     }
            //     : undefined,

            // forumProfile: user.forumProfileId
            //     ? {
            //         username: user.forumUsername,
            //         displayName: user.forumDisplayName,
            //     }
            //     : undefined,
        };

        res.json(safeUser);
    } catch (err: any) {
        console.error("Error fetching user: ", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot fetch user. Please try again." });
    }
};

export async function updateUserById(req: Request, res: Response) {
    const { userId } = req.params;

    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    const parsed = adminUpdateUserSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid input data",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        // Build update data object from parsed data (main, non-sensitive fields only)
        const updateData = {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            fatherName: parsed.data.fatherName,
            address: parsed.data.address,
            city: parsed.data.city,
            country: parsed.data.country,
            department: parsed.data.department,
            role: parsed.data.role,
        };

        // Update user in DB
        const updateResult = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning()
            .execute();

        if (updateResult.length === 0) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const updatedUser = updateResult[0];

        // Build safe user object to return
        const safeUser = {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fatherName: updatedUser.fatherName,
            address: updatedUser.address,
            city: updatedUser.city,
            country: updatedUser.country,
            department: updatedUser.department,
            role: updatedUser.role,
        };

        res.status(OK).json(safeUser);
    } catch (err: any) {
        console.error("Error updating user: ", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: 'Cannot update user. Please try again.' });
    }
};

export async function fetchPaginatedUsers(req: Request, res: Response) {
    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    try {
        const page = Math.max(parseInt(req.query.page as string) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offsetVal = (page - 1) * limit;

        const search = (req.query.search as string || "").trim();

        // Optional exact filters by individual fields
        // Use exact match only for enum types and some strings, 
        // you can add or remove fields as per your UI/filtering needs
        const filterEmail = req.query.email as string | undefined;
        const filterFirstName = req.query.firstName as string | undefined;
        const filterLastName = req.query.lastName as string | undefined;
        const filterFatherName = req.query.fatherName as string | undefined;
        const filterCity = req.query.city as string | undefined;
        const filterCountry = req.query.country as string | undefined;

        // For enums, ensure valid values or skip filter
        const filterRole = (req.query.role as AudienceEnum | undefined);
        const filterDepartment = (req.query.department as DepartmentEnum | undefined);

        // Build searchFilter (OR ilike on multiple fields)
        let searchFilter = undefined;
        if (search && typeof search === "string" && search.trim().length > 0) {
            // const likePattern = `%${search}%`;
            // searchFilter = or(
            //     ilike(users.email, likePattern),
            //     ilike(users.firstName, likePattern),
            //     ilike(users.lastName, likePattern),
            //     ilike(users.fatherName, likePattern),
            //     ilike(users.city, likePattern),
            //     ilike(users.country, likePattern),
            //     // For enums, cast to text and ilike, just in case
            //     ilike(sql`CAST(${users.role} AS TEXT)`, likePattern),
            //     ilike(sql`CAST(${users.department} AS TEXT)`, likePattern),
            // );

            // plainto_tsquery automatically tokenizes & sanitizes
            searchFilter = sql`${users.searchVector} @@ plainto_tsquery('simple', ${search.trim()})`;
        }

        // Build exact filters (AND)
        const exactFilters = [];

        if (filterEmail) exactFilters.push(eq(users.email, filterEmail));
        if (filterFirstName) exactFilters.push(eq(users.firstName, filterFirstName));
        if (filterLastName) exactFilters.push(eq(users.lastName, filterLastName));
        if (filterFatherName) exactFilters.push(eq(users.fatherName, filterFatherName));
        if (filterCity) exactFilters.push(eq(users.city, filterCity));
        if (filterCountry) exactFilters.push(eq(users.country, filterCountry));
        if (filterRole && Object.values(AudienceEnum).includes(filterRole)) {
            exactFilters.push(eq(users.role, filterRole));
        }
        if (filterDepartment && Object.values(DepartmentEnum).includes(filterDepartment)) {
            exactFilters.push(eq(users.department, filterDepartment));
        }

        // Combine filters: if searchFilter and exactFilters exist, combine with AND
        let finalFilter;
        if (searchFilter && exactFilters.length > 0) {
            finalFilter = and(searchFilter, and(...exactFilters));
        } else if (searchFilter) {
            finalFilter = searchFilter;
        } else if (exactFilters.length > 0) {
            finalFilter = and(...exactFilters);
        } else {
            finalFilter = undefined;
        }

        // Fetch paginated users with combined filter
        const usersList = await db
            .select({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                fatherName: users.fatherName,
                city: users.city,
                country: users.country,
                address: users.address,
                avatarURL: users.avatarURL,
                isEmailVerified: users.isEmailVerified,
                role: users.role,
                department: users.department,
            })
            .from(users)
            .where(finalFilter)
            .limit(limit)
            .offset(offsetVal)
            .execute();

        // Count total for pagination
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(finalFilter)
            .execute();

        const totalUsers = Number(count);

        res.status(OK).json({
            data: usersList,
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        });
    } catch (err: any) {
        console.error("Error fetching paginated users:", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot fetch users. Please try again." });
    }
}
