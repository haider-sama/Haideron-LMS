import { z } from "zod";
import { PostTypeEnum, VoteTypeEnum } from "../../../shared/social.enums";

export const CreatePostSchema = z.object({
    forumId: z.string({ required_error: "Forum ID is required." }),
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
    page: z.string().regex(/^\d+$/).default("1"),
    limit: z.string().regex(/^\d+$/).default("10"),
    forumId: z.string().optional(),
    type: z.nativeEnum(PostTypeEnum).optional(),
    sort: z.enum(["recent", "top", "trending"]).optional(),
    search: z.string().min(1).optional(),
    archived: z.string().optional(),
});

export const PollVoteSchema = z.object({
    optionId: z.string(),
    isAnonymous: z.boolean().optional().default(false),
});

export const PostVoteSchema = z.object({
  voteType: z.nativeEnum(VoteTypeEnum),
});