// import { z } from "zod";

// export const CreateAttendanceSessionSchema = z.object({
//   date: z
//     .string()
//     .refine((val) => !isNaN(Date.parse(val)), {
//       message: "Invalid date format",
//     }),
// });

// export const AttendanceRecordSchema = z.object({
//     studentId: z.string().min(1),
//     present: z.boolean(),
// });

// export const MarkAttendanceSchema = z.object({
//     records: z.array(AttendanceRecordSchema).min(1),
// });