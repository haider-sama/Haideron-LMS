import { z } from "zod";
import { ForumStatusEnum, ForumTypeEnum } from "../../../shared/social.enums";

export const CreateForumSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z.string().optional(),
    type: z.nativeEnum(ForumTypeEnum, {
        errorMap: () => ({ message: "Invalid forum type." }),
    }),
});

export const ForumQuerySchema = z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    type: z.nativeEnum(ForumTypeEnum).optional(),
    status: z.nativeEnum(ForumStatusEnum).optional(),
    search: z.string().optional(),
    showArchived: z.string().optional(),
    createdBy: z.string().optional(),
});

export const UpdateForumStatusSchema = z.object({
    status: z.nativeEnum(ForumStatusEnum, {
        errorMap: () => ({ message: "Invalid forum status" }),
    }),
});
