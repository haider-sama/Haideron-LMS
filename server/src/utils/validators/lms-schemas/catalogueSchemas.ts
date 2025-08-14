import { z } from "zod";

export const createProgramCatalogueSchema = z.object({
    programId: z.string().uuid({ message: "Invalid program ID" }),
    catalogueYear: z.number().refine((year) => {
        const currentYear = new Date().getFullYear();
        return year >= 2000 && year <= currentYear + 5;
    }, {
        message: "Invalid or unrealistic catalogue year",
    }),
});

export const updateProgramCatalogueSchema = z.object({
    programId: z.string().uuid({ message: "Invalid program ID" }).optional(),
    catalogueYear: z
        .number()
        .int()
        .min(2000, { message: "Catalogue year must be 2000 or later" })
        .max(new Date().getFullYear() + 5, {
            message: "Catalogue year is too far in the future",
        })
        .optional(),
});