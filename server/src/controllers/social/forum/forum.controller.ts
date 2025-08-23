import { Request, Response } from "express";
import slugify from "slugify";
import { AudienceEnum } from "../../../shared/enums";
import { ForumStatusEnum, ForumTypeEnum } from "../../../shared/social.enums";
import { CreateForumSchema, ForumQuerySchema, UpdateForumSchema, UpdateForumStatusSchema } from "../../../utils/validators/socialSchemas/forumSchemas";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { db } from "../../../db/db";
import { forumModerators, forumProfiles, forums, posts, users } from "../../../db/schema";
import { eq, sql, and, desc, or } from "drizzle-orm";
import { OptionalAuthRequest } from "../../../middleware/auth";
import multer from "multer";
import { extractPublicId } from "../../auth/avatar.controller";
import { v2 as cloudinary } from "cloudinary";
import { uploadImageToCloudinary } from "../../../utils/uploadImage";
import { SettingsService } from "../../../utils/settings/SettingsService";

/**
 * Helper functions
 */
export const generateSlug = (title: string) => {
    return slugify(title, {
        lower: true,
        strict: true,
        trim: true,
    });
};

export const getAllowedForumTypesForAudience = (audience: AudienceEnum): ForumTypeEnum[] => {
    switch (audience) {
        case AudienceEnum.Admin:
        case AudienceEnum.CommunityAdmin:
            return Object.values(ForumTypeEnum); // full access

        case AudienceEnum.ForumModerator:
        case AudienceEnum.ForumCurator:
            return Object.values(ForumTypeEnum).filter(
                type => type !== ForumTypeEnum.ADMIN // no internal admin-only space
            );

        case AudienceEnum.DepartmentHead:
            return [
                ForumTypeEnum.COURSE,
                ForumTypeEnum.PROGRAM,
                ForumTypeEnum.DEPARTMENT,
                ForumTypeEnum.FACULTY,
                ForumTypeEnum.UNIVERSITY,
                ForumTypeEnum.RESEARCH,
                ForumTypeEnum.EVENT,
                ForumTypeEnum.ANNOUNCEMENT,
                ForumTypeEnum.GENERAL,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.PUBLIC,
                ForumTypeEnum.ALUMNI,
            ];

        case AudienceEnum.DepartmentTeacher:
            return [
                ForumTypeEnum.COURSE,
                ForumTypeEnum.PROGRAM,
                ForumTypeEnum.FACULTY,
                ForumTypeEnum.UNIVERSITY,
                ForumTypeEnum.RESEARCH,
                ForumTypeEnum.EVENT,
                ForumTypeEnum.ANNOUNCEMENT,
                ForumTypeEnum.GENERAL,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.PUBLIC,
            ];

        case AudienceEnum.Student:
            return [
                ForumTypeEnum.COURSE,
                ForumTypeEnum.PROGRAM,
                ForumTypeEnum.UNIVERSITY,
                ForumTypeEnum.STUDENT_GROUP,
                ForumTypeEnum.EVENT,
                ForumTypeEnum.ANNOUNCEMENT,
                ForumTypeEnum.GENERAL,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.PUBLIC,
                ForumTypeEnum.ALUMNI,
            ];

        case AudienceEnum.Guest:
        default:
            return [
                ForumTypeEnum.PUBLIC,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.GENERAL,
            ];
    }
};

