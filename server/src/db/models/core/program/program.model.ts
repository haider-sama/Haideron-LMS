import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { StrengthEnum } from "../../../../shared/enums";
import { degreeEnum, departmentEnum, users } from "../../auth/user.model";

export const strengthEnum = pgEnum("strength_enum", Object.values(StrengthEnum) as [string, ...string[]]);

// -----------
// PLO Table
// -----------
export const plos = pgTable(
    "plos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        code: varchar("code", { length: 10 }).notNull(),
        title: text("title").notNull(),
        description: text("description").notNull(),
        programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("plos_program_code_unique").on(table.programId, table.code),
        index("plos_program_id_idx").on(table.programId),
    ]
);

// -----------
// PEO Table
// -----------
export const peos = pgTable(
    "peos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        title: text("title").notNull(),
        description: text("description").notNull(),
        programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
    },
    (table) => [
        index("peos_program_id_idx").on(table.programId),
    ]
);

// -------------------
// PEO - PLO Mapping Table
// -------------------
export const peoPloMappings = pgTable(
    "peo_plo_mappings",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        peoId: uuid("peo_id").notNull().references(() => peos.id, { onDelete: "cascade" }),
        ploId: uuid("plo_id").notNull().references(() => plos.id, { onDelete: "cascade" }),
        strength: strengthEnum("strength").notNull(),
    },
    (table) => [
        uniqueIndex("peo_plo_unique").on(table.peoId, table.ploId),
        index("peo_plo_plo_id_idx").on(table.ploId),
    ]
);

// --------------
// Programs Table
// --------------
export const programs = pgTable(
    "programs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        title: varchar("title", { length: 255 }).notNull(),
        programLevel: degreeEnum("program_level").notNull(),
        departmentTitle: departmentEnum("department_title").notNull(),
        maxDurationYears: integer("max_duration_years").notNull(),
        minCreditHours: integer("min_credit_hours").notNull().default(0),
        maxCreditHours: integer("max_credit_hours").notNull().default(0),
        requirements: text("requirements"),
        vision: text("vision"),
        mission: text("mission"),
        createdBy: uuid("created_by").notNull().references(() => users.id), // Assuming users table exists
        isArchived: boolean("is_archived").notNull().default(false),
        archivedAt: timestamp("archived_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("programs_title_unique").on(table.title),
        index("programs_created_by_idx").on(table.createdBy),
    ]
);