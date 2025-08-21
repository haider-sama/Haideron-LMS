import { auditLogs, NewAuditLog } from "../../db/models/logs/audit.log.model";

type WriteAuditLogInput = Omit<NewAuditLog, "id" | "createdAt" | "metadata"> & {
    metadata?: Record<string, unknown>;
};

/**
 * Simple helper to insert an audit log
 *
 * Example:
 *   await writeAuditLog(db, {
 *     action: "USER_LOGIN",
 *     actorId: user.id,
 *     entityType: "user",
 *     entityId: user.id,
 *     metadata: { ip: req.ip }
 *   });
 */
export async function writeAuditLog(db: any, log: WriteAuditLogInput) {
    return db.insert(auditLogs).values({
        ...log,
        metadata: log.metadata ?? {},
    });
}