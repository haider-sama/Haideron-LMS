import { z } from "zod";

export const CreateAttendanceSessionSchema = z.object({
    date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
});

export const CreateAttendanceRecordSchema = z.object({
    studentId: z.string().min(1),
    present: z.boolean(),
});

export const MarkAttendanceSchema = z.object({
    records: z.array(CreateAttendanceRecordSchema).min(1),
});

export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
