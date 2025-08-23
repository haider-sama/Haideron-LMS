// src/controllers/index.ts

export * as adminController from './admin/admin.controller';
export * as adminSettingsController from './admin/admin.settings.controller';

export * as facultyController from './core/faculty.controller';
export * as courseController from './core/course.controller';
export * as semesterController from './core/semester.controller'
import * as peoController from "./core/program//peo.controller";
import * as ploController from "./core/program/plo.controller";
import * as programControl from "./core/program/program.controller";
export * as catalogueController from "./core/program/catalogue.controller";
export * as batchController from "./core/batch/batch.controller";
export * as batchSemesterController from "./core/batch/batch.semester.controller";
export * as courseOfferingController from "./core/batch/course.offering.controller";
export * as batchEnrollmentController from "./core/batch/batch.enrollment.controller";
export * as assessmentController from "./core/teacher/assessment.controller";
export * as attendanceController from "./core/teacher/attendance.controller";
export * as resultController from "./core/teacher/result.controller";
export * as teacherCourseController from "./core/teacher/teacher.course.controller";
export * as studentController from "./core/student/student.controller";

export * as auditLogController from './logs/audit.log.controller';

export * as forumController from "./social/forum/forum.controller";
export * as forumUserController from "./social/forum/forum.user.controller";

export * as postController from "./social/post/post.controller";
export * as postUserController from "./social/post/post.user.controller";

export * as commentController from "./social/comment/comment.controller";
export * as commentUserController from "./social/comment/comment.user.controller";


export const programController = {
  ...peoController,
  ...ploController,
  ...programControl,
};
