import { pgTable, timestamp, uuid, index, uniqueIndex, pgEnum, integer, varchar } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { courseOfferings } from "../course/course.offering.model";
import { AssessmentTypeEnum } from "../../../../shared/enums";
import { clos } from "../course/course.model";

export const assessmentTypeEnum = pgEnum(
    "assessment_type_enum",
    Object.values(AssessmentTypeEnum) as [string, ...string[]]
);

// -----------
// Assessments
// -----------

export const assessments = pgTable(
    "assessments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        courseOfferingId: uuid("course_offering_id")
            .notNull()
            .references(() => courseOfferings.id, { onDelete: "cascade" }),
        type: assessmentTypeEnum("type").notNull(),
        title: varchar("title", { length: 100 }).notNull(),
        weightage: integer("weightage").notNull(), // percent 0-100
        dueDate: timestamp("due_date").notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("assessments_unique_course_title").on(
            table.courseOfferingId,
            table.title
        ),
        index("assessments_course_offering_idx").on(table.courseOfferingId),
        index("assessments_due_date_idx").on(table.dueDate),
    ]
);

// Since clos is an array of ObjectIds, create join table for assessment-clos mapping

export const assessmentClos = pgTable(
    "assessment_clos",
    {
        assessmentId: uuid("assessment_id")
            .notNull()
            .references(() => assessments.id, { onDelete: "cascade" }),
        cloId: uuid("clo_id").notNull().references(() => clos.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("assessment_clos_unique").on(table.assessmentId, table.cloId),
        index("assessment_clos_assessment_idx").on(table.assessmentId),
        index("assessment_clos_clo_idx").on(table.cloId),
    ]
);

// -----------
// Assessment Results
// -----------

export const assessmentResults = pgTable(
    "assessment_results",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        assessmentId: uuid("assessment_id")
            .notNull()
            .references(() => assessments.id, { onDelete: "cascade" }),
        studentId: uuid("student_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        marksObtained: integer("marks_obtained").notNull(),
        totalMarks: integer("total_marks").notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("assessment_results_unique_assessment_student").on(
            table.assessmentId,
            table.studentId
        ),
        index("assessment_results_assessment_idx").on(table.assessmentId),
        index("assessment_results_student_idx").on(table.studentId),
    ]
);

// TODO:
// Validation like marksObtained <= totalMarks should be done in application logic or DB triggers, 
// as Drizzle does not support custom validators.