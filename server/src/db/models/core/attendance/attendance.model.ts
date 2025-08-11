import { pgTable, timestamp, uuid, index, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { courseOfferings } from "../course/course.offering.model";

// -----------
// Attendance Sessions
// -----------

export const attendanceSessions = pgTable(
    "attendance_sessions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        courseOfferingId: uuid("course_offering_id")
            .notNull()
            .references(() => courseOfferings.id, { onDelete: "cascade" }),
        date: timestamp("date", { mode: "date" }).notNull(), // store as date only
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("attendance_sessions_unique_course_date").on(
            table.courseOfferingId,
            table.date
        ),
        index("attendance_sessions_course_offering_idx").on(table.courseOfferingId),
        index("attendance_sessions_date_idx").on(table.date),
    ]
);

// -----------
// Attendance Records
// -----------

export const attendanceRecords = pgTable(
    "attendance_records",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        attendanceSessionId: uuid("attendance_session_id")
            .notNull()
            .references(() => attendanceSessions.id, { onDelete: "cascade" }),
        studentId: uuid("student_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        present: boolean("present").notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("attendance_records_unique_session_student").on(
            table.attendanceSessionId,
            table.studentId
        ),
        index("attendance_records_session_idx").on(table.attendanceSessionId),
        index("attendance_records_student_idx").on(table.studentId),
    ]
);