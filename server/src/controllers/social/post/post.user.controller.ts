import { Request, Response } from "express";
import { CONFLICT, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { db } from "../../../db/db";
import { comments, postLikes, posts, postVotes } from "../../../db/schema";
import { and, count, eq } from "drizzle-orm";
import { redisClient } from "../../../lib/redis";
import { publishLikeEvent } from "../../../lib/rabbitMQ";
import { SettingsService } from "../../../utils/settings/SettingsService";

// Helper keys
export const getRedisLikeKeys = (postId: string) => ({
    setKey: `post:${postId}:likes`,
    countKey: `post:${postId}:likeCount`,
});

export const likePost = async (req: Request, res: Response) => {
    if (!(await SettingsService.isLikesEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Likes are disabled by admin" });
    }

    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(UNAUTHORIZED).json({ message: "Not logged in" });

    try {
        const { setKey, countKey } = getRedisLikeKeys(postId);

        // Check if already liked
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);

        let likeCount: number;

        if (!alreadyLiked) {
            // Only add + increment if not already liked
            const pipeline = redisClient.multi();
            pipeline.sAdd(setKey, userId);
            pipeline.incr(countKey);
            const results = await pipeline.exec();
            const likeCountReply = results?.[1]; // INCR reply
            likeCount = Math.max(parseInt(String(likeCountReply ?? "0"), 10), 0);
        } else {
            // Just read count
            const count = await redisClient.get(countKey);
            likeCount = parseInt(count ?? "0", 10);
        }

        return res.status(OK).json({
            message: alreadyLiked ? "Already liked." : "Post liked.",
            liked: true,
            likeCount,
        });
    } catch (err) {
        console.error("[POST_LIKE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const unlikePost = async (req: Request, res: Response) => {
    if (!(await SettingsService.isLikesEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Likes are disabled by admin" });
    }

    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(UNAUTHORIZED).json({ message: "Not logged in" });

    try {
        const { setKey, countKey } = getRedisLikeKeys(postId);

        // Check if actually liked
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);

        let likeCount: number;

        if (alreadyLiked) {
            // Only remove + decrement if previously liked
            const pipeline = redisClient.multi();
            pipeline.sRem(setKey, userId);
            pipeline.decr(countKey);
            const results = await pipeline.exec();
            const likeCountReply = results?.[1]; // DECR reply
            likeCount = Math.max(parseInt(String(likeCountReply ?? "0"), 10), 0);
        } else {
            // Just read count
            const count = await redisClient.get(countKey);
            likeCount = parseInt(count ?? "0", 10);
        }

        return res.status(OK).json({
            message: alreadyLiked ? "Post unliked." : "Not previously liked.",
            liked: false,
            likeCount,
        });
    } catch (err) {
        console.error("[POST_UNLIKE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

// Helper to get Redis keys for votes
export const getRedisVoteKeys = (postId: string) => ({
    upvoteSetKey: `post:${postId}:upvotes`,
    downvoteSetKey: `post:${postId}:downvotes`,
    upvoteCountKey: `post:${postId}:upvoteCount`,
    downvoteCountKey: `post:${postId}:downvoteCount`,
});

export const upvotePost = async (req: Request, res: Response) => {
    if (!(await SettingsService.isLikesEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Likes are disabled by admin" });
    }

    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(UNAUTHORIZED).json({ message: "Not logged in" });

    try {
        const { upvoteSetKey, downvoteSetKey, upvoteCountKey, downvoteCountKey } = getRedisVoteKeys(postId);

        // Check current membership
        const alreadyUpvoted = await redisClient.sIsMember(upvoteSetKey, userId);
        const alreadyDownvoted = await redisClient.sIsMember(downvoteSetKey, userId);

        console.log("User ID:", userId);
        console.log("Post ID:", postId);
        console.log("Already Upvoted?", alreadyUpvoted);
        console.log("Already Downvoted?", alreadyDownvoted);

        // Atomic pipeline
        const pipeline = redisClient.multi();

        if (alreadyUpvoted) {
            pipeline.sRem(upvoteSetKey, userId);
            pipeline.decr(upvoteCountKey);
        } else {
            if (alreadyDownvoted) {
                pipeline.sRem(downvoteSetKey, userId);
                pipeline.decr(downvoteCountKey);
            }
            pipeline.sAdd(upvoteSetKey, userId);
            pipeline.incr(upvoteCountKey);
        }

        await pipeline.exec();

        const [upvoteCountStr, downvoteCountStr] = await Promise.all([
            redisClient.get(upvoteCountKey),
            redisClient.get(downvoteCountKey),
        ]);

        const upvoteCount = Math.max(parseInt(upvoteCountStr || "0", 10), 0);
        const downvoteCount = Math.max(parseInt(downvoteCountStr || "0", 10), 0);

        console.log("Upvote Count:", upvoteCount);
        console.log("Downvote Count:", downvoteCount);

        return res.status(OK).json({
            upvoted: !alreadyUpvoted,
            upvoteCount,
            downvoteCount,
        });
    } catch (err) {
        console.error("Error upvoting post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const downvotePost = async (req: Request, res: Response) => {
    if (!(await SettingsService.isLikesEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Likes are disabled by admin" });
    }

    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(UNAUTHORIZED).json({ message: "Not logged in" });

    try {
        const { upvoteSetKey, downvoteSetKey, upvoteCountKey, downvoteCountKey } = getRedisVoteKeys(postId);

        // Check current membership
        const alreadyDownvoted = await redisClient.sIsMember(downvoteSetKey, userId);
        const alreadyUpvoted = await redisClient.sIsMember(upvoteSetKey, userId);

        console.log("User ID:", userId);
        console.log("Post ID:", postId);
        console.log("Already Upvoted?", alreadyUpvoted);
        console.log("Already Downvoted?", alreadyDownvoted);

        // Atomic pipeline
        const pipeline = redisClient.multi();

        if (alreadyDownvoted) {
            pipeline.sRem(downvoteSetKey, userId);
            pipeline.decr(downvoteCountKey);
        } else {
            if (alreadyUpvoted) {
                pipeline.sRem(upvoteSetKey, userId);
                pipeline.decr(upvoteCountKey);
            }
            pipeline.sAdd(downvoteSetKey, userId);
            pipeline.incr(downvoteCountKey);
        }

        await pipeline.exec();

        const [upvoteCountStr, downvoteCountStr] = await Promise.all([
            redisClient.get(upvoteCountKey),
            redisClient.get(downvoteCountKey),
        ]);

        const upvoteCount = Math.max(parseInt(upvoteCountStr || "0", 10), 0);
        const downvoteCount = Math.max(parseInt(downvoteCountStr || "0", 10), 0);

        console.log("Upvote Count:", upvoteCount);
        console.log("Downvote Count:", downvoteCount);

        return res.status(OK).json({
            downvoted: !alreadyDownvoted,
            upvoteCount,
            downvoteCount,
        });
    } catch (err) {
        console.error("Error downvoting post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const getPostMetrics = async (req: Request, res: Response) => {
    if (!(await SettingsService.isPostsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Posts are disabled by admin" });
    }

    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Ensure post exists
        const postRow = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) {
            return res.status(NOT_FOUND).json({ message: "Post not found" });
        }

        // Redis keys
        const { setKey: likeSetKey, countKey: likeCountKey } = getRedisLikeKeys(postId);
        const { upvoteSetKey, downvoteSetKey, upvoteCountKey, downvoteCountKey } = getRedisVoteKeys(postId);

        // Fetch from Redis first
        const [likeCountStr, upvoteCountStr, downvoteCountStr, hasLiked, upvoted, downvoted] = await Promise.all([
            redisClient.get(likeCountKey),
            redisClient.get(upvoteCountKey),
            redisClient.get(downvoteCountKey),
            redisClient.sIsMember(likeSetKey, userId),
            redisClient.sIsMember(upvoteSetKey, userId),
            redisClient.sIsMember(downvoteSetKey, userId),
        ]);

        let likeCount = likeCountStr ? parseInt(likeCountStr) : null;
        let upvoteCount = upvoteCountStr ? parseInt(upvoteCountStr) : null;
        let downvoteCount = downvoteCountStr ? parseInt(downvoteCountStr) : null;

        // Fallback to DB if Redis misses
        if (likeCount === null) {
            const [{ count: dbLikeCount }] = await db
                .select({ count: count() })
                .from(postLikes)
                .where(eq(postLikes.postId, postId));
            likeCount = Number(dbLikeCount);
            await redisClient.set(likeCountKey, likeCount); // hydrate cache
        }

        if (upvoteCount === null) {
            const [{ count: dbUpvoteCount }] = await db
                .select({ count: count() })
                .from(postVotes)
                .where(and(eq(postVotes.postId, postId), eq(postVotes.voteType, "UPVOTE")));
            upvoteCount = Number(dbUpvoteCount);
            await redisClient.set(upvoteCountKey, upvoteCount);
        }

        if (downvoteCount === null) {
            const [{ count: dbDownvoteCount }] = await db
                .select({ count: count() })
                .from(postVotes)
                .where(and(eq(postVotes.postId, postId), eq(postVotes.voteType, "DOWNVOTE")));
            downvoteCount = Number(dbDownvoteCount);
            await redisClient.set(downvoteCountKey, downvoteCount);
        }

        // Comment count (always DB since it changes often & filtered by deleted flag)
        const [{ count: dbCommentCount }] = await db
            .select({ count: count() })
            .from(comments)
            .where(and(eq(comments.postId, postId), eq(comments.isDeleted, false)));

        const commentCount = Number(dbCommentCount);

        // User vote status
        let userVote: "UPVOTE" | "DOWNVOTE" | null = null;
        if (upvoted) userVote = "UPVOTE";
        else if (downvoted) userVote = "DOWNVOTE";

        return res.status(OK).json({
            likeCount,
            upvoteCount,
            downvoteCount,
            commentCount,
            hasLiked: !!hasLiked,
            userVote,
        });
    } catch (err) {
        console.error("Error fetching post metrics:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};