import { pgEnum, pgTable, text, uuid, timestamp, boolean, jsonb, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, SQL, sql } from "drizzle-orm";
import { forums } from "./forum.model";
import { users } from "../auth/user.model";
import { PostTypeEnum, VoteTypeEnum } from "../../../shared/social.enums";
import { tsvector } from "../core/tsvector";

// Enum for Post Types
export const postTypeEnum = pgEnum("post_type_enum", Object.values(PostTypeEnum) as [string, ...string[]]);
// Enum for Vote Types (UPVOTE / DOWNVOTE)
export const voteTypeEnum = pgEnum("vote_type_enum", Object.values(VoteTypeEnum) as [string, ...string[]]);

// Posts Table
export const posts = pgTable(
    "posts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        forumId: uuid("forum_id").notNull().references(() => forums.id, { onDelete: "cascade" }),
        authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),

        type: postTypeEnum("type").notNull(),
        slug: text("slug").notNull().unique(),

        content: text("content"),

        // JSON field for link preview (optional object)
        linkPreview: jsonb("link_preview").$type<{
            url: string;
            title?: string;
            description?: string;
            image?: string;
        }>(),

        // Array of media URLs
        mediaUrls: text("media_urls").array().default(sql`ARRAY[]::text[]`).notNull(),

        likeCount: integer("like_count").default(0).notNull(),
        upvoteCount: integer("upvote_count").default(0).notNull(),
        downvoteCount: integer("downvote_count").default(0).notNull(),

        isPinned: boolean("is_pinned").default(false).notNull(),
        isEdited: boolean("is_edited").default(false).notNull(),
        isArchived: boolean("is_archived").default(false).notNull(),

        archivedAt: timestamp("archived_at"),
        lastEditedAt: timestamp("last_edited_at"),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),

        // Full-text search vector
        searchVector: tsvector("search_vector")
            .notNull()
            .generatedAlwaysAs(
                (): SQL => sql`
                  setweight(to_tsvector('english', coalesce(${posts.slug}, '')), 'A') ||
                  setweight(to_tsvector('english', coalesce(${posts.content}, '')), 'B') ||
                  setweight(to_tsvector('english', coalesce((${posts.linkPreview} ->> 'title'), '')), 'C') ||
                  setweight(to_tsvector('english', coalesce((${posts.linkPreview} ->> 'description'), '')), 'D')
                `
            ),
    },
    (table) => [
        // Unique slug
        uniqueIndex("idx_posts_slug").on(table.slug),

        index("idx_posts_forum_created").on(table.forumId, table.createdAt.desc()),
        index("idx_posts_author_created").on(table.authorId, table.createdAt.desc()),
        index("idx_posts_pinned").on(table.isPinned, table.createdAt.desc()),
        index("idx_posts_archived").on(table.isArchived, table.archivedAt),
        index("idx_posts_likecount").on(table.likeCount.desc()),
        index("idx_posts_upvotecount").on(table.upvoteCount.desc()),

        // Full-text search index
        index("idx_posts_search").using("gin", table.searchVector),
    ]
);

export const postLikes = pgTable(
    "post_likes",
    {
        postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        // A user can like a post only once
        uniqueIndex("idx_post_likes_unique").on(table.postId, table.userId),

        // For fast lookups
        index("idx_post_likes_post").on(table.postId),
        index("idx_post_likes_user").on(table.userId),
    ]
);

export const postVotes = pgTable(
    "post_votes",
    {
        postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        voteType: voteTypeEnum("vote_type").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        // A user can vote only once per post
        uniqueIndex("idx_post_votes_unique").on(table.postId, table.userId),

        // For fast lookups
        index("idx_post_votes_post").on(table.postId),
        index("idx_post_votes_user").on(table.userId),
        index("idx_post_votes_type").on(table.voteType),
    ]
);

export const postsRelations = relations(posts, ({ one }) => ({
    forum: one(forums, {
        fields: [posts.forumId],
        references: [forums.id],
    }),
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
    }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
    post: one(posts, {
        fields: [postLikes.postId],
        references: [posts.id],
    }),
    user: one(users, {
        fields: [postLikes.userId],
        references: [users.id],
    }),
}));

export const postVotesRelations = relations(postVotes, ({ one }) => ({
    post: one(posts, {
        fields: [postVotes.postId],
        references: [posts.id],
    }),
    user: one(users, {
        fields: [postVotes.userId],
        references: [users.id],
    }),
}));