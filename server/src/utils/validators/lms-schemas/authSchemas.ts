import { z } from 'zod';
import { AudienceEnum, DegreeEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from '../../../shared/enums';

function enumToZodEnum<T extends { [key: string]: string }>(e: T) {
    return z.enum(Object.values(e) as [string, ...string[]]);
}

export const registerSchema = z.object({
    email: z.string().email("Invalid email format").trim().toLowerCase(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters").trim(),
}).strict();

export const loginSchema = z.object({
    email: z.string().email("Invalid email format").trim().toLowerCase(),
    password: z.string()
        .min(1, "Password is required")
        .max(128, "Password must be less than 128 characters").trim(),
}).strict();

export const verifyEmailSchema = z.object({
    code: z.string().trim().min(6, "Verification code is required"),
});

export const emailOnlySchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
});

export const passwordOnlySchema = z.object({
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters").trim(),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const avatarSchema = z.object({
    userId: z.string().min(1),
});

const qualificationSchema = z.object({
    degree: z.nativeEnum(DegreeEnum, {
        errorMap: () => ({ message: "Please select a valid degree" }),
    }),

    passingYear: z.number({
        required_error: "Passing year is required",
        invalid_type_error: "Passing year must be a number",
    })
        .min(1900, { message: "Passing year must be no earlier than 1900" })
        .max(new Date().getFullYear(), {
            message: "Passing year cannot be in the future",
        }),

    institutionName: z.string({
        required_error: "Institution name is required",
    }).min(1, { message: "Institution name cannot be empty" }),

    majorSubjects: z.array(
        z.string().min(1, { message: "Subject name cannot be empty" }),
        {
            required_error: "Major subjects are required",
            invalid_type_error: "Major subjects must be an array of strings",
        }
    ).min(1, { message: "Please provide at least one major subject" }),
});

const teacherInfoSchema = z.object({
    qualifications: z.array(qualificationSchema, {
        required_error: "Qualifications are required",
        invalid_type_error: "Qualifications must be an array of qualifications",
    }).min(1, { message: "Please add at least one qualification" }),
});

const forumProfileSchema = z.object({
    username: z
        .string({
            required_error: "Username is required",
            invalid_type_error: "Username must be a string",
        })
        .min(3, { message: "Username must be at least 3 characters" })
        .max(20, { message: "Username must be at most 20 characters" })
        .regex(/^[a-zA-Z0-9_]+$/, {
            message: "Username can only contain letters, numbers, and underscores",
        }),

    displayName: z
        .string({ invalid_type_error: "Display name must be a string" })
        .max(50, { message: "Display name must be at most 50 characters" })
        .optional(),

    bio: z
        .string({ invalid_type_error: "Bio must be a string" })
        .max(300, { message: "Bio must be at most 300 characters" })
        .optional(),

    signature: z
        .string({ invalid_type_error: "Signature must be a string" })
        .max(300, { message: "Signature must be at most 300 characters" })
        .optional(),

    interests: z
        .array(
            z.string().max(30, {
                message: "Each interest must be at most 30 characters",
            }),
            {
                invalid_type_error: "Interests must be an array of strings",
            }
        )
        .optional(),

    visibility: z
        .enum(["public", "private"], {
            errorMap: () => ({
                message: "Visibility must be either 'public' or 'private'",
            }),
        })
        .optional(),
});

