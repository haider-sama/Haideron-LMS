import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { db } from "../../../db/db";
import { commentLikes, comments, forumProfiles, posts, users } from "../../../db/schema";
import { and, asc, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { AudienceEnum } from "../../../shared/enums";
import { OptionalAuthRequest } from "../../../middleware/auth";
import { redisClient } from "../../../lib/redis";
import { CreateCommentSchema, GetCommentsQuerySchema, UpdateCommentSchema } from "../../../utils/validators/socialSchemas/commentSchemas";

export const createComment = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { postId, parentId, content } = parsed.data;

    try {
        // Ensure post exists
        const post = await db
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!post) {
            return res.status(NOT_FOUND).json({ message: "Post not found." });
        }

        // If replying, ensure parent exists and is valid
        if (parentId) {
            const parent = await db
                .select()
                .from(comments)
                .where(eq(comments.id, parentId))
                .limit(1)
                .then((rows) => rows[0]);

            if (!parent) {
                return res.status(NOT_FOUND).json({ message: "Parent comment not found." });
            }

            if (parent.postId !== postId) {
                return res.status(BAD_REQUEST).json({ message: "Parent comment does not belong to the same post." });
            }

            // Increment childrenCount of parent
            await db
                .update(comments)
                .set({ childrenCount: parent.childrenCount + 1 })
                .where(eq(comments.id, parentId));
        }

        // Insert new comment
        const [createdComment] = await db
            .insert(comments)
            .values({
                postId,
                parentId: parentId ?? null,
                authorId: userId,
                content,
                likeCount: 0,
                childrenCount: 0,
                isBest: false,
                isDeleted: false,
            })
            .returning();

        return res.status(CREATED).json({
            message: "Comment created successfully.",
        });
    } catch (err) {
        console.error("[COMMENT_CREATE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const getCommentsForPost = async (req: OptionalAuthRequest, res: Response) => {
    const { postId } = req.params;
    const userId = req.userId;

    const parsed = GetCommentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid query parameters",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { parentId, sort = "newest", limit, offsetKey } = parsed.data;
    const perPage = limit ?? 10;

    try {
        // Check post exists
        const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1).then(r => r[0]);
        if (!post) return res.status(NOT_FOUND).json({ message: "Post not found" });

        // Build base filters
        const filters: any[] = [eq(comments.postId, postId), eq(comments.isDeleted, false)];
        if (parentId) filters.push(eq(comments.parentId, parentId));
        else filters.push(isNull(comments.parentId));

        // Sorting
        let orderBy;
        let cursorFilter: any[] = [];
        switch (sort) {
            case "oldest":
                orderBy = [asc(comments.createdAt)];
                if (offsetKey) cursorFilter.push(lt(comments.createdAt, new Date(offsetKey)));
                break;
            case "top":
                orderBy = [desc(comments.likeCount), desc(comments.createdAt)];
                if (offsetKey) cursorFilter.push(lt(comments.createdAt, new Date(offsetKey)));
                break;
            case "best":
                orderBy = [desc(comments.isBest), desc(comments.likeCount), desc(comments.createdAt)];
                if (offsetKey) cursorFilter.push(lt(comments.createdAt, new Date(offsetKey)));
                break;
            case "newest":
            default:
                orderBy = [desc(comments.createdAt)];
                if (offsetKey) cursorFilter.push(lt(comments.createdAt, new Date(offsetKey)));
        }

        const allFilters = cursorFilter.length > 0 ? [...filters, ...cursorFilter] : filters;

        // Fetch comments + author
        const commentRows = await db
            .select({
                comment: comments,
                author: users,
                profile: forumProfiles,
            })
            .from(comments)
            .leftJoin(users, eq(users.id, comments.authorId))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .where(and(...allFilters))
            .orderBy(...orderBy)
            .limit(perPage);

        // Map childrenCount, likeCount, likedByMe
        const results = await Promise.all(
            commentRows.map(async ({ comment, author, profile }) => {
                if (!comment || !author) return null;

                const childrenCountRow = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(comments)
                    .where(and(eq(comments.parentId, comment.id), eq(comments.isDeleted, false)))
                    .then(r => r[0]?.count ?? 0);

                const redisKey = `comment:${comment.id}:likeCount`;
                const likeCountStr = await redisClient.get(redisKey);
                const likeCount = likeCountStr ? parseInt(likeCountStr) : comment.likeCount;

                let likedByMe = false;
                if (userId) {
                    const redisSetKey = `comment:${comment.id}:likes`;
                    const redisResult = await redisClient.sIsMember(redisSetKey, userId);
                    likedByMe = !!redisResult;

                    if (!likedByMe) {
                        const dbLike = await db
                            .select()
                            .from(commentLikes)
                            .where(and(eq(commentLikes.commentId, comment.id), eq(commentLikes.userId, userId)))
                            .limit(1)
                            .then(r => r[0]);

                        likedByMe = !!dbLike;
                    }
                }

                return {
                    ...comment,
                    likeCount,
                    childrenCount: childrenCountRow,
                    likedByMe,
                    author: {
                        id: author.id,
                        avatarURL: author.avatarURL,
                        role: author.role,
                        displayName: profile?.displayName,
                        username: profile?.username,
                    },
                };
            })
        );

        // Return nextOffsetKey for pagination
        const lastComment = results[results.length - 1];
        const nextOffsetKey = lastComment ? lastComment.createdAt.toISOString() : null;

        return res.status(OK).json({
            comments: results.filter(Boolean),
            meta: {
                limit: perPage,
                nextOffsetKey,
            },
        });
    } catch (err) {
        console.error("Error fetching comments:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const getCommentById = async (req: OptionalAuthRequest, res: Response) => {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!commentId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });
    }

    try {
        // Fetch comment with author and forum profile
        const row = await db
            .select({
                commentId: comments.id,
                content: comments.content,
                postId: comments.postId,
                parentId: comments.parentId,
                isBest: comments.isBest,
                createdAt: comments.createdAt,
                likeCountDB: comments.likeCount,
                authorId: users.id,
                authorAvatar: users.avatarURL,
                authorRole: users.role,
                authorFirstName: users.firstName,
                authorLastName: users.lastName,
                profileDisplayName: forumProfiles.displayName,
                profileUsername: forumProfiles.username,
            })
            .from(comments)
            .leftJoin(users, eq(users.id, comments.authorId))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .where(and(eq(comments.id, commentId), eq(comments.isDeleted, false)))
            .limit(1)
            .then(r => r[0]);

        if (!row) {
            return res.status(NOT_FOUND).json({ message: "Comment not found" });
        }

        // Children count
        const childrenCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(comments)
            .where(and(eq(comments.parentId, commentId), eq(comments.isDeleted, false)))
            .then(r => r[0]?.count ?? 0);

        // Like count from Redis (fallback to DB)
        const redisKey = `comment:${commentId}:likeCount`;
        const likeCountStr = await redisClient.get(redisKey);
        const likeCount = likeCountStr ? parseInt(likeCountStr) : row.likeCountDB;

        // likedByMe
        let likedByMe = false;
        if (userId) {
            const redisSetKey = `comment:${commentId}:likes`;
            const redisResult = await redisClient.sIsMember(redisSetKey, userId);
            likedByMe = !!redisResult;

            if (!likedByMe) {
                const dbLike = await db
                    .select()
                    .from(commentLikes)
                    .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)))
                    .limit(1)
                    .then(r => r[0]);
                likedByMe = !!dbLike;
            }
        }

        // Return response
        return res.status(OK).json({
            comment: {
                id: row.commentId,
                postId: row.postId,
                parentId: row.parentId,
                content: row.content,
                createdAt: row.createdAt,
                isBest: row.isBest,
                likeCount,
                childrenCount,
                likedByMe,
                author: {
                    id: row.authorId,
                    avatarURL: row.authorAvatar,
                    role: row.authorRole,
                    displayName: row.profileDisplayName || `${row.authorFirstName ?? ""} ${row.authorLastName ?? ""}`.trim(),
                    username: row.profileUsername ?? row.authorId,
                },
            },
        });
    } catch (err) {
        console.error("Error fetching comment:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const getRepliesForComment = async (req: OptionalAuthRequest, res: Response) => {
    const { postId, parentId } = req.params;
    const userId = req.userId;

    // Validate query
    const parsed = GetCommentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid query parameters",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { sort = "newest", limit, offsetKey } = parsed.data;
    const perPage = limit ?? 10;

    try {
        // Ensure post exists
        const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1).then(r => r[0]);
        if (!post) return res.status(NOT_FOUND).json({ message: "Post not found" });

        // Ensure parent comment exists
        const parentComment = await db
            .select()
            .from(comments)
            .where(eq(comments.id, parentId))
            .limit(1)
            .then(r => r[0]);
        if (!parentComment) return res.status(NOT_FOUND).json({ message: "Parent comment not found" });

        // Build base filters
        const filters: any[] = [
            eq(comments.postId, postId),
            eq(comments.parentId, parentId),
            eq(comments.isDeleted, false),
        ];

        // 5. Cursor (offsetKey) filtering
        if (offsetKey) {
            filters.push(lt(comments.createdAt, new Date(offsetKey)));
        }

        // Determine sorting
        let orderBy;
        switch (sort) {
            case "oldest":
                orderBy = [asc(comments.createdAt)];
                break;
            case "top":
                orderBy = [desc(comments.likeCount), desc(comments.createdAt)];
                break;
            case "best":
                orderBy = [desc(comments.isBest), desc(comments.likeCount), desc(comments.createdAt)];
                break;
            case "newest":
            default:
                orderBy = [desc(comments.createdAt)];
        }

        // Fetch replies + author + profile
        const replyRows = await db
            .select({
                comment: comments,
                author: users,
                profile: forumProfiles,
            })
            .from(comments)
            .leftJoin(users, eq(users.id, comments.authorId))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(perPage);

        // Map childrenCount, likeCount, likedByMe
        const results = await Promise.all(
            replyRows.map(async ({ comment, author, profile }) => {
                if (!comment || !author) return null;

                // Children count
                const childrenCount = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(comments)
                    .where(and(eq(comments.parentId, comment.id), eq(comments.isDeleted, false)))
                    .then(r => r[0]?.count ?? 0);

                // Like count from Redis, fallback to DB
                const redisKey = `comment:${comment.id}:likeCount`;
                const likeCountStr = await redisClient.get(redisKey);
                const likeCount = likeCountStr ? parseInt(likeCountStr) : comment.likeCount;

                // likedByMe
                let likedByMe = false;
                if (userId) {
                    const redisSetKey = `comment:${comment.id}:likes`;
                    const redisResult = await redisClient.sIsMember(redisSetKey, userId);
                    likedByMe = !!redisResult;

                    if (!likedByMe) {
                        const dbLike = await db
                            .select()
                            .from(commentLikes)
                            .where(and(eq(commentLikes.commentId, comment.id), eq(commentLikes.userId, userId)))
                            .limit(1)
                            .then(r => r[0]);

                        likedByMe = !!dbLike;
                    }
                }

                return {
                    ...comment,
                    likeCount,
                    childrenCount,
                    likedByMe,
                    author: {
                        id: author.id,
                        avatarURL: author.avatarURL,
                        role: author.role,
                        displayName: profile?.displayName,
                        username: profile?.username,
                    },
                };
            })
        );

        // Offset key for next page
        const lastComment = results[results.length - 1];
        const nextOffsetKey = lastComment ? lastComment.createdAt.toISOString() : null;

        return res.status(OK).json({
            comments: results.filter(Boolean),
            meta: {
                limit: perPage,
                nextOffsetKey,
            },
        });
    } catch (err) {
        console.error("Error fetching replies:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!commentId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });
    }

    // Validate input
    const parsed = UpdateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        // Fetch the comment
        const commentRow = await db
            .select()
            .from(comments)
            .where(eq(comments.id, commentId))
            .limit(1)
            .then(r => r[0]);

        if (!commentRow || commentRow.isDeleted) {
            return res.status(NOT_FOUND).json({ message: "Comment not found" });
        }

        if (commentRow.authorId !== userId) {
            return res.status(FORBIDDEN).json({ message: "You are not allowed to edit this comment" });
        }

        // Update content
        await db
            .update(comments)
            .set({ content: parsed.data.content, updatedAt: new Date() })
            .where(eq(comments.id, commentId));

        // Optional: fetch updated comment to return
        const updatedComment = await db
            .select()
            .from(comments)
            .where(eq(comments.id, commentId))
            .limit(1)
            .then(r => r[0]);

        return res.status(OK).json({
            message: "Comment updated successfully",
        });
    } catch (err) {
        console.error("[COMMENT_UPDATE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!commentId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });
    }

    try {
        const commentRow = await db
            .select()
            .from(comments)
            .where(eq(comments.id, commentId))
            .limit(1)
            .then(r => r[0]);

        if (!commentRow || commentRow.isDeleted) {
            return res.status(NOT_FOUND).json({ message: "Comment not found" });
        }

        const userRow = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then(r => r[0]);

        if (!userRow) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(userRow.role as AudienceEnum)
            ? (userRow.role as AudienceEnum)
            : AudienceEnum.Guest;

        // Permissions
        const isOwner = commentRow.authorId === userId;
        const isAdmin = [
            AudienceEnum.Admin,
            AudienceEnum.ForumCurator,
            AudienceEnum.CommunityAdmin,
            AudienceEnum.ForumModerator,
        ].includes(userRole);

        if (!isOwner && !isAdmin) {
            return res.status(FORBIDDEN).json({ message: "You are not allowed to delete this comment" });
        }

        // Soft delete
        await db
            .update(comments)
            .set({ isDeleted: true, content: "[deleted]", updatedAt: new Date() })
            .where(eq(comments.id, commentId));

        // Decrement parent childrenCount if exists
        if (commentRow.parentId) {
            await db
                .update(comments)
                .set({ childrenCount: sql`children_count - 1` })
                .where(eq(comments.id, commentRow.parentId));
        }

        // Update Redis cache
        const likeCountKey = `comment:${commentId}:likeCount`;
        const likesSetKey = `comment:${commentId}:likes`;

        await Promise.all([
            redisClient.del(likeCountKey),
            redisClient.del(likesSetKey),
        ]);

        return res.status(OK).json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error("[COMMENT_DELETE_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const toggleBestComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!commentId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid comment ID" });
    }

    try {
        // Fetch comment
        const commentRow = await db
            .select()
            .from(comments)
            .where(and(eq(comments.id, commentId), eq(comments.isDeleted, false)))
            .limit(1)
            .then(r => r[0]);

        if (!commentRow) {
            return res.status(NOT_FOUND).json({ message: "Comment not found." });
        }

        // Fetch associated post
        const postRow = await db
            .select()
            .from(posts)
            .where(eq(posts.id, commentRow.postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) {
            return res.status(NOT_FOUND).json({ message: "Associated post not found." });
        }

        const userRow = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then(r => r[0]);

        if (!userRow) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(userRow.role as AudienceEnum)
            ? (userRow.role as AudienceEnum)
            : AudienceEnum.Guest;

        const isAdminOrModerator = [
            AudienceEnum.Admin,
            AudienceEnum.ForumCurator,
            AudienceEnum.CommunityAdmin,
            AudienceEnum.ForumModerator,
        ].includes(userRole);

        if (!isAdminOrModerator) {
            return res.status(FORBIDDEN).json({ message: "Permission denied" });
        }

        // Toggle isBest
        const newIsBest = !commentRow.isBest;
        await db
            .update(comments)
            .set({ isBest: newIsBest, updatedAt: new Date() })
            .where(eq(comments.id, commentId));

        return res.status(OK).json({
            message: newIsBest ? "Comment marked as best" : "Comment unmarked as best",
        });
    } catch (err) {
        console.error("[COMMENT_TOGGLE_BEST_ERROR]", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};