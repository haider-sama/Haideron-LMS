import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/auth";
import { auditLogController } from "../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../utils/limiter/rateLimiter";
import { AudienceEnum } from "../shared/enums";

dotenv.config();
const auditLogRouter = express.Router();

// Admin Routes
auditLogRouter.get(
    "/",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin),
    auditLogController.fetchPaginatedAuditLogs
);

export default auditLogRouter;