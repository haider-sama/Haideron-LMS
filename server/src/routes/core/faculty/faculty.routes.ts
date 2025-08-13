import express from "express";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { facultyController } from "../../../controllers";
import { AudienceEnum } from "../../../shared/enums";


dotenv.config();
const facultyRouter = express.Router();

facultyRouter.post(
    "/register",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    facultyController.registerFacultyMember
);

facultyRouter.get(
    "/",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    facultyController.fetchFacultyMembers
);

facultyRouter.route("/:teacherId")
    .get(
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        facultyController.fetchFacultyMembers
    )
    .put(
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        facultyController.updateFacultyMember
    )
    .delete(
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        facultyController.deleteFacultyMemberById
    );

facultyRouter.get(
    "/dashboard/context",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.DepartmentHead),
    facultyController.getDepartmentHeadDashboardContext);

export default facultyRouter;