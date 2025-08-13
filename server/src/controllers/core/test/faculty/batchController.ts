// import { Request, Response } from "express";
// import User, { UserDocument } from "../../../models/auth/user.model";
// import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
// import mongoose, { Types } from "mongoose";
// import { ProgramBatch } from "../../../models/lms/program/program.batch.model";
// import { ProgramCatalogue } from "../../../models/lms/program/program.catalogue.model";
// import { Program, ProgramDocument } from "../../../models/lms/program/program.model";
// import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
// import { createProgramBatchSchema, updateProgramBatchSchema } from "../../../utils/validators/lmsSchemas/batchSchemas";


// export const checkDepartmentAccess = (
//     user: UserDocument,
//     resourceDepartment: DepartmentEnum | string,
//     action: string = "perform this action"
// ) => {
//     if (!user) {
//         throw new Error("User not found");
//     }

//     const isAdmin = user.role === AudienceEnum.Admin;
//     const isDeptHead = user.role === AudienceEnum.DepartmentHead;

//     if (isAdmin) return; // Admins bypass access checks

//     if (!isDeptHead) {
//         throw new Error(`Only DepartmentHeads or Admins can ${action}`);
//     }

//     if (
//         !user.department ||
//         !Object.values(DepartmentEnum).includes(user.department as DepartmentEnum)
//     ) {
//         throw new Error("User does not belong to a valid department");
//     }

//     const userDept = String(user.department).trim().toLowerCase();
//     const targetDept = String(resourceDepartment).trim().toLowerCase();

//     if (userDept !== targetDept) {
//         console.warn(
//             `[ACCESS DENIED] DeptHead ${user.email} (dept: ${userDept}) tried to ${action} for ${targetDept}`
//         );
//         throw new Error(`DepartmentHead cannot ${action} outside their department`);
//     }
// };

// export const createProgramBatch = async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId;

//         const parsed = createProgramBatchSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Validation failed",
//                 errors: parsed.error.flatten().fieldErrors
//             });
//         }

//         const { programId, programCatalogueId, sessionYear } = parsed.data;

//         const [user, program, catalogue] = await Promise.all([
//             User.findById(userId),
//             Program.findById(programId),
//             ProgramCatalogue.findById(programCatalogueId)
//         ]);

//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }
//         if (!program) {
//             return res.status(NOT_FOUND).json({ message: "Program not found" });
//         }
//         if (!catalogue) {
//             return res.status(NOT_FOUND).json({ message: "Program Catalogue not found" });
//         }

//         // Enforce department-level permission
//         try {
//             checkDepartmentAccess(user, program.departmentTitle, "create a program batch");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         // Ensure the catalogue is for the same program
//         if (!(catalogue.program as Types.ObjectId).equals(program._id as Types.ObjectId)) {
//             return res.status(BAD_REQUEST).json({ message: "Catalogue does not belong to this program." });
//         }

//         // Prevent duplicates
//         const exists = await ProgramBatch.findOne({ program: programId, sessionYear });
//         if (exists) {
//             return res.status(FORBIDDEN).json({
//                 message: "A batch for this program and session year already exists."
//             });
//         }

//         const newBatch = await ProgramBatch.create({
//             program: programId,
//             programCatalogue: programCatalogueId,
//             sessionYear,
//             createdBy: userId
//         });

//         return res.status(OK).json({
//             message: "Program batch created successfully.",
//             batch: newBatch
//         });
//     } catch (error: any) {
//         console.error("Error while creating program batch:", error.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while creating program batch",
//             error: error.message
//         });
//     }
// };

// export const getBatchesByProgram = async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId;
//         const programId = req.query.programId as string;

//         if (!programId) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid ProgramId" });
//         }

//         // Fetch user
//         const [user, program] = await Promise.all([
//             User.findById(userId).select("-password"),
//             Program.findById(programId),
//         ]);

//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }
//         if (!program) {
//             return res.status(NOT_FOUND).json({ message: "Program not found" });
//         }

//         // Enforce department-level permission
//         try {
//             checkDepartmentAccess(user, program.departmentTitle, "access program batches");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         // Pagination
//         const page = parseInt(req.query.page as string) || 1;
//         const limit = parseInt(req.query.limit as string) || 20;
//         const skip = (page - 1) * limit;

//         // Fetch batches
//         const [batches, totalBatches] = await Promise.all([
//             ProgramBatch.find({ program: program._id })
//                 .populate("createdBy", "firstName lastName email")
//                 .populate("program", "title")
//                 .populate("programCatalogue", "catalogueYear")
//                 .sort({ sessionYear: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean(),
//             ProgramBatch.countDocuments({ program: program._id }),
//         ]);

//         return res.status(OK).json({
//             message: "Batches fetched successfully",
//             batches,
//             page,
//             totalPages: Math.ceil(totalBatches / limit),
//             totalBatches,
//         });
//     } catch (err: any) {
//         console.error("Error while fetching batches:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while fetching batches", error: err.message
//         });
//     }
// };

// export const getBatchById = async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId;
//         const { batchId } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(batchId)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid batch ID format" });
//         }

//         const user = await User.findById(userId).select("-password");
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batch = await ProgramBatch.findById(batchId)
//             .populate("createdBy", "firstName lastName email")
//             .populate("programCatalogue", "catalogueYear")
//             .populate<{ program: ProgramDocument }>("program", "title departmentTitle");

//         if (!batch) {
//             return res.status(NOT_FOUND).json({ message: "Batch not found" });
//         }

//         try {
//             checkDepartmentAccess(user, batch.program.departmentTitle, "view this batch");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         return res.status(OK).json({
//             message: "Batch fetched successfully",
//             batch,
//         });
//     } catch (err: any) {
//         console.error("Error while fetching batch:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while fetching batch",
//             error: err.message,
//         });
//     }
// };

// export const updateBatchById = async (req: Request, res: Response) => {
//     try {
//         const userId = req.userId;
//         const { batchId } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(batchId)) {
//             return res.status(BAD_REQUEST).json({ message: "Invalid batch ID format" });
//         }

//         const parsed = updateProgramBatchSchema.safeParse(req.body);
//         if (!parsed.success) {
//             return res.status(BAD_REQUEST).json({
//                 message: "Validation failed",
//                 errors: parsed.error.flatten().fieldErrors,
//             });
//         }

//         const { sessionYear, isActive } = parsed.data;

//         const user = await User.findById(userId).select("-password");
//         if (!user) {
//             return res.status(NOT_FOUND).json({ message: "User not found" });
//         }

//         const batch = await ProgramBatch.findById(batchId)
//             .populate<{ program: ProgramDocument }>("program");

//         if (!batch) {
//             return res.status(NOT_FOUND).json({ message: "Batch not found" });
//         }

//         try {
//             checkDepartmentAccess(user, batch.program.departmentTitle, "update this batch");
//         } catch (err: any) {
//             return res.status(FORBIDDEN).json({ message: err.message });
//         }

//         if (sessionYear) batch.sessionYear = sessionYear;
//         if (typeof isActive === "boolean") batch.isActive = isActive;

//         await batch.save();

//         return res.status(OK).json({
//             message: "Batch updated successfully",
//             batch,
//         });
//     } catch (err: any) {
//         console.error("Error while updating batch:", err.message);
//         return res.status(INTERNAL_SERVER_ERROR).json({
//             message: "Error while updating batch",
//             error: err.message,
//         });
//     }
// };