import { z } from "zod";
import { ClassSectionEnum, DomainEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../shared/enums";

const uuidSchema = z.string().uuid({ message: "Invalid UUID" });

export const addSemesterSchema = z.object({
    programCatalogueId: z.string(),
    semesterNo: z.number().int().min(1).max(8),
    courses: z
        .array(z.string())
        .optional(),
});

export const updateSemesterSchema = z.object({
    semesterNo: z.number().int().min(1).max(8).optional(),
    courses: z
        .array(z.string())
        .optional(),
});

// Zod schema for a single CLO
export const cloSchema = z.object({
    id: uuidSchema.optional(), // For updates — keep CLO IDs if they exist
    code: z.string().regex(/^CLO\d+$/, "CLO code must be in format CLO<number>"),
    title: z.string().min(1, "CLO title is required"),
    description: z.string().min(1, "CLO description is required"),
    ploMapping: z
        .array(
            z.object({
                id: uuidSchema.optional(), // For updating existing mappings
                ploId: uuidSchema,         // Postgres foreign key to PLO table
                strength: z.nativeEnum(StrengthEnum),
            })
        )
        .min(1, "At least one PLO mapping is required"),
});

export const createCourseSchema = z.object({
    programId: uuidSchema,
    programCatalogueId: uuidSchema,
    title: z.string().min(1, "Title is required"),
    code: z.string().min(1, "Course code is required"),
    codePrefix: z.string().min(1, "Code prefix is required"),
    description: z.string().min(1, "Description is required"),
    subjectLevel: z.nativeEnum(SubjectLevelEnum),
    subjectType: z.nativeEnum(SubjectTypeEnum),
    contactHours: z.number().min(0),
    creditHours: z.number().min(0),
    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum),
    domain: z.nativeEnum(DomainEnum),
    preRequisites: z.array(uuidSchema).optional(),
    coRequisites: z.array(uuidSchema).optional(),
    sections: z.array(z.nativeEnum(ClassSectionEnum)).optional()
        .refine((arr) => !arr || new Set(arr).size === arr.length, {
            message: "Duplicate sections are not allowed",
        }),
}).refine((data) => data.creditHours >= data.contactHours, {
    message: "Credit hours must be greater than or equal to contact hours"
});

export const updateCourseSchema = z.object({
    title: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    codePrefix: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    subjectLevel: z.nativeEnum(SubjectLevelEnum).optional(),
    subjectType: z.nativeEnum(SubjectTypeEnum).optional(),
    contactHours: z.number().min(0).optional(),
    creditHours: z.number().min(0).optional(),
    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum).optional(),
    domain: z.nativeEnum(DomainEnum).optional(),
    preRequisites: z.array(uuidSchema).optional(),
    coRequisites: z.array(uuidSchema).optional(),
    sections: z.array(z.nativeEnum(ClassSectionEnum))
        .optional()
        .refine((arr) => !arr || new Set(arr).size === arr.length, {
            message: "Duplicate sections are not allowed",
        }),
    clos: z.array(cloSchema).optional()
}).refine((data) => {
    if (data.creditHours !== undefined && data.contactHours !== undefined) {
        return data.creditHours >= data.contactHours;
    }
    return true;
}, {
    message: "Credit hours must be greater than or equal to contact hours",
});

export const facultyCourseUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    codePrefix: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    subjectLevel: z.nativeEnum(SubjectLevelEnum).optional(),
    subjectType: z.nativeEnum(SubjectTypeEnum).optional(),
    contactHours: z.number().min(0).optional(),
    creditHours: z.number().min(0).optional(),
    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum).optional(),
    domain: z.nativeEnum(DomainEnum).optional(),
}).refine((data) => {
    if (data.creditHours !== undefined && data.contactHours !== undefined) {
        return data.creditHours >= data.contactHours;
    }
    return true;
}, {
    message: "Credit hours must be greater than or equal to contact hours",
});

