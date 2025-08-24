import { db } from "../../db/db";
import { adminSettings } from "../../db/models/logs/admin.settings.model";
import { redisClient } from "../../lib/redis";

// Infer type from schema
type AdminSettings = typeof adminSettings.$inferSelect;

export class SettingsService {
    private static cachedSettings: AdminSettings | null = null;
    private static lastFetch = 0;
    private static ttl = 60 * 1000; // 60s in-memory
    private static readonly REDIS_KEY = "admin:settings";

    static async getSettings(forceRefresh = false): Promise<AdminSettings> {
        const now = Date.now();

        // 1. In-memory cache
        if (!forceRefresh && this.cachedSettings && now - this.lastFetch < this.ttl) {
            return this.cachedSettings;
        }

        // 2. Redis cache
        if (!forceRefresh) {
            try {
                const cached = await redisClient.get(this.REDIS_KEY);
                if (cached) {
                    this.cachedSettings = JSON.parse(cached) as AdminSettings;
                    this.lastFetch = now;
                    return this.cachedSettings;
                }
            } catch (err: any) {
                console.warn("Redis unavailable, skipping cache:", err.message);
            }
        }

        // 3. DB fallback
        let rows = await db.select().from(adminSettings).limit(1);

        if (!rows[0]) {
            console.warn("Admin settings not found, creating default settings...");

            // Use partial type: database will fill default id/createdAt/updatedAt
            const defaultSettings = {
                allowForums: true,
                allowPosts: true,
                allowComments: true,
                allowLikes: true,
                allowMessages: true,
                allowUserRegistration: true,
                maintenanceMode: false,
                enableEmailNotifications: true,
                enablePushNotifications: true,
                maxUploadSizeMB: 50,
                maxPostsPerDay: 10,
                createdBy: null,
                updatedBy: null,
            };

            // Insert and return the row
            const inserted = await db
                .insert(adminSettings)
                .values(defaultSettings)
                .returning({
                    id: adminSettings.id,
                    allowForums: adminSettings.allowForums,
                    allowPosts: adminSettings.allowPosts,
                    allowComments: adminSettings.allowComments,
                    allowLikes: adminSettings.allowLikes,
                    allowMessages: adminSettings.allowMessages,
                    allowUserRegistration: adminSettings.allowUserRegistration,
                    maintenanceMode: adminSettings.maintenanceMode,
                    enableEmailNotifications: adminSettings.enableEmailNotifications,
                    enablePushNotifications: adminSettings.enablePushNotifications,
                    maxUploadSizeMB: adminSettings.maxUploadSizeMB,
                    maxPostsPerDay: adminSettings.maxPostsPerDay,
                    createdBy: adminSettings.createdBy,
                    updatedBy: adminSettings.updatedBy,
                    createdAt: adminSettings.createdAt,
                    updatedAt: adminSettings.updatedAt,
                });

            rows = inserted;

        }

        this.cachedSettings = rows[0];
        this.lastFetch = now;

        // Save to Redis (5 min TTL + jitter)
        try {
            const ttlSeconds = 300 + Math.floor(Math.random() * 30); // 5min ±30s
            await redisClient.set(this.REDIS_KEY, JSON.stringify(this.cachedSettings), {
                EX: ttlSeconds,
            });
        } catch (err: any) {
            console.warn("Failed to write to Redis:", err.message);
        }

        return this.cachedSettings;
    }

    // Invalidate cache (after UPDATE in admin panel)
    static async invalidateCache() {
        this.cachedSettings = null;
        this.lastFetch = 0;
        try {
            await redisClient.del(this.REDIS_KEY);
        } catch (err: any) {
            console.warn("Failed to invalidate Redis cache:", err.message);
        }
    }

    // Generic checker
    static async isEnabled<K extends keyof AdminSettings>(key: K): Promise<boolean> {
        const s = await this.getSettings();
        return Boolean(s[key]);
    }

    // ---------- Feature Toggles ----------
    static isForumsEnabled() { return this.isEnabled("allowForums"); }
    static isPostsEnabled() { return this.isEnabled("allowPosts"); }
    static isCommentsEnabled() { return this.isEnabled("allowComments"); }
    static isLikesEnabled() { return this.isEnabled("allowLikes"); }
    static isMessagesEnabled() { return this.isEnabled("allowMessages"); }

    // ---------- Platform Toggles ----------
    static isUserRegistrationAllowed() { return this.isEnabled("allowUserRegistration"); }
    static isMaintenanceMode() { return this.isEnabled("maintenanceMode"); }
    static isEmailNotificationsEnabled() { return this.isEnabled("enableEmailNotifications"); }
    static isPushNotificationsEnabled() { return this.isEnabled("enablePushNotifications"); }

    // ---------- Limits ----------
    static async getMaxUploadSizeMB() {
        const s = await this.getSettings();
        return s.maxUploadSizeMB;
    }
    static async getMaxPostsPerDay() {
        const s = await this.getSettings();
        return s.maxPostsPerDay;
    }
}
