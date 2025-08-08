import { z } from "zod";

export const AuditLogQuerySchema = z.object({
    actor: z.string().optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    from: z.coerce.date().optional(), // convert string to Date
    to: z.coerce.date().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});