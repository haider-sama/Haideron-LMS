import { z } from "zod";
import { TermEnum } from "../../../shared/enums";

export const createProgramBatchSchema = z.object({
    programId: z.string().uuid("Invalid program ID"),
    programCatalogueId: z.string().uuid("Invalid program catalogue ID"),
    sessionYear: z.number().refine((year) => {
        const currentYear = new Date().getFullYear();
        return year >= 2000 && year <= currentYear + 5;
    }, {
        message: "Invalid or unrealistic catalogue year",
    }),
});

export const updateProgramBatchSchema = z.object({
    sessionYear: z
        .number()
        .int("Session year must be an integer")
        .min(2000, "Session year must be 2000 or later")
        .max(new Date().getFullYear() + 5, "Session year is too far in the future")
        .optional(),
    isActive: z.boolean().optional(),
});

export const activateSemesterSchema = z.object({
    programBatchId: z.string().uuid("Invalid program batch ID"),
    semesterNo: z.number().int().min(1).max(8).refine(n => Number.isInteger(n), {
        message: "Semester number must be an integer between 1 and 8",
    }),
    term: z.nativeEnum(TermEnum, {
        errorMap: () => ({ message: "Invalid term selected" }),
    }),
    startedAt: z
        .string()
        .datetime({ offset: true })
        .or(z.date())
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
});

export const updateBatchSemesterSchema = z.object({
    isActive: z.boolean().optional(),
    term: z.nativeEnum(TermEnum).optional(),
    semesterNo: z
        .number()
        .min(1, "Semester number must be at least 1")
        .max(12, "Semester number cannot exceed 12")
        .optional(),
    startedAt: z
        .string()
        .datetime({ offset: true })
        .or(z.date())
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    endedAt: z
        .string()
        .datetime({ offset: true })
        .or(z.date())
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    enrollmentDeadline: z
        .string()
        .datetime({ offset: true })
        .or(z.date())
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
});