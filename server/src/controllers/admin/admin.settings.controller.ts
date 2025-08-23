import { Request, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from "../../constants/http";
import { SettingsService } from "../../utils/settings/SettingsService";
import { assertAdmin } from "./admin.controller";
import { adminSettings } from "../../db/models/logs/admin.settings.model";
import { db } from "../../db/db";
import { eq } from "drizzle-orm";

export async function fetchAdminSettings(req: Request, res: Response) {
    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin; // early return if not admin

    try {
        const settings = await SettingsService.getSettings();

        res.status(OK).json({
            data: settings,
        });
    } catch (err: any) {
        console.error("Error fetching admin settings:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Cannot fetch settings. Please try again later.",
        });
    }
}

export async function updateAdminSettings(req: Request, res: Response) {
    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin; // block non-admins

    try {
        const payload = req.body;

        // Whitelist fields that can be updated by admins
        type AdminUpdatableFields =
            | "allowForums"
            | "allowPosts"
            | "allowComments"
            | "allowLikes"
            | "allowMessages"
            | "allowUserRegistration"
            | "maintenanceMode"
            | "enableEmailNotifications"
            | "enablePushNotifications"
            | "maxUploadSizeMB"
            | "maxPostsPerDay";

        const allowedFields: AdminUpdatableFields[] = [
            "allowForums",
            "allowPosts",
            "allowComments",
            "allowLikes",
            "allowMessages",
            "allowUserRegistration",
            "maintenanceMode",
            "enableEmailNotifications",
            "enablePushNotifications",
            "maxUploadSizeMB",
            "maxPostsPerDay",
        ];

        const updateData: Partial<Record<AdminUpdatableFields, any>> = {};

        for (const key of allowedFields) {
            if (key in payload) {
                updateData[key] = payload[key];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res
                .status(BAD_REQUEST)
                .json({ message: "No valid fields provided for update" });
        }

        // Get existing settings row (singleton)
        const existing = await db.select().from(adminSettings).limit(1);
        if (!existing[0]) {
            return res.status(BAD_REQUEST).json({ message: "Settings row not found" });
        }

        // Merge audit field separately
        const finalUpdate = {
            ...updateData,
            updatedBy: (req as any).user?.id ?? null,
            updatedAt: new Date(),
        };

        await db
            .update(adminSettings)
            .set(finalUpdate)
            .where(eq(adminSettings.id, existing[0].id));

        // Invalidate cache
        await SettingsService.invalidateCache();

        // Return fresh settings
        const updated = await SettingsService.getSettings(true);

        res.status(OK).json({
            message: "Settings updated successfully",
            data: updated,
        });
    } catch (err: any) {
        console.error("Error updating admin settings:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Cannot update settings. Please try again later.",
        });
    }
}