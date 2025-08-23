import { Request, Response } from "express";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { db } from "../../../db/db";
import { posts } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { redisClient } from "../../../lib/redis";

// Helper keys
export const getRedisLikeKeys = (postId: string) => ({
    setKey: `post:${postId}:likes`,
    countKey: `post:${postId}:likeCount`,
});

export const likePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Check if post exists
        const postRow = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);
        if (!postRow) return res.status(NOT_FOUND).json({ message: "Post not found." });

        const { setKey, countKey } = getRedisLikeKeys(postId);

        // Check if already liked
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);
        if (alreadyLiked) return res.status(CONFLICT).json({ message: "Post already liked." });

        // Add like
        await redisClient.sAdd(setKey, userId);
        await redisClient.incr(countKey);

        const likeCountStr = await redisClient.get(countKey);
        const likeCount = likeCountStr ? parseInt(likeCountStr) : 0;

        return res.status(OK).json({ message: "Post liked.", liked: true, likeCount });
    } catch (err) {
        console.error("Error liking post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

// Unlike a post
export const unlikePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Check if post exists
        const postRow = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);
        if (!postRow) return res.status(NOT_FOUND).json({ message: "Post not found." });

        const { setKey, countKey } = getRedisLikeKeys(postId);

        // Check if not liked yet
        const alreadyLiked = await redisClient.sIsMember(setKey, userId);
        if (!alreadyLiked) return res.status(CONFLICT).json({ message: "Post not liked yet." });

        // Remove like
        await redisClient.sRem(setKey, userId);
        await redisClient.decr(countKey);

        const likeCountStr = await redisClient.get(countKey);
        const likeCount = likeCountStr ? parseInt(likeCountStr) : 0;

        return res.status(OK).json({ message: "Post unliked.", liked: false, likeCount });
    } catch (err) {
        console.error("Error unliking post:", err);
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
    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Check post exists
        const postRow = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);
        if (!postRow) return res.status(NOT_FOUND).json({ message: "Post not found." });

        const { upvoteSetKey, downvoteSetKey, upvoteCountKey, downvoteCountKey } = getRedisVoteKeys(postId);

        const alreadyUpvoted = await redisClient.sIsMember(upvoteSetKey, userId);

        if (alreadyUpvoted) {
            // Undo upvote
            await redisClient.sRem(upvoteSetKey, userId);
            await redisClient.decr(upvoteCountKey);
        } else {
            // Remove downvote if exists
            const hadDownvote = await redisClient.sIsMember(downvoteSetKey, userId);
            if (hadDownvote) {
                await redisClient.sRem(downvoteSetKey, userId);
                await redisClient.decr(downvoteCountKey);
            }
            // Add upvote
            await redisClient.sAdd(upvoteSetKey, userId);
            await redisClient.incr(upvoteCountKey);
        }

        const upvoteCount = parseInt((await redisClient.get(upvoteCountKey)) || "0");
        const downvoteCount = parseInt((await redisClient.get(downvoteCountKey)) || "0");

        return res.status(OK).json({ upvoteCount, downvoteCount, upvoted: !alreadyUpvoted });
    } catch (err) {
        console.error("Error upvoting post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const downvotePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Check post exists
        const postRow = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) return res.status(NOT_FOUND).json({ message: "Post not found." });

        const { upvoteSetKey, downvoteSetKey, upvoteCountKey, downvoteCountKey } = getRedisVoteKeys(postId);

        const alreadyDownvoted = await redisClient.sIsMember(downvoteSetKey, userId);

        if (alreadyDownvoted) {
            // Undo downvote
            await redisClient.sRem(downvoteSetKey, userId);
            await redisClient.decr(downvoteCountKey);
        } else {
            // Remove upvote if exists
            const hadUpvote = await redisClient.sIsMember(upvoteSetKey, userId);
            if (hadUpvote) {
                await redisClient.sRem(upvoteSetKey, userId);
                await redisClient.decr(upvoteCountKey);
            }
            // Add downvote
            await redisClient.sAdd(downvoteSetKey, userId);
            await redisClient.incr(downvoteCountKey);
        }

        const upvoteCount = parseInt((await redisClient.get(upvoteCountKey)) || "0");
        const downvoteCount = parseInt((await redisClient.get(downvoteCountKey)) || "0");

        return res.status(OK).json({ upvoteCount, downvoteCount, downvoted: !alreadyDownvoted });
    } catch (err) {
        console.error("Error downvoting post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};