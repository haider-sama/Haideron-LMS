import express, { Request, Response } from "express";
import { authorizeRoles, refreshToken, verifyToken } from "../../middleware/auth";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../utils/limiter/rateLimiter";
import { semesterController } from "../../controllers";
import { AudienceEnum } from "../../shared/enums";

dotenv.config();
const semesterRouter = express.Router();

semesterRouter.post(
    "/add",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    semesterController.addSemesterToCatalogue
);

semesterRouter.get(
    "/",
    verifyToken,
    safeLimiter,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    semesterController.getSemestersInCatalogue
);

semesterRouter
    .put(
        "/:semesterId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        semesterController.updateSemesterById
    ).delete(
        "/:semesterId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        semesterController.deleteSemesterById
    );

export default semesterRouter;