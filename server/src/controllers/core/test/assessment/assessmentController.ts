// import { Request, Response } from "express";
// import { CourseDocument } from "../../../models/lms/course/course.model";
// import { Assessment } from "../../../models/lms/assessment/assessment.model";
// import User from "../../../models/auth/user.model";
// import { AssessmentResult } from "../../../models/lms/assessment/assessment.result.model";
// import CourseOffering from "../../../models/lms/course/course.offering.model";
// import { CreateAssessmentSchema, finalizeResultSchema, reviewResultSchema, saveGradingSchemeSchema, submitResultsSchema, UpdateAssessmentSchema } from "../../../utils/validators/lmsSchemas/assessmentSchemas";
// import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
// import mongoose, { Types } from "mongoose";
// import Enrollment from "../../../models/lms/enrollment/enrollment.model";
// import CustomGradingScheme, { GradingRule } from "../../../models/lms/assessment/grading.scheme.model.";
// import FinalizedResult from "../../../models/lms/assessment/finalized.result.model";
// import { AudienceEnum, FinalizedResultStatusEnum } from "../../../shared/enums";

// export function validateResultEntry(entry: any): { valid: boolean; message?: string } {
//     const { studentId, marksObtained, totalMarks } = entry;

//     if (!studentId || typeof marksObtained !== 'number' || typeof totalMarks !== 'number') {
//         return { valid: false, message: 'Missing or invalid fields.' };
//     }

//     if (marksObtained < 0 || totalMarks <= 0 || marksObtained > totalMarks) {
//         return { valid: false, message: 'Marks must be within 0 and totalMarks.' };
//     }

//     return { valid: true };
// };

// export const createAssessment = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     try {
//         const parsed = CreateAssessmentSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Validation failed",
//                 errors: parsed.error.flatten().fieldErrors,
//             });
//         }

//         const { type, title, weightage, dueDate, clos } = parsed.data;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found." });
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

//         const existingAssessments = await Assessment.find({ courseOfferingId: courseOfferingId });
//         const totalWeightage = existingAssessments.reduce((sum, a) => sum + a.weightage, 0);

//         if (totalWeightage + weightage > 100) {
//             return res.status(BAD_REQUEST).json({
//                 message: `Total assessment weightage cannot exceed 100%. 
//                 Existing: ${totalWeightage}%. Requested: ${weightage}%.`
//             });
//         }

//         // Validate CLOs against embedded course.clos
//         const validCLOIds = courseOffering.course.clos.map(clo => clo._id.toString());
//         const filteredCLOs = clos.filter(cloId => validCLOIds.includes(cloId));

//         if (filteredCLOs.length !== clos.length) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Some selected CLOs are invalid or not part of this course.",
//             });
//         }


//         // Step 6: Create assessment
//         const newAssessment = new Assessment({
//             courseOfferingId: courseOfferingId,
//             type,
//             title,
//             weightage,
//             dueDate,
//             clos: filteredCLOs
//         });

//         await newAssessment.save();

//         res.status(CREATED).json({
//             message: 'Assessment created successfully.',
//             assessment: newAssessment
//         });
//     } catch (error) {
//         res.status(INTERNAL_SERVER_ERROR).json({ message: 'Server error while creating assessment.' });
//     }
// };

// export const updateAssessment = async (req: Request, res: Response) => {
//     const { assessmentId } = req.params;
//     const userId = req.userId;

//     try {
//         const parsed = UpdateAssessmentSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Validation failed",
//                 errors: parsed.error.flatten().fieldErrors,
//             });
//         }

//         const { type, title, weightage, dueDate, clos } = parsed.data;

//         const assessment = await Assessment.findById(assessmentId);
//         if (!assessment) {
//             return res.status(NOT_FOUND).json({ message: "Assessment not found." });
//         }

//         const courseOfferingId = assessment.courseOfferingId;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found." });
//         }

//         const courseOffering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");
//         if (!courseOffering) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found." });
//         }

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

