import { Request, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../constants/http";
import { Disable2FASchema, TwoFALoginSchema, TwoFATokenSchema } from "../../utils/validators/lms-schemas/authSchemas";
import { disable2FAForUser, initiate2FA, loginWith2FAService, verify2FAForUser } from "../../services/auth/twoFAService";

export async function setup2FA(req: Request, res: Response) {
    const userId = req.userId;

    try {
        const { qrCodeDataURL, secret } = await initiate2FA(userId);

        res.status(OK).json({
            message: "2FA setup initiated. Scan the QR code with your authenticator app.",
            qrCodeDataURL,
            secret, // optional, mostly for testing or backup
        });
    } catch (err: any) {
        console.error("2FA Setup Error:", err);

        if (err.message === "USER_NOT_FOUND") {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to setup 2FA." });
    }
}

export async function verify2FA(req: Request, res: Response) {
    const userId = req.userId;

    const parsed = TwoFATokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        await verify2FAForUser(userId, parsed.data.token);

        return res.status(OK).json({
            message: "2FA has been successfully enabled.",
        });
    } catch (err: any) {
        console.error("2FA Verification Error:", err);

        switch (err.message) {
            case "USER_NOT_FOUND":
                return res.status(NOT_FOUND).json({ message: "User not found." });
            case "TWO_FA_NOT_SETUP":
                return res.status(BAD_REQUEST).json({ message: "2FA has not been set up for this user." });
            case "TWO_FA_ALREADY_ENABLED":
                return res.status(BAD_REQUEST).json({ message: "2FA is already enabled for this account." });
            case "INVALID_TOKEN":
                return res.status(BAD_REQUEST).json({ message: "Invalid 2FA token." });
            default:
                return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to verify 2FA." });
        }
    }
}

export async function loginWith2FA(req: Request, res: Response) {
    const parsed = TwoFALoginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { email, password, twoFAToken } = parsed.data;

    try {
        const result = await loginWith2FAService(
            email,
            password,
            twoFAToken || null,
            req.headers["user-agent"],
            (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
            res
        );

        if ("twoFARequired" in result) {
            return res.status(OK).json({
                message: "2FA required",
                twoFARequired: true,
            });
        }

        return res.status(OK).json(result);
    } catch (err: any) {
        console.error("Login 2FA Error:", err);

        switch (err.message) {
            case "INVALID_CREDENTIALS":
                return res.status(UNAUTHORIZED).json({ message: "Invalid email or password." });
            case "INVALID_2FA_TOKEN":
                return res.status(UNAUTHORIZED).json({ message: "Invalid 2FA token." });
            default:
                return res.status(INTERNAL_SERVER_ERROR).json({ message: "Login failed. Please try again." });
        }
    }
}

export async function disable2FA(req: Request, res: Response) {
    const userId = req.userId;

    const parsed = Disable2FASchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { password, twoFAToken } = parsed.data;

    try {
        await disable2FAForUser(userId, password, twoFAToken);

        return res.status(OK).json({ message: "2FA has been disabled successfully." });
    } catch (err: any) {
        console.error("Disable 2FA Error:", err);

        switch (err.message) {
            case "USER_NOT_FOUND":
                return res.status(NOT_FOUND).json({ message: "User not found." });
            case "INVALID_PASSWORD":
                return res.status(UNAUTHORIZED).json({ message: "Invalid password." });
            case "TWO_FA_NOT_ENABLED":
                return res.status(BAD_REQUEST).json({ message: "2FA is not enabled for this account." });
            case "INVALID_2FA_TOKEN":
                return res.status(UNAUTHORIZED).json({ message: "Invalid 2FA token." });
            default:
                return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to disable 2FA." });
        }
    }
}