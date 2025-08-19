import express from "express";
import { assessmentController } from "../../../controllers";
import dotenv from "dotenv";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const assessmentRouter = express.Router();


assessmentRouter
    .post(
        "/:courseOfferingId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        assessmentController.createAssessment
    ).get(
        "/:courseOfferingId",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher, AudienceEnum.Student),
        assessmentController.getCourseAssessments
    );

assessmentRouter
    .put(
        "/:assessmentId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        assessmentController.updateAssessment
    ).delete(
        "/:assessmentId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        assessmentController.deleteAssessment
    );

assessmentRouter
    .post(
        "/:id/results",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        assessmentController.submitBulkAssessmentResults
    ).get(
        "/:id/results",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentHead, AudienceEnum.DepartmentTeacher, AudienceEnum.Student),
        assessmentController.getAssessmentResults
    );


export default assessmentRouter;