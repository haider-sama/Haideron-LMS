import { pgTable, boolean, timestamp, uuid, text, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "../auth/user.model";

// Admin settings table
export const adminSettings = pgTable(
    "admin_settings",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        // Feature toggles
        allowForums: boolean("allow_forums").default(true).notNull(),
        allowPosts: boolean("allow_posts").default(true).notNull(),
        allowComments: boolean("allow_comments").default(true).notNull(),
        allowLikes: boolean("allow_likes").default(true).notNull(),
        allowMessages: boolean("allow_messages").default(true).notNull(),

        // Platform-level toggles
        allowUserRegistration: boolean("allow_user_registration").default(true).notNull(),
        maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
        enableEmailNotifications: boolean("enable_email_notifications").default(true).notNull(),
        enablePushNotifications: boolean("enable_push_notifications").default(true).notNull(),

        // Limits
        maxUploadSizeMB: integer("max_upload_size_mb").default(10).notNull(), // e.g. 10 MB default
        maxPostsPerDay: integer("max_posts_per_day").default(50).notNull(),

        // Audit
        createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
        updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    }
);
