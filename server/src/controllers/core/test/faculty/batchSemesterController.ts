// import { Request, Response } from "express";
// import User from "../../../models/auth/user.model";
// import mongoose, { Types } from "mongoose";
// import { Semester } from "../../../models/lms/semester/semester.model";
// import { ProgramBatch, ProgramBatchDocument } from "../../../models/lms/program/program.batch.model";
// import { ActivatedSemester, ActivatedSemesterDocument } from "../../../models/lms/semester/activated.semester.model";
// import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
// import { ProgramDocument } from "../../../models/lms/program/program.model";
// import { checkDepartmentAccess } from "./batchController";
// import { TermEnum } from "../../../shared/enums";
// import { activateSemesterSchema, updateBatchSemesterSchema } from "../../../utils/validators/lmsSchemas/batchSchemas";

// export const activateSemester = async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId;

//         const parsed = activateSemesterSchema.safeParse(req.body);

//         if (!parsed.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Validation failed",
//                 errors: parsed.error.flatten().fieldErrors,
//             });
//         }

//         const { programBatchId, semesterNo, term, startedAt } = parsed.data;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batch = await ProgramBatch.findById(programBatchId)
//             .populate<{ program: ProgramDocument }>("program");

//         if (!batch) {
//             return res.status(NOT_FOUND).json({ message: "Program batch not found" });
//         }

//         try {
//             checkDepartmentAccess(user, batch.program.departmentTitle, "activate a semester for this batch");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         // Check if semesterNo exists in the associated ProgramCatalogue
//         const semesterExists = await Semester.findOne({
//             programCatalogue: batch.programCatalogue,
//             semesterNo,
//         });

//         if (!semesterExists) {
//             return res.status(BAD_REQUEST).json({
//                 message: `Semester ${semesterNo} does not exist in this batch's catalogue`
//             });
//         }

//         // Prevent duplicate activation
//         const alreadyActivated = await ActivatedSemester.findOne({
//             programBatch: batch._id,
//             semesterNo,
//             term,
//         });

//         if (alreadyActivated) {
//             return res.status(CONFLICT).json({
//                 message: `Semester ${semesterNo} is already activated for this batch`
//             });
//         }

//         // Prevent multiple active semesters in the same program batch
//         const existingActiveSemester = await ActivatedSemester.findOne({
//             programBatch: batch._id,
//             isActive: true,
//         });

//         if (existingActiveSemester) {
//             return res.status(BAD_REQUEST).json({
//                 message: "An active semester already exists for this batch. Please complete or deactivate it first.",
//             });
//         }

//         const newActivatedSemester = await ActivatedSemester.create({
//             programBatch: batch._id,
//             semesterNo,
//             term,
//             isActive: true,
//             startedAt: startedAt ? new Date(startedAt) : new Date()
//         });

//         return res.status(CREATED).json({
//             message: `Semester ${semesterNo} activated successfully for this batch`,
//             activatedSemester: newActivatedSemester
//         });

//     } catch (err: any) {
//         console.error("Error while activating semester:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while activating semester",
//             error: err.message
//         });
//     }
// };

// export const getSemestersByBatch = async (req: Request, res: Response) => {
//     try {
//         const { batchId } = req.params;
//         const userId = req.userId;

//         if (!batchId || !mongoose.Types.ObjectId.isValid(batchId as string)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid or missing batchId" });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batch = await ProgramBatch.findById(batchId)
//             .populate<{ program: ProgramDocument }>("program");

//         if (!batch) {
//             return res.status(NOT_FOUND).json({ message: "Program batch not found" });
//         }

//         try {
//             checkDepartmentAccess(user, batch.program.departmentTitle, "view semesters of this batch");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         const semesters = await ActivatedSemester.find({
//             programBatch: batchId
//         }).sort({ semesterNo: 1 });

//         return res.status(OK).json({
//             message: `Found ${semesters.length} semesters for this batch`,
//             semesters
//         });

//     } catch (err: any) {
//         console.error("Error while fetching batch semesters:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while fetching batch semesters",
//             error: err.message
//         });
//     }
// };

// export const updateBatchSemester = async (req: Request, res: Response) => {
//     try {
//         const { batchSemesterId } = req.params;
//         const userId = req.userId;

//         if (!mongoose.Types.ObjectId.isValid(batchSemesterId)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid batchSemesterId format" });
//         }

//         const updates = updateBatchSemesterSchema.safeParse(req.body);
//         if (!updates.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Invalid data",
//                 errors: updates.error.flatten().fieldErrors,
//             });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batchSemester = await ActivatedSemester.findById(batchSemesterId).populate<{
//             programBatch: ProgramBatchDocument & { program: ProgramDocument };
//         }>({
//             path: "programBatch",
//             populate: { path: "program" }
//         });

//         if (!batchSemester) {
//             return res.status(NOT_FOUND).json({ message: "Batch semester not found" });
//         }

//         const program = batchSemester.programBatch.program;

