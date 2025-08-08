import { z } from "zod";
import mongoose from "mongoose";
import { BatchEnrollmentStatus } from "../../../shared/enums";

export const createEnrollmentSchema = z.object({
    studentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid studentId format",
    }),
    programBatchId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid programBatchId format",
    }),
    status: z
        .enum([BatchEnrollmentStatus.Active, BatchEnrollmentStatus.Graduated, BatchEnrollmentStatus.Dropped])
        .optional(),
});

export const defaultEnrollmentSchema = z.object({
  studentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid studentId format",
  }),
  programBatchId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid programBatchId format",
  }),
});