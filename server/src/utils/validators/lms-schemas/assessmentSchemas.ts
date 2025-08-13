// import { z } from 'zod';
// import { AssessmentTypeEnum, FinalizedResultStatusEnum } from '../../../shared/enums';
// import mongoose from 'mongoose';

// export const CreateAssessmentSchema = z.object({
//   type: z.nativeEnum(AssessmentTypeEnum, {
//     required_error: "Assessment type is required",
//     invalid_type_error: "Invalid assessment type"
//   }),
//   title: z
//     .string({
//       required_error: "Assessment title is required"
//     })
//     .min(3, "Title must be at least 3 characters"),
//   weightage: z
//     .number({
//       required_error: "Weightage is required",
//       invalid_type_error: "Weightage must be a number"
//     })
//     .min(1, "Weightage must be at least 1%")
//     .max(100, "Weightage cannot exceed 100%"),
//   dueDate: z
//     .string({
//       required_error: "Due date is required"
//     })
//     .refine((val) => !isNaN(Date.parse(val)), {
//       message: "Due date must be a valid ISO date string"
//     }),
//   clos: z
//     .array(
//       z
//         .string()
//         .refine((id) => mongoose.Types.ObjectId.isValid(id), {
//           message: "Invalid CLO ID"
//         })
//     )
//     .min(1, "At least one CLO must be selected")
// });

// export const UpdateAssessmentSchema = z.object({
//   type: z.nativeEnum(AssessmentTypeEnum, {
//     required_error: "Assessment type is required",
//     invalid_type_error: "Invalid assessment type"
//   }),

//   title: z
//     .string({
//       required_error: "Assessment title is required"
//     })
//     .min(3, "Title must be at least 3 characters")
//     .max(100, "Title cannot exceed 100 characters"),

//   weightage: z
//     .number({
//       required_error: "Weightage is required",
//       invalid_type_error: "Weightage must be a number"
//     })
//     .min(1, "Weightage must be at least 1%")
//     .max(100, "Weightage cannot exceed 100%"),

//   dueDate: z
//     .string({
//       required_error: "Due date is required"
//     })
//     .refine((val) => !isNaN(Date.parse(val)), {
//       message: "Due date must be a valid ISO date string"
//     }),

//   clos: z
//     .array(
//       z
//         .string()
//         .refine((id) => mongoose.Types.ObjectId.isValid(id), {
//           message: "Invalid CLO ID"
//         })
//     )
//     .min(1, "At least one CLO must be selected")
// });

// export const resultEntrySchema = z.object({
//   studentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
//     message: "Invalid studentId",
//   }),
//   marksObtained: z.number().min(0, "Marks must be non-negative"),
//   totalMarks: z.number().positive("Total marks must be positive"),
// });

// export const submitResultsSchema = z.object({
//   results: z.array(resultEntrySchema).min(1, "At least one result is required"),
// });

// export const gradingRuleSchema = z.object({
//   grade: z.string().min(1),
//   minPercentage: z.number().min(0).max(100),
//   gradePoint: z.number().min(0).max(4.0),
// });

// export const saveGradingSchemeSchema = z.object({
//   section: z.string().min(1, "Section is required."),
//   rules: z.array(gradingRuleSchema).min(1, "At least one rule is required."),
// });

// export const reviewResultSchema = z.object({
//   status: z.nativeEnum(FinalizedResultStatusEnum)
//     .refine((val) => val !== FinalizedResultStatusEnum.Pending, {
//       message: "Status must be Confirmed or Rejected.",
//     }),
// });

// export const finalizeResultSchema = z.object({
//   section: z
//     .string({ required_error: "Section is required." })
//     .min(1, "Section cannot be empty.")
// });