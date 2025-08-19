import express from "express";
import { authorizeRoles, verifyToken } from "../../middleware/auth";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../utils/limiter/rateLimiter";
import { courseController } from "../../controllers";
import { AudienceEnum } from "../../shared/enums";

dotenv.config();
const courseRouter = express.Router();


courseRouter.post(
    "/create",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    courseController.createCourse
);

courseRouter.get(
    "/",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    courseController.getCourses
);

courseRouter
    .get(
        "/:courseId",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead, AudienceEnum.DepartmentTeacher),
        courseController.getCourseById
    ).put(
        "/:courseId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead, AudienceEnum.DepartmentTeacher),
        courseController.updateCourseById
    ).delete(
        "/:courseId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead, AudienceEnum.DepartmentTeacher),
        courseController.deleteCourseById
    );

export default courseRouter;