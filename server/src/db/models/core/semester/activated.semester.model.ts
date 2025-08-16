import { pgTable, integer, timestamp, uuid, index, uniqueIndex, pgEnum, boolean } from "drizzle-orm/pg-core";
import { TermEnum } from "../../../../shared/enums";
import { programBatches } from "../program/program.batch.model";
import { relations } from "drizzle-orm";

export const termEnum = pgEnum("term_enum", Object.values(TermEnum) as [string, ...string[]]);

export const activatedSemesters = pgTable(
  "activated_semesters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programBatchId: uuid("program_batch_id").notNull().references(() => programBatches.id, { onDelete: "cascade" }),
    semesterNo: integer("semester_no").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    term: termEnum("term").notNull(),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    enrollmentDeadline: timestamp("enrollment_deadline"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("activated_semesters_batch_semester_unique").on(table.programBatchId, table.semesterNo),
    index("activated_semesters_program_batch_id_idx").on(table.programBatchId),
  ]
);

export const activatedSemestersRelations = relations(activatedSemesters, ({ one }) => ({
  programBatch: one(programBatches, {
    fields: [activatedSemesters.programBatchId],
    references: [programBatches.id],
  }),
}));