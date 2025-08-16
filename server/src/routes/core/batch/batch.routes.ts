import express from "express";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { batchController } from "../../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const batchRouter = express.Router();

batchRouter.post(
    "/create",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchController.createProgramBatch
);

batchRouter.get(
    "/",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchController.getBatchesByProgram
);

batchRouter
    .get(
        "/:batchId",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        batchController.getBatchById
    ).put(
        "/:batchId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        batchController.updateBatchById
    );

export default batchRouter;