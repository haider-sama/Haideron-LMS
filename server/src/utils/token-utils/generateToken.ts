import { Response } from "express";
import { generateAccessToken, generateRefreshToken } from './jwt';
import { setAuthCookies } from './cookies';
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

const generateToken = async (res: Response, userId: string) => {
    const user = await db
        .select({
            tokenVersion: users.tokenVersion,
            role: users.role,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(rows => rows[0]);

    const accessToken = generateAccessToken(userId, user.tokenVersion, user.role);
    const refreshToken = generateRefreshToken(userId, user.tokenVersion, user.role);

    setAuthCookies({ res, accessToken, refreshToken });

    return accessToken;
};

export default generateToken;