//         // Check weightage overflow (excluding current assessment)
//         const existingAssessments = await Assessment.find({
//             courseOfferingId,
//             _id: { $ne: assessmentId }, // Exclude current assessment
//         });

//         const totalWeightage = existingAssessments.reduce((sum, a) => sum + a.weightage, 0);
//         if (totalWeightage + weightage > 100) {
//             return res.status(BAD_REQUEST).json({
//                 message: `Total assessment weightage cannot exceed 100%. 
//                 Existing (excluding current): ${totalWeightage}%. Requested: ${weightage}%.`,
//             });
//         }

//         // Update fields
//         assessment.type = type;
//         assessment.title = title;
//         assessment.weightage = weightage;
//         assessment.dueDate = new Date(dueDate);
//         assessment.clos = clos.map(id => new mongoose.Types.ObjectId(id));

//         await assessment.save();

//         res.status(OK).json({
//             message: "Assessment updated successfully.",
//             assessment,
//         });
//     } catch (error) {
//         res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Server error while updating assessment.",
//         });
//     }
// };

// export const deleteAssessment = async (req: Request, res: Response) => {
//     const { assessmentId } = req.params;
//     const userId = req.userId;

//     try {
//         const assessment = await Assessment.findById(assessmentId);
//         if (!assessment) {
//             return res.status(NOT_FOUND).json({ message: "Assessment not found." });
//         }

//         const courseOfferingId = assessment.courseOfferingId;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found." });
//         }

//         const courseOffering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");

//         if (!courseOffering) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found." });
//         }

//         if (user.role === AudienceEnum.DepartmentTeacher) {
//             const sectionTeachersMap = courseOffering.course.sectionTeachers;
//             const sectionTeachers = sectionTeachersMap instanceof Map
//                 ? Object.fromEntries(sectionTeachersMap)
//                 : sectionTeachersMap;

//             const isAssigned = Object.values(sectionTeachers).some(
//                 (teacherId) => teacherId?.toString() === userId.toString()
//             );

//             if (!isAssigned) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not assigned to this course offering.",
//                 });
//             }
//         }

//         await assessment.deleteOne();

//         return res.status(OK).json({ message: "Assessment deleted successfully." });
//     } catch (error) {
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Server error while deleting assessment.",
//         });
//     }
// };

// export const getCourseAssessments = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     try {
//         const courseOffering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");
//         if (!courseOffering) {
//             return res.status(NOT_FOUND).json({ message: 'Course offering not found.' });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(FORBIDDEN).json({ message: "Unauthorized" });
//         }

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
//                 courseOffering: courseOfferingId,
//                 student: userId,
//                 isActive: true,
//             });

//             if (!isEnrolled) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not enrolled in this course offering.",
//                 });
//             }
//         }

//         // Step 2: Fetch assessments for this course
//         const assessments = await Assessment.find({ courseOfferingId: courseOfferingId })
//             .sort({ dueDate: 1 }) // Optional: earliest first
//             .lean();

//         res.status(OK).json({
//             message: 'Assessments retrieved successfully.',
//             assessments
//         });
//     } catch (error) {
//         res.status(INTERNAL_SERVER_ERROR).json({ message: 'Server error while fetching assessments.' });
//     }
// };

// export const submitBulkAssessmentResults = async (req: Request, res: Response) => {
//     const { id: assessmentId } = req.params;
//     const userId = req.userId;

//     try {
//         const parsed = submitResultsSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Validation failed",
//                 errors: parsed.error.flatten().fieldErrors,
//             });
//         }

//         const { results } = parsed.data;

//         const assessment = await Assessment.findById(assessmentId).lean();
//         if (!assessment) {
//             return res.status(NOT_FOUND).json({ message: 'Assessment not found.' });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const isDeptTeacher = user.role === AudienceEnum.DepartmentTeacher;

//         if (isDeptTeacher) {
//             const courseOffering = await CourseOffering.findById(assessment.courseOfferingId)
//                 .populate<{ course: CourseDocument }>("course");
//             if (!courseOffering) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not authorized to submit results for this assessment."
//                 });
//             }

