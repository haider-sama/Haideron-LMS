import { pgEnum, pgTable, text, uuid, timestamp, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql, SQL } from "drizzle-orm";
import { ForumStatusEnum, ForumTypeEnum } from "../../../shared/social.enums";
import { users } from "../auth/user.model";
import { tsvector } from "../core/tsvector";

// Enums
export const forumTypeEnum = pgEnum("forum_type_enum", Object.values(ForumTypeEnum) as [string, ...string[]]);
export const forumStatusEnum = pgEnum("forum_status_enum", Object.values(ForumStatusEnum) as [string, ...string[]]);

export const forums = pgTable(
    "forums",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        slug: text("slug").notNull().unique(),
        title: text("title").notNull(),
        description: text("description"),
        iconUrl: text("icon_url"),
        type: forumTypeEnum("type").notNull(),
        status: forumStatusEnum("status").default(ForumStatusEnum.PENDING).notNull(),
        isArchived: boolean("is_archived").default(false).notNull(),
        archivedAt: timestamp("archived_at"),
        createdBy: uuid("created_by").notNull(), // reference to users.id
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),

        // Full-text search vector
        searchVector: tsvector("search_vector")
            .notNull()
            .generatedAlwaysAs(
                (): SQL => sql`
          setweight(to_tsvector('english', coalesce(${forums.title}, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(${forums.description}, '')), 'B')
        `
            ),
    },
    (table) => [
        index("idx_forums_search").using("gin", table.searchVector),
    ]
);

export const forumModerators = pgTable(
    "forum_moderators",
    {
        forumId: uuid("forum_id").notNull().references(() => forums.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("idx_forum_moderators").on(table.forumId, table.userId),
    ]
);

export const forumMembers = pgTable(
    "forum_members",
    {
        forumId: uuid("forum_id").notNull().references(() => forums.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        joinedAt: timestamp("joined_at").defaultNow().notNull(),
    },
    (table) => [
        // Unique constraint
        uniqueIndex("idx_forum_members_unique").on(table.forumId, table.userId),
        // Optional: separate index for faster lookups by forum
        index("idx_forum_members_forum").on(table.forumId),
        // Optional: separate index for faster lookups by user
        index("idx_forum_members_user").on(table.userId),
    ]
);

export const forumsRelations = relations(forums, ({ one }) => ({
    creator: one(users, {
        fields: [forums.createdBy],
        references: [users.id],
    }),
}));

export const forumMembersRelations = relations(forumMembers, ({ one }) => ({
    forum: one(forums, {
        fields: [forumMembers.forumId],
        references: [forums.id],
    }),
    user: one(users, {
        fields: [forumMembers.userId],
        references: [users.id],
    }),
}));