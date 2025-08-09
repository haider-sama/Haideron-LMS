import { Request, Response } from "express";
import { generateVerificationToken } from "../../utils/token-utils/tokenUtils";
import {
    sendEmailChangedNotification,
    sendVerificationEmail,
} from "../../utils/email/emailService";

import dotenv from "dotenv";
import { VerificationCodeType } from "../../shared/enums";
import { fifteenMinutesFromNow } from "../../utils/date";
import { BAD_REQUEST, CONFLICT, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../constants/http";
import { emailOnlySchema, verifyEmailSchema } from "../../utils/validators/lmsSchemas/authSchemas";
import { ALLOW_EMAIL_MIGRATION } from "../../constants/env";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { verificationCodes } from "../../db/models/auth/verificationCode.model";
import { userSessions } from "../../db/models/auth/userSession.model";
import { and, eq, gt } from "drizzle-orm";

dotenv.config();

export async function verifyEmail(req: Request, res: Response) {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { code } = parsed.data;

    try {
        // 1. Find verification code that matches and is not expired
        const validCode = await db
            .select()
            .from(verificationCodes)
            .where(
                (vc) =>
                    eq(vc.code, code) &&
                    eq(vc.type, VerificationCodeType.EmailVerification) &&
                    gt(vc.expiresAt, new Date())
            )
            .limit(1);

        if (validCode.length === 0) {
            return res.status(BAD_REQUEST).json({ message: "Invalid or expired verification code" });
        }

        const verificationCode = validCode[0];

        // Find user by userId
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, verificationCode.userId))
            .limit(1);

        const user = userResult[0];
        if (!user) {
            return res.status(BAD_REQUEST).json({ message: "User not found" });
        }

        if (user?.isEmailVerified) {
            // Delete leftover verification code
            await db
                .delete(verificationCodes)
                .where(eq(verificationCodes.id, verificationCode.id));

            return res.status(OK).json({
                success: true,
                message: "Email is already verified.",
                user: {
                    id: user.id,
                    email: user.email,
                    isEmailVerified: true,
                },
            });
        }

        // Update user email verification status
        const updatedUser = await db
            .update(users)
            .set({ isEmailVerified: true })
            .where(eq(users.id, verificationCode.userId))
            .returning();

        if (updatedUser.length === 0) {
            return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to verify email" });
        }

        // Delete verification codes related to email verification for this user
        await db.delete(verificationCodes).where(
            and(
                eq(verificationCodes.id, verificationCode.id),
                eq(verificationCodes.type, VerificationCodeType.EmailVerification)
            )
        );

        res.status(OK).json({
            success: true,
            message: "Email verified successfully!",
            user: {
                id: updatedUser[0].id,
                email: updatedUser[0].email,
                isEmailVerified: updatedUser[0].isEmailVerified,
            },
        });
    } catch (err: any) {
        console.error("Email verification error:", err);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Email verification failed. Please try again." });
    }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
    const parsed = emailOnlySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { email } = parsed.data;

    try {
        // Find user by email
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        const user = userResult[0];
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(BAD_REQUEST).json({ message: "Email is already verified" });
        }

        // Find existing verification code for user and type EmailVerification
        const existingCodeResult = await db
            .select()
            .from(verificationCodes)
            .where(
                and(
                    eq(verificationCodes.userId, user.id),
                    eq(verificationCodes.type, VerificationCodeType.EmailVerification)
                )
            )
            .limit(1);

        const existingCode = existingCodeResult[0];
        const now = new Date();

        // If code sent less than 5 minutes ago, reject
        if (existingCode && existingCode.lastSentAt) {
            const diff = now.getTime() - existingCode.lastSentAt.getTime();
            if (diff < 5 * 60 * 1000) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: "Please wait before requesting another verification email.",
                });
            }
        }

        // Delete existing code if present
        if (existingCode) {
            await db.delete(verificationCodes).where(eq(verificationCodes.id, existingCode.id));
        }

        const code = generateVerificationToken(); // 6-digit code

        await db.insert(verificationCodes).values({
            userId: user.id,
            type: VerificationCodeType.EmailVerification,
            code,
            expiresAt: fifteenMinutesFromNow(),
            lastSentAt: now,
            createdAt: now,
            updatedAt: now,
        });

        // send email
        await sendVerificationEmail(user.email, code);

        return res.status(OK).json({
            success: true,
            message: `Verification email sent to ${user.email}. Token expires in 15 minutes.`,
        });
    } catch (error) {
        console.error("Resend verification email error:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Could not resend verification email. Please try again.",
        });
    }
};