//             const sectionTeachersMap = courseOffering.course.sectionTeachers;
//             const sectionTeachers = sectionTeachersMap instanceof Map
//                 ? Object.fromEntries(sectionTeachersMap)
//                 : sectionTeachersMap;
//             const isAssigned = Object.values(sectionTeachers).some(
//                 (teacherId) => teacherId?.toString() === user._id.toString()
//             );

//             if (!isAssigned) {
//                 return res.status(FORBIDDEN).json({ message: "You are not assigned to this course offering." });
//             }
//         }

//         const bulkOps = [];

//         for (const entry of results) {
//             if (!entry.studentId) {
//                 return res.status(BAD_REQUEST).json({
//                     message: "Missing studentId in one of the entries."
//                 });
//             }

//             const validation = validateResultEntry(entry);
//             if (!validation.valid) {
//                 return res.status(BAD_REQUEST).json({
//                     message: `Invalid entry for studentId ${entry.studentId}: ${validation.message}`
//                 });
//             }

//             const { studentId, marksObtained, totalMarks } = entry;

//             const studentExists = await User.exists({ _id: studentId });
//             if (!studentExists) {
//                 return res.status(NOT_FOUND).json({ message: `Student not found: ${studentId}` });
//             }

//             bulkOps.push({
//                 updateOne: {
//                     filter: { assessmentId, studentId },
//                     update: {
//                         $set: { marksObtained, totalMarks },
//                         $setOnInsert: { assessmentId, studentId } // ensure studentId is present on insert
//                     },
//                     upsert: true
//                 }
//             });
//         }

//         await AssessmentResult.bulkWrite(bulkOps);

//         res.status(OK).json({ message: 'Assessment results submitted successfully.' });
//     } catch (error) {
//         res.status(INTERNAL_SERVER_ERROR).json({ message: 'Server error during bulk result submission.' });
//     }
// };

// export const getAssessmentResults = async (req: Request, res: Response) => {
//     const { id: assessmentId } = req.params;
//     const userId = req.userId;

//     try {
//         const assessment = await Assessment.findById(assessmentId);
//         if (!assessment) {
//             return res.status(NOT_FOUND).json({ message: "Assessment not found." });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found." });
//         }

//         const isDeptTeacher = user.role === AudienceEnum.DepartmentTeacher;
//         const isDeptHead = user.role === AudienceEnum.DepartmentHead;
//         const isStudent = user.role === AudienceEnum.Student;

//         if (isDeptTeacher) {
//             const courseOffering = await CourseOffering.findById(assessment.courseOfferingId)
//                 .populate<{ course: CourseDocument }>("course");

//             if (!courseOffering) {
//                 return res.status(FORBIDDEN).json({
//                     message: "You are not authorized to view results for this assessment.",
//                 });
//             }

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

//         if (isStudent) {
//             const studentResult = await AssessmentResult.findOne({
//                 assessmentId,
//                 studentId: user._id,
//             }).populate("studentId", "firstName email").lean();

//             if (!studentResult) {
//                 return res.status(NOT_FOUND).json({ message: "Result not found for student." });
//             }

//             return res.status(OK).json({
//                 message: "Student result fetched successfully.",
//                 results: [studentResult],
//             });
//         }

//         const results = await AssessmentResult.find({ assessmentId })
//             .populate("studentId", "firstName email") // populate student info
//             .lean();

//         res.status(OK).json({ message: "Results fetched successfully.", results });
//     } catch (error) {
//         res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error while fetching results." });
//     }
// };

// function getCustomGradePoint(rules: GradingRule[], percentage: number) {
//     const sorted = rules.sort((a, b) => b.minPercentage - a.minPercentage);
//     for (const rule of sorted) {
//         if (percentage >= rule.minPercentage) {
//             return { grade: rule.grade, gradePoint: rule.gradePoint };
//         }
//     }
//     return { grade: "F", gradePoint: 0.0 };
// };

