import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { assessmentClos, assessmentResults, assessments, clos, courseOfferings, courseSectionTeachers, enrollments, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, asc, ne, inArray } from "drizzle-orm";
import { AudienceEnum } from "../../../shared/enums";
import { CreateAssessmentSchema, submitResultsSchema, UpdateAssessmentSchema } from "../../../utils/validators/lms-schemas/assessmentSchemas";
import { writeAuditLog } from "../../../utils/logs/writeAuditLog";
import { isValidUUID } from "../../../utils/validators/lms-schemas/isValidUUID";

export function validateResultEntry(entry: any): { valid: boolean; message?: string } {
    const { studentId, marksObtained, totalMarks } = entry;

    if (!studentId || typeof marksObtained !== 'number' || typeof totalMarks !== 'number') {
        return { valid: false, message: 'Missing or invalid fields.' };
    }

    if (marksObtained < 0 || totalMarks <= 0 || marksObtained > totalMarks) {
        return { valid: false, message: 'Marks must be within 0 and totalMarks.' };
    }

    return { valid: true };
};

export const createAssessment = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId;

    if (!isValidUUID(courseOfferingId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid courseOffering ID" });
    }

    try {
        // Validation
        const parsed = CreateAssessmentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { type, title, weightage, dueDate, clos: cloIds } = parsed.data;

        // Check user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        // Check course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, courseOfferingId));

        if (!courseOffering || !courseOffering.isActive) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found or inactive." });
        }

        // Authorization check for DepartmentTeacher
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(and(eq(courseSectionTeachers.courseId, courseOffering.courseId), eq(courseSectionTeachers.teacherId, user.id)));

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        // Check weightage limit
        const existingAssessments = await db
            .select()
            .from(assessments)
            .where(eq(assessments.courseOfferingId, courseOfferingId));

        const totalWeightage = existingAssessments.reduce((sum, a) => sum + a.weightage, 0);

        if (totalWeightage + weightage > 100) {
            return res.status(BAD_REQUEST).json({
                message: `Total assessment weightage cannot exceed 100%. 
                Existing: ${totalWeightage}%. Requested: ${weightage}%.`
            });
        }

        // Validate CLOs
        const validCLOs = await db
            .select({ id: clos.id })
            .from(clos)
            .where(eq(clos.courseId, courseOffering.courseId));

        const validCLOIds = validCLOs.map(c => c.id);
        const filteredCLOs = cloIds.filter(cloId => validCLOIds.includes(cloId));

        if (filteredCLOs.length !== cloIds.length) {
            return res.status(BAD_REQUEST).json({
                message: "Some selected CLOs are invalid or not part of this course.",
            });
        }

        // Create assessment
        const [newAssessment] = await db
            .insert(assessments)
            .values({
                courseOfferingId: courseOfferingId,
                type,
                title,
                weightage,
                dueDate: new Date(dueDate),
            })
            .returning();

        // Insert CLO mappings
        if (filteredCLOs.length > 0) {
            await db.insert(assessmentClos).values(
                filteredCLOs.map(cloId => ({
                    assessmentId: newAssessment.id,
                    cloId,
                }))
            );
        }

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "ASSESSMENT_CREATED",
            actorId: userId, // The user who created the assessment
            entityType: "assessment",
            entityId: newAssessment.id, // Newly created assessment ID
            metadata: {
                ip: req.ip,
                courseOfferingId: courseOfferingId,
                courseId: courseOffering.courseId,
                type,
                title,
                weightage,
                dueDate: new Date(dueDate),
                clos: filteredCLOs, // Array of valid CLO IDs associated with this assessment
                createdAt: new Date(),
            },
        });

        res.status(CREATED).json({ message: "Assessment created successfully." });
    } catch (error) {
        console.error(error);
        res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error while creating assessment." });
    }
};

