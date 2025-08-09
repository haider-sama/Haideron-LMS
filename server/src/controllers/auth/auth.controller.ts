import { Request, Response } from "express";
import generateToken from "../../utils/token-utils/generateToken";
import { generateVerificationToken } from "../../utils/token-utils/tokenUtils";
import {
    sendVerificationEmail,
} from "../../utils/email/emailService";
import dotenv from "dotenv";
import { AudienceEnum, DegreeEnum, FacultyTypeEnum, TeacherDesignationEnum, VerificationCodeType } from "../../shared/enums";
import { fifteenMinutesFromNow, oneHourFromNow } from "../../utils/date";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../constants/http";
import { clearAuthCookies } from "../../utils/token-utils/cookies";
import { loginSchema, registerSchema } from "../../utils/validators/lms-schemas/authSchemas";
import { ZodError } from "zod";
import * as UAParser from "ua-parser-js";
import { ALLOW_PUBLIC_REGISTRATION } from "../../constants/env";
import { db } from "../../db/db";
import { TeacherInfoWithQualifications } from "../../shared/interfaces";
import { VisibilityEnum } from "../../shared/social.enums";
import { users } from "../../db/schema";
import { compareValue, hashValue } from "../../utils/bcrypt";
import { verificationCodes } from "../../db/models/auth/verificationCode.model";
import { userSessions } from "../../db/models/auth/userSession.model";
import { and, eq, sql } from "drizzle-orm";

dotenv.config();

export async function validateToken(req: Request, res: Response) {
    const userId = req.userId;

    try {
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, req.userId),
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Fetch teacherInfo + qualifications
        const teacherInfoData = await db.query.teacherInfo.findFirst({
            where: (ti, { eq }) => eq(ti.userId, userId),
        });

        // Declare a variable for teacherInfo + qualifications
        let teacherInfoWithQualifications: TeacherInfoWithQualifications | null = null;

        if (teacherInfoData) {
            const qualificationsRaw = await db.query.teacherQualifications.findMany({
                where: (q, { eq }) => eq(q.teacherInfoId, teacherInfoData.id),
            });

            const qualifications = qualificationsRaw.map(q => ({
                ...q,
                degree: q.degree as DegreeEnum,
            }));

            teacherInfoWithQualifications = {
                ...teacherInfoData,
                designation: teacherInfoData.designation as TeacherDesignationEnum,
                facultyType: teacherInfoData.facultyType as FacultyTypeEnum,
                // convert joiningDate string to Date object or null
                joiningDate: teacherInfoData.joiningDate ? new Date(teacherInfoData.joiningDate) : null,
                qualifications,
            };
        }

        // Fetch forumProfile
        let forumProfileData = await db.query.forumProfiles.findFirst({
            where: (fp, { eq }) => eq(fp.userId, req.userId),
        });

        // Provide default forumProfile if missing
        if (!forumProfileData) {
            forumProfileData = {
                id: "", // default id, or empty string, if you prefer
                userId: "", // default userId, must exist because type requires it
                username: "",
                displayName: null,
                bio: null,
                signature: null,
                interests: [],
                badges: [],
                reputation: 0,
                visibility: VisibilityEnum.public,
                postCount: 0,
                commentCount: 0,
                joinedAt: new Date(),
            };
        }

        res.status(OK).json({
            id: user.id,
            role: user.role,
            email: user.email,
            fatherName: user.fatherName,
            firstName: user.firstName,
            lastName: user.lastName,
            city: user.city,
            country: user.country,
            avatarURL: user.avatarURL,
            lastOnline: user.lastOnline,
            address: user.address,
            isEmailVerified: user.isEmailVerified,
            department: user.department,
            teacherInfo: teacherInfoData,
            forumProfile: forumProfileData,
        });
    } catch (err) {
        console.error("Token Validation Error", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Token Validation failed." });
    }
}

