import { Request, Response } from "express";
import { ForumStatusEnum } from "../../../shared/social.enums";
import { CreateForumSchema } from "../../../utils/validators/socialSchemas/forumSchemas";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { db } from "../../../db/db";
import { forumMembers, forumProfiles, forums, posts, users } from "../../../db/schema";
import { eq, sql, and, desc, gte } from "drizzle-orm";
import { SettingsService } from "../../../utils/settings/SettingsService";
import { generateSlug } from "./forum.controller";

export const requestForumCreation = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const userId = req.userId;

        // 1. Validate request body
        const parsed = CreateForumSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { title, description, type } = parsed.data;

        // 2. Ensure user exists
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // 3. Generate slug and check uniqueness
        const slug = generateSlug(title);

        const existingForum = await db
            .select()
            .from(forums)
            .where(eq(forums.slug, slug))
            .limit(1)
            .then((rows) => rows[0]);

        if (existingForum) {
            return res
                .status(CONFLICT)
                .json({ message: `Forum with slug '${slug}' already exists.` });
        }

        // 4. Create forum in PENDING state
        const [newForum] = await db
            .insert(forums)
            .values({
                title,
                description,
                type,
                slug,
                status: ForumStatusEnum.PENDING,
                createdBy: userId,
            })
            .returning();

        return res.status(CREATED).json({
            message: "Forum request submitted. Awaiting admin approval.",
        });
    } catch (err) {
        console.error("Error requesting forum:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error." });
    }
};

export const getMembershipStatus = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const userId = req.userId;
        const { forumId } = req.params;

        // Ensure forum exists
        const forum = await db
            .select({ id: forums.id })
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Check if user is a member
        let isMember = false;
        if (userId) {
            const existing = await db
                .select({ forumId: forumMembers.forumId })
                .from(forumMembers)
                .where(and(eq(forumMembers.forumId, forumId), eq(forumMembers.userId, userId)))
                .limit(1)
                .then((rows) => rows[0]);

            isMember = !!existing;
        }

        // Count total members
        const [{ count: memberCount }] = await db
            .select({ count: sql<number>`COUNT(${forumMembers.userId})` })
            .from(forumMembers)
            .where(eq(forumMembers.forumId, forumId));

        return res.status(OK).json({
            isMember,
            memberCount: Number(memberCount) || 0,
        });
    } catch (error) {
        console.error("Error checking forum membership:", error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
};

export const getForumFooterInfo = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // Update current user's lastOnline timestamp (if logged in)
        if (req.userId) {
            await db
                .update(users)
                .set({ lastOnline: now })
                .where(eq(users.id, req.userId));
        }

        // Fetch online users (leftJoin with forumProfiles to include all users)
        const onlineUsers = await db
            .select({
                username: forumProfiles.username,
                avatarUrl: users.avatarURL,
                lastOnline: users.lastOnline,
            })
            .from(users)
            .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .where(gte(users.lastOnline, tenMinutesAgo));

        const totalOnline = onlineUsers.length;
        const registered = onlineUsers.filter(
            (u) => u.username && !u.username.includes("[Bot]")
        ).length;
        const hidden = 0; // later: add hidden/visibility support
        const guests = totalOnline - registered - hidden;

        const registeredUsernames = onlineUsers
            .flatMap((u) => (u.username ? [u.username] : []))
            .slice(0, 15);

        // Forum statistics in parallel
        const [postCount, forumCount, memberCount, newestMember] = await Promise.all([
            db
                .select({ count: sql<number>`COUNT(*)` })
                .from(posts)
                .then((rows) => rows[0]?.count || 0),

            db
                .select({ count: sql<number>`COUNT(*)` })
                .from(forums)
                .then((rows) => rows[0]?.count || 0),

            db
                .select({ count: sql<number>`COUNT(*)` })
                .from(users)
                .then((rows) => rows[0]?.count || 0),

            db
                .select({ username: forumProfiles.username })
                .from(users)
                .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
                .orderBy(desc(users.createdAt))
                .limit(1)
                .then((rows) => rows[0]),
        ]);

        return res.status(OK).json({
            online: {
                total: totalOnline,
                registered,
                hidden,
                guests,
            },
            registeredUsernames,
            statistics: {
                totalPosts: Number(postCount),
                totalTopics: Number(forumCount),
                totalMembers: Number(memberCount),
                newestMember: newestMember?.username || "Unknown",
            },
        });
    } catch (err) {
        console.error("Failed to get forum footer info:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to fetch forum footer information" });
    }
};

export const joinForum = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { forumId } = req.params;

    if (!forumId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid forum ID" });
    }

    try {
        // Check if forum exists
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then(rows => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Check if user is already a member
        const existingMember = await db
            .select()
            .from(forumMembers)
            .where(
                and(
                    eq(forumMembers.forumId, forumId),
                    eq(forumMembers.userId, userId)
                )
            )
            .limit(1)
            .then(rows => rows[0]);

        if (existingMember) {
            return res.status(BAD_REQUEST).json({ message: "Already a member of this forum" });
        }

        // Insert new membership
        await db.insert(forumMembers).values({
            forumId,
            userId,
        });

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(forumMembers)
            .where(eq(forumMembers.forumId, forumId));

        return res.status(OK).json({
            message: "Successfully joined the forum",
            membersCount: Number(count),
            isMember: true,

        });
    } catch (error) {
        console.error("Error joining forum:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Error joining forum" });
    }
};

export const leaveForum = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { forumId } = req.params;

    if (!forumId) {
        return res.status(BAD_REQUEST).json({ message: "Invalid forum ID" });
    }

    try {
        // Check if forum exists
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then(rows => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Delete membership
        const result = await db
            .delete(forumMembers)
            .where(
                and(
                    eq(forumMembers.forumId, forumId),
                    eq(forumMembers.userId, userId)
                )
            )
            .execute();

        if (result.rowCount === 0) {
            return res.status(BAD_REQUEST).json({ message: "You are not a member of this forum" });
        }

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(forumMembers)
            .where(eq(forumMembers.forumId, forumId));

        return res.status(OK).json({
            message: "Successfully left the forum",
            membersCount: Number(count),
            isMember: false,

        });
    } catch (error) {
        console.error("Error leaving forum:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Error leaving forum" });
    }
};