// import { Request, Response } from "express";;
// import CourseOffering from "../../../models/lms/course/course.offering.model";
// import AttendanceSession from "../../../models/lms/attendance/attendance.session.model";
// import AttendanceRecord from "../../../models/lms/attendance/attendance.record";
// import mongoose from "mongoose";
// import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
// import { CreateAttendanceSessionSchema, MarkAttendanceSchema } from "../../../utils/validators/lmsSchemas/attendanceSchemas";
// import User from "../../../models/auth/user.model";
// import { AudienceEnum } from "../../../shared/enums";
// import { CourseDocument } from "../../../models/lms/course/course.model";
// import Enrollment from "../../../models/lms/enrollment/enrollment.model";

// export const createAttendanceSession = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     if (!mongoose.Types.ObjectId.isValid(courseOfferingId)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
//     }

//     const parsed = CreateAttendanceSessionSchema.safeParse(req.body);
//     if (!parsed.success) {
//         return res.status(BAD_REQUEST).json({
//             message: "Validation failed",
//             errors: parsed.error.flatten().fieldErrors
//         });
//     }

//     const { date } = parsed.data;

//     try {
//         const user = await User.findById(userId);
//         if (!user || user.role !== AudienceEnum.DepartmentTeacher) {
//             return res.status(FORBIDDEN).json({ message: "Only Teachers can create attendance sessions" });
//         }

//         const courseOffering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");
//         if (!courseOffering || !courseOffering.isActive) {
//             return res.status(NOT_FOUND).json({ message: 'Course offering not found or inactive.' });
//         }

//         // Authorization: DeptTeacher must be assigned to at least one section
//         if (user.role === AudienceEnum.DepartmentTeacher) {
//             const sectionTeachersMap = courseOffering.course.sectionTeachers;
//             const sectionTeachers = sectionTeachersMap instanceof Map
//                 ? Object.fromEntries(sectionTeachersMap)
//                 : sectionTeachersMap;

//             const isAssigned = Object.values(sectionTeachers).some(
//                 (teacherId) => teacherId?.toString() === user._id.toString()
//             );

//             if (!isAssigned) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not assigned to this course offering.",
//                 });
//             }
//         }

//         // Optional: Prevent duplicate session on same day for same course
//         const existing = await AttendanceSession.findOne({
//             courseOffering: courseOfferingId,
//             date: new Date(date),
//         });

//         if (existing) {
//             return res.status(CONFLICT).json({ message: "Attendance session already exists for this date" });
//         }

//         const session = new AttendanceSession({
//             courseOffering: courseOfferingId,
//             date: new Date(date),
//         });

//         await session.save();

//         return res.status(CREATED).json({
//             message: "Attendance session created",
//             session,
//         });
//     } catch (error) {
//         console.error("Create Attendance Error:", error);
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error });
//     }
// };

// export const getAttendanceSessions = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     if (!mongoose.Types.ObjectId.isValid(courseOfferingId)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
//     }
//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(UNAUTHORIZED).json({ message: "User not found" });
//         }

//         const courseOffering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");

//         if (!courseOffering || !courseOffering.isActive) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found or inactive" });
//         }

//         // Authorization checks
//         if (user.role === AudienceEnum.DepartmentTeacher) {
//             const sectionTeachersMap = courseOffering.course.sectionTeachers;
//             const sectionTeachers = sectionTeachersMap instanceof Map
//                 ? Object.fromEntries(sectionTeachersMap)
//                 : sectionTeachersMap;

//             const isAssigned = Object.values(sectionTeachers).some(
//                 (teacherId) => teacherId?.toString() === user._id.toString()
//             );

//             if (!isAssigned) {
//                 return res.status(403).json({
//                     message: "You are not assigned to this course offering.",
//                 });
//             }
//         }

//         if (user.role === AudienceEnum.Student) {
//             const isEnrolled = await Enrollment.exists({
//                 student: user._id,
//                 courseOffering: courseOfferingId,
//             });

//             if (!isEnrolled) {
//                 return res.status(403).json({
//                     message: "You are not enrolled in this course offering.",
//                 });
//             }
//         }

//         // DepartmentHead is allowed without checks

//         const sessions = await AttendanceSession.find({ courseOffering: courseOfferingId })
//             .sort({ date: -1 }); // Newest first

//         return res.status(OK).json({
//             message: "Attendance sessions fetched successfully",
//             sessions,
//         });
//     } catch (error) {
//         console.error("Error fetching attendance sessions:", error);
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error });
//     }
// };

// export const markAttendanceRecords = async (req: Request, res: Response) => {
//     const { id: sessionId } = req.params;
//     const userId = req.userId;

//     if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid session ID" });
//     }

//     const parsed = MarkAttendanceSchema.safeParse(req.body);
//     if (!parsed.success) {
//         return res.status(BAD_REQUEST).json({
//             message: "Validation failed",
//             errors: parsed.error.flatten().fieldErrors,
//         });
//     }

//     const { records } = parsed.data;

//     try {
//         const user = await User.findById(userId);
//         if (!user || user.role !== AudienceEnum.DepartmentTeacher) {
//             return res.status(UNAUTHORIZED).json({ message: "Only assigned teachers can mark attendance" });
//         }


//         const session = await AttendanceSession.findById(sessionId);
//         if (!session) {
//             return res.status(404).json({ message: "Attendance session not found" });
//         }

