import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { db } from "../../../db/db";
import { comments } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import { redisClient } from "../../../lib/redis";

export const getRedisCommentKeys = (commentId: string) => ({
    setKey: `comment:${commentId}:likes`,
    countKey: `comment:${commentId}:likeCount`,
});

export const likeComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!commentId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });
    }

    try {
        // Check if comment exists and is not deleted
        const commentRow = await db
            .select({ id: comments.id })
            .from(comments)
            .where(and(eq(comments.id, commentId), eq(comments.isDeleted, false)))
            .limit(1)
            .then(r => r[0]);

        if (!commentRow) return res.status(NOT_FOUND).json({ message: "Comment not found." });

        const { setKey, countKey } = getRedisCommentKeys(commentId);

        // Check if user already liked
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);
        if (alreadyLiked) return res.status(CONFLICT).json({ message: "Comment already liked." });

        // Add like in Redis
        await Promise.all([
            redisClient.sAdd(setKey, userId),
            redisClient.incr(countKey),
        ]);

        // Return updated like count
        const likeCountStr = await redisClient.get(countKey);
        const likeCount = likeCountStr ? parseInt(likeCountStr) : 0;

        return res.status(OK).json({ message: "Comment liked.", liked: true, likeCount });
    } catch (err) {
        console.error("[COMMENT_LIKE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const unlikeComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!commentId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });
    }

    try {
        // Check if comment exists and is not deleted
        const commentRow = await db
            .select({ id: comments.id })
            .from(comments)
            .where(and(eq(comments.id, commentId), eq(comments.isDeleted, false)))
            .limit(1)
            .then(r => r[0]);

        if (!commentRow) return res.status(NOT_FOUND).json({ message: "Comment not found." });

        const { setKey, countKey } = getRedisCommentKeys(commentId);

        // Check if user actually liked
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);
        if (!alreadyLiked) return res.status(CONFLICT).json({ message: "Comment not liked yet." });

        // Remove like in Redis
        await Promise.all([
            redisClient.sRem(setKey, userId),
            redisClient.decr(countKey),
        ]);

        // Return updated like count
        const likeCountStr = await redisClient.get(countKey);
        const likeCount = likeCountStr ? parseInt(likeCountStr) : 0;

        return res.status(OK).json({ message: "Comment unliked.", liked: false, likeCount });
    } catch (err) {
        console.error("[COMMENT_UNLIKE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};