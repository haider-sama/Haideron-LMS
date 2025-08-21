import {
    pgTable,
    uuid,
    varchar,
    jsonb,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { SQL, sql } from "drizzle-orm";
import { tsvector } from "../core/tsvector";

/**
 * AUDIT LOG (generic, lightweight, partitionable)
 *
 * - No enums: action/entityType are free-form strings managed at app layer.
 * - Minimal columns: who, what, on what, when, extra (jsonb).
 * - Indexed for frequent lookups: by entity, actor, action, and time.
 * - Scales to hundreds of millions via Postgres native partitioning.
 */
export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        // What happened (free-form; keep short & consistent at the app layer)
        action: varchar("action", { length: 80 }).notNull(),

        // Who did it (usually users.id UUID; keep as uuid for compact btree index)
        actorId: uuid("actor_id").notNull(),

        // Which domain object (free-form type + id keeps schema generic)
        entityType: varchar("entity_type", { length: 80 }).notNull(),
        entityId: varchar("entity_id", { length: 80 }).notNull(),

        // Optional small JSON payload for context (diffs, extra ids, etc.)
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default(sql`'{}'::jsonb`),

        // When it happened (also used as partitioning key)
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),

        searchVector: tsvector("search_vector").generatedAlwaysAs(
            (): SQL => sql`
        setweight(to_tsvector('english', coalesce(${auditLogs.action}, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(${auditLogs.entityType}, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(${auditLogs.entityId}, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(${auditLogs.metadata}::text, '')), 'D')
      `
        ),
    },
    (table) => [
        // Fast per-entity timeline queries
        index("audit_logs_entity_timeline_idx").on(
            table.entityType,
            table.entityId,
            table.createdAt
        ),

        // Fast per-actor timeline queries
        index("audit_logs_actor_timeline_idx").on(table.actorId, table.createdAt),

        // Fast per-action timeline / analytics
        index("audit_logs_action_timeline_idx").on(table.action, table.createdAt),

        // Common time-sorted scans
        index("audit_logs_created_at_idx").on(table.createdAt),

        // Optional: GIN on metadata for key/exists queries
        index("audit_logs_metadata_gin_idx").using("gin", table.metadata),

        // GIN index for search
        index("audit_logs_search_idx").using("gin", table.searchVector),
    ]
);

// Types
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
