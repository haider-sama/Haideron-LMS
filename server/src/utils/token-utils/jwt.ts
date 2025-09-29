// src/utils/token-utils/jwt.ts
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../../constants/env";

export interface DecodedToken {
    userId: string;
    tokenVersion: number;
    role: string;
    sessionId: string;
    type: "access" | "refresh";
}

export const generateAccessToken = (
    userId: string,
    tokenVersion: number,
    role: string,
    sessionId: string
): string => {
    return jwt.sign(
        { userId, tokenVersion, role, sessionId, type: "access" },
        JWT_SECRET! as string,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (
    userId: string,
    tokenVersion: number,
    role: string,
    sessionId: string
): string => {
    return jwt.sign(
        { userId, tokenVersion, role, sessionId, type: "refresh" },
        JWT_REFRESH_SECRET! as string,
        { expiresIn: "7d" }
    );
};

export const verifyAccessToken = (token: string): DecodedToken => {
    const decoded = jwt.verify(token, JWT_SECRET! as string) as DecodedToken;
    if (decoded.type !== "access") {
        throw new Error("Invalid token type");
    }
    return decoded;
};

export const verifyRefreshToken = (token: string): DecodedToken => {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET! as string) as DecodedToken;
    if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
    }
    return decoded;
};