export const requestEmailChange = async (req: Request, res: Response) => {
    if (ALLOW_EMAIL_MIGRATION !== "true") {
        return res.status(FORBIDDEN).json({ message: "Email migration is currently disabled." });
    }

    const parsed = emailOnlySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const userId = req.userId;
    const { email: newEmail } = parsed.data;

    try {
        // Check if new email already exists
        const existingUserResult = await db
            .select()
            .from(users)
            .where(eq(users.email, newEmail))
            .limit(1);
        if (existingUserResult.length > 0) {
            return res.status(CONFLICT).json({ message: "Email already in use" });
        }

        // Find current user
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const code = generateVerificationToken(); // reuse existing token generator
        const now = new Date();

        // Insert verification code for email change with meta info as JSON
        await db.insert(verificationCodes).values({
            userId: user.id,
            type: VerificationCodeType.EmailChange,
            code,
            expiresAt: fifteenMinutesFromNow(),
            meta: JSON.stringify({ newEmail }), // store meta as stringified JSON
            lastSentAt: now,
            createdAt: now,
            updatedAt: now,
        });

        await sendVerificationEmail(newEmail, code); // send to newEmail

        // Update user's pendingEmail field
        await db
            .update(users)
            .set({ pendingEmail: newEmail })
            .where(eq(users.id, userId));

        return res.status(OK).json({
            success: true,
            message: `Verification code sent to ${newEmail}. Token expires in 15 minutes.`,
        });
    } catch (err) {
        console.error("Request email change error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Request failed" });
    }
};

export const verifyEmailChange = async (req: Request, res: Response) => {
    if (ALLOW_EMAIL_MIGRATION !== "true") {
        return res.status(FORBIDDEN).json({ message: "Email migration is currently disabled." });
    }

    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { code } = parsed.data;

    try {
        // 1. Find a valid email change verification code
        const validCodeResult = await db
            .select()
            .from(verificationCodes)
            .where(
                and(
                    eq(verificationCodes.code, code),
                    eq(verificationCodes.type, VerificationCodeType.EmailChange),
                    gt(verificationCodes.expiresAt, new Date())
                )
            )
            .limit(1);

        if (validCodeResult.length === 0) {
            return res.status(BAD_REQUEST).json({ message: "Invalid or expired code" });
        }

        const verificationCode = validCodeResult[0];

        // 2. Find the user associated with the verification code
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, verificationCode.userId))
            .limit(1);

        const user = userResult[0];
        if (!user || !user.pendingEmail) {
            return res.status(400).json({ message: "Pending email not found" });
        }

        const newEmail = user.pendingEmail;
        const oldEmail = user.email;

        // Make sure no one else has this newEmail (just in case)
        const existingUserResult = await db
            .select()
            .from(users)
            .where(eq(users.email, newEmail))
            .limit(1);

        if (existingUserResult.length > 0) {
            return res.status(CONFLICT).json({ message: "Email is already in use by another account" });
        }

        // Update user: set email = pendingEmail, clear pendingEmail, mark verified
        await db
            .update(users)
            .set({
                email: newEmail,
                pendingEmail: null,
                isEmailVerified: true,
            })
            .where(eq(users.id, user.id));


        // Delete all EmailChange verification codes for this user
        await db.delete(verificationCodes).where(
            and(
                eq(verificationCodes.userId, user.id),
                eq(verificationCodes.type, VerificationCodeType.EmailChange)
            )
        );

        // 6. Delete all user sessions for this user (optional: exclude current session - req.sessionId)
        await db.delete(userSessions).where(eq(userSessions.userId, user.id));
        // Notify old email
        await sendEmailChangedNotification(oldEmail, newEmail);

        return res.status(OK).json({
            success: true,
            message: "Email successfully updated",
            user: {
                id: user.id,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (err) {
        console.error("Email update failed:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Email update failed" });
    }
};