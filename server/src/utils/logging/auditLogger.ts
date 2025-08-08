import AuditLog from "../../models/logs/audit.log.model";

export const logAuditEvent = async ({
    actor,
    action,
    entityType,
    entityId,
    metadata = {},
}: {
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
}) => {
    try {
        await AuditLog.create({
            actor,
            action,
            entityType,
            entityId,
            metadata,
        });
    } catch (err) {
        console.error("Failed to write audit log:", err); // Don’t crash app on logging error
    }
};