//         const courseOffering = await CourseOffering.findById(session.courseOffering)
//             .populate<{ course: CourseDocument }>("course");

//         if (!courseOffering || !courseOffering.isActive) {
//             return res.status(NOT_FOUND).json({ message: "Associated course offering not found or inactive" });
//         }

//         // Verify teacher is assigned to this offering
//         const sectionTeachersMap = courseOffering.course.sectionTeachers;
//         const sectionTeachers = sectionTeachersMap instanceof Map
//             ? Object.fromEntries(sectionTeachersMap)
//             : sectionTeachersMap;

//         const isAssigned = Object.values(sectionTeachers).some(
//             (teacherId) => teacherId?.toString() === user._id.toString()
//         );

//         if (!isAssigned) {
//             return res.status(FORBIDDEN).json({
//                 message: "You are not assigned to this course offering.",
//             });
//         }

//         const bulkOps = [];

//         for (const { studentId, present } of records) {
//             if (!mongoose.Types.ObjectId.isValid(studentId)) continue;

//             bulkOps.push({
//                 updateOne: {
//                     filter: {
//                         attendanceSession: sessionId,
//                         student: studentId,
//                     },
//                     update: {
//                         $set: { present },
//                     },
//                     upsert: true,
//                 },
//             });
//         }

//         if (bulkOps.length === 0) {
//             return res.status(BAD_REQUEST).json({ message: "No valid records to process" });
//         }

//         const result = await AttendanceRecord.bulkWrite(bulkOps);

//         return res.status(CREATED).json({
//             message: "Attendance records updated successfully",
//             upsertedCount: result.upsertedCount,
//             modifiedCount: result.modifiedCount,
//         });
//     } catch (error) {
//         console.error("Error marking attendance:", error);
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error });
//     }
// };

// export const getAttendanceRecords = async (req: Request, res: Response) => {
//     const { id: sessionId } = req.params;
//     const userId = req.userId;

//     if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid attendance session ID" });
//     }

//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(UNAUTHORIZED).json({ message: "User not found" });
//         }

//         const session = await AttendanceSession.findById(sessionId);
//         if (!session) {
//             return res.status(NOT_FOUND).json({ message: "Attendance session not found" });
//         }

//         const courseOffering = await CourseOffering.findById(session.courseOffering)
//             .populate<{ course: CourseDocument }>("course");

//         if (!courseOffering || !courseOffering.isActive) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found or inactive" });
//         }

//         // Authorization checks
//         if (user.role === AudienceEnum.DepartmentTeacher) {
//             const sectionTeachersMap = courseOffering.course.sectionTeachers;
//             const sectionTeachers = sectionTeachersMap instanceof Map
//                 ? Object.fromEntries(sectionTeachersMap)
//                 : sectionTeachersMap;

//             const isAssigned = Object.values(sectionTeachers).some(
//                 (teacherId) => teacherId?.toString() === user._id.toString()
//             );

//             if (!isAssigned) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not assigned to this course offering.",
//                 });
//             }
//         }

//         if (user.role === AudienceEnum.Student) {
//             const isEnrolled = await Enrollment.exists({
//                 student: user._id,
//                 courseOffering: courseOffering._id,
//             });

//             if (!isEnrolled) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not enrolled in this course offering.",
//                 });
//             }
//         }

//         // DepartmentHead allowed without section-level checks

//         const records = await AttendanceRecord.find({ attendanceSession: sessionId });
//         return res.status(OK).json({
//             message: "Attendance records fetched",
//             records,
//         });
//     } catch (error) {
//         console.error("Error fetching attendance records:", error);
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error });
//     }
// };

// export const getStudentAttendanceReport = async (req: Request, res: Response) => {
//     const studentId = req.params.id;

//     try {
//         // Step 1: Get all attendance records for the student
//         const records = await AttendanceRecord.find({ student: studentId })
//             .populate({
//                 path: "attendanceSession",
//                 populate: { path: "courseOffering", populate: { path: "course" } }
//             });

//         if (records.length === 0) {
//             return res.status(404).json({ message: "No attendance records found for this student" });
//         }

//         // Step 2: Group records by courseOffering
//         const grouped = new Map<string, {
//             courseOfferingId: string;
//             courseCode: string;
//             courseTitle: string;
//             sessionsHeld: number;
//             sessionsPresent: number;
//         }>();

//         for (const record of records) {
//             const session = record.attendanceSession as any; // populated session
//             const offering = session.courseOffering as any;  // populated offering
//             const course = offering.course as any;           // populated course

//             const key = offering._id.toString();

//             if (!grouped.has(key)) {
//                 grouped.set(key, {
//                     courseOfferingId: key,
//                     courseCode: course.code,
//                     courseTitle: course.title,
//                     sessionsHeld: 0,
//                     sessionsPresent: 0,
//                 });
//             }

//             const data = grouped.get(key)!;
//             data.sessionsHeld += 1;
//             if (record.present) data.sessionsPresent += 1;
//         }

//         const report = Array.from(grouped.values()).map(c => ({
//             ...c,
//             sessionsAbsent: c.sessionsHeld - c.sessionsPresent,
//             percentage: Number(((c.sessionsPresent / c.sessionsHeld) * 100).toFixed(2))
//         }));

//         return res.status(200).json({
//             studentId,
//             courses: report
//         });
//     } catch (err) {
//         console.error("Error fetching attendance report:", err);
//         return res.status(500).json({ message: "Failed to fetch attendance report", error: err });
//     }
// };