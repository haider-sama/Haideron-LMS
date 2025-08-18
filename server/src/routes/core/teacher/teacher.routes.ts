import express from "express";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { teacherCourseController } from "../../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const teacherRouter = express.Router();

teacherRouter.get(
    "/assigned-course-offerings/:activatedSemesterId",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    teacherCourseController.getAssignedCourseOfferings
);

teacherRouter.get("/assigned-course-offerings", 
    safeLimiter, 
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    teacherCourseController.getAllAssignedCourseOfferings
);

teacherRouter.get(
    "/dashboard", 
    safeLimiter, 
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    teacherCourseController.getFacultyDashboardContext
);

teacherRouter.get(
    "/courses/:offeringId/sections/:section/enrolled-students", 
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentTeacher),
    teacherCourseController.getEnrolledStudentsForCourse
);

export default teacherRouter;