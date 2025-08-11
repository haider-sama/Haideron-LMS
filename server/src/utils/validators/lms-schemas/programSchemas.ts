import { z } from "zod";
import { DegreeEnum, DepartmentEnum, StrengthEnum } from "../../../shared/enums";

export const programRegisterSchema = z.object({
    title: z.string({
        required_error: "Program title is required",
    }).min(3, "Program title must be at least 3 characters"),

    programLevel: z.nativeEnum(DegreeEnum, {
        required_error: "Program level is required",
        invalid_type_error: "Invalid program level",
    }),

    departmentTitle: z.nativeEnum(DepartmentEnum, {
        required_error: "Department title is required",
        invalid_type_error: "Invalid department",
    }),

    maxDurationYears: z.number({
        required_error: "Max duration is required",
        invalid_type_error: "Max duration must be a number",
    }).int().min(1).max(10),

    requirements: z.string().optional(),
    vision: z.string().optional(),
    mission: z.string().optional(),
});

export const updateProgramSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),

    programLevel: z.nativeEnum(DegreeEnum, {
        invalid_type_error: "Invalid program level",
    }).optional(),

    departmentTitle: z.nativeEnum(DepartmentEnum, {
        invalid_type_error: "Invalid department title",
    }).optional(),

    maxDurationYears: z.number()
        .int("Max duration must be an integer")
        .min(1, "Minimum duration is 1 year")
        .max(10, "Maximum duration is 10 years")
        .optional(),

    requirements: z.string().optional(),
    vision: z.string().optional(),
    mission: z.string().optional(),
});

export const ploSchema = z.object({
    code: z.string().regex(/^PLO\d+$/, "Code must be in format PLO<number>"),
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
});

export const peoSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    ploMapping: z.array(z.object({
        plo: z.string().uuid({ message: "Invalid UUID for PLO" }),
        strength: z.nativeEnum(StrengthEnum, {
            errorMap: () => ({ message: "Invalid strength enum value" }),
        }),
    })).nonempty("PEO must map to at least one PLO"),
});

export const updatePloSchema = z.object({
    code: z.string().regex(/^PLO\d+$/, "Code must be in format PLO<number>").optional(),
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().min(5, "Description must be at least 5 characters").optional(),
});

export const updatePeoSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().min(5, "Description must be at least 5 characters").optional(),
    ploMapping: z.array(z.object({
        plo: z.string().uuid({ message: "Invalid UUID for PLO" }),
        strength: z.nativeEnum(StrengthEnum),
    })).optional(),
});