export const getCourseAssessments = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId;

    if (!isValidUUID(courseOfferingId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid courseOffering ID" });
    }

    try {
        // Fetch course offering with courseId and active flag
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, courseOfferingId));

        if (!courseOffering) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found." });
        }

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(FORBIDDEN).json({ message: "Unauthorized" });
        }

        // Department teacher: must be assigned
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(
                    and(
                        eq(courseSectionTeachers.courseId, courseOffering.courseId),
                        eq(courseSectionTeachers.teacherId, user.id)
                    )
                );

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        // Student: must be enrolled
        if (user.role === AudienceEnum.Student) {
            const [enrollment] = await db
                .select()
                .from(enrollments)
                .where(
                    and(
                        eq(enrollments.courseOfferingId, courseOfferingId),
                        eq(enrollments.studentId, userId),
                        eq(enrollments.isActive, true)
                    )
                );

            if (!enrollment) {
                return res.status(FORBIDDEN).json({
                    message: "You are not enrolled in this course offering.",
                });
            }
        }

        // Fetch assessments for this course offering
        const courseAssessments = await db
            .select()
            .from(assessments)
            .where(eq(assessments.courseOfferingId, courseOfferingId))
            .orderBy(asc(assessments.dueDate)); // earliest first

        // For each assessment, fetch its clos
        const assessmentsWithClos = await Promise.all(
            courseAssessments.map(async (a) => {
                const rows = await db
                    .select({
                        id: clos.id,
                        code: clos.code,
                        title: clos.title,
                    })
                    .from(assessmentClos)
                    .innerJoin(clos, eq(assessmentClos.cloId, clos.id))
                    .where(eq(assessmentClos.assessmentId, a.id));

                return {
                    ...a,
                    clos: rows, // now contains full CLO objects
                };
            })
        );

        return res.status(OK).json({
            message: "Assessments retrieved successfully.",
            assessments: assessmentsWithClos,
        });
    } catch (error) {
        console.error(error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Server error while fetching assessments." });
    }
};

export const updateAssessment = async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const userId = req.userId;

    if (!isValidUUID(assessmentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid assessment ID" });
    }

    try {
        // Validate input
        const parsed = UpdateAssessmentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { type, title, weightage, dueDate, clos: incomingCloIds } = parsed.data;

        // Fetch assessment
        const [assessment] = await db.select().from(assessments).where(eq(assessments.id, assessmentId));
        if (!assessment) return res.status(NOT_FOUND).json({ message: "Assessment not found." });

        const courseOfferingId = assessment.courseOfferingId;

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return res.status(NOT_FOUND).json({ message: "User not found." });

        // Fetch course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, courseOfferingId));

        if (!courseOffering) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found." });
        }

        // Authorization check
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(
                    and(
                        eq(courseSectionTeachers.courseId, courseOffering.courseId),
                        eq(courseSectionTeachers.teacherId, user.id)
                    )
                );

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({ message: "You are not assigned to this course offering." });
            }
        }

        // Weightage check (excluding current assessment)
        const otherAssessments = await db
            .select()
            .from(assessments)
            .where(and(eq(assessments.courseOfferingId, courseOfferingId), ne(assessments.id, assessmentId)));

        const totalWeightage = otherAssessments.reduce((sum, a) => sum + a.weightage, 0);
        if (totalWeightage + weightage > 100) {
            return res.status(BAD_REQUEST).json({
                message: `Total assessment weightage cannot exceed 100%. 
                Existing (excluding current): ${totalWeightage}%. Requested: ${weightage}%.`,
            });
        }

        // Validate incoming CLOs against course
        const validCLOs = await db
            .select({ id: clos.id })
            .from(clos)
            .where(eq(clos.courseId, courseOffering.courseId));

        const validCloIdSet = new Set(validCLOs.map((c) => c.id));
        const dedupIncoming = Array.from(new Set(incomingCloIds)); // avoid dup inserts
        const filteredIncoming = dedupIncoming.filter((id) => validCloIdSet.has(id));

        if (filteredIncoming.length !== dedupIncoming.length) {
            return res.status(BAD_REQUEST).json({
                message: "Some selected CLOs are invalid or not part of this course.",
            });
        }

        // Diff current vs. incoming mappings
        const currentMappings = await db
            .select({ cloId: assessmentClos.cloId })
            .from(assessmentClos)
            .where(eq(assessmentClos.assessmentId, assessmentId));

        const currentSet = new Set(currentMappings.map((m) => m.cloId));
        const incomingSet = new Set(filteredIncoming);

        const toInsert = filteredIncoming.filter((id) => !currentSet.has(id));
        const toDelete = [...currentSet].filter((id) => !incomingSet.has(id));

        // Transaction: update assessment + apply mapping diffs only
        const [updatedAssessment] = await db.transaction(async (tx) => {
            // Update main assessment record
            const [updated] = await tx
                .update(assessments)
                .set({
                    type,
                    title,
                    weightage,
                    dueDate: new Date(dueDate),
                    updatedAt: new Date(),
                })
                .where(eq(assessments.id, assessmentId))
                .returning();

            // Insert only new mappings
            if (toInsert.length > 0) {
                await tx.insert(assessmentClos).values(
                    toInsert.map((cloId) => ({
                        assessmentId,
                        cloId,
                    }))
                );
            }

            // Delete only removed mappings
            if (toDelete.length > 0) {
                await tx
                    .delete(assessmentClos)
                    .where(and(eq(assessmentClos.assessmentId, assessmentId), inArray(assessmentClos.cloId, toDelete)));
            }

            return [updated];
        });

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "ASSESSMENT_UPDATED",
            actorId: userId, // User performing the update
            entityType: "assessment",
            entityId: assessmentId, // Updated assessment ID
            metadata: {
                ip: req.ip,
                courseOfferingId: courseOfferingId,
                courseId: courseOffering.courseId,
                updatedFields: {
                    type,
                    title,
                    weightage,
                    dueDate: new Date(dueDate),
                },
                cloChanges: {
                    added: toInsert,   // CLO IDs newly associated
                    removed: toDelete, // CLO IDs removed
                },
                updatedAt: new Date(),
            },
        });

        return res.status(OK).json({
            message: "Assessment updated successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error while updating assessment." });
    }
};

