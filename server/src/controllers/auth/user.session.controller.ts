import { Request, Response } from "express";
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../constants/http";
import { db } from "../../db/db";
import { userSessions } from "../../db/models/auth/userSession.model";
import { and, eq, desc } from "drizzle-orm";

export const deleteSession = async (req: Request, res: Response) => {
    try {
        const sessionId = req.params.sessionId;
        const userId = req.userId;

        // Delete session where id = sessionId and userId = userId
        const result = await db
            .delete(userSessions)
            .where(
                and(
                    eq(userSessions.id, sessionId),
                    eq(userSessions.userId, userId)
                )
            );


        if (result.rowCount === 0) {
            return res.status(NOT_FOUND).json({ message: "Session not found" });
        }

        return res.status(OK).json({ message: "Session deleted" });
    } catch (err) {
        console.error("Delete session error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Could not delete session" });
    }
};

export const getUserSessions = async (req: Request, res: Response) => {
    try {
        const sessions = await db
            .select()
            .from(userSessions)
            .where(eq(userSessions.userId, req.userId))
            .orderBy(desc(userSessions.updatedAt));

        return res.status(OK).json(sessions);
    } catch (err) {
        console.error("Failed to fetch sessions", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Could not fetch sessions" });
    }
};