export const createForum = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const userId = req.userId;

        const parsed = CreateForumSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { title, description, type } = parsed.data;

        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;
        const isPrivileged =
            userRole === AudienceEnum.Admin || userRole === AudienceEnum.CommunityAdmin;

        const allowedTypes = getAllowedForumTypesForAudience(userRole);

        if (!isPrivileged && !allowedTypes.includes(type)) {
            return res.status(FORBIDDEN).json({
                message: `You are not allowed to create a forum of type '${type}'.`,
            });
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

        // 4. Create forum
        const [newForum] = await db
            .insert(forums)
            .values({
                title,
                description,
                type,
                slug,
                status: ForumStatusEnum.APPROVED,
                createdBy: userId,
            })
            .returning();

        return res.status(CREATED).json({
            message: "Forum created successfully.",
        });
    } catch (err) {
        console.error("Error creating forum:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const getForums = async (req: OptionalAuthRequest, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const userId = req.userId;

        const parsed = ForumQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Invalid query parameters",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const {
            page: pageStr,
            limit: limitStr,
            type,
            status: formStatus,
            search,
            showArchived,
            createdBy,
        } = parsed.data;

        const currentPage = parseInt(pageStr, 10) || 1;
        const perPage = parseInt(limitStr, 10) || 10;
        const showArchivedBool = showArchived === "true";

        // Get user role if logged in
        let userRole: AudienceEnum = AudienceEnum.Guest;
        let isAdmin = false;
        if (userId) {
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
            if (user) {
                userRole = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
                    ? (user.role as AudienceEnum)
                    : AudienceEnum.Guest;
                isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);
            }
        }

        const allowedTypes = getAllowedForumTypesForAudience(userRole);
        if (type && !allowedTypes.includes(type)) {
            return res.status(FORBIDDEN).json({ message: "You are not allowed to view this forum type." });
        }

        // Build filters
        const filters: any[] = [];
        if (type) filters.push(eq(forums.type, type));
        else filters.push(or(...allowedTypes.map(t => eq(forums.type, t))));

        filters.push(eq(forums.isArchived, !isAdmin ? false : showArchivedBool));

        if (isAdmin && formStatus) filters.push(eq(forums.status, formStatus));
        else filters.push(eq(forums.status, ForumStatusEnum.APPROVED));

        if (createdBy) filters.push(eq(forums.createdBy, createdBy));

        if (search && search.trim()) {
            filters.push(sql`${forums.searchVector} @@ plainto_tsquery('english', ${search})`);
        }

        // Total count for pagination
        const total = await db
            .select({ count: sql<number>`count(*)` })
            .from(forums)
            .where(and(...filters))
            .then(r => r[0]?.count ?? 0);

        // Fetch forums + creator + profile in a single query
        const forumRows = await db
            .select({
                forum: forums,
                creator: users,
                profile: forumProfiles,
            })
            .from(forums)
            .leftJoin(users, eq(users.id, forums.createdBy))
            .leftJoin(forumProfiles, eq(forumProfiles.userId, forums.createdBy))
            .where(and(...filters))
            .orderBy(desc(forums.createdAt))
            .offset((currentPage - 1) * perPage)
            .limit(perPage);

        const forumIds = forumRows.map(f => f.forum.id);

        // Fetch post counts
        const postCounts: Record<string, number> = {};
        if (forumIds.length > 0) {
            const postRows = await db
                .select({ forumId: posts.forumId, count: sql<number>`count(*)` })
                .from(posts)
                .where(sql`${posts.forumId} IN (${sql.join(forumIds, sql`,`)})`)
                .groupBy(posts.forumId);

            postRows.forEach(p => {
                postCounts[p.forumId] = Number(p.count);
            });
        }

        // Format forums with post counts and user info
        const forumsWithDetails = forumRows.map(f => {
            if (!f.creator) {
                return res.status(NOT_FOUND).json({ message: "Forum creator not found." });
            }

            return {
                ...f.forum,
                postCount: postCounts[f.forum.id] ?? 0,
                creator: {
                    id: f.creator.id,
                    email: f.creator.email,
                    username: f.profile?.username,
                    displayName: f.profile?.displayName,
                    firstName: isAdmin ? f.creator.firstName : undefined,
                    lastName: isAdmin ? f.creator.lastName : undefined,
                    avatarURL: f.creator.avatarURL,
                },
            };
        }).filter(Boolean); // remove any nulls

        return res.status(OK).json({
            forums: forumsWithDetails,
            meta: {
                total,
                page: currentPage,
                limit: perPage,
                pages: Math.ceil(total / perPage),
            },
        });
    } catch (err) {
        console.error("Error fetching forums:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const getForumBySlug = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { slug } = req.params;

        // Fetch forum with creator info
        const forum = await db
            .select({
                id: forums.id,
                slug: forums.slug,
                title: forums.title,
                description: forums.description,
                createdAt: forums.createdAt,

                // Creator info
                createdBy: users.id,
                createdByFirstName: users.firstName,
                createdByLastName: users.lastName,
                createdByAvatarURL: users.avatarURL,
            })
            .from(forums)
            .leftJoin(users, eq(forums.createdBy, users.id))
            .where(eq(forums.slug, slug))
            .limit(1)
            .then((rows) => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Fetch moderators
        const moderators = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                avatarURL: users.avatarURL,
            })
            .from(forumModerators)
            .innerJoin(users, eq(forumModerators.userId, users.id))
            .where(eq(forumModerators.forumId, forum.id));

        return res.status(OK).json({
            ...forum,
            createdBy: {
                id: forum.createdBy,
                firstName: forum.createdByFirstName,
                lastName: forum.createdByLastName,
                avatarURL: forum.createdByAvatarURL,
            },
            moderators,
        });
    } catch (error) {
        console.error("Error fetching forum by slug:", error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
};

export const updateForum = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId } = req.params;
        const userId = req.userId;

        // Validate request body
        const parsed = UpdateForumSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const updates = { ...parsed.data } as Partial<{
            title: string;
            description?: string;
            type?: ForumTypeEnum;
            status?: ForumStatusEnum;
            isArchived?: boolean;
            slug?: string;
        }>;

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then(r => r[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Fetch user role
        const user = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then(r => r[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;
        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);

        // Authorization: Only admin or creator can update
        if (!isAdmin && forum.createdBy !== userId) {
            return res.status(FORBIDDEN).json({
                message: "You are not allowed to edit this forum.",
            });
        }

        // Regenerate slug if title changes
        if (updates.title && updates.title !== forum.title) {
            const newSlug = generateSlug(updates.title);
            const existing = await db
                .select()
                .from(forums)
                .where(eq(forums.slug, newSlug))
                .limit(1)
                .then(r => r[0]);

            if (existing && existing.id !== forum.id) {
                return res.status(CONFLICT).json({
                    message: `Forum with slug '${newSlug}' already exists.`,
                });
            }

            updates.slug = newSlug;
        }

        // Apply updates
        const [updatedForum] = await db
            .update(forums)
            .set(updates)
            .where(eq(forums.id, forumId))
            .returning();

        return res.status(OK).json(updatedForum);

    } catch (err) {
        console.error("Error updating forum:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const archiveForum = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId } = req.params;
        const userId = req.userId;

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then(r => r[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        if (forum.isArchived) {
            return res.status(BAD_REQUEST).json({ message: "Forum already archived." });
        }

        // Fetch user role
        const user = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then(r => r[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;

        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);

        // Authorization: Only admin or creator can archive
        if (!isAdmin && forum.createdBy !== userId) {
            return res.status(FORBIDDEN).json({ message: "You are not allowed to archive this forum." });
        }

        const archivedAt = new Date();

        // Update forum as archived
        const [updatedForum] = await db
            .update(forums)
            .set({ isArchived: true, archivedAt })
            .where(eq(forums.id, forumId))
            .returning();

        return res.status(OK).json({
            message: "Forum archived successfully. It will be permanently deleted in 30 days.",
        });

    } catch (err) {
        console.error("Error archiving forum:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const restoreForum = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId } = req.params;
        const userId = req.userId;

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then(r => r[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        if (!forum.isArchived) {
            return res.status(BAD_REQUEST).json({ message: "Forum is not archived." });
        }

        // Fetch user role
        const user = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then(r => r[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;

        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);

        // Authorization: Only admin or creator can restore
        if (!isAdmin && forum.createdBy !== userId) {
            return res.status(FORBIDDEN).json({ message: "You are not allowed to restore this forum." });
        }

        // Update forum as restored
        const [updatedForum] = await db
            .update(forums)
            .set({ isArchived: false, archivedAt: null })
            .where(eq(forums.id, forumId))
            .returning();

        return res.status(OK).json({
            message: "Forum restored successfully.",
        });

    } catch (err) {
        console.error("Error restoring forum:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

export const updateForumStatus = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId } = req.params;
        const userId = req.userId;

        // 1. Validate request body
        const parsed = UpdateForumStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { status } = parsed.data;

        // 2. Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then(r => r[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found." });
        }

        // 3. Fetch user role
        const user = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then(r => r[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;

        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);

        // 4. Authorization: Only admin or creator can update
        if (!isAdmin && forum.createdBy !== userId) {
            return res.status(FORBIDDEN).json({ message: "You are not allowed to update this forum." });
        }

        // 5. Handle rejected status → delete forum
        if (status === ForumStatusEnum.REJECTED) {
            await db
                .delete(forums)
                .where(eq(forums.id, forumId));

            return res.status(OK).json({ message: "Forum rejected and deleted." });
        }

        // 6. Update forum status
        const [updatedForum] = await db
            .update(forums)
            .set({ status })
            .where(eq(forums.id, forumId))
            .returning();

        return res.status(OK).json({ message: `Forum ${status}.` });
    } catch (err) {
        console.error("Error updating forum status:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error." });
    }
};

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1mb
    },
});

export const uploadSingleIcon = upload.single("icon");

export const uploadForumIcon = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const userId = req.userId;
        const { forumId } = req.params;

        if (!req.file) {
            return res.status(BAD_REQUEST).json({ message: "No file uploaded" });
        }

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Fetch user
        const user = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;

        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);

        // Authorization: Only creator or admin can update
        if (!isAdmin && forum.createdBy !== userId) {
            return res
                .status(FORBIDDEN)
                .json({ message: "Not authorized to update this forum." });
        }

        // Delete old image from Cloudinary (if exists)
        if (forum.iconUrl) {
            const publicId = extractPublicId(forum.iconUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.warn("Failed to delete old icon:", err);
                }
            }
        }

        // Upload new icon
        const iconUrl = await uploadImageToCloudinary(req.file, {
            folder: "forums",
            entityId: forumId,
            transformation: { width: 200, height: 200, crop: "limit" },
        });

        // Save forum icon
        const [updatedForum] = await db
            .update(forums)
            .set({ iconUrl })
            .where(eq(forums.id, forumId))
            .returning();

        return res
            .status(OK)
            .json({ message: "Icon uploaded successfully", iconUrl, forum: updatedForum });
    } catch (err) {
        console.error("Error uploading forum icon:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Error uploading forum icon" });
    }
};

