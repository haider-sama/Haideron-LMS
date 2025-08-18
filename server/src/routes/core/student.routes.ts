import express from "express";
import { authorizeRoles, verifyToken } from "../../middleware/auth";
import { studentController } from "../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter } from "../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../shared/enums";

dotenv.config();
const studentRouter = express.Router();

studentRouter
    .post(
        "/:courseOfferingId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Student),
        studentController.enrollInCourse
    ).delete(
        "/:courseOfferingId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Student),
        studentController.deEnrollFromCourse
    );

studentRouter.get(
    "/courses", 
    safeLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Student),
    studentController.getEnrolledCourses
);

studentRouter.get("/dashboard", 
    safeLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Student),
    studentController.getStudentDashboardContext
);

studentRouter.get(
    "/transcript", 
    safeLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Student),
    studentController.getTranscript
);

export default studentRouter;