export async function register(req: Request, res: Response) {
    try {
        const parsed = registerSchema.parse(req.body);
        const { email, password } = parsed;

        if (!ALLOW_PUBLIC_REGISTRATION) {
            return res.status(FORBIDDEN).json({ message: "Public registration is disabled by the administrator." });
        }

        // Check if user exists
        const userExists = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, email),
        });
        if (userExists) {
            return res.status(CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await hashValue(password);

        // Insert new user (hash password before insert if not already done)
        const insertResult = await db.insert(users).values({
            email,
            password: hashedPassword, // make sure password is hashed before!
            createdAt: new Date(),
            lastOnline: new Date(),
            isEmailVerified: false,
            role: AudienceEnum.Guest, // default role enum value
            tokenVersion: 0,
        }).returning();

        const user = insertResult[0]; // inserted user row

        const verificationCodeVal = generateVerificationToken();

        await db.insert(verificationCodes).values({
            userId: user.id,
            type: VerificationCodeType.EmailVerification,
            code: verificationCodeVal,
            expiresAt: fifteenMinutesFromNow(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await sendVerificationEmail(user.email, verificationCodeVal as string);

        const resData = {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            role: user.role,
            department: user.department,
        };

        return res.status(CREATED).json({
            success: true,
            message: `Account Verification email sent to ${user?.email}. Token expires in
                15 minutes`,
            user: resData,
        });
    } catch (err: any) {
        if (err instanceof ZodError) {
            const formattedErrors = err.errors.map((e) => ({
                field: e.path[0],
                message: e.message,
            }));
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: formattedErrors,
            });
        }
        console.error("Registration error: ", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: 'Registration failed. Please try again.' });
    }
};

export async function login(req: Request, res: Response) {
    try {
        const parsed = loginSchema.parse(req.body);
        const { email, password } = parsed;

        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, email),
        });

        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: "Invalid email or password" });
        }

        const isValidPassword = await compareValue(password, user.password);
        if (!isValidPassword) {
            return res.status(UNAUTHORIZED).json({ message: "Invalid email or password" });
        }

        const parser = new UAParser.UAParser(req.headers["user-agent"] || "");
        const ua = parser.getResult();

        // Store session
        await db.insert(userSessions).values({
            userId: user.id, // UUID string
            ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
            userAgent: {
                browser: ua.browser.name + " " + ua.browser.version,
                os: ua.os.name + " " + ua.os.version,
                device: ua.device.type || "Desktop",
                raw: req.headers["user-agent"] || "",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const accessToken = await generateToken(res, user.id);

        res.status(OK).json({
            id: user.id,
            email: user.email,
            accessToken,
        });

    } catch (err: any) {
        if (err instanceof ZodError) {
            const formattedErrors = err.errors.map((e) => ({
                field: e.path[0],
                message: e.message,
            }));
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: formattedErrors,
            });
        }
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Login failed. Please try again." });
    }
};

export async function logout(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const userAgent = (req.headers["user-agent"] ?? "") as string;
        const ipHeader = req.headers["x-forwarded-for"];
        const ip =
            typeof ipHeader === "string"
                ? ipHeader.split(",")[0].trim()
                : req.socket.remoteAddress ?? "";

        // Delete session matching userId, ip, and userAgent.raw (we stored userAgent as JSONB)
        await db.delete(userSessions).where(
            and(
                eq(userSessions.userId, userId),
                eq(userSessions.ip, ip),
                eq(
                    sql`(${userSessions.userAgent} ->> 'raw')`,
                    userAgent
                )
            )
        );

        clearAuthCookies(res);
        res.status(OK).json({ message: "Logged out successfully." });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Logout failed." });
    }
}

export const logoutFromAllDevices = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        await db.update(users)
            .set({ tokenVersion: sql`tokenVersion + 1` })
            .where(eq(users.id, userId));

        // Delete all sessions for userId:
        await db.delete(userSessions).where(eq(userSessions.userId, userId));

        clearAuthCookies(res);
        res.status(OK).json({ message: "Logged out from all devices." });
    } catch (err) {
        console.error("Logout from all devices error:", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
};