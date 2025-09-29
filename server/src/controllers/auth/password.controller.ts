import { Request, Response } from "express";
import { generateVerificationToken } from "../../utils/token-utils/tokenUtils";
import {
    sendPasswordResetEmail,
    sendResetSuccessEmail,
} from "../../utils/email/emailService";
import dotenv from "dotenv";
import { VerificationCodeType } from "../../shared/enums";
import { oneHourFromNow } from "../../utils/date";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../constants/http";
import { emailOnlySchema, resetPasswordSchema } from "../../utils/validators/lms-schemas/authSchemas";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { hashValue } from "../../utils/bcrypt";
import { verificationCodes } from "../../db/models/auth/verificationCode.model";
import { and, eq, gt} from "drizzle-orm";

dotenv.config();

export const forgotPassword = async (req: Request, res: Response) => {
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

        // Generate Reset Token
        const resetToken = generateVerificationToken();
        const resetTokenExpiresAt = oneHourFromNow();

        // Update user's reset token and expiry
        const updatedUser = await db
            .update(users)
            .set({
                resetPasswordToken: resetToken,
                resetPasswordExpiresAt: resetTokenExpiresAt,
            })
            .where(eq(users.id, user.id))
            .returning();

        if (updatedUser.length === 0) {
            return res.status(INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to generate reset token"
            });
        }

        // send email
        await sendPasswordResetEmail(
            updatedUser[0].email,
            `${process.env.FRONTEND_URL}/account/reset-password/${resetToken}`
        );

        res.status(OK).json({
            success: true,
            message: "If the account exists, a reset link will be sent.",
        });
    } catch (err: any) {
        console.error("Forgot password error:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Forgot password failed. Please try again."
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token } = req.params;

    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const { password } = parsed.data;

    try {
        // Find user by token and expiry > now
        const userResult = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.resetPasswordToken, token),
                    gt(users.resetPasswordExpiresAt, new Date())
                )
            )
            .limit(1);

        const user = userResult[0];

        if (!user) {
            return res.status(BAD_REQUEST).json({
                success: false,
                message: "Invalid or expired reset token."
            });
        }

        const hashedPassword = await hashValue(password);
        // Update password and clear reset token fields
        const updatedUser = await db
            .update(users)
            .set({
                password: hashedPassword, // hash password!
                resetPasswordToken: null,
                resetPasswordExpiresAt: null,
            })
            .where(eq(users.id, user.id))
            .returning();

        if (updatedUser.length === 0) {
            return res.status(INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to reset password.",
            });
        }

        await sendResetSuccessEmail(user.email);

        res.status(OK).json({
            success: true,
            message: "Password reset successful."
        });
    } catch (error: any) {
        console.error("Reset password error:", error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Reset password failed. Please try again."
        });
    }
};

export const resendPasswordResetEmail = async (req: Request, res: Response) => {
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

        const now = new Date();

        // Find existing reset password code
        const existingCodeResult = await db
            .select()
            .from(verificationCodes)
            .where(
                and(
                    eq(verificationCodes.userId, user.id),
                    eq(verificationCodes.type, VerificationCodeType.ResetPassword)
                )
            )
            .limit(1);

        const existingCode = existingCodeResult[0];

        // Throttle if last sent less than 5 minutes ago
        if (existingCode && existingCode.lastSentAt) {
            const diff = now.getTime() - existingCode.lastSentAt.getTime();
            if (diff < 5 * 60 * 1000) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: "Please wait before requesting another password reset email.",
                });
            }
        }

        // Delete existing reset password code if any
        if (existingCode) {
            await db.delete(verificationCodes).where(eq(verificationCodes.id, existingCode.id));
        }

        // Generate new reset token and insert
        const token = generateVerificationToken();
        await db.insert(verificationCodes).values({
            userId: user.id,
            type: VerificationCodeType.ResetPassword,
            code: token,
            expiresAt: oneHourFromNow(),
            lastSentAt: now,
            createdAt: now,
            updatedAt: now,
        });

        // Send password reset email
        await sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/reset-password/${token}`);

        return res.status(OK).json({
            success: true,
            message: `Password reset link sent to ${user.email}.`,
        });
    } catch (error) {
        console.error("Resend password reset email error:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to resend password reset email. Please try again.",
        });
    }
};