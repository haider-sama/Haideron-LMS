// // src/controllers/studentController.ts
// import { Request, Response } from "express";
// import User from "../../../models/auth/user.model";
// import { AudienceEnum, ClassSectionEnum, FinalizedResultStatusEnum } from "../../../shared/enums";
// import mongoose, { Types } from "mongoose";
// import Enrollment from "../../../models/lms/enrollment/enrollment.model";
// import CourseOffering, { ScheduleSlot } from "../../../models/lms/course/course.offering.model";
// import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
// import { StudentBatchEnrollment, StudentBatchEnrollmentDocument } from "../../../models/lms/enrollment/student.batch.enrollment";
// import { ActivatedSemester } from "../../../models/lms/semester/activated.semester.model";
// import { ProgramDocument } from "../../../models/lms/program/program.model";
// import { ProgramBatchDocument } from "../../../models/lms/program/program.batch.model";
// import FinalizedResult from "../../../models/lms/assessment/finalized.result.model";

// const PASSING_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D"];

// export const enrollInCourse = async (req: Request, res: Response) => {
//     const studentId = req.userId;
//     const { courseOfferingId } = req.params;
//     const { section } = req.body;

//     if (!studentId) {
//         return res.status(NOT_FOUND).json({ message: "Missing user ID" });
//     }

//     if (!section) {
//         return res.status(BAD_REQUEST).json({ message: "Section is required to enroll." });
//     }

//     try {
//         const student = await User.findById(studentId);
//         if (!student || student.role !== AudienceEnum.Student) {
//             return res.status(FORBIDDEN).json({ message: "Only students can enroll in courses." });
//         }

//         const offering = await CourseOffering.findById(courseOfferingId)
//             .populate("course")
//             .populate({
//                 path: "activatedSemester",
//                 populate: {
//                     path: "programBatch",
//                     populate: {
//                         path: "program",
//                         select: "departmentTitle"
//                     }
//                 }
//             });

//         if (!offering || !offering.isActive) {
//             return res.status(BAD_REQUEST).json({ message: "Course offering is not available." });
//         }

//         const course = offering.course as any;
//         const activatedSemester = offering.activatedSemester as any;
//         const program = activatedSemester?.programBatch?.program;

//         if (new Date() > new Date(activatedSemester?.enrollmentDeadline)) {
//             return res.status(FORBIDDEN).json({ message: "Enrollment deadline has passed." });
//         }

//         if (!program || program.departmentTitle !== student.department) {
//             return res.status(FORBIDDEN).json({
//                 message: "You can only enroll in courses from your own department."
//             });
//         }

//         const sectionSchedules = offering.sectionSchedules instanceof Map
//             ? offering.sectionSchedules
//             : new Map(Object.entries(offering.sectionSchedules || {}));

//         if (!sectionSchedules.has(section)) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Invalid section for this course offering.",
//             });
//         }

//         const studentBatch = await StudentBatchEnrollment.findOne({ student: student._id });
//         if (!studentBatch || studentBatch.programBatch.toString() !== activatedSemester.programBatch._id.toString()) {
//             return res.status(FORBIDDEN).json({ message: "You cannot enroll in offerings from another batch." });
//         }

//         const capacity = offering.capacityPerSection?.[section];
//         const enrolledCount = await Enrollment.countDocuments({
//             courseOffering: offering._id,
//             section,
//         });

//         if (capacity !== undefined && enrolledCount >= capacity) {
//             return res.status(BAD_REQUEST).json({ message: `Section ${section} is full.` });
//         }

//         const alreadyEnrolled = await Enrollment.findOne({
//             student: student._id,
//             courseOffering: { $exists: true }
//         }).populate({
//             path: "courseOffering",
//             match: { course: course._id }
//         });

//         if (alreadyEnrolled?.courseOffering) {
//             return res.status(CONFLICT).json({ message: "You are already enrolled in this course." });
//         }

//         // Prerequisite check
//         const prerequisites = course.preRequisites || [];