//         try {
//             checkDepartmentAccess(user, program.departmentTitle, "update this batch semester");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         const transformedUpdates = {
//             ...("isActive" in updates.data ? { isActive: updates.data.isActive } : {}),
//             ...("term" in updates.data ? { term: updates.data.term } : {}),
//             ...("semesterNo" in updates.data ? { semesterNo: updates.data.semesterNo } : {}),
//             ...("startedAt" in updates.data && updates.data.startedAt
//                 ? { startedAt: new Date(updates.data.startedAt).toISOString() } : {}),
//             ...("endedAt" in updates.data && updates.data.endedAt
//                 ? { endedAt: new Date(updates.data.endedAt).toISOString() } : {}),
//             ...("enrollmentDeadline" in updates.data
//                 ? { enrollmentDeadline: updates.data.enrollmentDeadline?.toISOString?.() ?? null }
//                 : {}),
//         };

//         const updated = await ActivatedSemester.findByIdAndUpdate(
//             batchSemesterId,
//             { $set: transformedUpdates },
//             { new: true, runValidators: true }
//         );

//         return res.status(OK).json({
//             message: "Batch semester updated successfully",
//             updated
//         });
//     } catch (err: any) {
//         console.error("Error while updating batch semester:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while updating batch semester",
//             error: err.message
//         });
//     }
// };

// export const completeBatchSemester = async (req: Request, res: Response) => {
//     try {
//         const { batchSemesterId } = req.params;
//         const userId = req.userId;

//         if (!mongoose.Types.ObjectId.isValid(batchSemesterId)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid batchSemesterId format" });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batchSemester = await ActivatedSemester.findById(batchSemesterId).populate<{
//             programBatch: ProgramBatchDocument & { program: ProgramDocument };
//         }>({
//             path: "programBatch",
//             populate: { path: "program" },
//         });

//         if (!batchSemester) {
//             return res.status(NOT_FOUND).json({ message: "Batch semester not found" });
//         }

//         const program = batchSemester.programBatch.program;

//         try {
//             checkDepartmentAccess(user, program.departmentTitle, "mark this batch semester as complete");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         // Set the semester as completed
//         batchSemester.isActive = false;

//         // If endedAt is not already set, mark it now
//         if (!batchSemester.endedAt) {
//             batchSemester.endedAt = new Date();
//         }

//         await batchSemester.save();

//         return res.status(OK).json({
//             message: "Semester marked as completed",
//             batchSemester,
//         });
//     } catch (err: any) {
//         console.error("Error while completing batch semester:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while completing batch semester",
//             error: err.message
//         });
//     }
// };

// export const deleteBatchSemester = async (req: Request, res: Response) => {
//     try {
//         const { batchSemesterId } = req.params;
//         const userId = req.userId;

//         if (!mongoose.Types.ObjectId.isValid(batchSemesterId)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid batchSemesterId format" });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batchSemester = await ActivatedSemester.findById(batchSemesterId).populate<{
//             programBatch: ProgramBatchDocument & { program: ProgramDocument };
//         }>({
//             path: "programBatch",
//             populate: { path: "program" },
//         });

//         if (!batchSemester) {
//             return res.status(NOT_FOUND).json({ message: "Batch semester not found" });
//         }

//         const program = batchSemester.programBatch.program;

//         try {
//             checkDepartmentAccess(user, program.departmentTitle, "delete this batch semester");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         await ActivatedSemester.findByIdAndDelete(batchSemesterId);

//         return res.status(OK).json({
//             message: "Batch semester deleted successfully",
//         });
//     } catch (err: any) {
//         console.error("Error while deleting batch semester:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while deleting batch semester",
//             error: err.message,
//         });
//     }
// };

// export const getCatalogueCoursesForActivatedSemester = async (req: Request, res: Response) => {
//     try {
//         const { activatedSemesterId } = req.params;
//         const userId = req.userId;

//         if (!mongoose.Types.ObjectId.isValid(activatedSemesterId)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid activated semester ID" });
//         }

//         const activatedSemester = await ActivatedSemester.findById(activatedSemesterId)
//             .populate({
//                 path: "programBatch",
//                 populate: {
//                     path: "program",
//                     model: "Program",
//                 },
//             }) as unknown as ActivatedSemesterDocument & {
//                 programBatch: ProgramBatchDocument & {
//                     program: ProgramDocument;
//                 };
//             };

//         if (!activatedSemester) {
//             return res.status(NOT_FOUND).json({ message: "Activated semester not found" });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         try {
//             checkDepartmentAccess(user, activatedSemester.programBatch.program.departmentTitle, "view catalogue courses");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         const { programCatalogue } = activatedSemester.programBatch;
//         const { semesterNo } = activatedSemester;

//         const semester = await Semester.findOne({
//             programCatalogue,
//             semesterNo,
//         }).populate("courses");

//         if (!semester) {
//             return res.status(NOT_FOUND).json({ message: "Corresponding catalogue semester not found" });
//         }

//         return res.status(OK).json({
//             message: `Found ${semester.courses.length} catalogue courses`,
//             courses: semester.courses,
//         });


//     } catch (err: any) {
//         console.error("Error fetching catalogue courses:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error fetching catalogue courses",
//             error: err.message,
//         });
//     }
// };
