import { NextFunction, Request, Response } from "express";
import { FORBIDDEN, INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from "../constants/http";
import { generateAccessToken, verifyAccessToken, verifyRefreshToken } from "../utils/token-utils/jwt";
import { clearAuthCookies, setAuthCookies } from "../utils/token-utils/cookies";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { users } from "../db/schema";

declare global {
    namespace Express {
        interface Request {
            userId: string;
            userRole?: string;
        }
    }
}

export type OptionalAuthRequest = Omit<Request, "userId"> & {
    userId?: string | null;
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(UNAUTHORIZED).json({ message: "No access token, authorization denied" });
        }

        try {
            const decoded = verifyAccessToken(token);

            // find unique user by id
            const user = await db
                .select({
                    id: users.id,
                    tokenVersion: users.tokenVersion,
                    role: users.role,
                    lastOnline: users.lastOnline,
                })
                .from(users)
                .where(eq(users.id, decoded.userId.toString()))
                .limit(1)
                .then(rows => rows[0]);

            if (!user) {
                return res.status(UNAUTHORIZED).json({ message: "User not found" });
            }

            if (decoded.tokenVersion !== user.tokenVersion) {
                clearAuthCookies(res);
                return res.status(UNAUTHORIZED).json({ message: "Session expired. Please log in again." });
            }

            req.userId = user.id;
            req.userRole = user.role;

            // Update last online
            await db.update(users)
                .set({ lastOnline: new Date() })
                .where(eq(users.id, user.id));

            return next();
        } catch (error) {
            clearAuthCookies(res);
            return res.status(UNAUTHORIZED).json({ message: "Session expired. Please log in again." });
        }
    } catch (err) {
        console.error("Token verification error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};


export const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
        return res.status(UNAUTHORIZED).json({ message: "Refresh token not provided" });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        const user = await db
            .select({
                id: users.id,
                tokenVersion: users.tokenVersion,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, decoded.userId.toString()))
            .limit(1)
            .then(rows => rows[0]);

        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: "User not found" });
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
            clearAuthCookies(res);
            return res.status(FORBIDDEN).json({ message: "Token invalidated. Please log in again." });
        }

        const newAccessToken = generateAccessToken(user.id, user.tokenVersion, user.role);

        setAuthCookies({
            res,
            accessToken: newAccessToken,
            refreshToken, // optional: rotate if implementing
        });

        return res.status(OK).json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("Failed to refresh token:", error);
        clearAuthCookies(res);
        return res.status(FORBIDDEN).json({ message: "Invalid or expired refresh token" });
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

export const optionalVerifyToken = async (req: OptionalAuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            req.userId = null;
            return next();
        }

        try {
            const decoded = verifyAccessToken(token);
            const user = await db
                .select({
                    id: users.id,
                    tokenVersion: users.tokenVersion,
                    lastOnline: users.lastOnline,
                })
                .from(users)
                .where(eq(users.id, decoded.userId.toString()))
                .limit(1)
                .then(rows => rows[0]);

            if (!user || decoded.tokenVersion !== user.tokenVersion) {
                req.userId = null;
                return next();
            }

            req.userId = user.id;

            await db.update(users)
                .set({ lastOnline: new Date() })
                .where(eq(users.id, user.id));

            return next();
        } catch (err) {
            req.userId = null;
            return next(); // treat as guest
        }
    } catch (err) {
        console.error("Optional token error:", err);
        req.userId = null;
        return next();
    }
};

export const fastVerifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(UNAUTHORIZED).json({ message: "No access token" });
        }

        const decoded = verifyAccessToken(token);
        req.userId = decoded.userId.toString();
        req.userRole = decoded.role;

        return next(); // No DB calls
    } catch (err) {
        return res.status(UNAUTHORIZED).json({ message: "Invalid token" });
    }
};