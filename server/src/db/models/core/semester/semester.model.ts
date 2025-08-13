import { pgTable, integer, timestamp, uuid, index, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { programCatalogues } from "../program/program.catalogue.model";
import { courses } from "../course/course.model";

export const semesters = pgTable(
    "semesters",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        programCatalogueId: uuid("program_catalogue_id").notNull().references(() => programCatalogues.id, { onDelete: "cascade" }),
        semesterNo: integer("semester_no").notNull(),
        isArchived: boolean("is_archived").notNull().default(false),
        archivedAt: timestamp("archived_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("semesters_program_catalogue_semester_no_unique").on(table.programCatalogueId, table.semesterNo),
        index("semesters_program_catalogue_id_idx").on(table.programCatalogueId),
    ]
);

// Since courses is an array of ObjectIds (many-to-many relation),
// create a join table semester_courses:

export const semesterCourses = pgTable(
    "semester_courses",
    {
        semesterId: uuid("semester_id").notNull().references(() => semesters.id, { onDelete: "cascade" }),
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("semester_courses_semester_course_unique").on(table.semesterId, table.courseId),
        index("semester_courses_semester_id_idx").on(table.semesterId),
        index("semester_courses_course_id_idx").on(table.courseId),
    ]
);