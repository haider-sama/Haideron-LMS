import { NextFunction, Request, Response } from "express";
import { FORBIDDEN, INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from "../constants/http";
import { DecodedToken, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utils/token-utils/jwt";
import { clearAuthCookies, setAuthCookies } from "../utils/token-utils/cookies";
import { eq, and } from "drizzle-orm";
import { db } from "../db/db";
import { users, userSessions } from "../db/schema";

declare global {
    namespace Express {
        interface Request {
            userId: string;
            userRole?: string;
        }
    }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(UNAUTHORIZED).json({ message: "Unauthorized: No access token provided." });
        }

        // Decode token
        let decoded: DecodedToken;
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            clearAuthCookies(res);
            return res.status(UNAUTHORIZED).json({ message: "Invalid or expired access token." });
        }

        // Fetch session + user in one query
        const result = await db
            .select({
                sessionId: userSessions.id,
                userId: users.id,
                tokenVersion: users.tokenVersion,
                role: users.role,
                lastOnline: users.lastOnline,
            })
            .from(users)
            .innerJoin(userSessions, and(
                eq(userSessions.userId, users.id),
                eq(userSessions.id, decoded.sessionId)
            ))
            .where(eq(users.id, decoded.userId.toString()))
            .limit(1)
            .then(rows => rows[0])
            .catch(err => {
                console.error("DB error fetching session + user", err);
                throw { status: 503, message: "Temporary server issue. Please try again." };
            });

        if (!result) {
            clearAuthCookies(res);
            return res.status(UNAUTHORIZED).json({ message: "Session not found or expired. Please log in again." });
        }

        if (decoded.tokenVersion !== result.tokenVersion) {
            clearAuthCookies(res);
            return res.status(UNAUTHORIZED).json({ message: "Session expired. Please log in again." });
        }

        req.userId = result.userId;
        req.userRole = result.role;

        // Update last online (non-blocking)
        db.update(users)
            .set({ lastOnline: new Date() })
            .where(eq(users.id, result.userId))
            .catch(err => console.error("Failed to update lastOnline", err));

        return next();

    } catch (err: any) {
        // Handle custom errors from DB
        if (err.status && err.message) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error("Token verification error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(UNAUTHORIZED).json({ message: "Refresh token not provided" });
        }

        // Verify refresh token
        let decoded: DecodedToken;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            clearAuthCookies(res);
            return res.status(FORBIDDEN).json({ message: "Invalid or expired refresh token" });
        }

        // Fetch session + user in one query
        const result = await db
            .select({
                sessionId: userSessions.id,
                userId: users.id,
                tokenVersion: users.tokenVersion,
                role: users.role,
            })
            .from(users)
            .innerJoin(userSessions, and(
                eq(userSessions.userId, users.id),
                eq(userSessions.id, decoded.sessionId)
            ))
            .where(eq(users.id, decoded.userId.toString()))
            .limit(1)
            .then(rows => rows[0])
            .catch(err => {
                console.error("DB error fetching session + user", err);
                throw { status: 503, message: "Temporary server issue. Please try again." };
            });

        if (!result) {
            clearAuthCookies(res);
            return res.status(UNAUTHORIZED).json({ message: "Session not found or expired. Please log in again." });
        }

        if (decoded.tokenVersion !== result.tokenVersion) {
            clearAuthCookies(res);
            return res.status(UNAUTHORIZED).json({ message: "Session expired. Please log in again." });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(result.userId, result.tokenVersion, result.role, result.sessionId);

        // Set cookies
        setAuthCookies({
            res,
            accessToken: newAccessToken,
            refreshToken: refreshToken, // send the old one
        });

        return res.status(OK).json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("Refresh token error:", err);
        clearAuthCookies(res);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.userRole) {
                return res.status(UNAUTHORIZED).json({ message: "User not found" });
            }
            if (!allowedRoles.includes(req.userRole)) {
                return res.status(FORBIDDEN).json({ message: "Access denied: Insufficient Permissions" });
            }

            next();
        } catch (err) {
            return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        }
    };
};