import { eq } from "drizzle-orm";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { users, userSessions } from "../../db/schema";
import { db } from "../../db/db";
import { compareValue } from "../../utils/bcrypt";
import generateToken from "../../utils/token-utils/generateToken";
import * as UAParser from "ua-parser-js";

export async function initiate2FA(userId: string) {
    // Fetch user
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({
        name: `Haideron-LMS (${user.email})`,
        length: 20,
    });

    // Store base32 secret in the database (do not enable 2FA yet)
    await db.update(users)
        .set({ twoFASecret: secret.base32 })
        .where(eq(users.id, userId));

    if (!secret.otpauth_url) {
        throw new Error("OTP_URL_FAILED");
    }

    // Generate QR code data URL
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    return {
        qrCodeDataURL,
        secret: secret.base32,
    };
}

export async function verify2FAForUser(userId: string, token: string) {
    // Fetch user
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (!user.twoFASecret) {
        throw new Error("TWO_FA_NOT_SETUP");
    }

    if (user.isTwoFAEnabled) {
        throw new Error("TWO_FA_ALREADY_ENABLED");
    }

    // Verify token
    const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: "base32",
        token,
        window: 1, // allow 1 step before/after to account for clock drift
    });

    if (!verified) {
        throw new Error("INVALID_TOKEN");
    }

    // Enable 2FA
    await db.update(users)
        .set({ isTwoFAEnabled: true })
        .where(eq(users.id, userId));

    return true;
}

export async function loginWith2FAService(
    email: string,
    password: string,
    twoFAToken: string | null,
    userAgent: string | undefined,
    ip: string | undefined,
    res: any // passing res because generateToken needs it
) {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isValidPassword = await compareValue(password, user.password);
    if (!isValidPassword) {
        throw new Error("INVALID_CREDENTIALS");
    }

    //  If 2FA enabled, require token
    if (user.isTwoFAEnabled) {
        if (!twoFAToken) {
            return { twoFARequired: true };
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret!,
            encoding: "base32",
            token: twoFAToken,
            window: 1,
        });

        if (!verified) {
            throw new Error("INVALID_2FA_TOKEN");
        }
    }

    // Generate session + access token
    const sessionId = crypto.randomUUID();
    const accessToken = await generateToken(res, user.id, sessionId);

    const parser = new UAParser.UAParser(userAgent || "");
    const ua = parser.getResult();

    await db.insert(userSessions).values({
        id: sessionId,
        userId: user.id,
        ip: ip || "",
        userAgent: {
            browser: ua.browser.name + " " + ua.browser.version,
            os: ua.os.name + " " + ua.os.version,
            device: ua.device.type || "Desktop",
            raw: userAgent || "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return {
        id: user.id,
        email: user.email,
        accessToken,
    };
}

export async function disable2FAForUser(userId: string, password: string, twoFAToken: string) {
    // Fetch user
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    // Verify password
    const isPasswordValid = await compareValue(password, user.password);
    if (!isPasswordValid) {
        throw new Error("INVALID_PASSWORD");
    }

    // Check if 2FA is enabled
    if (!user.isTwoFAEnabled) {
        throw new Error("TWO_FA_NOT_ENABLED");
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
        secret: user.twoFASecret!,
        encoding: "base32",
        token: twoFAToken,
        window: 1,
    });

    if (!verified) {
        throw new Error("INVALID_2FA_TOKEN");
    }

    // Disable 2FA
    await db.update(users)
        .set({ isTwoFAEnabled: false, twoFASecret: null })
        .where(eq(users.id, userId));

    return true;
}