import { z } from "zod";
import { ReportTargetType } from "../../../shared/social.enums";

export const CreateReportSchema = z.object({
    targetType: z.nativeEnum(ReportTargetType, {
        errorMap: () => ({ message: "A valid target type (e.g. Post, Comment, User) is required." }),
    }),
    targetId: z
        .string({
            required_error: "Target ID is required.",
            invalid_type_error: "Target ID must be a string.",
        })
        .min(1, "Target ID cannot be empty."),
    reason: z
        .string({
            required_error: "Reason is required.",
            invalid_type_error: "Reason must be a string.",
        })
        .min(3, "Reason must be at least 3 characters long."),
    details: z
        .string({
            invalid_type_error: "Details must be a string.",
        })
        .optional(),
});