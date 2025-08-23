import {
    pgTable,
    uuid,
    text,
    boolean,
    integer,
    timestamp,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "../auth/user.model";
import { posts } from "./post.model";

// Comments Table
export const comments = pgTable(
    "comments",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        // Relations
        postId: uuid("post_id")
            .notNull()
            .references(() => posts.id, { onDelete: "cascade" }),

        // wrap in arrow to avoid circular type inference
        parentId: uuid("parent_id").references((): any => comments.id, { onDelete: "cascade" }),

        authorId: uuid("author_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        // Content
        content: text("content").notNull(),

        // Denormalized counts
        likeCount: integer("like_count").default(0).notNull(),
        childrenCount: integer("children_count").default(0).notNull(),

        // Flags
        isBest: boolean("is_best").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    }, (table) => [
        // Common query patterns
        index("idx_comments_post_parent_created").on(table.postId, table.parentId, table.createdAt.desc()),
        index("idx_comments_parent").on(table.parentId),
        index("idx_comments_best").on(table.isBest),
    ]
);


// Likes table for comments (1 user can like 1 comment max)
export const commentLikes = pgTable(
    "comment_likes",
    {
        commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("idx_comment_likes_unique").on(table.commentId, table.userId), // user can like only once
        index("idx_comment_likes_comment").on(table.commentId),
        index("idx_comment_likes_user").on(table.userId),
    ]
);

// Relations
export const commentsRelations = relations(comments, ({ one, many }) => ({
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
    }),
    author: one(users, {
        fields: [comments.authorId],
        references: [users.id],
    }),
    likes: many(commentLikes),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
    comment: one(comments, {
        fields: [commentLikes.commentId],
        references: [comments.id],
    }),
    user: one(users, {
        fields: [commentLikes.userId],
        references: [users.id],
    }),
}));