export const deleteAssessment = async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const userId = req.userId;

    try {
        // Fetch assessment
        const [assessment] = await db
            .select()
            .from(assessments)
            .where(eq(assessments.id, assessmentId));

        if (!assessment) {
            return res.status(NOT_FOUND).json({ message: "Assessment not found." });
        }

        const courseOfferingId = assessment.courseOfferingId;

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        // Fetch course offering
        const [courseOffering] = await db
            .select({
                id: courseOfferings.id,
                courseId: courseOfferings.courseId,
                isActive: courseOfferings.isActive,
            })
            .from(courseOfferings)
            .where(eq(courseOfferings.id, courseOfferingId));

        if (!courseOffering) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found." });
        }

        // Authorization check
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(and(
                    eq(courseSectionTeachers.courseId, courseOffering.courseId),
                    eq(courseSectionTeachers.teacherId, user.id)
                ));

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "ASSESSMENT_DELETED",
            actorId: userId, // User performing the deletion
            entityType: "assessment",
            entityId: assessmentId, // Deleted assessment ID
            metadata: {
                ip: req.ip,
                courseOfferingId: courseOfferingId,
                courseId: courseOffering.courseId,
                deletedAt: new Date(),
            },
        });

        // Delete assessment (cascade deletes CLO mappings & results via FK)
        await db.delete(assessments).where(eq(assessments.id, assessmentId));

        return res.status(OK).json({ message: "Assessment deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Server error while deleting assessment.",
        });
    }
};

export const submitBulkAssessmentResults = async (req: Request, res: Response) => {
    const { id: assessmentId } = req.params;
    const userId = req.userId;

    if (!isValidUUID(assessmentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid assessment ID" });
    }

    try {
        // Validate body
        const parsed = submitResultsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { results } = parsed.data;

        // Fetch assessment
        const [assessment] = await db
            .select()
            .from(assessments)
            .where(eq(assessments.id, assessmentId));

        if (!assessment) {
            return res.status(NOT_FOUND).json({ message: "Assessment not found." });
        }

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        // Department teacher check
        if (user.role === AudienceEnum.DepartmentTeacher) {
            const [courseOffering] = await db
                .select({
                    id: courseOfferings.id,
                    courseId: courseOfferings.courseId,
                })
                .from(courseOfferings)
                .where(eq(courseOfferings.id, assessment.courseOfferingId));

            if (!courseOffering) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to submit results for this assessment.",
                });
            }

            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(
                    and(
                        eq(courseSectionTeachers.courseId, courseOffering.courseId),
                        eq(courseSectionTeachers.teacherId, user.id)
                    )
                );

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        // Bulk results insert/update
        await db.transaction(async (tx) => {
            for (const entry of results) {
                if (!entry.studentId) {
                    throw {
                        status: BAD_REQUEST,
                        message: "Missing studentId in one of the entries.",
                    };
                }

                const validation = validateResultEntry(entry);
                if (!validation.valid) {
                    throw {
                        status: BAD_REQUEST,
                        message: `Invalid entry for studentId ${entry.studentId}: ${validation.message}`,
                    };
                }

                const { studentId, marksObtained, totalMarks } = entry;

                // Ensure student exists
                const [student] = await tx
                    .select()
                    .from(users)
                    .where(eq(users.id, studentId));

                if (!student) {
                    throw {
                        status: NOT_FOUND,
                        message: `Student not found: ${studentId}`,
                    };
                }

                // Upsert assessment result
                await tx
                    .insert(assessmentResults)
                    .values({
                        assessmentId,
                        studentId,
                        marksObtained,
                        totalMarks,
                        updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: [assessmentResults.assessmentId, assessmentResults.studentId],
                        set: {
                            marksObtained,
                            totalMarks,
                            updatedAt: new Date(),
                        },
                    });
            }
        });

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "BULK_ASSESSMENT_RESULTS_SUBMITTED",
            actorId: userId, // The teacher submitting the results
            entityType: "assessment",
            entityId: assessmentId,
            metadata: {
                ip: req.ip,
                totalResults: results.length,
                studentIds: results.map(r => r.studentId),
                updatedAt: new Date(),
            },
        });

        return res.status(OK).json({ message: "Assessment results submitted successfully." });
    } catch (error: any) {
        console.error(error);
        if (error?.status) {
            return res.status(error.status).json({ message: error.message });
        }
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Server error during bulk result submission." });
    }
};

