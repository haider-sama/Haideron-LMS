import { pgTable, integer, timestamp, uuid, index, uniqueIndex, pgEnum, varchar, text, boolean } from "drizzle-orm/pg-core";
import { ClassSectionEnum, DomainEnum, KnowledgeAreaEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../../shared/enums";
import { plos, programs, strengthEnum } from "../program/program.model";
import { users } from "../../auth/user.model";
import { programCatalogues } from "../program/program.catalogue.model";

// Enums
export const subjectLevelEnum = pgEnum("subject_level_enum", Object.values(SubjectLevelEnum) as [string, ...string[]]);
export const subjectTypeEnum = pgEnum("subject_type_enum", Object.values(SubjectTypeEnum) as [string, ...string[]]);
export const knowledgeAreaEnum = pgEnum("knowledge_area_enum", Object.values(KnowledgeAreaEnum) as [string, ...string[]]);
export const domainEnum = pgEnum("domain_enum", Object.values(DomainEnum) as [string, ...string[]]);
export const classSectionEnum = pgEnum("class_section_enum", Object.values(ClassSectionEnum) as [string, ...string[]]);

export const clos = pgTable(
    "clos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        code: varchar("code", { length: 10 }).notNull(), // e.g. "CLO1"
        title: text("title").notNull(),
        description: text("description").notNull(),
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("clos_course_code_unique").on(table.courseId, table.code),
        index("clos_course_id_idx").on(table.courseId),
    ]
);

export const cloPloMappings = pgTable(
    "clo_plo_mappings",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        cloId: uuid("clo_id").notNull().references(() => clos.id, { onDelete: "cascade" }),
        ploId: uuid("plo_id").notNull().references(() => plos.id, { onDelete: "cascade" }),
        strength: strengthEnum("strength").notNull(),
    },
    (table) => [
        uniqueIndex("clo_plo_unique").on(table.cloId, table.ploId),
        index("clo_plo_plo_id_idx").on(table.ploId),
    ]
);

export const courses = pgTable(
    "courses",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
        programCatalogueId: uuid("program_catalogue_id").notNull()
            .references(() => programCatalogues.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        code: varchar("code", { length: 50 }).notNull(),
        codePrefix: varchar("code_prefix", { length: 10 }).notNull(),
        description: text("description").notNull(),
        subjectLevel: subjectLevelEnum("subject_level").notNull(),
        subjectType: subjectTypeEnum("subject_type").notNull(),
        contactHours: integer("contact_hours").notNull(),
        creditHours: integer("credit_hours").notNull(),
        knowledgeArea: knowledgeAreaEnum("knowledge_area").notNull(),
        domain: domainEnum("domain").notNull(),
        isArchived: boolean("is_archived").notNull().default(false),
        archivedAt: timestamp("archived_at"),
        createdBy: uuid("created_by").notNull().references(() => users.id),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("courses_code_unique").on(table.code),
        index("courses_program_id_idx").on(table.programId),
        index("courses_program_catalogue_id_idx").on(table.programCatalogueId),
        index("courses_created_by_idx").on(table.createdBy),
    ]
);

export const coursePreRequisites = pgTable(
    "course_pre_requisites",
    {
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
        preReqCourseId: uuid("pre_req_course_id").notNull()
            .references(() => courses.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("course_pre_req_unique").on(table.courseId, table.preReqCourseId),
        index("course_pre_req_course_idx").on(table.courseId),
    ]
);

export const courseCoRequisites = pgTable(
    "course_co_requisites",
    {
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
        coReqCourseId: uuid("co_req_course_id").notNull()
            .references(() => courses.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("course_co_req_unique").on(table.courseId, table.coReqCourseId),
        index("course_co_req_course_idx").on(table.courseId),
    ]
);

export const courseSectionTeachers = pgTable(
    "course_section_teachers",
    {
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
        section: classSectionEnum("section").notNull(),
        teacherId: uuid("teacher_id").notNull().references(() => users.id),
    },
    (table) => [
        uniqueIndex("course_section_teacher_unique").on(table.courseId, table.section),
        index("course_section_teacher_course_idx").on(table.courseId),
    ]
);

export const courseSections = pgTable(
    "course_sections",
    {
        courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
        section: classSectionEnum("section").notNull(),
    },
    (table) => [
        uniqueIndex("course_section_unique").on(table.courseId, table.section),
    ]
);

// TODO:
// Validation like creditHours >= contactHours
// and uniqueness of sections needs to be done in your app or with DB triggers / migrations.