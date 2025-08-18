import express from "express";
import { attendanceController } from "../../../controllers";
import dotenv from "dotenv";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const attendanceRouter = express.Router();

attendanceRouter
    .post(
        "/:courseOfferingId/attendance-sessions",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        attendanceController.createAttendanceSession
    ).get(
        "/:courseOfferingId/attendance-sessions",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher, AudienceEnum.DepartmentHead, AudienceEnum.Student),
        attendanceController.getAttendanceSessions
    );

attendanceRouter
    .post(
        "/attendance-sessions/:id/records",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher),
        attendanceController.markAttendanceRecords
    ).get(
        "/attendance-sessions/:id/records",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.DepartmentTeacher, AudienceEnum.DepartmentHead),
        attendanceController.getAttendanceRecords
    );

export default attendanceRouter;
