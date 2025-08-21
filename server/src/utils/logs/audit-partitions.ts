import { sql } from "drizzle-orm";

/**
 * Build partition table name like: audit_logs_2025_08
 */
export const auditPartitionName = (year: number, month: number) =>
    `audit_logs_${year}_${String(month).padStart(2, "0")}`;

/**
 * Generate SQL to create a monthly partition.
 * - Each partition is [start, next).
 * - Example: 2025-08 covers from Aug 1 to Sep 1.
 */
export const createAuditPartition = (year: number, month: number) => {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const next =
        month === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    return sql`
    CREATE TABLE IF NOT EXISTS ${sql.raw(auditPartitionName(year, month))}
    PARTITION OF audit_logs
    FOR VALUES FROM ('${start}') TO ('${next}');
  `;
};

/**
 * Generate SQL to add indexes to a given partition.
 * Keep them *local* so each partition’s index stays small.
 */
export const indexAuditPartition = (year: number, month: number) => {
    const table = auditPartitionName(year, month);

    return [
        sql`CREATE INDEX IF NOT EXISTS ${sql.raw(table + "_entity_timeline_idx")}
        ON ${sql.raw(table)} (entity_type, entity_id, created_at);`,

        sql`CREATE INDEX IF NOT EXISTS ${sql.raw(table + "_actor_timeline_idx")}
        ON ${sql.raw(table)} (actor_id, created_at);`,

        sql`CREATE INDEX IF NOT EXISTS ${sql.raw(table + "_action_timeline_idx")}
        ON ${sql.raw(table)} (action, created_at);`,

        sql`CREATE INDEX IF NOT EXISTS ${sql.raw(table + "_created_at_idx")}
        ON ${sql.raw(table)} (created_at);`,

        sql`CREATE INDEX IF NOT EXISTS ${sql.raw(table + "_metadata_gin_idx")}
        ON ${sql.raw(table)} USING gin (metadata);`,
    ];
};

/**
 * High-level helper: create partition + indexes in one go.
 */
export const ensureAuditPartition = (year: number, month: number) => {
    return [
        createAuditPartition(year, month),
        ...indexAuditPartition(year, month),
    ];
};

/**
 * Utility to auto-provision current + next month partitions.
 * Example usage inside a migration or startup hook.
 */
export const provisionAuditPartitions = () => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1; // JS months are 0-based

    return [
        ...ensureAuditPartition(y, m), // current month
        ...ensureAuditPartition(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1), // next month
    ];
};

/**
 * Generate DROP TABLE statements for all partitions strictly before (year, month).
 * Useful for retention jobs (e.g., drop data older than 24 months).
 */
export const dropAuditPartitionsBefore = (year: number, month: number) => {
    const now = new Date();
    const partitions: string[] = [];

    for (let y = 2000; y <= year; y++) {
        for (let m = 1; m <= 12; m++) {
            if (y < year || m < month) {
                if (y === year && m >= month) break;
                partitions.push(auditPartitionName(y, m));
            }
        }
    }

    return partitions.map(
        (table) => sql`DROP TABLE IF EXISTS ${sql.raw(table)} CASCADE;`
    );
};
