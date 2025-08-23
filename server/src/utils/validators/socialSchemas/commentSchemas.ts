import { z } from "zod";

export const CreateCommentSchema = z.object({
    postId: z.string().min(1, "postId is required"),
    parentId: z.string().optional().nullable(),
    content: z.string().min(1, "content is required"),
});

export const GetCommentsQuerySchema = z.object({
    parentId: z.string().uuid().optional(), // null or not provided = root comments
    sort: z.enum(["newest", "oldest", "top", "best"]).optional().default("newest"),
    limit: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .optional()
        .default("10"), // page size
    offsetKey: z.string().datetime().optional(), // ISO string of last comment createdAt for cursor pagination
});

export const UpdateCommentSchema = z.object({
    content: z.string().min(1, "Content cannot be empty").max(10000),
});