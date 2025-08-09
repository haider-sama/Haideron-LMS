import { z } from "zod";
import mongoose from "mongoose";
import { ClassSectionEnum, DomainEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../shared/enums";

export const addSemesterSchema = z.object({
    programCatalogue: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid programCatalogue ID",
    }),
    semesterNo: z.number().int().min(1).max(8),
    courses: z
        .array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid course ID",
        }))
        .optional(),
});

export const updateSemesterSchema = z.object({
    semesterNo: z.number().int().min(1).max(8).optional(),
    courses: z
        .array(z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid course ID",
        }))
        .optional(),
});

const objectId = z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
    });

// Zod schema for a single CLO
const cloSchema = z.object({
    _id: z.string().optional(),
    code: z.string().regex(/^CLO\d+$/, "CLO code must be in format CLO<number>"),
    title: z.string().min(1, "CLO title is required"),
    description: z.string().min(1, "CLO description is required"),
    ploMapping: z
        .array(
            z.object({
                _id: z.string().optional(),
                plo: objectId,
                strength: z.nativeEnum(StrengthEnum),
            })
        )
        .min(1, "At least one PLO mapping is required"),
});

// Zod schema for course creation
export const createCourseSchema = z.object({
    programId: z.string({ required_error: "Program is required" }),

    catalogueId: z.string({ required_error: "Catalogue is required" }),

    title: z.string({ required_error: "Title is required" })
        .min(1, { message: "Title cannot be empty" }),

    code: z.string({ required_error: "Course code is required" })
        .min(1, { message: "Course code cannot be empty" }),

    codePrefix: z.string({ required_error: "Code prefix is required" })
        .min(1, { message: "Code prefix cannot be empty" }),

    description: z.string({ required_error: "Description is required" })
        .min(1, { message: "Description cannot be empty" }),

    subjectLevel: z.nativeEnum(SubjectLevelEnum, {
        required_error: "Subject level is required",
        invalid_type_error: "Invalid subject level",
    }),

    subjectType: z.nativeEnum(SubjectTypeEnum, {
        required_error: "Subject type is required",
        invalid_type_error: "Invalid subject type",
    }),

    contactHours: z.number({ required_error: "Contact hours are required" })
        .min(0, { message: "Contact hours must be at least 0" }),

    creditHours: z.number({ required_error: "Credit hours are required" })
        .min(0, { message: "Credit hours must be at least 0" }),

    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum, {
        required_error: "Knowledge area is required",
        invalid_type_error: "Invalid knowledge area",
    }),

    domain: z.nativeEnum(DomainEnum, {
        required_error: "Domain is required",
        invalid_type_error: "Invalid domain",
    }),

    preRequisites: z.array(objectId, {
        invalid_type_error: "Pre-requisites must be an array of course IDs",
    }).optional(),

    coRequisites: z.array(objectId, {
        invalid_type_error: "Co-requisites must be an array of course IDs",
    }).optional(),

    clos: z.array(cloSchema, {
        invalid_type_error: "CLOs must be a valid array",
    }).optional(),

    sections: z
        .array(z.nativeEnum(ClassSectionEnum), {
            invalid_type_error: "Sections must be valid class sections",
        })
        .optional()
        .refine((arr) => !arr || new Set(arr).size === arr.length, {
            message: "Duplicate sections are not allowed",
        }),
});


export const updateCourseSchema = z.object({
    title: z.string().min(1, { message: "Course title is required" }).optional(),
    code: z.string().min(1, { message: "Course code is required" }).optional(),
    codePrefix: z.string().min(1, { message: "Code prefix is required" }).optional(),
    description: z.string().min(1, { message: "Description is required" }).optional(),

    subjectLevel: z.nativeEnum(SubjectLevelEnum, {
        errorMap: () => ({ message: "Invalid subject level" }),
    }).optional(),

    subjectType: z.nativeEnum(SubjectTypeEnum, {
        errorMap: () => ({ message: "Invalid subject type" }),
    }).optional(),

    contactHours: z.number().min(0, {
        message: "Contact hours must be 0 or greater",
    }).optional(),

    creditHours: z.number().min(0, {
        message: "Credit hours must be 0 or greater",
    }).optional(),

    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum, {
        errorMap: () => ({ message: "Invalid knowledge area" }),
    }).optional(),

    domain: z.nativeEnum(DomainEnum, {
        errorMap: () => ({ message: "Invalid domain" }),
    }).optional(),

    preRequisites: z.array(objectId, {
        invalid_type_error: "Pre-requisites must be an array of valid IDs",
    }).optional(),

    coRequisites: z.array(objectId, {
        invalid_type_error: "Co-requisites must be an array of valid IDs",
    }).optional(),

    clos: z.array(cloSchema, {
        invalid_type_error: "CLOs must be an array of valid CLO objects",
    }).optional(),

    sectionTeachers: z.record(objectId, {
        invalid_type_error: "Section teachers must be an object of valid user IDs",
    }).optional(),

    sections: z
        .array(z.nativeEnum(ClassSectionEnum, {
            errorMap: () => ({ message: "Invalid class section" }),
        }))
        .optional()
        .refine((arr) => !arr || new Set(arr).size === arr.length, {
            message: "Duplicate sections are not allowed",
        }),
});

export const facultyCourseUpdateSchema = z.object({
    title: z.string().min(1, { message: "Course title is required" }).optional(),
    code: z.string().min(1, { message: "Course code is required" }).optional(),
    codePrefix: z.string().min(1, { message: "Code prefix is required" }).optional(),
    description: z.string().min(1, { message: "Description is required" }).optional(),

    subjectLevel: z.nativeEnum(SubjectLevelEnum, {
        errorMap: () => ({ message: "Invalid subject level" }),
    }).optional(),

    subjectType: z.nativeEnum(SubjectTypeEnum, {
        errorMap: () => ({ message: "Invalid subject type" }),
    }).optional(),

    contactHours: z.number().min(0, {
        message: "Contact hours must be 0 or greater",
    }).optional(),

    creditHours: z.number().min(0, {
        message: "Credit hours must be 0 or greater",
    }).optional(),

    knowledgeArea: z.nativeEnum(KnowledgeAreaEnum, {
        errorMap: () => ({ message: "Invalid knowledge area" }),
    }).optional(),

    domain: z.nativeEnum(DomainEnum, {
        errorMap: () => ({ message: "Invalid domain" }),
    }).optional(),

    clos: z.array(cloSchema, {
        invalid_type_error: "CLOs must be an array of valid CLO objects",
    }).optional(),

});