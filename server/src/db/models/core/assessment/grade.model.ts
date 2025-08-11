import { pgTable, timestamp, uuid, index, uniqueIndex, pgEnum, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { courseOfferings } from "../course/course.offering.model";
import { AssessmentTypeEnum, FinalizedResultStatusEnum } from "../../../../shared/enums";
import { clos } from "../course/course.model";

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