import { Request, Response } from "express";
import User, { UserDocument } from "../../../models/auth/user.model";
import { AudienceEnum, DepartmentEnum } from "../../../shared/enums";
import { Program, ProgramDocument } from "../../../models/lms/program/program.model";
import mongoose, { Types } from "mongoose";
import { ProgramCatalogue } from "../../../models/lms/program/program.catalogue.model";
import { ProgramBatch } from "../../../models/lms/program/program.batch.model";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { createProgramCatalogueSchema, updateProgramCatalogueSchema } from "../../../utils/validators/lmsSchemas/catalogueSchemas";
import { logAuditEvent } from "../../../utils/logging/auditLogger";

export function canManageDepartmentContent(user: UserDocument, program: ProgramDocument | { departmentTitle: string }) {
    const isAdmin = user.role === AudienceEnum.Admin;
    const isDeptHead = user.role === AudienceEnum.DepartmentHead && user.department === program.departmentTitle;
    return isAdmin || isDeptHead;
};

export function isAdmin(user: UserDocument) {
    return user.role === AudienceEnum.Admin;
};

export async function createProgramCatalogue(req: Request, res: Response) {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const parsed = createProgramCatalogueSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { program, catalogueYear } = parsed.data;

        const parsedYear = catalogueYear;
        const currentYear = new Date().getFullYear();
        if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 5) {
            return res.status(400).json({ message: "Invalid or unrealistic catalogue year" });
        }
        // Optional: Ensure the program exists
        const existingProgram = await Program.findById(program);
        if (!existingProgram) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === existingProgram.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to create catalogues for this program"
            });
        }

        // Check for duplicates
        const existingCatalogue = await ProgramCatalogue.findOne({ program, catalogueYear: parsedYear });
        if (existingCatalogue) {
            return res.status(CONFLICT).json({ message: "Catalogue for this program and year already exists" });
        }

        const newCatalogue = new ProgramCatalogue({
            program,
            catalogueYear: parsedYear,
            createdBy: userId,
        });

        await newCatalogue.save();

        res.status(CREATED).json({
            message: "Catalogue created successfully",
            catalogue: newCatalogue,
        });
    } catch (err: any) {
        console.error("Error creating catalogue:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating catalogue",
            error: err.message,
        });
    }
};

export async function getCataloguesByProgram(req: Request, res: Response) {
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select("role department");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const { programId, year, page = "1", limit = "20" } = req.query;
        if (!programId || typeof programId !== "string") {
            return res.status(BAD_REQUEST).json({ message: "Missing or invalid programId query parameter" });
        }
        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID format" });
        }

        const program = await Program.findById(programId).select("departmentTitle");
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found" });
        }


        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead &&
            user.department === program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized view catalogues for this program"
            });
        }

        const pageNum = parseInt(page as string);
        const pageSize = parseInt(limit as string);
        const skip = (pageNum - 1) * pageSize;

        const filter: any = { program: programId };
        if (year) {
            filter.catalogueYear = Number(year);
        }

        const [catalogues, total] = await Promise.all([
            ProgramCatalogue.find(filter)
                .sort({ catalogueYear: -1 })
                .skip(skip)
                .limit(pageSize)
                .populate("program", "title departmentTitle")
                .populate("createdBy", "firstName lastName email")
                .lean(),
            ProgramCatalogue.countDocuments(filter),
        ]);

        res.status(OK).json({
            data: catalogues,
            page: pageNum,
            totalPages: Math.ceil(total / pageSize),
            totalCatalogues: total,
        });
    } catch (err: any) {
        console.error("Error while fetching catalogues:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching catalogues",
            error: err.message
        });
    }
};

export async function getCatalogueById(req: Request, res: Response) {
    const catalogueId = req.params.catalogueId;
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select("role department");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(catalogueId)) {
            return res.status(400).json({ message: "Invalid catalogue ID" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;

        const catalogue = await ProgramCatalogue.findById(catalogueId)
            .populate<{ program: ProgramDocument }>("program", "title departmentTitle")
            .populate("createdBy", "firstName lastName email");

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Catalogue not found" });
        }

        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({ message: "You cannot view catalogues outside your department" });
        }

        res.status(OK).json(catalogue);
    } catch (err: any) {
        console.error("Error fetching catalogue:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching catalogue",
            error: err.message
        });
    }
};

