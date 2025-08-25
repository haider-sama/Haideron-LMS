import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { redisClient } from "../../../lib/redis";
import { SettingsService } from "../../../utils/settings/SettingsService";

export const getRedisCommentKeys = (commentId: string) => ({
    setKey: `comment:${commentId}:likes`,
    countKey: `comment:${commentId}:likeCount`,
});

export const likeComment = async (req: Request, res: Response) => {
    if (!(await SettingsService.isLikesEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Likes are disabled by admin" });
    }

    const { commentId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(UNAUTHORIZED).json({ message: "Not logged in" });
    if (!commentId) return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });

    try {
        const { setKey, countKey } = getRedisCommentKeys(commentId);

        // Check if user already liked
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);

        let likeCount: number;

        if (!alreadyLiked) {
            // Only add + increment if not already liked
            const pipeline = redisClient.multi();
            pipeline.sAdd(setKey, userId);
            pipeline.incr(countKey);

            const results = await pipeline.exec();
            const likeCountReply = results?.[1]; // 2nd command (INCR) reply
            likeCount = Math.max(parseInt(String(likeCountReply ?? "0"), 10), 0);
        } else {
            // Just read the count
            const count = await redisClient.get(countKey);
            likeCount = Math.max(parseInt(count ?? "0", 10), 0);
        }

        return res.status(OK).json({
            message: alreadyLiked ? "Already liked." : "Comment liked.",
            liked: true,
            likeCount,
        });
    } catch (err) {
        console.error("[COMMENT_LIKE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const unlikeComment = async (req: Request, res: Response) => {
    if (!(await SettingsService.isLikesEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Likes are disabled by admin" });
    }

    const { commentId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(UNAUTHORIZED).json({ message: "Not logged in" });
    if (!commentId) return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });

    try {
        const { setKey, countKey } = getRedisCommentKeys(commentId);

        // Check if user actually liked before
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);

        let likeCount: number;

        if (alreadyLiked) {
            // Only remove + decrement if previously liked
            const pipeline = redisClient.multi();
            pipeline.sRem(setKey, userId);
            pipeline.decr(countKey);

            const results = await pipeline.exec();
            const likeCountReply = results?.[1]; // 2nd command (DECR) reply
            likeCount = Math.max(parseInt(String(likeCountReply ?? "0"), 10), 0);
        } else {
            // Just read the count
            const count = await redisClient.get(countKey);
            likeCount = Math.max(parseInt(count ?? "0", 10), 0);
        }

        return res.status(OK).json({
            message: alreadyLiked ? "Comment unliked." : "Not previously liked.",
            liked: false,
            likeCount,
        });
    } catch (err) {
        console.error("[COMMENT_UNLIKE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};