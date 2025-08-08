import { pgTable, timestamp, index, uuid, text, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userSessions = pgTable(
    "user_sessions",
    {
        id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // UUID primary key
        userId: uuid("user_id").notNull(), // FK to users.id (UUID)
        ip: text("ip"),
        userAgent: jsonb("user_agent").$type<{
            browser?: string;
            os?: string;
            device?: string;
            raw?: string;
        }>(),
        lastUsed: timestamp("last_used", { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("user_sessions_user_id_index").on(table.userId),
        // We cannot create a TTL index like Mongo's 'expires', but you can create a DB job to delete old sessions.
    ]
);