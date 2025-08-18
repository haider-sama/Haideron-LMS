import express from "express";
import { resultController } from "../../../controllers";
import dotenv from "dotenv";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const resultRouter = express.Router();

resultRouter.post(
    "/:courseOfferingId/grading-scheme",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    resultController.saveGradingScheme
);

resultRouter.post(
    "/:courseOfferingId/finalize",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    resultController.finalizeAssessmentResults
);

resultRouter.delete(
    "/:courseOfferingId/withdraw",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    resultController.withdrawFinalizedResult
);

resultRouter.get(
    "/review/pending",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentHead),
    resultController.getPendingFinalizedResultsForReview
);

resultRouter.patch("/review/:resultId",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentHead),
    resultController.reviewFinalizedResult
);

export default resultRouter;