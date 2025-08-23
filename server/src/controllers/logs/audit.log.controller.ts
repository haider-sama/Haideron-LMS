import { Request, Response } from "express";
import { INTERNAL_SERVER_ERROR, OK } from "../../constants/http";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { auditLogs } from "../../db/models/logs/audit.log.model";
import { assertAdmin } from "../admin/admin.controller";

export async function fetchPaginatedAuditLogs(req: Request, res: Response) {
    const isAdmin = await assertAdmin(req, res);
    if (isAdmin !== true) return isAdmin;

    try {
        const page = Math.max(parseInt(req.query.page as string) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offsetVal = (page - 1) * limit;

        const search = (req.query.search as string || "").trim();

        // Optional filters
        const filterActorId = req.query.actorId as string | undefined;
        const filterEntityType = req.query.entityType as string | undefined;
        const filterAction = req.query.action as string | undefined;

        const filters: any[] = [];

        if (filterActorId) filters.push(eq(auditLogs.actorId, filterActorId));
        if (filterEntityType) filters.push(eq(auditLogs.entityType, filterEntityType));
        if (filterAction) filters.push(eq(auditLogs.action, filterAction));

        // Full-text search including actorId
        if (search.length > 0) {
            filters.push(
                sql`${auditLogs.searchVector} @@ websearch_to_tsquery('simple', ${search})`
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Fetch paginated logs
        const logs = await db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                actorId: auditLogs.actorId,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                metadata: auditLogs.metadata,
                createdAt: auditLogs.createdAt,
            })
            .from(auditLogs)
            .where(whereClause)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offsetVal);

        // Count total
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(auditLogs)
            .where(whereClause);

        const totalLogs = Number(count);

        return res.status(OK).json({
            data: logs,
            page,
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs,
        });
    } catch (err: any) {
        console.error("Error fetching audit logs:", err);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Cannot fetch audit logs", error: err.message });
    }
}