// export const finalizeAssessmentResults = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     const parsed = finalizeResultSchema.safeParse(req.body);
//     if (!parsed.success) {
//         return res.status(BAD_REQUEST).json({
//             message: "Validation failed",
//             errors: parsed.error.flatten().fieldErrors,
//         });
//     }

//     const { section } = parsed.data;

//     try {
//         const offering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course")
//             .populate<{ programBatch: { program: { departmentTitle: string } } }>({
//                 path: "programBatch",
//                 populate: {
//                     path: "program",
//                     model: "Program",
//                 },
//             });

//         if (!offering || !offering.course) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found." });
//         }

//         // Authorization: Only assigned teacher for this section can finalize
//         const user = await User.findById(userId);
//         if (!user || user.role !== "DepartmentTeacher") {
//             return res.status(FORBIDDEN).json({ message: "You are not authorized to finalize results." });
//         }

//         const sectionTeachersMap = offering.course.sectionTeachers;
//         const sectionTeachers = sectionTeachersMap instanceof Map
//             ? Object.fromEntries(sectionTeachersMap)
//             : sectionTeachersMap;

//         const assignedTeacherId = sectionTeachers?.[section]?.toString();

//         if (assignedTeacherId !== userId.toString()) {
//             return res.status(FORBIDDEN).json({ message: `You are not assigned to section ${section}.` });
//         }

//         const assessments = await Assessment.find({ courseOfferingId });
//         const totalWeightage = assessments.reduce((sum, a) => sum + a.weightage, 0);

//         if (totalWeightage < 100) {
//             return res.status(BAD_REQUEST).json({
//                 message: `Cannot finalize. Total weightage is ${totalWeightage}%. Required: 100%.`,
//             });
//         }

//         const scheme = await CustomGradingScheme.findOne({ courseOffering: courseOfferingId, section });
//         if (!scheme || scheme.rules.length === 0) {
//             return res.status(BAD_REQUEST).json({ message: "No grading scheme defined by the teacher." });
//         }

//         // Only fetch enrollments for the specified section
//         const enrollments = await Enrollment.find({
//             courseOffering: courseOfferingId,
//             isActive: true,
//             section: section,
//         });

//         const studentIds = enrollments.map((e) => e.student as Types.ObjectId);

//         const results = await AssessmentResult.find({
//             assessmentId: { $in: assessments.map(a => a._id) },
//             studentId: { $in: studentIds },
//         });

//         const gradesToSubmit = [];

//         for (const rawStudentId of studentIds) {
//             const studentId = new mongoose.Types.ObjectId(rawStudentId);
//             let totalScore = 0;

//             for (const assessment of assessments) {
//                 const result = results.find(
//                     r => r.assessmentId.equals(assessment._id as Types.ObjectId) &&
//                         r.studentId.equals(studentId)
//                 );
//                 if (!result) continue;

//                 const percentage = (result.marksObtained / result.totalMarks) * 100;
//                 totalScore += percentage * (assessment.weightage / 100);
//             }

//             const { grade, gradePoint } = getCustomGradePoint(scheme.rules, totalScore);

//             gradesToSubmit.push({
//                 studentId,
//                 courseOfferingId,
//                 weightedPercentage: parseFloat(totalScore.toFixed(2)),
//                 gradePoint,
//                 grade,
//             });
//         }

//         const department = offering.programBatch.program.departmentTitle;

//         const deptHead = await User.findOne({ role: "DepartmentHead", department });
//         if (!deptHead) {
//             return res.status(NOT_FOUND).json({ message: "No department head found for this department." });
//         }

//         const existingFinalized = await FinalizedResult.findOne({
//             courseOffering: courseOfferingId,
//             section,
//         });

//         if (existingFinalized) {
//             if (existingFinalized.status === FinalizedResultStatusEnum.Pending) {
//                 return res.status(BAD_REQUEST).json({
//                     message: "This section's results have already been finalized and are pending review. You must wait for the Department Head to review them or withdraw the submission to make changes.",
//                 });
//             }

