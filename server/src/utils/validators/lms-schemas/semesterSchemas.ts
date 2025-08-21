import { z } from "zod";
import { ClassSectionEnum, DomainEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../shared/enums";

export const addSemesterSchema = z.object({
    programCatalogueId: z.string().uuid({ message: "Invalid program catalogue ID" }),
    semesterNo: z.number().int().min(1).max(8),
    courses: z
        .array(z.string().uuid({ message: "Invalid course IDs" }))
        .optional(),
});

export const updateSemesterSchema = z.object({
    semesterNo: z.number().int().min(1).max(8).optional(),
    courses: z
        .array(z.string().uuid({ message: "Invalid course IDs" }))
        .optional(),
});

// Zod schema for a single CLO
export const cloSchema = z.object({
    id: z.string().uuid({ message: "Invalid CLO ID" }).optional(), // For updates — keep CLO IDs if they exist
    code: z.string().regex(/^CLO\d+$/, "CLO code must be in format CLO<number>"),
    title: z.string().min(1, "CLO title is required"),
    description: z.string().min(1, "CLO description is required"),
    ploMappings: z
        .array(
            z.object({
                id: z.string().uuid({ message: "Invalid CLO ID" }).optional(),  // For updating existing mappings
                ploId: z.string().uuid({ message: "Invalid PLO ID" }),  // Postgres foreign key to PLO table
                strength: z.nativeEnum(StrengthEnum),
            })
        )
        .min(1, "At least one PLO mapping is required"),
});

export const createCourseSchema = z.object({
    programId: z.string().uuid({ message: "Invalid program ID" }),
    programCatalogueId: z.string().uuid({ message: "Invalid catalogue ID" }),
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
}).refine((data) => data.creditHours >= data.contactHours, {
    message: "Credit hours must be greater than or equal to contact hours"
});

export const updateCourseSchema = z.object({
    title: z.string({ required_error: "Title is required" }).min(1, "Title cannot be empty"),
    code: z.string({ required_error: "Code is required" }).min(1, "Code cannot be empty"),
    codePrefix: z.string({ required_error: "Code prefix is required" }).min(1, "Code prefix cannot be empty"),
    description: z.string({ required_error: "Description is required" }).min(1, "Description cannot be empty"),
    subjectLevel: z.nativeEnum(SubjectLevelEnum, { required_error: "Subject level is required" }),
    subjectType: z.nativeEnum(SubjectTypeEnum, { required_error: "Subject type is required" }),
    contactHours: z.number({ required_error: "Contact hours are required" }).min(0, "Contact hours must be >= 0"),
    creditHours: z.number({ required_error: "Credit hours are required" }).min(0, "Credit hours must be >= 0"),
    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum, { required_error: "Knowledge area is required" }),
    domain: z.nativeEnum(DomainEnum, { required_error: "Domain is required" }),

    preRequisites: z.array(
        z.object({
            courseId: z.string().uuid({ message: "Invalid courseId" }),
            preReqCourseId: z.string().uuid({ message: "Invalid preReqCourseId" })
        })
    ).optional(),

    coRequisites: z.array(
        z.object({
            courseId: z.string().uuid({ message: "Invalid courseId" }),
            coReqCourseId: z.string().uuid({ message: "Invalid coReqCourseId" })
        })
    ).optional(),
    
    sections: z.array(
        z.object({ section: z.nativeEnum(ClassSectionEnum) })
    ).optional()
        .refine(arr => !arr || new Set(arr.map(s => s.section)).size === arr.length, {
            message: "Duplicate sections are not allowed",
        }),
    sectionTeachers: z.array(
        z.object({
            section: z.nativeEnum(ClassSectionEnum),
            teacherId: z.string().uuid({ message: "Invalid teacher ID" }),
        })
    ).optional(),
    clos: z.array(cloSchema).optional()
}).refine(data => {
    if (data.creditHours !== undefined && data.contactHours !== undefined) {
        return data.creditHours >= data.contactHours;
    }
    return true;
}, {
    message: "Credit hours must be greater than or equal to contact hours",
});
