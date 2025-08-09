import { z } from "zod";
import mongoose from "mongoose";

export const createProgramCatalogueSchema = z.object({
    program: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
        message: "Invalid program ID",
    }),
    catalogueYear: z.number().refine((year) => {
        const currentYear = new Date().getFullYear();
        return year >= 2000 && year <= currentYear + 5;
    }, {
        message: "Invalid or unrealistic catalogue year",
    }),
});

export const updateProgramCatalogueSchema = z.object({
    program: z
        .string()
        .optional()
        .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid program ID",
        }),
    catalogueYear: z
        .number()
        .int()
        .min(2000, { message: "Catalogue year must be 2000 or later" })
        .max(new Date().getFullYear() + 5, {
            message: "Catalogue year is too far in the future",
        })
        .optional(),
});