//         if (prerequisites.length > 0) {
//             const finalizedResults = await FinalizedResult.find({
//                 "results.studentId": student._id,
//                 "results.grade": { $in: PASSING_GRADES }
//             }).populate({
//                 path: "courseOffering",
//                 populate: {
//                     path: "course",
//                     select: "_id"
//                 }
//             });

//             const passedCourseIds = finalizedResults
//                 .map((result: any) => {
//                     const course = result.courseOffering?.course;
//                     return course ? (typeof course === "object" ? course._id.toString() : course.toString()) : null;
//                 })
//                 .filter(Boolean);

//             // console.log("Passed course IDs (from FinalizedResult):", passedCourseIds);

//             const unmet = prerequisites.filter(
//                 (prereqId: Types.ObjectId | string) => !passedCourseIds.includes(prereqId.toString())
//             );

//             if (unmet.length > 0) {
//                 return res.status(BAD_REQUEST).json({
//                     message: "You have not completed all prerequisite courses.",
//                     missingPrerequisites: unmet,
//                 });
//             }
//         }

//         const enrollment = new Enrollment({
//             student: student._id,
//             courseOffering: offering._id,
//             section,
//         });

//         await enrollment.save();

//         return res.status(CREATED).json({ message: `Enrolled in section ${section} successfully.` });
//     } catch (err) {
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
//     }
// };

// export const getEnrolledCourses = async (req: Request, res: Response) => {
//     const studentId = req.userId;

//     if (!studentId) {
//         return res.status(UNAUTHORIZED).json({ message: "Unauthorized: Missing user ID" });
//     }

//     try {
//         const enrollments = await Enrollment.find({ student: studentId })
//             .populate({
//                 path: "courseOffering",
//                 populate: {
//                     path: "course",
//                     select: `
//                     title code codePrefix creditHours contactHours description subjectLevel subjectType
//                     department semester isActive preRequisites coRequisites createdBy
//                     knowledgeArea domain clos sectionTeachers prerequisites corequisites
//                     `,
//                     populate: [
//                         { path: "preRequisites", select: "title code" },
//                         { path: "coRequisites", select: "title code" },
//                         { path: "createdBy", select: "firstName lastName email role" }
//                     ]
//                 }
//             })
//             .lean();

//         const response = [];

//         for (const enrollment of enrollments) {
//             const offering: any = enrollment.courseOffering;
//             const course: any = offering?.course;
//             const section = enrollment.section;

//             const teacherId = course?.sectionTeachers?.[section];
//             let sectionTeacher = null;

//             if (teacherId) {
//                 const teacher = await User.findById(teacherId).select("firstName lastName email");
//                 if (teacher) {
//                     sectionTeacher = {
//                         _id: teacher._id,
//                         name: `${teacher.firstName} ${teacher.lastName}`,
//                         email: teacher.email,
//                     };
//                 }
//             }

//             response.push({
//                 _id: enrollment._id,
//                 enrolledAt: enrollment.enrolledAt,
//                 section,
//                 sectionTeacher, // <- IMPORTANT: add this field
//                 courseOffering: {
//                     _id: offering._id,
//                     programBatch: offering.programBatch,
//                     activatedSemester: offering.activatedSemester,
//                     sectionSchedules: offering.sectionSchedules?.[section] || [],
//                     capacityPerSection: offering.capacityPerSection?.[section] || null,
//                     course: course,
//                     isActive: offering.isActive ?? true,
//                     createdAt: offering.createdAt?.toISOString() ?? "",
//                     updatedAt: offering.updatedAt?.toISOString() ?? "",
//                 },
//             })
//         }

//         res.status(OK).json(response);
//     } catch (err) {
//         console.error("Fetch enrolled courses error:", err);
//         res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
//     }
// };

// export const deEnrollFromCourse = async (req: Request, res: Response) => {
//     const studentId = req.userId;
//     const { courseOfferingId } = req.params;
//     const rawSection = req.params.section?.trim();

