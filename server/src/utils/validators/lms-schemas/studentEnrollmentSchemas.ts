import { z } from "zod";
import { BatchEnrollmentStatus } from "../../../shared/enums";

export const createEnrollmentSchema = z.object({
    studentId: z.string().uuid().optional(),          // single student
    studentIds: z.array(z.string().uuid()).optional(), // multiple students
    programBatchId: z.string().uuid(),
    status: z
        .enum([BatchEnrollmentStatus.Active, BatchEnrollmentStatus.Graduated, BatchEnrollmentStatus.Dropped])
        .optional(),
}).refine(
    (data) => data.studentId || (data.studentIds && data.studentIds.length > 0),
    {
        message: "Provide either studentId or studentIds",
        path: ["studentIds"], // attach to studentIds instead of global
    }
);

export const defaultEnrollmentSchema = z.object({
    studentId: z.string().uuid(),
    programBatchId: z.string().uuid(),
});