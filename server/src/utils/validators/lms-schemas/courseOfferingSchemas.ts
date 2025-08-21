import { z } from "zod";

const ScheduleSlotSchema = z.object({
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be in HH:mm format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be in HH:mm format"),
});

// Define offerings
const CourseOfferingSchema = z.object({
  courseId: z.string().uuid(),
  sectionSchedules: z.record(z.array(ScheduleSlotSchema)).optional(),
  capacityPerSection: z.record(z.number().int().nonnegative()).optional(),
});

// Validate the entire payload
export const CreateCourseOfferingsSchema = z.object({
  offerings: z.array(CourseOfferingSchema).min(1, "Offerings array cannot be empty"),
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
    .uuid()
    .optional(),

  programBatch: z
    .string({
      required_error: "Program Batch ID is required",
      invalid_type_error: "Program Batch must be a string",
    })
    .uuid()
    .optional(),

  activatedSemester: z
    .string({
      required_error: "Activated Semester ID is required",
      invalid_type_error: "Activated Semester must be a string",
    })
    .uuid()
    .optional(),
});