//     if (!studentId) {
//         return res.status(NOT_FOUND).json({ message: "Missing user ID" });
//     }
//     if (!courseOfferingId || !mongoose.Types.ObjectId.isValid(courseOfferingId)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid course offering ID" });
//     }
//     if (!rawSection) {
//         return res.status(BAD_REQUEST).json({ message: "Section name is required" });
//     }
//     // Validate section against enum
//     if (!Object.values(ClassSectionEnum).includes(rawSection as ClassSectionEnum)) {
//         return res.status(BAD_REQUEST).json({ message: "Invalid section name" });
//     }

//     const section = rawSection as ClassSectionEnum;

//     try {
//         const offering = await CourseOffering.findById(courseOfferingId).lean();
//         if (!offering) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found" });
//         }

//         if (!offering.isActive) {
//             return res.status(FORBIDDEN).json({
//                 message: "You cannot de-enroll from an inactive course offering."
//             });
//         }

//         const activatedSemester = await ActivatedSemester.findById(offering.activatedSemester);
//         if (!activatedSemester) {
//             return res.status(NOT_FOUND).json({ message: "Associated semester not found." });
//         }
//         if (!activatedSemester.enrollmentDeadline) {
//             return res.status(BAD_REQUEST).json({ message: "Enrollment deadline is not set for this semester." });
//         }
//         if (new Date() > new Date(activatedSemester.enrollmentDeadline)) {
//             return res.status(FORBIDDEN).json({ message: "De-enrollment deadline has passed." });
//         }

//         // Handle Map vs Object conversion for sectionSchedules
//         const sectionSchedules = offering.sectionSchedules instanceof Map
//             ? offering.sectionSchedules
//             : new Map(Object.entries(offering.sectionSchedules || {}));

//         if (!sectionSchedules.has(section)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid section for this course offering." });
//         }

//         const deleted = await Enrollment.findOneAndDelete({
//             student: new mongoose.Types.ObjectId(studentId),
//             courseOffering: new mongoose.Types.ObjectId(courseOfferingId),
//             section,
//         });

//         if (!deleted) {
//             return res.status(NOT_FOUND).json({ message: "You are not enrolled in this course." });
//         }

//         res.json({ message: `Successfully de-enrolled from section ${section}.` });
//     } catch (err) {
//         res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
//     }
// };

// export interface PopulatedProgramBatch extends Omit<ProgramBatchDocument, "program"> {
//     program: ProgramDocument;
// }

// export interface PopulatedStudentBatchEnrollment extends Omit<StudentBatchEnrollmentDocument, "programBatch"> {
//     programBatch: PopulatedProgramBatch;
// }

// export const getStudentDashboardContext = async (req: Request, res: Response) => {
//     const studentId = req.userId;

//     if (!studentId) {
//         return res.status(UNAUTHORIZED).json({ message: "Unauthorized: Missing user ID" });
//     }

//     try {
//         const enrollment = await StudentBatchEnrollment.findOne({ student: studentId })
//             .populate({
//                 path: "programBatch",
//                 populate: { path: "program", select: "title departmentTitle" },
//             })
//             .lean() as unknown as PopulatedStudentBatchEnrollment;

//         if (!enrollment) {
//             return res.status(NOT_FOUND).json({ message: "Student is not enrolled in any batch" });
//         }

//         const activatedSemesters = await ActivatedSemester.find({
//             programBatch: enrollment.programBatch._id,
//         }).lean();

//         res.status(OK).json({
//             program: enrollment.programBatch.program,
//             programBatch: {
//                 _id: enrollment.programBatch._id,
//                 sessionYear: enrollment.programBatch.sessionYear,
//             },
//             activatedSemesters,
//         });
//     } catch (err) {
//         res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error" });
//     }
// };

// export const getTranscript = async (req: Request, res: Response) => {
//     const studentId = req.userId;