export const getAssessmentResults = async (req: Request, res: Response) => {
    const { id: assessmentId } = req.params;
    const userId = req.userId;

    if (!isValidUUID(assessmentId)) {
        return res.status(BAD_REQUEST).json({ message: "Invalid assessment ID" });
    }

    try {
        // Fetch assessment
        const [assessment] = await db
            .select()
            .from(assessments)
            .where(eq(assessments.id, assessmentId));

        if (!assessment) {
            return res.status(NOT_FOUND).json({ message: "Assessment not found." });
        }

        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found." });
        }

        const isDeptTeacher = user.role === AudienceEnum.DepartmentTeacher;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isStudent = user.role === AudienceEnum.Student;

        // Department teacher check
        if (isDeptTeacher) {
            const [courseOffering] = await db
                .select({
                    id: courseOfferings.id,
                    courseId: courseOfferings.courseId,
                })
                .from(courseOfferings)
                .where(eq(courseOfferings.id, assessment.courseOfferingId));

            if (!courseOffering) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to view results for this assessment.",
                });
            }

            const sectionAssignments = await db
                .select()
                .from(courseSectionTeachers)
                .where(
                    and(
                        eq(courseSectionTeachers.courseId, courseOffering.courseId),
                        eq(courseSectionTeachers.teacherId, user.id)
                    )
                );

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to this course offering.",
                });
            }
        }

        // Student fetching their own result
        if (isStudent) {
            const [studentResult] = await db
                .select({
                    id: assessmentResults.id,
                    assessmentId: assessmentResults.assessmentId,
                    studentId: assessmentResults.studentId,
                    marksObtained: assessmentResults.marksObtained,
                    totalMarks: assessmentResults.totalMarks,
                    firstName: users.firstName,
                    email: users.email,
                })
                .from(assessmentResults)
                .where(
                    and(
                        eq(assessmentResults.assessmentId, assessmentId),
                        eq(assessmentResults.studentId, user.id)
                    )
                )
                .innerJoin(users, eq(users.id, assessmentResults.studentId));

            if (!studentResult) {
                return res
                    .status(NOT_FOUND)
                    .json({ message: "Result not found for student." });
            }

            return res.status(OK).json({
                message: "Student result fetched successfully.",
                results: [studentResult],
            });
        }

        // Dept head or teacher -> fetch all results
        const results = await db
            .select({
                id: assessmentResults.id,
                assessmentId: assessmentResults.assessmentId,
                studentId: assessmentResults.studentId,
                marksObtained: assessmentResults.marksObtained,
                totalMarks: assessmentResults.totalMarks,
                firstName: users.firstName,
                email: users.email,
            })
            .from(assessmentResults)
            .where(eq(assessmentResults.assessmentId, assessmentId))
            .innerJoin(users, eq(users.id, assessmentResults.studentId));

        return res
            .status(OK)
            .json({ message: "Results fetched successfully.", results });
    } catch (error) {
        console.error(error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Server error while fetching results." });
    }
};
