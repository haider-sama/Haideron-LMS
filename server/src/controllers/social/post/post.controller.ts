import { Request, Response } from "express";
import slugify from "slugify";
import { CreatePostSchema, PostQuerySchema, UpdatePostSchema } from "../../../utils/validators/socialSchemas/postSchemas";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { db } from "../../../db/db";
import { forumModerators, forumProfiles, forums, posts, users } from "../../../db/schema";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { AudienceEnum } from "../../../shared/enums";
import { OptionalAuthRequest } from "../../../middleware/auth";
import { redisClient } from "../../../lib/redis";
import { getRedisLikeKeys, getRedisVoteKeys } from "./post.user.controller";

// /**
//  * Helper functions
//  */
export async function generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });

    // Get all slugs that start with baseSlug (case-sensitive LIKE)
    const rows = await db
        .select({ slug: posts.slug })
        .from(posts)
        .where(sql`${posts.slug} LIKE ${baseSlug + "%"}`);

    if (rows.length === 0) {
        return baseSlug; // nothing exists → safe to use directly
    }

    const existingSlugs = rows.map((r) => r.slug);

    // If baseSlug itself is free, use it
    if (!existingSlugs.includes(baseSlug)) {
        return baseSlug;
    }

    // Find max "-N" suffix and add 1
    let maxCount = 0;
    for (const s of existingSlugs) {
        const match = s.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxCount) {
                maxCount = num;
            }
        }
    }

    return `${baseSlug}-${maxCount + 1}`;
};