//             if (existingFinalized.status === FinalizedResultStatusEnum.Confirmed) {
//                 return res.status(BAD_REQUEST).json({
//                     message: "This section's results have already been confirmed by the Department Head and cannot be changed.",
//                 });
//             }
//         }

//         await FinalizedResult.findOneAndUpdate(
//             { courseOffering: courseOfferingId, section }, // match by course + section
//             {
//                 submittedBy: req.userId,
//                 results: gradesToSubmit.map(g => ({
//                     studentId: g.studentId,
//                     grade: g.grade,
//                     gradePoint: g.gradePoint,
//                     weightedPercentage: g.weightedPercentage,
//                 })),
//                 status: "Pending",
//             },
//             { upsert: true, new: true, setDefaultsOnInsert: true }
//         );

//         return res.status(OK).json({
//             message: `Final grades for Section ${section} calculated and sent to Department Head (${deptHead.firstName} ${deptHead.lastName}) for approval.`,
//         });

//     } catch (err) {
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
//     }
// };

// export const withdrawFinalizedResult = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     const parsed = finalizeResultSchema.safeParse(req.body); // using same schema to validate section
//     if (!parsed.success) {
//         return res.status(BAD_REQUEST).json({
//             message: "Validation failed",
//             errors: parsed.error.flatten().fieldErrors,
//         });
//     }

//     const { section } = parsed.data;

//     try {
//         const offering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");

//         if (!offering || !offering.course) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found." });
//         }

//         const user = await User.findById(userId);
//         if (!user || user.role !== "DepartmentTeacher") {
//             return res.status(FORBIDDEN).json({ message: "You are not authorized to withdraw results." });
//         }

//         const sectionTeachersMap = offering.course.sectionTeachers;
//         const sectionTeachers = sectionTeachersMap instanceof Map
//             ? Object.fromEntries(sectionTeachersMap)
//             : sectionTeachersMap;

//         const assignedTeacherId = sectionTeachers?.[section]?.toString();
//         if (assignedTeacherId !== userId.toString()) {
//             return res.status(FORBIDDEN).json({ message: `You are not assigned to section ${section}.` });
//         }

//         const existing = await FinalizedResult.findOne({ courseOffering: courseOfferingId, section });

//         if (!existing) {
//             return res.status(NOT_FOUND).json({ message: "No finalized result found for this section." });
//         }

//         if (existing.status !== "Pending") {
//             return res.status(BAD_REQUEST).json({
//                 message: "Only pending results can be withdrawn.",
//             });
//         }

//         await FinalizedResult.deleteOne({ _id: existing._id });

//         return res.status(OK).json({
//             message: `Finalized result for Section ${section} has been withdrawn successfully.`,
//         });
//     } catch (err) {
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
//     }
// };

// export const saveGradingScheme = async (req: Request, res: Response) => {
//     const { courseOfferingId } = req.params;
//     const userId = req.userId;

//     const parsed = saveGradingSchemeSchema.safeParse(req.body);
//     if (!parsed.success) {
//         return res.status(BAD_REQUEST).json({
//             message: "Validation failed",
//             errors: parsed.error.flatten().fieldErrors,
//         });
//     }

//     const { section, rules } = parsed.data;

//     try {
//         const user = await User.findById(userId);
//         if (!user || user.role !== AudienceEnum.DepartmentTeacher) {
//             return res.status(FORBIDDEN).json({ message: "Only department teachers can define grading schemes." });
//         }

//         const offering = await CourseOffering.findById(courseOfferingId)
//             .populate<{ course: CourseDocument }>("course");

//         if (!offering || !offering.course) {
//             return res.status(NOT_FOUND).json({ message: "Course offering not found." });
//         }

//         // Check if teacher is assigned to the section
//         const sectionTeachersMap = offering.course.sectionTeachers;
//         const sectionTeachers = sectionTeachersMap instanceof Map
//             ? Object.fromEntries(sectionTeachersMap)
//             : sectionTeachersMap;

