import { pgTable, timestamp, uuid, index, uniqueIndex, pgEnum, integer, varchar, jsonb, numeric } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { courseOfferings } from "../course/course.offering.model";
import { FinalizedResultStatusEnum } from "../../../../shared/enums";
import { relations } from "drizzle-orm";

export const finalizedResultStatusEnumPg = pgEnum(
    "finalized_result_status_enum",
    Object.values(FinalizedResultStatusEnum) as [string, ...string[]]
);

// ------------------
// Finalized Results
// ------------------

export const finalizedResults = pgTable(
    "finalized_results",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        courseOfferingId: uuid("course_offering_id")
            .notNull()
            .references(() => courseOfferings.id, { onDelete: "cascade" }),
        section: varchar("section", { length: 1 }).notNull(), // e.g., "A", "B"
        submittedBy: uuid("submitted_by").notNull().references(() => users.id),
        // store results as JSON array [{studentId, grade, gradePoint, weightedPercentage}, ...]
        results: jsonb("results").notNull(),
        status: finalizedResultStatusEnumPg("status")
            .notNull()
            .default(FinalizedResultStatusEnum.Pending),
        reviewedBy: uuid("reviewed_by").references(() => users.id),
        reviewedAt: timestamp("reviewed_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("finalized_results_course_section_unique").on(
            table.courseOfferingId,
            table.section
        ),
        index("finalized_results_submitted_by_idx").on(table.submittedBy),
        index("finalized_results_reviewed_by_idx").on(table.reviewedBy),
    ]
);

// -------------------------
// Finalized Results Entries
// -------------------------

export const finalizedResultEntries = pgTable("finalized_result_entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    finalizedResultId: uuid("finalized_result_id")
        .notNull()
        .references(() => finalizedResults.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    grade: varchar("grade", { length: 2 }).notNull(),  // e.g. "A", "B+"
    gradePoint: numeric("grade_point", { precision: 3, scale: 2 }).notNull(), // e.g. 3.67
    weightedPercentage: numeric("weighted_percentage", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ------------------
// Custom Grading Scheme
// ------------------

export const customGradingSchemes = pgTable(
    "custom_grading_schemes",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        courseOfferingId: uuid("course_offering_id")
            .notNull()
            .references(() => courseOfferings.id, { onDelete: "cascade" }),
        section: varchar("section", { length: 1 }).notNull(),
        createdBy: uuid("created_by").notNull().references(() => users.id),
        rules: jsonb("rules").notNull(), // array of grading rules [{grade, minPercentage, gradePoint}, ...]
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("custom_grading_schemes_course_section_unique").on(
            table.courseOfferingId,
            table.section
        ),
        index("custom_grading_schemes_created_by_idx").on(table.createdBy),
    ]
);

export const finalizedResultsRelations = relations(finalizedResults, ({ one }) => ({
    courseOffering: one(courseOfferings, {
        fields: [finalizedResults.courseOfferingId],
        references: [courseOfferings.id],
    }),
    submittedByUser: one(users, {
        fields: [finalizedResults.submittedBy],
        references: [users.id],
    }),
    reviewedByUser: one(users, {
        fields: [finalizedResults.reviewedBy],
        references: [users.id],
    }),
}));