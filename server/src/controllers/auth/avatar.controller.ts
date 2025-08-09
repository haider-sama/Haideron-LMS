import { Request, Response } from "express";
import { uploadImageToCloudinary } from "../../utils/uploadImage";
import multer from "multer";
import dotenv from "dotenv";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../../constants/http";
import { avatarSchema } from "../../utils/validators/lms-schemas/authSchemas";
import { v2 as cloudinary } from "cloudinary";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

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
        const parsed = avatarSchema.safeParse({ userId: req.userId });
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({ message: 'Invalid user ID' });
        }

        if (!req.file) {
            return res.status(BAD_REQUEST).json({ message: 'No file uploaded' });
        }

        const avatarURL = await uploadImageToCloudinary(req.file, {
            folder: 'avatars',
            entityId: String(req.userId),
            transformation: { width: 500, height: 500, crop: 'limit' }
        });

        // Update user avatarURL in DB
        const updatedUsers = await db
            .update(users)
            .set({ avatarURL })
            .where(eq(users.id, req.userId))
            .returning();

        if (updatedUsers.length === 0) {
            return res.status(BAD_REQUEST).json({ message: "User not found" });
        }

        // Return updated user record
        res.json(updatedUsers[0]);
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(INTERNAL_SERVER_ERROR).json({ message: 'Error uploading image' });
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
        const parsed = avatarSchema.safeParse({ userId: req.userId });
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({ message: "Invalid user ID" });
        }

        // Find user by ID
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, req.userId))
            .limit(1);

        const user = userResult[0];

        if (!user) {
            return res.status(BAD_REQUEST).json({ message: "User not found" });
        }

        if (user.avatarURL) {
            const publicId = extractPublicId(user.avatarURL);

            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudErr) {
                    console.warn("Cloudinary delete failed:", cloudErr); // log and continue
                }
            }
        }

        // Update user record to clear avatarURL
        await db
            .update(users)
            .set({ avatarURL: null })
            .where(eq(users.id, req.userId));

        res.json({ message: "Avatar deleted successfully" });
    } catch (error) {
        console.error("Failed to delete avatar:", error);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to delete avatar" });
    }
};
