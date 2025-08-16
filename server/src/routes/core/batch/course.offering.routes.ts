import express from "express";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { courseOfferingController } from "../../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const courseOfferingRouter = express.Router();

courseOfferingRouter
    .post(
        "/:activatedSemesterId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        courseOfferingController.createCourseOfferings
    ).get(
        "/:activatedSemesterId",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead,
            AudienceEnum.DepartmentTeacher, AudienceEnum.Student),
        courseOfferingController.getCourseOfferings
    );

courseOfferingRouter
    .put(
        "/:offeringId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        courseOfferingController.updateCourseOffering
    ).delete(
        "/:offeringId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        courseOfferingController.deleteCourseOffering
    );

export default courseOfferingRouter;