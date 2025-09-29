import { Request, Response } from "express";
import generateToken from "../../utils/token-utils/generateToken";
import { generateVerificationToken } from "../../utils/token-utils/tokenUtils";
import {
    sendVerificationEmail,
} from "../../utils/email/emailService";
import dotenv from "dotenv";
import { AudienceEnum, DegreeEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum, VerificationCodeType } from "../../shared/enums";
import { fifteenMinutesFromNow, oneHourFromNow } from "../../utils/date";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../constants/http";
import { clearAuthCookies } from "../../utils/token-utils/cookies";
import { loginSchema, registerSchema } from "../../utils/validators/lms-schemas/authSchemas";
import { ZodError } from "zod";
import * as UAParser from "ua-parser-js";
import { db } from "../../db/db";
import { TeacherInfoWithQualifications, UserWithRelations } from "../../shared/interfaces";
import { users } from "../../db/schema";
import { compareValue, hashValue } from "../../utils/bcrypt";
import { verificationCodes } from "../../db/models/auth/verificationCode.model";
import { userSessions } from "../../db/models/auth/userSession.model";
import { and, eq, sql } from "drizzle-orm";
import { SettingsService } from "../../utils/settings/SettingsService";
import crypto from "crypto";
import { verifyAccessToken } from "../../utils/token-utils/jwt";

dotenv.config();

export async function validateToken(req: Request, res: Response) {
    const userId = req.userId;

    try {
        // Fetch user with teacherInfo + qualifications
        const user: any = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                id: true,
                email: true,
                fatherName: true,
                firstName: true,
                lastName: true,
                city: true,
                country: true,
                avatarURL: true,
                lastOnline: true,
                address: true,
                isEmailVerified: true,
                department: true,
                role: true,
                isTwoFAEnabled: true,
            },
            with: {
                teacherInfo: {
                    columns: {
                        id: true,
                        userId: true,
                        designation: true,
                        facultyType: true,
                        joiningDate: true,
                        subjectOwner: true,
                    },
                    with: {
                        qualifications: {
                            columns: {
                                id: true,
                                teacherInfoId: true,
                                degree: true,
                                passingYear: true,
                                institutionName: true,
                                majorSubjects: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        // Directly return user + teacherInfo + qualifications as-is
        return res.status(OK).json(user);

    } catch (err) {
        console.error("Validate Token Error", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Validate token failed." });
    }
}

// export async function validateToken(req: Request, res: Response) {
//     const userId = req.userId;

//     try {
//         // Fetch only user details
//         const user: any = await db.query.users.findFirst({
//             where: eq(users.id, userId),
//             columns: {
//                 id: true,
//                 email: true,
//                 fatherName: true,
//                 firstName: true,
//                 lastName: true,
//                 city: true,
//                 country: true,
//                 avatarURL: true,
//                 lastOnline: true,
//                 address: true,
//                 isEmailVerified: true,
//                 department: true,
//                 role: true,
//                 isTwoFAEnabled: true,
//             },
//         });

//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found." });
//         }

//         // Return only user details
//         res.status(OK).json(user);
//     } catch (err) {
//         console.error("Validate Token Error", err);
//         res.status(INTERNAL_SERVER_ERROR).json({ message: "Validate token failed." });
//     }
// }


export async function register(req: Request, res: Response) {
    if (!(await SettingsService.isUserRegistrationAllowed())) {
        return res.status(FORBIDDEN).json({ message: "Registration is disabled by admin" });
    }

    try {
        const parsed = registerSchema.parse(req.body);
        const { email, password } = parsed;

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

        const sessionId = crypto.randomUUID();

        // Store session
        await db.insert(userSessions).values({
            id: sessionId,
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

        const accessToken = await generateToken(res, user.id, sessionId);

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
        const decoded = verifyAccessToken(req.cookies.auth_token);
        const sessionId = decoded.sessionId;
        await db.delete(userSessions).where(eq(userSessions.id, sessionId));
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
            .set({ tokenVersion: sql`token_version + 1` })
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