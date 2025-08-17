import { z } from "zod";
import { BatchEnrollmentStatus } from "../../../shared/enums";

export const createEnrollmentSchema = z.object({
    studentId: z.string().optional(),          // single student
    studentIds: z.array(z.string()).optional(), // multiple students
    programBatchId: z.string(),
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
    studentId: z.string(),
    programBatchId: z.string(),
});