export const createPost = async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const parsed = CreatePostSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { forumId, type, content, linkPreview, mediaUrls } = parsed.data;

        const slug = await generateUniqueSlug(content as string);

        // Check if slug already exists
        const existingPost = await db
            .select()
            .from(posts)
            .where(eq(posts.slug, slug))
            .limit(1)
            .then((rows) => rows[0]);

        if (existingPost) {
            return res
                .status(CONFLICT)
                .json({ message: `Post with slug '${slug}' already exists.` });
        }

        // 4. Insert new post
        const [newPost] = await db
            .insert(posts)
            .values({
                forumId,
                authorId: userId,
                type,
                slug,
                content,
                linkPreview,
                mediaUrls,
                likeCount: 0,
                upvoteCount: 0,
                downvoteCount: 0,
            })
            .returning();

        return res.status(CREATED).json({ message: "Post created successfully." });
    } catch (err) {
        console.error("Error creating post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const filterPosts = async (req: OptionalAuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        // Parse query params
        const parsed = PostQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Invalid query parameters",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { limit: perPageRaw, type, sort = "recent", search, archived, lastPostCreatedAt } = parsed.data;

        // Ensure a safe limit (max 50)
        const perPage = Math.min(perPageRaw || 20, 50);

        const forumId = req.params.forumId;
        const filterAuthorId = req.params.userId;

        // Determine user role and archived access
        let userRole: AudienceEnum = AudienceEnum.Guest;
        let canSeeArchived = false;
        if (userId) {
            const viewer = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
            userRole = viewer && Object.values(AudienceEnum).includes(viewer.role as AudienceEnum) ? viewer.role as AudienceEnum : AudienceEnum.Guest;

            const absoluteAdmins = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin];
            let isModerator = false;
            if (forumId) {
                const modRow = await db.select().from(forumModerators).where(and(eq(forumModerators.forumId, forumId), eq(forumModerators.userId, userId))).limit(1).then(r => r[0]);
                isModerator = !!modRow;
            }
            canSeeArchived = absoluteAdmins.includes(userRole) || isModerator;
        }

        // Build filters
        const filters: any[] = [];
        if (forumId) filters.push(eq(posts.forumId, forumId));
        if (filterAuthorId) filters.push(eq(posts.authorId, filterAuthorId));
        if (type) filters.push(eq(posts.type, type));
        if (search?.trim()) filters.push(sql`${posts.searchVector} @@ plainto_tsquery('english', ${search})`);

        // Archived filter
        if (canSeeArchived) {
            if (archived === "true") filters.push(eq(posts.isArchived, true));
            else if (archived === "false") filters.push(eq(posts.isArchived, false));
        } else {
            filters.push(eq(posts.isArchived, false));
        }

        // Keyset pagination
        if (lastPostCreatedAt) {
            filters.push(lt(posts.createdAt, new Date(lastPostCreatedAt)));
        }

        // Sorting logic
        const sortByMap: Record<string, any[]> = {
            recent: [desc(posts.createdAt)],
            top: [desc(posts.upvoteCount), desc(posts.createdAt)],
            trending: [desc(posts.upvoteCount), desc(posts.likeCount), desc(posts.createdAt)],
        };
        const orderBy = sortByMap[sort] || sortByMap["recent"];

        // Fetch posts + join author + profile
        const postRows = await db
            .select({ post: posts, author: users, profile: forumProfiles })
            .from(posts)
            .leftJoin(users, eq(users.id, posts.authorId))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, posts.authorId))
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(perPage);

        // Format response
        const results = await Promise.all(
            postRows.map(async (row) => {
                if (!row.author || !row.post) return null;

                const postId = row.post.id;

                // Fetch counts from Redis (fallback to DB if missing)
                const likeCountStr = await redisClient.get(getRedisLikeKeys(postId).countKey);
                const upvoteCountStr = await redisClient.get(getRedisVoteKeys(postId).upvoteCountKey);
                const downvoteCountStr = await redisClient.get(getRedisVoteKeys(postId).downvoteCountKey);

                const likeCount = likeCountStr ? parseInt(likeCountStr) : row.post.likeCount;
                const upvoteCount = upvoteCountStr ? parseInt(upvoteCountStr) : row.post.upvoteCount;
                const downvoteCount = downvoteCountStr ? parseInt(downvoteCountStr) : row.post.downvoteCount;

                return {
                    ...row.post,
                    likeCount,
                    upvoteCount,
                    downvoteCount,
                    author: {
                        id: row.author.id,
                        avatarURL: row.author.avatarURL,
                        forumProfile: row.profile?.username,
                    },
                };
            })
        );

        // Filter out nulls if any (inline type guard)
        const filteredResults = results.filter(
            (row): row is NonNullable<typeof row> => row !== null
        );

        return res.status(OK).json({
            posts: filteredResults,
            meta: {
                limit: perPage,
                nextCursor: filteredResults.length > 0 ?
                    filteredResults[filteredResults.length - 1].createdAt
                    : null,
            },
        });
    } catch (err) {
        console.error("Error fetching posts:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const getPostBySlug = async (req: OptionalAuthRequest, res: Response) => {
    const { slug } = req.params;
    const userId = req.userId;

    try {
        // Fetch post + author + forum profile
        const row = await db
            .select({
                post: posts,
                author: users,
                profile: forumProfiles,
            })
            .from(posts)
            .leftJoin(users, eq(users.id, posts.authorId))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, posts.authorId))
            .where(eq(posts.slug, slug))
            .limit(1)
            .then(r => r[0]);

        if (!row || !row.post) {
            return res.status(NOT_FOUND).json({ message: "Post not found" });
        }

        const post = row.post;
        const author = row.author;
        const profile = row.profile;

        // Archived access check
        if (post.isArchived) {
            if (!userId) {
                return res
                    .status(FORBIDDEN)
                    .json({ message: "Login required to access archived post" });
            }

            // Fetch user role
            const user = await db
                .select({ role: users.role })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1)
                .then(r => r[0]);

            const absoluteAdmins = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin];

            // Check if current user is moderator
            let isModerator = false;
            if (post.forumId) {
                const modRow = await db
                    .select()
                    .from(forumModerators)
                    .where(
                        and(
                            eq(forumModerators.forumId, post.forumId),
                            eq(forumModerators.userId, userId)
                        )
                    )
                    .limit(1)
                    .then(r => r[0]);
                isModerator = !!modRow;
            }

            const canSeeArchived =
                (user && absoluteAdmins.includes(user.role as AudienceEnum)) || isModerator;

            if (!canSeeArchived) {
                return res
                    .status(FORBIDDEN)
                    .json({ message: "Access denied to archived post" });
            }
        }

        // Check if current viewer is admin
        let viewerRole: AudienceEnum = AudienceEnum.Guest;

        if (userId) {
            const viewer = await db
                .select({ role: users.role })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1)
                .then(r => r[0]);

            if (viewer?.role && Object.values(AudienceEnum).includes(viewer.role as AudienceEnum)) {
                viewerRole = viewer.role as AudienceEnum;
            } else {
                viewerRole = AudienceEnum.Guest;
            }
        }
        const isAdminViewer = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(viewerRole);

        // Build author object
        const authorData = row.author
            ? {
                id: row.author.id,
                avatarURL: row.author.avatarURL,
                forumProfile: row.profile
                    ? {
                        username: row.profile.username,
                        displayName: row.profile.displayName,
                        bio: row.profile.bio,
                        reputation: row.profile.reputation,
                        badges: row.profile.badges,
                    }
                    : null,
            }
            : {
                id: "unknown",
                avatarURL: null,
                forumProfile: null,
            };

        // Fetch counts from Redis (fallback to DB)
        const likeCountStr = await redisClient.get(`post:${post.id}:likeCount`);
        const upvoteCountStr = await redisClient.get(`post:${post.id}:upvoteCount`);
        const downvoteCountStr = await redisClient.get(`post:${post.id}:downvoteCount`);

        const likeCount = likeCountStr ? parseInt(likeCountStr) : post.likeCount;
        const upvoteCount = upvoteCountStr ? parseInt(upvoteCountStr) : post.upvoteCount;
        const downvoteCount = downvoteCountStr ? parseInt(downvoteCountStr) : post.downvoteCount;

        // Return final response
        return res.status(OK).json({
            post: {
                ...post,
                likeCount,
                upvoteCount,
                downvoteCount,
                author: authorData,
            },
        });
    } catch (err) {
        console.error("Error getting post by slug:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
};

export const getPostById = async (req: OptionalAuthRequest, res: Response) => {
    const { postId } = req.params;
    const userId = req.userId;

    try {
        // Fetch post + author + forum profile
        const row = await db
            .select({
                post: posts,
                author: users,
                profile: forumProfiles,
            })
            .from(posts)
            .leftJoin(users, eq(users.id, posts.authorId))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, posts.authorId))
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!row || !row.post) {
            return res.status(NOT_FOUND).json({ message: "Post not found" });
        }

        const post = row.post;
        const author = row.author;
        const profile = row.profile;

        // Archived access check
        if (post.isArchived) {
            if (!userId) {
                return res.status(FORBIDDEN).json({ message: "Login required to access archived post" });
            }

            // Fetch viewer role
            const viewer = await db
                .select({ role: users.role })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1)
                .then(r => r[0]);

            const absoluteAdmins = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin];

            // Check if user is moderator of the forum
            let isModerator = false;
            if (post.forumId) {
                const modRow = await db
                    .select()
                    .from(forumModerators)
                    .where(and(
                        eq(forumModerators.forumId, post.forumId),
                        eq(forumModerators.userId, userId)
                    ))
                    .limit(1)
                    .then(r => r[0]);
                isModerator = !!modRow;
            }

            const canSeeArchived = (viewer && absoluteAdmins.includes(viewer.role as AudienceEnum)) || isModerator;

            if (!canSeeArchived) {
                return res.status(FORBIDDEN).json({ message: "Access denied to archived post" });
            }
        }

        // Determine if viewer is admin
        let viewerRole: AudienceEnum = AudienceEnum.Guest;
        if (userId && row.author) {
            const viewer = await db
                .select({ role: users.role })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1)
                .then(r => r[0]);

            viewerRole = viewer?.role && Object.values(AudienceEnum).includes(viewer.role as AudienceEnum)
                ? (viewer.role as AudienceEnum)
                : AudienceEnum.Guest;
        }
        const isAdminViewer = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(viewerRole);

        // Fetch counts from Redis (fallback to DB)
        const likeCountStr = await redisClient.get(`post:${post.id}:likeCount`);
        const upvoteCountStr = await redisClient.get(`post:${post.id}:upvoteCount`);
        const downvoteCountStr = await redisClient.get(`post:${post.id}:downvoteCount`);

        const likeCount = likeCountStr ? parseInt(likeCountStr) : post.likeCount;
        const upvoteCount = upvoteCountStr ? parseInt(upvoteCountStr) : post.upvoteCount;
        const downvoteCount = downvoteCountStr ? parseInt(downvoteCountStr) : post.downvoteCount;

        const authorData = row.author
            ? {
                id: row.author.id,
                avatarURL: row.author.avatarURL,
                forumProfile: row.profile
                    ? {
                        username: row.profile.username,
                        displayName: row.profile.displayName,
                        bio: row.profile.bio,
                        reputation: row.profile.reputation,
                        badges: row.profile.badges,
                    }
                    : null,
            }
            : {
                id: "unknown",
                avatarURL: null,
                forumProfile: null,
            };

        return res.status(OK).json({
            post: {
                ...post,
                likeCount,
                upvoteCount,
                downvoteCount,
                author: authorData,
            },
        });
    } catch (err) {
        console.error("Error getting post by ID:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { postId } = req.params;

    try {
        // Fetch post
        const postRow = await db
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) {
            return res.status(NOT_FOUND).json({ message: "Post not found." });
        }

        // Fetch user role
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

        // Check permissions: owner or admin/moderator
        const isOwner = postRow.authorId === userId;
        const isAdmin = [
            AudienceEnum.Admin,
            AudienceEnum.ForumCurator,
            AudienceEnum.CommunityAdmin,
            AudienceEnum.ForumModerator,
        ].includes(userRole);

        if (!isOwner && !isAdmin) {
            return res.status(FORBIDDEN).json({
                message: "Not authorized to update this post.",
            });
        }

        // Validate request body
        const parsed = UpdatePostSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { content, linkPreview, mediaUrls } = parsed.data;

        // Update post
        const [updatedPost] = await db
            .update(posts)
            .set({
                content: content ?? undefined,
                linkPreview: linkPreview ?? undefined,
                mediaUrls: mediaUrls ?? undefined,
                isEdited: true,
                lastEditedAt: new Date(),
            })
            .where(eq(posts.id, postId))
            .returning();

        return res.status(OK).json({
            message: "Post updated successfully.",
        });
    } catch (err) {
        console.error("Error updating post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const archivePost = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { postId } = req.params;

    try {
        // Fetch post
        const postRow = await db
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) {
            return res.status(NOT_FOUND).json({ message: "Post not found." });
        }

        // Fetch user role
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

        // Check permissions: owner or admin/moderator
        const isOwner = postRow.authorId === userId;
        const isAdmin = [
            AudienceEnum.Admin,
            AudienceEnum.ForumCurator,
            AudienceEnum.CommunityAdmin,
            AudienceEnum.ForumModerator,
        ].includes(userRole);

        if (!isOwner && !isAdmin) {
            return res
                .status(FORBIDDEN)
                .json({ message: "Not authorized to archive this post." });
        }

        // Archive the post
        const [archivedPost] = await db
            .update(posts)
            .set({
                isArchived: true,
                archivedAt: new Date(),
            })
            .where(eq(posts.id, postId))
            .returning();

        return res.status(OK).json({ message: "Post archived successfully." });
    } catch (err) {
        console.error("Error archiving post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const restorePost = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { postId } = req.params;

    try {
        // Fetch post
        const postRow = await db
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) {
            return res.status(NOT_FOUND).json({ message: "Post not found." });
        }

        // Fetch user role
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

        // Check permissions: owner or admin/moderator
        const isOwner = postRow.authorId === userId;
        const isAdmin = [
            AudienceEnum.Admin,
            AudienceEnum.ForumCurator,
            AudienceEnum.CommunityAdmin,
            AudienceEnum.ForumModerator,
        ].includes(userRole);

        if (!isOwner && !isAdmin) {
            return res
                .status(FORBIDDEN)
                .json({ message: "Not authorized to restore this post." });
        }

        if (!postRow.isArchived) {
            return res.status(BAD_REQUEST).json({ message: "Post is not archived." });
        }

        // Restore the post
        const [restoredPost] = await db
            .update(posts)
            .set({
                isArchived: false,
                archivedAt: null,
            })
            .where(eq(posts.id, postId))
            .returning();

        return res.status(OK).json({ message: "Post restored successfully." });
    } catch (err) {
        console.error("Error restoring post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const togglePinPost = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { postId } = req.params;
    const { pin } = req.body as { pin: boolean }; // ensure boolean type

    try {
        // Fetch user role
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

        const isModerator = [
            AudienceEnum.Admin,
            AudienceEnum.CommunityAdmin,
            AudienceEnum.ForumModerator,
        ].includes(userRole);

        if (!isModerator) {
            return res.status(FORBIDDEN).json({ message: "Not authorized to pin/unpin posts." });
        }

        // Fetch post
        const postRow = await db
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
            .then(r => r[0]);

        if (!postRow) {
            return res.status(NOT_FOUND).json({ message: "Post not found." });
        }

        // Update pin status
        const [updatedPost] = await db
            .update(posts)
            .set({ isPinned: pin })
            .where(eq(posts.id, postId))
            .returning();

        return res.status(OK).json({
            message: `Post ${pin ? "pinned" : "unpinned"} successfully.`,
        });
    } catch (err) {
        console.error("Error pinning/unpinning post:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};
