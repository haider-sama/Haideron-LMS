import { z } from "zod";

export const CreateCommentSchema = z.object({
    postId: z.string().min(1, "postId is required"),
    parentId: z.string().optional().nullable(),
    content: z.string().min(1, "content is required"),
});

export const GetCommentsQuerySchema = z.object({
    parentId: z.string().optional(), // null or not provided = root comments
    sort: z.enum(["newest", "oldest", "top", "best"]).optional().default("newest"),
    page: z.string().default("1"),
    limit: z.string().default("10"),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, "Content cannot be empty").max(10000),
});