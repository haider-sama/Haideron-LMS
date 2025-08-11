import { pgTable, integer, boolean, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { programs } from "./program.model";

export const programCatalogues = pgTable(
    "program_catalogues",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
        catalogueYear: integer("catalogue_year").notNull(),
        createdBy: uuid("created_by").notNull().references(() => users.id),
        isArchived: boolean("is_archived").notNull().default(false),
        archivedAt: timestamp("archived_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("program_catalogues_program_year_unique").on(table.programId, table.catalogueYear),
        index("program_catalogues_program_id_idx").on(table.programId),
        index("program_catalogues_created_by_idx").on(table.createdBy),
    ]
);

// TODO:
// ALTER TABLE program_catalogues
// ADD CONSTRAINT catalogue_year_range CHECK (catalogue_year >= 2000 AND catalogue_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10);