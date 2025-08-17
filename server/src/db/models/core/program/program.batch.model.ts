import { pgTable, integer, boolean, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "../../auth/user.model";
import { programs } from "./program.model";
import { programCatalogues } from "./program.catalogue.model";
import { relations, SQL, sql } from "drizzle-orm";
import { tsvector } from "../tsvector";

export const programBatches = pgTable(
    "program_batches",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
        programCatalogueId: uuid("program_catalogue_id").notNull()
            .references(() => programCatalogues.id, { onDelete: "cascade" }),
        sessionYear: integer("session_year").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdBy: uuid("created_by").notNull().references(() => users.id),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("program_batches_program_session_unique").on(table.programId, table.sessionYear),
        index("program_batches_program_id_idx").on(table.programId),
        index("program_batches_program_catalogue_id_idx").on(table.programCatalogueId),
        index("program_batches_created_by_idx").on(table.createdBy),
    ]
);

export const programBatchesRelations = relations(programBatches, ({ one }) => ({
    program: one(programs, {
        fields: [programBatches.programId],
        references: [programs.id],
    }),
    programCatalogue: one(programCatalogues, {
        fields: [programBatches.programCatalogueId],
        references: [programCatalogues.id],
    }),
}));