export const deleteForumIcon = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId } = req.params;
        const userId = req.userId;

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Fetch user
        const user = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const userRole: AudienceEnum = Object.values(AudienceEnum).includes(user.role as AudienceEnum)
            ? (user.role as AudienceEnum)
            : AudienceEnum.Guest;

        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(userRole);

        // Authorization: Only creator or admin can delete
        if (!isAdmin && forum.createdBy !== userId) {
            return res
                .status(FORBIDDEN)
                .json({ message: "Not authorized to delete this forum icon." });
        }

        // Delete icon from Cloudinary (if exists)
        if (forum.iconUrl) {
            const publicId = extractPublicId(forum.iconUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudErr) {
                    console.warn("Cloudinary delete failed:", cloudErr);
                }
            }

            // Update forum record (remove iconUrl)
            await db
                .update(forums)
                .set({ iconUrl: null })
                .where(eq(forums.id, forumId))
                .returning();
        }

        return res.status(OK).json({ message: "Forum icon deleted successfully" });
    } catch (err) {
        console.error("Error deleting forum icon:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Error deleting forum icon" });
    }
};

export const assignModerator = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId } = req.params;
        const { userId } = req.body; // moderator to assign
        const requesterId = req.userId;

        // Fetch requester role
        const requester = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, requesterId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!requester) {
            return res.status(NOT_FOUND).json({ message: "Requester not found" });
        }

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Authorization check
        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(
            requester.role as AudienceEnum
        );
        const isForumOwner = forum.createdBy === requesterId;

        if (!isAdmin && !isForumOwner) {
            return res.status(FORBIDDEN).json({
                message:
                    "You are not authorized to assign moderators to this forum.",
            });
        }

        // Prevent self-assign
        if (requesterId === userId) {
            return res
                .status(FORBIDDEN)
                .json({ message: "You cannot assign yourself as a moderator." });
        }

        // Validate target user
        const targetUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!targetUser) {
            return res.status(NOT_FOUND).json({ message: "User to assign not found" });
        }

        const isTargetAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(
            targetUser.role as AudienceEnum
        );

        if (isTargetAdmin) {
            return res
                .status(BAD_REQUEST)
                .json({ message: "Admins cannot be assigned as moderators." });
        }

        // Check if already a moderator
        const existingModerator = await db
            .select()
            .from(forumModerators)
            .where(
                and(eq(forumModerators.forumId, forumId), eq(forumModerators.userId, userId))
            )
            .limit(1)
            .then((rows) => rows[0]);

        if (existingModerator) {
            return res
                .status(CONFLICT)
                .json({ message: "User is already a moderator" });
        }

        // Assign moderator
        await db.insert(forumModerators).values({
            forumId,
            userId,
        });

        return res.status(OK).json({
            message: "Moderator assigned successfully",
            moderatorId: userId,
            forumId,
        });
    } catch (err) {
        console.error("Assign moderator error:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
};

export const removeModerator = async (req: Request, res: Response) => {
    if (!(await SettingsService.isForumsEnabled())) {
        return res.status(FORBIDDEN).json({ message: "Forums are disabled by admin" });
    }

    try {
        const { forumId, userId } = req.params;
        const requesterId = req.userId;

        // Prevent self-removal
        if (requesterId === userId) {
            return res
                .status(FORBIDDEN)
                .json({ message: "You cannot remove yourself as a moderator." });
        }

        // Fetch requester role
        const requester = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, requesterId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!requester) {
            return res.status(NOT_FOUND).json({ message: "Requester not found" });
        }

        // Fetch forum
        const forum = await db
            .select()
            .from(forums)
            .where(eq(forums.id, forumId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!forum) {
            return res.status(NOT_FOUND).json({ message: "Forum not found" });
        }

        // Authorization check
        const isAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(
            requester.role as AudienceEnum
        );
        const isForumOwner = forum.createdBy === requesterId;

        if (!isAdmin && !isForumOwner) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to remove moderators from this forum.",
            });
        }

        // Validate target user
        const targetUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!targetUser) {
            return res.status(NOT_FOUND).json({ message: "User to remove not found" });
        }

        const isTargetAdmin = [AudienceEnum.Admin, AudienceEnum.CommunityAdmin].includes(
            targetUser.role as AudienceEnum
        );

        if (isTargetAdmin) {
            return res
                .status(BAD_REQUEST)
                .json({ message: "Admins cannot be removed from moderator lists." });
        }

        // Check if user is actually a moderator
        const existingModerator = await db
            .select()
            .from(forumModerators)
            .where(
                and(
                    eq(forumModerators.forumId, forumId),
                    eq(forumModerators.userId, userId)
                )
            )
            .limit(1)
            .then((rows) => rows[0]);

        if (!existingModerator) {
            return res
                .status(NOT_FOUND)
                .json({ message: "User was not a moderator of this forum." });
        }

        // Remove moderator
        await db
            .delete(forumModerators)
            .where(
                and(
                    eq(forumModerators.forumId, forumId),
                    eq(forumModerators.userId, userId)
                )
            );

        return res.status(OK).json({
            message: "Moderator removed successfully",
            moderatorId: userId,
            forumId,
        });
    } catch (err) {
        console.error("Remove moderator error:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
};