//         const assignedTeacherId = sectionTeachers?.[section]?.toString();

//         if (assignedTeacherId !== user._id.toString()) {
//             return res.status(FORBIDDEN).json({ message: `You are not assigned to section ${section}.` });
//         }

//         const existing = await CustomGradingScheme.findOne({ courseOffering: courseOfferingId, section });

//         if (existing) {
//             existing.rules = rules;
//             await existing.save();
//             return res.status(OK).json({ message: "Grading scheme updated.", scheme: existing });
//         }

//         const newScheme = await CustomGradingScheme.create({
//             courseOffering: courseOfferingId,
//             section,
//             createdBy: req.userId,
//             rules,
//         });

//         return res.status(CREATED).json({ message: "Grading scheme saved.", scheme: newScheme });
//     } catch (err) {
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
//     }
// };

// export const reviewFinalizedResult = async (req: Request, res: Response) => {
//     const { resultId } = req.params;

//     const parsed = reviewResultSchema.safeParse(req.body);

//     if (!parsed.success) {
//         return res.status(BAD_REQUEST).json({
//             message: "Validation failed",
//             errors: parsed.error.flatten().fieldErrors,
//         });
//     }

//     const { status } = parsed.data;
//     try {
//         const result = await FinalizedResult.findById(resultId).populate({
//             path: "courseOffering",
//             populate: {
//                 path: "programBatch",
//                 populate: { path: "program", model: "Program" },
//             },
//         });

//         if (!result) {
//             return res.status(NOT_FOUND).json({ message: "Finalized result not found." });
//         }

//         const department = (result.courseOffering as any)?.programBatch?.program?.departmentTitle;
//         if (!department) {
//             return res.status(BAD_REQUEST).json({ message: "Program department not found in offering." });
//         }

//         // Ensure user is department head of the offering's department
//         const reviewer = await User.findById(req.userId);
//         if (!reviewer || reviewer.role !== AudienceEnum.DepartmentHead || reviewer.department !== department) {
//             return res.status(FORBIDDEN).json({ message: "You are not authorized to review this result." });
//         }

//         result.status = status;
//         result.reviewedBy = new mongoose.Types.ObjectId(req.userId);
//         result.reviewedAt = new Date();

//         await result.save();

//         return res.status(OK).json({ message: `Result ${status.toLowerCase()} successfully.` });
//     } catch (err) {
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
//     }
// };

// export const getPendingFinalizedResultsForReview = async (req: Request, res: Response) => {
//     try {
//         const reviewer = await User.findById(req.userId);
//         if (!reviewer || reviewer.role !== AudienceEnum.DepartmentHead || !reviewer.department) {
//             return res.status(FORBIDDEN).json({ message: "Access denied. You must be a department head." });
//         }

//         const page = parseInt((req.query.page as string) || "1");
//         const limit = parseInt((req.query.limit as string) || "20");
//         const skip = (page - 1) * limit;

//         // Fetch only department-matching results
//         const allResults = await FinalizedResult.find({ status: "Pending" })
//             .populate({
//                 path: "courseOffering",
//                 populate: [
//                     {
//                         path: "course",
//                         model: "Course",
//                         select: "code title creditHours",
//                     },
//                     {
//                         path: "programBatch",
//                         select: "sessionYear program",
//                         populate: {
//                             path: "program",
//                             model: "Program",
//                             select: "title departmentTitle",
//                         },
//                     },
//                 ],
//             })
//             .populate("submittedBy", "firstName lastName email")
//             .lean();

//         // Filter for department match
//         const filtered = allResults.filter(result => {
//             const dept = (result.courseOffering as any)?.programBatch?.program?.departmentTitle;
//             return dept === reviewer.department;
//         });

//         const total = filtered.length;
//         const paginated = filtered.slice(skip, skip + limit);

//         return res.status(OK).json({
//             results: paginated,
//             total,
//             page,
//             pageSize: limit,
//             totalPages: Math.ceil(total / limit),
//         });
//     } catch (err) {
//         return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
//     }
// };
