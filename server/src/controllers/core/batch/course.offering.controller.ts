import { Request, Response } from "express";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { activatedSemesters, courseOfferings, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and } from "drizzle-orm";
import { checkDepartmentAccess } from "./batch.controller";
import { CreateCourseOfferingsSchema, UpdateCourseOfferingSchema } from "../../../utils/validators/lms-schemas/courseOfferingSchemas";
import { writeAuditLog } from "../../../utils/logs/writeAuditLog";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";

export const createCourseOfferings = async (req: Request, res: Response) => {
    const { activatedSemesterId } = req.params;
    const userId = req.userId;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!isValidUUID(activatedSemesterId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid activated Semester ID" });
        }

        const parsed = CreateCourseOfferingsSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { offerings } = parsed.data;

        // 2. Get activatedSemester with program + department
        const activatedSemester = await db.query.activatedSemesters.findFirst({
            where: eq(activatedSemesters.id, activatedSemesterId),
            with: {
                programBatch: {
                    with: {
                        program: true, // has departmentTitle
                    },
                },
            },
        });

        if (!activatedSemester || !activatedSemester.isActive) {
            return res.status(NOT_FOUND).json({ message: "Activated semester not found or inactive" });
        }

        // 3. Check department access
        try {
            checkDepartmentAccess(
                user, // you can load full user if needed
                activatedSemester.programBatch.program.departmentTitle,
                "create course offerings"
            );
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // 4. Validate offerings input
        if (!Array.isArray(offerings) || offerings.length === 0) {
            return res.status(BAD_REQUEST).json({
                message: "Offerings array is required and cannot be empty",
            });
        }

        const createdOfferings = [];

        for (const offer of offerings) {
            const { courseId, sectionSchedules, capacityPerSection } = offer;

            // uuid validation
            if (!courseId) {
                continue;
            }

            // check if offering already exists
            const existing = await db.query.courseOfferings.findFirst({
                where: and(
                    eq(courseOfferings.activatedSemesterId, activatedSemester.id),
                    eq(courseOfferings.courseId, courseId)
                ),
            });
            if (existing) continue;

            // insert new offering
            const [newOffering] = await db
                .insert(courseOfferings)
                .values({
                    activatedSemesterId: activatedSemester.id,
                    programBatchId: activatedSemester.programBatchId,
                    courseId,
                    sectionSchedules,
                    capacityPerSection,
                })
                .returning();

            createdOfferings.push(newOffering);
        }

        // --- AUDIT LOG --- //
        for (const offering of createdOfferings) {
            await writeAuditLog(db, {
                action: "COURSE_OFFERING_CREATED",
                actorId: userId,
                entityType: "courseOffering",
                entityId: offering.id,
                metadata: {
                    ip: req.ip,
                    activatedSemesterId: activatedSemester.id,
                    programBatchId: activatedSemester.programBatchId,
                    programId: activatedSemester.programBatch.program.id,
                    courseId: offering.courseId,
                    sectionSchedules: offering.sectionSchedules,
                    capacityPerSection: offering.capacityPerSection,
                    createdAt: new Date(),
                },
            });
        }

        return res.status(CREATED).json({
            message: "Course offerings created",
        });
    } catch (err: any) {
        console.error("Error while creating offerings:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating offerings",
            error: err.message
        });
    }
};

export const getCourseOfferings = async (req: Request, res: Response) => {
    const { activatedSemesterId } = req.params;

    try {
        if (!isValidUUID(activatedSemesterId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid activated Semester ID" });
        }

        // Ensure activated semester exists
        const semester = await db.query.activatedSemesters.findFirst({
            where: eq(activatedSemesters.id, activatedSemesterId),
        });

        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Activated semester not found" });
        }

        // Fetch offerings with course and relations
        const offerings = await db.query.courseOfferings.findMany({
            where: eq(courseOfferings.activatedSemesterId, activatedSemesterId),
            with: {
                course: {
                    with: {
                        clos: true,
                    }
                }
            }
        });

        // Filter out offerings where course is missing
        const validOfferings = offerings.filter(o => o.course !== null);

        return res.status(OK).json({ offerings: validOfferings });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching course offerings",
            error: err.message
        });
    }
};

export const updateCourseOffering = async (req: Request, res: Response) => {
    const { offeringId } = req.params;
    const userId = req.userId;

    try {
        if (!isValidUUID(offeringId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid offering ID" });
        }

        const parsed = UpdateCourseOfferingSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        // 2. Get user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // 3. Get course offering with activatedSemester → programBatch → program
        const offering = await db.query.courseOfferings.findFirst({
            where: eq(courseOfferings.id, offeringId),
            with: {
                activatedSemester: {
                    with: {
                        programBatch: {
                            with: {
                                program: true, // contains departmentTitle
                            },
                        },
                    },
                },
            },
        });

        if (!offering) {
            return res.status(NOT_FOUND).json({ message: "Course Offering not found" });
        }

        // Department access check
        const program = offering.activatedSemester?.programBatch?.program;
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found for this offering" });
        }

        try {
            checkDepartmentAccess(user, program.departmentTitle, "update course offering");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // Update the offering
        const [updatedOffering] = await db
            .update(courseOfferings)
            .set({
                ...parsed.data,
                updatedAt: new Date(),
            })
            .where(eq(courseOfferings.id, offeringId))
            .returning();

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "COURSE_OFFERING_UPDATED",
            actorId: userId,
            entityType: "courseOffering",
            entityId: offeringId,
            metadata: {
                ip: req.ip,
                activatedSemesterId: offering.activatedSemester.id,
                programBatchId: offering.activatedSemester.programBatch.id,
                programId: offering.activatedSemester.programBatch.program.id,
                updatedFields: parsed.data,
                updatedAt: new Date(),
            },
        });

        return res.status(OK).json({ message: "Course Offering updated" });
    } catch (err: any) {
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating course offering",
            error: err.message
        });
    }
};

export const deleteCourseOffering = async (req: Request, res: Response) => {
    const { offeringId } = req.params;
    const userId = req.userId;

    try {
        if (!isValidUUID(offeringId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid offering ID" });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // fetch offering with full nested program.departmentTitle
        const offering = await db.query.courseOfferings.findFirst({
            where: eq(courseOfferings.id, offeringId),
            with: {
                activatedSemester: {
                    with: {
                        programBatch: {
                            with: {
                                program: true,
                            },
                        },
                    },
                },
            },
        });

        if (!offering) {
            return res.status(NOT_FOUND).json({ message: "Course Offering not found" });
        }

        const program = offering.activatedSemester?.programBatch?.program;
        if (!program) {
            return res.status(NOT_FOUND).json({ message: "Program not found for this offering" });
        }

        try {
            checkDepartmentAccess(user, program.departmentTitle, "delete course offering");
        } catch (err: any) {
            return res.status(FORBIDDEN).json({ message: err.message });
        }

        // delete offering
        await db.delete(courseOfferings).where(eq(courseOfferings.id, offeringId));

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "COURSE_OFFERING_DELETED",
            actorId: userId,
            entityType: "courseOffering",
            entityId: offeringId,
            metadata: {
                ip: req.ip,
                activatedSemesterId: offering.activatedSemester.id,
                programBatchId: offering.activatedSemester.programBatch.id,
                programId: offering.activatedSemester.programBatch.program.id,
                deletedAt: new Date(),
            },
        });

        return res.status(OK).json({ message: "Course offering deleted successfully" });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while deleting course offering",
            error
        });
    }
};