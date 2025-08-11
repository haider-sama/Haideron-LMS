import { pgTable, timestamp, uuid, index, uniqueIndex, boolean, jsonb } from "drizzle-orm/pg-core";
import { courses } from "./course.model";
import { programBatches } from "../program/program.batch.model";
import { activatedSemesters } from "../semester/activated.semester.model";
import { sql } from "drizzle-orm";

export const scheduleSlotType = {
    // JSON: { [section: string]: ScheduleSlot[] }
    sectionSchedules: jsonb("section_schedules").notNull().default(sql`'{}'`),
    startTime: "string", // stored as string in JSON, validated by app
    endTime: "string",
};

export const courseOfferings = pgTable(
    "course_offerings",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
        programBatchId: uuid("program_batch_id").notNull().references(() => programBatches.id, { onDelete: "cascade" }),
        activatedSemesterId: uuid("activated_semester_id").notNull().references(() => activatedSemesters.id, { onDelete: "cascade" }),
        sectionSchedules: jsonb("section_schedules").notNull().default(sql`'{}'`), // Map<string, ScheduleSlot[]>
        capacityPerSection: jsonb("capacity_per_section").notNull().default(sql`'{}'`), // Map<string, number>
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        index("course_offerings_course_idx").on(table.courseId),
        index("course_offerings_program_batch_idx").on(table.programBatchId),
        index("course_offerings_activated_semester_idx").on(table.activatedSemesterId),
        uniqueIndex("course_offerings_unique").on(table.courseId, table.programBatchId, table.activatedSemesterId),
    ]
);