export const updateUserProfileSchema = z.object({
    firstName: z
        .string({ invalid_type_error: "First name must be a string" })
        .min(2, { message: "First name must be at least 2 characters" })
        .max(30, { message: "First name must be at most 30 characters" })
        .optional(),

    lastName: z
        .string({ invalid_type_error: "Last name must be a string" })
        .min(2, { message: "Last name must be at least 2 characters" })
        .max(30, { message: "Last name must be at most 30 characters" })
        .optional(),

    fatherName: z
        .string({ invalid_type_error: "Father's name must be a string" })
        .min(2, { message: "Father's name must be at least 2 characters" })
        .max(50, { message: "Father's name must be at most 50 characters" })
        .optional(),

    city: z
        .string({ invalid_type_error: "City must be a string" })
        .min(2, { message: "City must be at least 2 characters" })
        .max(50, { message: "City must be at most 50 characters" })
        .optional(),

    country: z
        .string({ invalid_type_error: "Country must be a string" })
        .min(2, { message: "Country must be at least 2 characters" })
        .max(50, { message: "Country must be at most 50 characters" })
        .optional(),

    address: z
        .string({ invalid_type_error: "Address must be a string" })
        .min(2, { message: "Address must be at least 2 characters" })
        .max(100, { message: "Address must be at most 100 characters" })
        .optional(),

    forumProfile: forumProfileSchema.optional(),

    teacherInfo: teacherInfoSchema.optional(),
});


export const bulkRegisterUserSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    role: z.nativeEnum(AudienceEnum, { errorMap: () => ({ message: "Invalid role" }) }),
    department: z.nativeEnum(DepartmentEnum, { errorMap: () => ({ message: "Invalid department" }) })
});

export const bulkRegisterSchema = z.object({
    users: z.array(
        z.object({
            email: z.string().email(),
            password: z.string().min(6),
            role: z.nativeEnum(AudienceEnum),
            department: z.nativeEnum(DepartmentEnum),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            fatherName: z.string().min(1),
            city: z.string().min(1),
            country: z.string().min(1),
            address: z.string().min(1),
        })
    ).refine(
        (users) => !users.some(user => user.role === AudienceEnum.Admin),
        {
            message: "Role 'Admin' is not allowed.",
            path: ["users"], // attach error at users array level
        }
    )
});

export const adminUpdateUserSchema = z.object({
    firstName: z
        .string({ required_error: "First name is required" })
        .trim()
        .min(1, { message: "First name cannot be empty" })
        .max(50, { message: "First name must be at most 50 characters long" })
        .optional(),

    lastName: z
        .string({ required_error: "Last name is required" })
        .trim()
        .min(1, { message: "Last name cannot be empty" })
        .max(50, { message: "Last name must be at most 50 characters long" })
        .optional(),

    fatherName: z
        .string({ required_error: "Father's name is required" })
        .trim()
        .min(1, { message: "Father's name cannot be empty" })
        .max(50, { message: "Father's name must be at most 50 characters long" })
        .optional(),

    address: z
        .string()
        .trim()
        .max(100, { message: "Address must be at most 100 characters long" })
        .optional(),

    city: z
        .string()
        .trim()
        .max(50, { message: "City must be at most 50 characters long" })
        .optional(),

    country: z
        .string()
        .trim()
        .max(50, { message: "Country must be at most 50 characters long" })
        .optional(),

    department: z
        .nativeEnum(DepartmentEnum, { errorMap: () => ({ message: "Invalid department selected" }) })
        .optional(),

    role: z
        .nativeEnum(AudienceEnum, { errorMap: () => ({ message: "Invalid role selected" }) })
        .optional()
        .refine((val) => val !== AudienceEnum.Admin, {
            message: "Role 'Admin' is not allowed",
        }),
});

export const TwoFATokenSchema = z.object({
    token: z.string().length(6).regex(/^\d+$/, "Token must be 6 digits"),
});

export const TwoFALoginSchema = z.object({
    email: z.string().email("Invalid email format").trim().toLowerCase(),
    password: z.string()
        .min(1, "Password is required")
        .max(128, "Password must be less than 128 characters").trim(),
    twoFAToken: z.string().length(6).regex(/^\d+$/, "Token must be 6 digits").optional(),
}).strict();

export const Disable2FASchema = z.object({
    password: z.string()
        .min(1, "Password is required")
        .max(128, "Password must be less than 128 characters").trim(),
    twoFAToken: z.string().length(6).regex(/^\d+$/, "Token must be 6 digits"),
}).strict();