//     if (!studentId) {
//         return res.status(UNAUTHORIZED).json({ message: "Unauthorized: missing user ID" });
//     }

//     try {
//         const finalizedResults = await FinalizedResult.find({
//             "results.studentId": studentId,
//             status: FinalizedResultStatusEnum.Confirmed
//         })
//             .populate({
//                 path: "courseOffering",
//                 populate: [
//                     { path: "course", select: "title code creditHours" },
//                     {
//                         path: "activatedSemester",
//                         select: "semesterNo term startedAt endedAt programBatch",
//                         populate: {
//                             path: "programBatch",
//                             select: "sessionYear"
//                         }
//                     }
//                 ]
//             })
//             .lean();

//         // Get latest attempt per course
//         const latestAttemptPerCourse = new Map<string, {
//             courseOffering: any,
//             studentResult: any,
//             activatedSemester: any,
//             status: typeof FinalizedResultStatusEnum[keyof typeof FinalizedResultStatusEnum]
//         }>();

//         for (const fr of finalizedResults) {
//             const result = fr.results.find(r => r.studentId.toString() === studentId.toString());
//             const courseOffering: any = fr.courseOffering;
//             const course = courseOffering?.course;
//             const activatedSemester = courseOffering?.activatedSemester;

//             if (!result || !course || !activatedSemester) continue;

//             const courseId = course._id.toString();
//             const current = latestAttemptPerCourse.get(courseId);

//             const newTimestamp = new Date(activatedSemester.startedAt || fr.createdAt).getTime();
//             const oldTimestamp = current ? new Date(current.activatedSemester.startedAt || fr.createdAt).getTime() : 0;

//             if (!current || newTimestamp > oldTimestamp) {
//                 latestAttemptPerCourse.set(courseId, {
//                     courseOffering,
//                     studentResult: result,
//                     activatedSemester,
//                     status: fr.status
//                 });
//             }
//         }

//         // Organize by semester
//         const semestersMap = new Map<number, any>();

//         for (const { courseOffering, studentResult, activatedSemester, status } of latestAttemptPerCourse.values()) {
//             const {
//                 semesterNo,
//                 term,
//                 startedAt,
//                 endedAt,
//                 programBatch
//             } = activatedSemester;

//             const course = courseOffering.course;
//             const sessionYear = programBatch?.sessionYear;

//             if (!semestersMap.has(semesterNo)) {
//                 semestersMap.set(semesterNo, {
//                     semesterNo,
//                     term,
//                     sessionYear,
//                     startedAt,
//                     endedAt,
//                     courses: [],
//                     totalCredits: 0,
//                     totalGradePoints: 0
//                 });
//             }

//             const semester = semestersMap.get(semesterNo);
//             semester.courses.push({
//                 courseTitle: course.title,
//                 courseCode: course.code,
//                 creditHours: course.creditHours,
//                 grade: studentResult.grade,
//                 gradePoint: studentResult.gradePoint,
//                 status,
//             });

//             // Include all courses, including failed, in GPA calculation
//             semester.totalCredits += course.creditHours;
//             semester.totalGradePoints += course.creditHours * studentResult.gradePoint;
//         }

//         // Compute GPA and CGPA
//         const semesters = Array.from(semestersMap.values()).sort((a, b) => a.semesterNo - b.semesterNo);

//         let totalCredits = 0;
//         let totalGradePoints = 0;

//         for (const sem of semesters) {
//             sem.gpa = sem.totalCredits > 0
//                 ? (sem.totalGradePoints / sem.totalCredits).toFixed(2)
//                 : "0.00";

//             totalCredits += sem.totalCredits;
//             totalGradePoints += sem.totalGradePoints;
//         }

//         const cgpa = totalCredits > 0
//             ? (totalGradePoints / totalCredits).toFixed(2)
//             : "0.00";

//         return res.status(OK).json({
//             semesters,
//             cgpa
//         });
//     } catch (err) {
//         console.error("Transcript error:", err);
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to compile transcript" });
//     }
// };