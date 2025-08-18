import { pgTable, timestamp, uuid, index, varchar, boolean, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { courseOfferings } from "../course/course.offering.model";
import { programBatches } from "../program/program.batch.model";
import { BatchEnrollmentStatus } from "../../../../shared/enums";
import { relations } from "drizzle-orm";

export const enrollments = pgTable(
    "enrollments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
        enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
        section: varchar("section", { length: 1 }).notNull(), // /^[A-Z]$/ validated in app
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        // Indexes for common filters and joins:
        index("enrollments_student_idx").on(table.studentId),
        index("enrollments_course_offering_idx").on(table.courseOfferingId),

        // Unique constraint to prevent duplicate enrollment for same student in same course offering and section
        uniqueIndex("enrollments_student_course_section_unique").on(table.studentId, table.courseOfferingId, table.section),

        // Composite indexes to speed up common queries involving active enrollments
        index("enrollments_student_active_idx").on(table.studentId, table.isActive),
        index("enrollments_course_offering_active_idx").on(table.courseOfferingId, table.isActive),
    ]
);

export const batchEnrollmentStatusEnum = pgEnum("batch_enrollment_status_enum",
    Object.values(BatchEnrollmentStatus) as [string, ...string[]]);

export const studentBatchEnrollments = pgTable(
    "student_batch_enrollments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        programBatchId: uuid("program_batch_id").notNull()
            .references(() => programBatches.id, { onDelete: "cascade" }),
        status: batchEnrollmentStatusEnum("status").notNull().default(BatchEnrollmentStatus.Active),
        enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("student_batch_enrollments_unique").on(table.studentId, table.programBatchId),
        index("student_batch_enrollments_student_idx").on(table.studentId),
        index("student_batch_enrollments_program_batch_idx").on(table.programBatchId),
    ]
);

export const enrollmentsUsersRelations = relations(users, ({ many }) => ({
    enrollments: many(studentBatchEnrollments), // one user can have many batch enrollments
}));

export const studentBatchEnrollmentsRelations = relations(studentBatchEnrollments, ({ one }) => ({
    student: one(users, {
        fields: [studentBatchEnrollments.studentId],
        references: [users.id],
    }),
    programBatch: one(programBatches, {
        fields: [studentBatchEnrollments.programBatchId],
        references: [programBatches.id],
    }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    courseOffering: one(courseOfferings, {
        fields: [enrollments.courseOfferingId],
        references: [courseOfferings.id],
    }),
    student: one(users, {
        fields: [enrollments.studentId],
        references: [users.id],
    }),
}));