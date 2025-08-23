import { z } from "zod";
import { PostTypeEnum, VoteTypeEnum } from "../../../shared/social.enums";

export const CreatePostSchema = z.object({
    forumId: z.string().uuid({ message: "Invalid Forum ID." }),
    type: z.nativeEnum(PostTypeEnum, {
        required_error: "Post type is required.",
        invalid_type_error: "Invalid post type.",
    }),
    content: z.string().optional(),

    linkPreview: z
        .object({
            url: z.string({ required_error: "Link URL is required." }).url("Must be a valid URL."),
            title: z.string().optional(),
            description: z.string().optional(),
            image: z.string().optional(),
        })
        .optional(),

    mediaUrls: z.array(z.string().url("Each media URL must be valid.")).optional(),
});

export const UpdatePostSchema = z.object({
    content: z.string().optional(),

    linkPreview: z
        .object({
            url: z.string({ required_error: "Link URL is required." }).url("Must be a valid URL."),
            title: z.string().optional(),
            description: z.string().optional(),
            image: z.string().optional(),
        })
        .optional(),

    mediaUrls: z
        .array(z.string().url("Each media URL must be valid."))
        .optional(),
});

export const PostQuerySchema = z.object({
    limit: z
        .string()
        .regex(/^\d+$/)
        .default("10")
        .transform((val) => parseInt(val, 10)), // auto convert to number
    type: z.nativeEnum(PostTypeEnum).optional(),
    sort: z.enum(["recent", "top", "trending"]).optional().default("recent"),
    search: z.string().min(1).optional(),
    archived: z.enum(["true", "false"]).optional(),
    lastPostCreatedAt: z
        .string()
        .datetime()
        .optional(), // cursor for infinite scroll
});