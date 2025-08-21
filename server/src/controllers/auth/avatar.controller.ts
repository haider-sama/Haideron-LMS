import { Request, Response } from "express";
import { uploadImageToCloudinary } from "../../utils/uploadImage";
import multer from "multer";
import dotenv from "dotenv";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../../constants/http";
import { avatarSchema } from "../../utils/validators/lms-schemas/authSchemas";
import { v2 as cloudinary } from "cloudinary";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { AudienceEnum } from "../../shared/enums";

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2mb
    },
});

export const uploadSingleAvatar = upload.single("avatar");

export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const { userId: requesterId } = req;
        const targetUserId = req.params.targetUserId || req.userId; // allow self or param

        // Validate targetUserId
        const parsed = avatarSchema.safeParse({ userId: targetUserId });
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({ message: "Invalid target user ID" });
        }

        if (!req.file) {
            return res.status(BAD_REQUEST).json({ message: "No file uploaded" });
        }

        // Fetch requester + target user
        const requester = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, requesterId),
            columns: { id: true, role: true, department: true }
        });

        const targetUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, targetUserId),
            columns: { id: true, role: true, department: true }
        });

        if (!requester || !targetUser) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // --- Permission checks ---
        const isSelf = requester.id === targetUser.id;
        const isAdmin = requester.role === AudienceEnum.Admin;
        const isDeptHead = requester.role === AudienceEnum.DepartmentHead &&
            targetUser.department === requester.department;

        if (!(isSelf || isAdmin || isDeptHead)) {
            return res.status(FORBIDDEN).json({ message: "Not allowed to upload this avatar" });
        }

        // --- Upload to Cloudinary ---
        const avatarURL = await uploadImageToCloudinary(req.file, {
            folder: "avatars",
            entityId: String(targetUserId),
            transformation: { width: 500, height: 500, crop: "limit" }
        });

        // --- Update DB ---
        const updatedUsers = await db
            .update(users)
            .set({ avatarURL })
            .where(eq(users.id, targetUserId))
            .returning();

        if (updatedUsers.length === 0) {
            return res.status(BAD_REQUEST).json({ message: "User not found" });
        }

        return res.json(updatedUsers[0]);
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Error uploading image" });
    }
};

export const extractPublicId = (url: string): string | null => {
    try {
        const parts = url.split('/');
        const fileWithExt = parts.slice(-1)[0];
        const publicId = parts.slice(-2).join('/').replace(/\.[^/.]+$/, ''); // remove extension
        return publicId;
    } catch {
        return null;
    }
};

export const deleteAvatar = async (req: Request, res: Response) => {
    try {
        const { userId: requesterId } = req;
        const targetUserId = req.params.targetUserId || req.userId; // allow self or param

        // Validate targetUserId
        const parsed = avatarSchema.safeParse({ userId: targetUserId });
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({ message: "Invalid target user ID" });
        }

        // Fetch requester + target user
        const requester = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, requesterId),
            columns: { id: true, role: true, department: true }
        });

        const targetUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, targetUserId),
            columns: { id: true, role: true, department: true, avatarURL: true }
        });

        if (!requester || !targetUser) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // --- Permission checks ---
        const isSelf = requester.id === targetUser.id;
        const isAdmin = requester.role === AudienceEnum.Admin;
        const isDeptHead = requester.role === AudienceEnum.DepartmentHead &&
            targetUser.department === requester.department;

        if (!(isSelf || isAdmin || isDeptHead)) {
            return res.status(FORBIDDEN).json({ message: "Not allowed to delete this avatar" });
        }

        // --- Delete from Cloudinary ---
        if (targetUser.avatarURL) {
            const publicId = extractPublicId(targetUser.avatarURL);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudErr) {
                    console.warn("Cloudinary delete failed:", cloudErr); // log and continue
                }
            }
        }

        // --- Update DB ---
        await db
            .update(users)
            .set({ avatarURL: null })
            .where(eq(users.id, targetUserId));

        return res.json({ message: "Avatar deleted successfully" });
    } catch (error) {
        console.error("Failed to delete avatar:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to delete avatar" });
    }
};