export async function updateCatalogueById(req: Request, res: Response) {
    const catalogueId = req.params.catalogueId;

    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("role department");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(catalogueId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid catalogue ID" });
        }

        const existingCatalogue = await ProgramCatalogue.findById(catalogueId).populate("program");

        if (!existingCatalogue) {
            return res.status(NOT_FOUND).json({ message: "Catalogue not found" });
        }

        if (
            !existingCatalogue.program ||
            typeof existingCatalogue.program === "string" ||
            existingCatalogue.program instanceof mongoose.Types.ObjectId
        ) {
            return res.status(BAD_REQUEST).json({ message: "Program population failed" });
        }

        const populatedProgram = existingCatalogue.program as ProgramDocument;

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            user.department === populatedProgram.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You cannot update catalogues from other departments",
            });
        }

        const parsed = updateProgramCatalogueSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { program, catalogueYear } = parsed.data;

        // Optional: If program is being updated, validate the new program ID
        if (program && !mongoose.Types.ObjectId.isValid(program)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
        }

        // If program is being updated, verify it exists
        if (program && program !== String(populatedProgram._id)) {
            const newProgram = await Program.findById(program);
            if (!newProgram) {
                return res.status(NOT_FOUND).json({ message: "Target program not found" });
            }
            existingCatalogue.program = newProgram._id as Types.ObjectId;
        }

        if (catalogueYear !== undefined) {
            existingCatalogue.catalogueYear = catalogueYear;
        }

        // Enforce uniqueness manually (in case program or year changed)
        const duplicate = await ProgramCatalogue.findOne({
            _id: { $ne: catalogueId },
            program: existingCatalogue.program,
            catalogueYear: existingCatalogue.catalogueYear,
        });

        if (duplicate) {
            return res.status(CONFLICT).json({
                message: "A catalogue with this program and year already exists",
            });
        }

        await existingCatalogue.save();

        res.status(OK).json({
            message: "Catalogue updated successfully",
            catalogue: existingCatalogue,
        });
    } catch (err: any) {
        console.error("Error while updating catalogue:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating catalogue",
            error: err.message

        });
    }
};

export async function deleteCatalogueById(req: Request, res: Response) {
    const catalogueId = req.params.catalogueId;
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select("role department");
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!mongoose.Types.ObjectId.isValid(catalogueId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid catalogue ID" });
        }

        const catalogue = await ProgramCatalogue.findById(catalogueId)
            .populate<{ program: ProgramDocument }>("program", "departmentTitle");

        if (!catalogue) {
            return res.status(NOT_FOUND).json({ message: "Catalogue not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            catalogue.program?.departmentTitle === user.department;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not allowed to delete catalogues from other departments",
            });
        }

        if (catalogue.isArchived) {
            return res.status(BAD_REQUEST).json({
                message: "Catalogue is already archived",
            });
        }

        // Prevent deletion if the catalogue is in use
        const isInUse = await ProgramBatch.exists({ catalogue: catalogueId });
        if (isInUse) {
            return res.status(CONFLICT).json({
                message: "Catalogue is in use by a ProgramBatch and cannot be archived",
            });
        }

        catalogue.isArchived = true;
        catalogue.archivedAt = new Date();
        await catalogue.save();

        await logAuditEvent({
            actor: userId,
            action: "CATALOGUE_ARCHIVED",
            entityType: "ProgramCatalogue",
            entityId: catalogueId,
            metadata: {
                title: catalogue.program?.title,
                programId: catalogue.program?._id,
                department: catalogue.program?.departmentTitle,
            },
        });

        res.status(OK).json({ message: "Catalogue archived successfully" });
    } catch (error: any) {
        console.error("Error while archiving catalogue:", error);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while archiving catalogue",
            error: error.message,
        });
    }
}