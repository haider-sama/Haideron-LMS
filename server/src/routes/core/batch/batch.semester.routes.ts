import express from "express";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { batchSemesterController } from "../../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const batchSemesterRouter = express.Router();


batchSemesterRouter.post(
    "/activate",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchSemesterController.activateSemester
);

batchSemesterRouter.get(
    "/:batchId",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchSemesterController.getSemestersByBatch
);

batchSemesterRouter.get(
    "/:activatedSemesterId/courses",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchSemesterController.getCatalogueCoursesForActivatedSemester
);

batchSemesterRouter
    .put(
        "/:batchSemesterId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        batchSemesterController.updateBatchSemester
    ).patch(
        "/:batchSemesterId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        batchSemesterController.completeBatchSemester
    ).delete(
        "/:batchSemesterId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        batchSemesterController.deleteBatchSemester
    );


export default batchSemesterRouter;