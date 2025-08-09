import { z } from "zod";

const ScheduleSlotSchema = z.object({
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  startTime: z.string(), // optionally add regex for "HH:mm" if you want strict time format
  endTime: z.string(),
});

export const UpdateCourseOfferingSchema = z.object({
  sectionSchedules: z
    .record(z.array(ScheduleSlotSchema), {
      invalid_type_error: "Section schedules must be an object of arrays",
    })
    .optional(),

  capacityPerSection: z
    .record(z.number().positive("Capacity must be greater than 0"), {
      invalid_type_error: "Capacity per section must be an object with numbers",
    })
    .optional(),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional(),

  course: z
    .string({
      required_error: "Course ID is required",
      invalid_type_error: "Course must be a string",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Course ID format",
    })
    .optional(),

  programBatch: z
    .string({
      required_error: "Program Batch ID is required",
      invalid_type_error: "Program Batch must be a string",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Program Batch ID format",
    })
    .optional(),

  activatedSemester: z
    .string({
      required_error: "Activated Semester ID is required",
      invalid_type_error: "Activated Semester must be a string",
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: "Invalid Activated Semester ID format",
    })
    .optional(),
});