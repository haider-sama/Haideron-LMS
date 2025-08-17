import express from "express";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { batchEnrollmentController } from "../../../controllers";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";

import dotenv from "dotenv";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const batchEnrollmentRouter = express.Router();

batchEnrollmentRouter.post(
    "/create",
    normalLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.createStudentBatchEnrollment
);

batchEnrollmentRouter.get(
    "/:programBatchId/students", 
    safeLimiter, 
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.listStudentsInBatch
);

batchEnrollmentRouter.get(
    "/enrolled-students", 
    safeLimiter, 
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.listStudentsInAllBatches
);

batchEnrollmentRouter.get(
    "/students", 
    safeLimiter, 
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.fetchPaginatedStudentsByDepartment
);

batchEnrollmentRouter.delete(
    "/delete",
    strictLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.removeStudentFromBatch
);

batchEnrollmentRouter.patch(
    "/remove", 
    normalLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.softRemoveStudentFromBatch
);

batchEnrollmentRouter.patch(
    "/reinstate", 
    normalLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    batchEnrollmentController.reinstateStudentInBatch
);

export default batchEnrollmentRouter;