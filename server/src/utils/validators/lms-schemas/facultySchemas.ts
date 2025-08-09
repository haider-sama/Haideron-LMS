import { nativeEnum, z } from "zod";
import { AudienceEnum, DegreeEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../../shared/enums";

export const facultyRegisterSchema = z.object({
    email: z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
    }).email("Invalid email format"),

    password: z.string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
    }).min(8, "Password must be at least 8 characters long"),

    department: z.nativeEnum(DepartmentEnum, {
        required_error: "Department is required",
        invalid_type_error: "Invalid department",
    }),

    teacherInfo: z.object({
        designation: z.nativeEnum(TeacherDesignationEnum, {
            required_error: "Designation is required",
            invalid_type_error: "Invalid designation",
        }),

        joiningDate: z.string({
            required_error: "Joining date is required",
            invalid_type_error: "Joining date must be a string",
        }).refine(date => !isNaN(Date.parse(date)), {
            message: "Joining date must be a valid ISO date string",
        }),

        facultyType: z.nativeEnum(FacultyTypeEnum, {
            required_error: "Faculty type is required",
            invalid_type_error: "Invalid faculty type",
        }),

        subjectOwner: z.boolean({
            invalid_type_error: "Subject owner must be a boolean",
        }).optional(),

        qualifications: z.array(
            z.object({
                degree: z.nativeEnum(DegreeEnum, {
                    required_error: "Degree is required",
                    invalid_type_error: "Invalid degree",
                }),

                passingYear: z.number({
                    required_error: "Passing year is required",
                    invalid_type_error: "Passing year must be a number",
                })
                    .int("Passing year must be an integer")
                    .min(1900, "Passing year must be after 1900")
                    .max(new Date().getFullYear(), `Passing year cannot be after ${new Date().getFullYear()}`),

                institutionName: z.string({
                    required_error: "Institution name is required",
                    invalid_type_error: "Institution name must be a string",
                }).min(2, "Institution name must be at least 2 characters"),

                majorSubjects: z.array(z.string({
                    required_error: "Subject name is required",
                    invalid_type_error: "Each subject must be a string",
                }).min(1, "Subject name cannot be empty")).nonempty("At least one major subject is required"),
            })
        ).optional(),
    }),
});

export const updateFacultySchema = z.object({
    teacherInfo: z
        .object({
            designation: z.nativeEnum(TeacherDesignationEnum).optional(),
            joiningDate: z
                .string()
                .refine(date => !isNaN(Date.parse(date)), {
                    message: "Invalid ISO date format",
                })
                .optional(),
            facultyType: z.nativeEnum(FacultyTypeEnum).optional(),
            subjectOwner: z.boolean().optional(),
            qualifications: z
                .array(
                    z.object({
                        degree: z.nativeEnum(DegreeEnum),
                        passingYear: z
                            .number()
                            .int()
                            .min(1900)
                            .max(new Date().getFullYear()),
                        institutionName: z.string().min(2),
                        majorSubjects: z
                            .array(z.string().min(1))
                            .nonempty("At least one major subject is required"),
                    })
                )
                .optional(),
        })
        .optional(),

    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
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
    address: z
        .string()
        .trim()
        .max(100, { message: "Address must be at most 100 characters long" })
        .optional(),
    department: z.nativeEnum(DepartmentEnum, { errorMap: () => ({ message: "Invalid department" }) }).optional(),
    role: z.nativeEnum(AudienceEnum, { errorMap: () => ({ message: "Invalid role" }) }).optional(),
});