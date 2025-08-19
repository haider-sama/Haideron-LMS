import express from "express";
import { attendanceController } from "../../../controllers";
import dotenv from "dotenv";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { safeLimiter, normalLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const attendanceRouter = express.Router();

attendanceRouter
    .post(
        "/:courseOfferingId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        attendanceController.createAttendanceSession
    ).get(
        "/:courseOfferingId",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher, AudienceEnum.DepartmentHead, AudienceEnum.Student),
        attendanceController.getAttendanceSessions
    );

attendanceRouter
    .post(
        "/:id/records",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        attendanceController.markAttendanceRecords
    ).get(
        "/:id/records",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher, AudienceEnum.DepartmentHead),
        attendanceController.getAttendanceRecords
    );

export default attendanceRouter;
