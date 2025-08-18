import { Request, Response } from "express";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { customGradingSchemes, finalizedResultEntries, finalizedResults } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq } from "drizzle-orm";
import { AudienceEnum, FinalizedResultStatusEnum } from "../../../shared/enums";
import { finalizeResultSchema, reviewResultSchema, saveGradingSchemeSchema, submitResultsSchema } from "../../../utils/validators/lms-schemas/assessmentSchemas";

export interface GradingRule {
    grade: string;        // e.g., "A+", "A", "B"
    minPercentage: number; // e.g., 75
    gradePoint: number;   // e.g., 4.0
}

function getCustomGradePoint(rules: GradingRule[], percentage: number) {
    const sorted = rules.sort((a, b) => b.minPercentage - a.minPercentage);
    for (const rule of sorted) {
        if (percentage >= rule.minPercentage) {
            return { grade: rule.grade, gradePoint: rule.gradePoint };
        }
    }
    return { grade: "F", gradePoint: 0.0 };
};

interface GradeSubmission {
    studentId: string;
    weightedPercentage: number;
    gradePoint: number;
    grade: string;
}

export const finalizeAssessmentResults = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId!;

    const parsed = finalizeResultSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { section } = parsed.data;

    try {
        // ----------------------
        // Authorization
        // ----------------------
        const teacher = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        });

        if (!teacher || teacher.role !== "DepartmentTeacher") {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to finalize results." });
        }

        // ----------------------
        // Validate Course Offering & Teacher Assignment
        // ----------------------
        const courseOfferingRecord = await db
            .query.courseOfferings.findFirst({
                where: (co, { eq }) => eq(co.id, courseOfferingId),
            });

        if (!courseOfferingRecord) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found." });
        }

        // Only for DepartmentTeacher: must be assigned to this course's section
        if (teacher.role === AudienceEnum.DepartmentTeacher) {
            const sectionAssignments = await db.query.courseSectionTeachers.findMany({
                where: (cst, { and, eq }) =>
                    and(
                        eq(cst.courseId, courseOfferingRecord.courseId),
                        eq(cst.teacherId, userId),
                        eq(cst.section, section) // <-- include the section being finalized
                    ),
            });

            if (sectionAssignments.length === 0) {
                return res.status(FORBIDDEN).json({
                    message: `You are not assigned to Section ${section} of this course offering.`,
                });
            }
        }

        // ----------------------
        // Assessments & Weightage
        // ----------------------
        const assessmentList = await db.query.assessments.findMany({
            where: (a, { eq }) => eq(a.courseOfferingId, courseOfferingId),
        });

        const totalWeightage = assessmentList.reduce((sum, a) => sum + a.weightage, 0);
        if (totalWeightage < 100) {
            return res.status(BAD_REQUEST).json({
                message: `Cannot finalize. Total weightage is ${totalWeightage}%. Required: 100%.`,
            });
        }

        // ----------------------
        // Custom Grading Scheme
        // ----------------------
        const scheme = await db.query.customGradingSchemes.findFirst({
            where: (cgs, { and, eq }) =>
                and(eq(cgs.courseOfferingId, courseOfferingId), eq(cgs.section, section)),
        }) as (typeof customGradingSchemes.$inferSelect & { rules: GradingRule[] }) | null;

        if (!scheme || !scheme.rules || scheme.rules.length === 0) {
            return res.status(BAD_REQUEST).json({ message: "No grading scheme defined by the teacher." });
        }

        // ----------------------
        // Active Enrollments
        // ----------------------
        const enrollmentList = await db.query.enrollments.findMany({
            where: (e, { and, eq }) =>
                and(eq(e.courseOfferingId, courseOfferingId), eq(e.section, section), eq(e.isActive, true)),
        });

        const studentIds = enrollmentList.map((e) => e.studentId);
        if (studentIds.length === 0) {
            return res.status(NOT_FOUND).json({ message: "No active enrollments found for this section." });
        }

        // ----------------------
        // Assessment Results
        // ----------------------
        const assessmentIds = assessmentList.map((a) => a.id);

        const resultList = await db.query.assessmentResults.findMany({
            where: (r, { and, inArray }) =>
                and(inArray(r.assessmentId, assessmentIds), inArray(r.studentId, studentIds)),
        });

        // ----------------------
        // Grade Calculation
        // ----------------------
        const gradesToSubmit: GradeSubmission[] = [];

        for (const studentId of studentIds) {
            let totalScore = 0;

            for (const a of assessmentList) {
                const result = resultList.find(
                    (r) => r.assessmentId === a.id && r.studentId === studentId,
                );
                if (!result) continue;

                const percentage = (result.marksObtained / result.totalMarks) * 100;
                totalScore += percentage * (a.weightage / 100);
            }

            const { grade, gradePoint } = getCustomGradePoint(scheme.rules as any, totalScore);

            gradesToSubmit.push({
                studentId,
                grade,
                gradePoint,
                weightedPercentage: parseFloat(totalScore.toFixed(2)),
            });
        }

        // ----------------------
        // Existing Finalized Check
        // ----------------------
        const existingFinalized = await db.query.finalizedResults.findFirst({
            where: (fr, { and, eq }) =>
                and(eq(fr.courseOfferingId, courseOfferingId), eq(fr.section, section)),
        });

        if (existingFinalized) {
            if (existingFinalized.status === FinalizedResultStatusEnum.Pending) {
                return res.status(BAD_REQUEST).json({
                    message: "This section's results have already been finalized and are pending review.",
                });
            }
            if (existingFinalized.status === FinalizedResultStatusEnum.Confirmed) {
                return res.status(BAD_REQUEST).json({
                    message: "This section's results have already been confirmed and cannot be changed.",
                });
            }
        }

        // ----------------------
        // Insert Finalized Result + Entries (transaction)
        // ----------------------
        await db.transaction(async (tx) => {
            const [finalized] = await tx
                .insert(finalizedResults)
                .values({
                    courseOfferingId,
                    section,
                    submittedBy: userId,
                    results: gradesToSubmit, // keep raw JSON snapshot
                    status: FinalizedResultStatusEnum.Pending,
                })
                .onConflictDoUpdate({
                    target: [finalizedResults.courseOfferingId, finalizedResults.section],
                    set: {
                        submittedBy: userId,
                        results: gradesToSubmit,
                        status: FinalizedResultStatusEnum.Pending,
                        updatedAt: new Date(),
                    },
                })
                .returning();

            // clean old entries and re-insert
            await tx.delete(finalizedResultEntries).where(eq(finalizedResultEntries.finalizedResultId, finalized.id));

            await tx.insert(finalizedResultEntries).values(
                gradesToSubmit.map((g) => ({
                    finalizedResultId: finalized.id,
                    studentId: g.studentId,
                    grade: g.grade,
                    gradePoint: g.gradePoint.toString(),           // <-- convert to string
                    weightedPercentage: g.weightedPercentage.toString(), // <-- convert to string
                })),
            );
        });

        return res.status(OK).json({
            message: `Final grades for Section ${section} calculated and submitted for review.`,
        });
    } catch (err) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
    }
};

export const withdrawFinalizedResult = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId!;

    const parsed = finalizeResultSchema.safeParse(req.body); // validate section
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { section } = parsed.data;

    try {
        // ----------------------
        // Authorization
        // ----------------------
        const teacher = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        });

        if (!teacher || teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to withdraw results." });
        }

        // ----------------------
        // Validate Course Offering & Teacher Assignment
        // ----------------------
        const courseOfferingRecord = await db.query.courseOfferings.findFirst({
            where: (co, { eq }) => eq(co.id, courseOfferingId),
        });

        if (!courseOfferingRecord) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found." });
        }

        // Check if teacher is assigned to this section
        const sectionAssignments = await db.query.courseSectionTeachers.findMany({
            where: (cst, { and, eq }) =>
                and(
                    eq(cst.courseId, courseOfferingRecord.courseId),
                    eq(cst.teacherId, userId),
                    eq(cst.section, section)
                ),
        });

        if (sectionAssignments.length === 0) {
            return res.status(FORBIDDEN).json({
                message: `You are not assigned to Section ${section} of this course offering.`,
            });
        }

        // ----------------------
        // Find existing finalized result
        // ----------------------
        const existingFinalized = await db.query.finalizedResults.findFirst({
            where: (fr, { and, eq }) =>
                and(eq(fr.courseOfferingId, courseOfferingId), eq(fr.section, section)),
        });

        if (!existingFinalized) {
            return res.status(NOT_FOUND).json({ message: "No finalized result found for this section." });
        }

        if (existingFinalized.status !== FinalizedResultStatusEnum.Pending) {
            return res.status(BAD_REQUEST).json({
                message: "Only pending results can be withdrawn.",
            });
        }

        // ----------------------
        // Delete finalized result + entries (transaction)
        // ----------------------
        await db.transaction(async (tx) => {
            await tx.delete(finalizedResultEntries).where(
                eq(finalizedResultEntries.finalizedResultId, existingFinalized.id)
            );

            await tx.delete(finalizedResults).where(eq(finalizedResults.id, existingFinalized.id));
        });

        return res.status(OK).json({
            message: `Finalized result for Section ${section} has been withdrawn successfully.`,
        });

    } catch (err) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
    }
};

export const saveGradingScheme = async (req: Request, res: Response) => {
    const { courseOfferingId } = req.params;
    const userId = req.userId!;

    const parsed = saveGradingSchemeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { section, rules } = parsed.data;

    try {
        // ----------------------
        // Authorization
        // ----------------------
        const teacher = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        });

        if (!teacher || teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(FORBIDDEN).json({ message: "Only department teachers can define grading schemes." });
        }

        // ----------------------
        // Validate Course Offering & Teacher Assignment
        // ----------------------
        const courseOfferingRecord = await db.query.courseOfferings.findFirst({
            where: (co, { eq }) => eq(co.id, courseOfferingId),
        });

        if (!courseOfferingRecord) {
            return res.status(NOT_FOUND).json({ message: "Course offering not found." });
        }

        // Check if teacher is assigned to this section
        const sectionAssignments = await db.query.courseSectionTeachers.findMany({
            where: (cst, { and, eq }) =>
                and(
                    eq(cst.courseId, courseOfferingRecord.courseId),
                    eq(cst.teacherId, userId),
                    eq(cst.section, section)
                ),
        });

        if (sectionAssignments.length === 0) {
            return res.status(FORBIDDEN).json({
                message: `You are not assigned to Section ${section} of this course offering.`,
            });
        }

        // ----------------------
        // Check if grading scheme already exists
        // ----------------------
        const existingScheme = await db.query.customGradingSchemes.findFirst({
            where: (cgs, { and, eq }) =>
                and(eq(cgs.courseOfferingId, courseOfferingId), eq(cgs.section, section)),
        });

        if (existingScheme) {
            await db
                .update(customGradingSchemes)
                .set({ rules, updatedAt: new Date() })
                .where(eq(customGradingSchemes.id, existingScheme.id));
            return res.status(OK).json({ message: "Grading scheme updated.", scheme: { ...existingScheme, rules } });
        }

        // ----------------------
        // Create new grading scheme
        // ----------------------
        const [newScheme] = await db
            .insert(customGradingSchemes)
            .values({
                courseOfferingId,
                section,
                createdBy: userId,
                rules,
            })
            .returning();

        return res.status(CREATED).json({ message: "Grading scheme saved.", scheme: newScheme });

    } catch (err) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
    }
};

export const reviewFinalizedResult = async (req: Request, res: Response) => {
    const { resultId } = req.params;
    const userId = req.userId!;

    const parsed = reviewResultSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { status } = parsed.data;

    try {
        // ----------------------
        // Fetch finalized result
        // ----------------------
        const finalized = await db.query.finalizedResults.findFirst({
            where: (fr, { eq }) => eq(fr.id, resultId),
        });

        if (!finalized) {
            return res.status(NOT_FOUND).json({ message: "Finalized result not found." });
        }

        // ----------------------
        // Fetch course offering with program & department
        // ----------------------
        const courseOfferingRecord = await db.query.courseOfferings.findFirst({
            where: (co, { eq }) => eq(co.id, finalized.courseOfferingId),
            with: {
                programBatch: {
                    with: {
                        program: true,
                    },
                },
            },
        });

        const department = courseOfferingRecord?.programBatch?.program?.departmentTitle;
        if (!department) {
            return res.status(BAD_REQUEST).json({ message: "Program department not found in offering." });
        }

        // ----------------------
        // Authorization: Department Head
        // ----------------------
        const reviewer = await db.query.users.findFirst({
            where: (u, { and, eq }) => and(eq(u.id, userId), eq(u.role, AudienceEnum.DepartmentHead), eq(u.department, department)),
        });

        if (!reviewer) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to review this result." });
        }

        // ----------------------
        // Update finalized result
        // ----------------------
        await db.update(finalizedResults)
            .set({
                status,
                reviewedBy: userId,
                reviewedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(finalizedResults.id, resultId));

        return res.status(OK).json({ message: `Result ${status.toLowerCase()} successfully.` });
    } catch (err) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
    }
};

// Explicit type for nested relations
type FinalizedResultWithRelations = {
    id: string;
    section: string;
    submittedById: string;
    status: FinalizedResultStatusEnum;
    courseOffering: {
        id: string;
        course: { code: string; title: string; creditHours: number };
        programBatch: {
            id: string;
            program: { title: string; departmentTitle: string };
        };
    };
    submittedBy: { id: string; firstName: string; lastName: string; email: string };
};

export const getPendingFinalizedResultsForReview = async (req: Request, res: Response) => {
    const userId = req.userId!;

    try {
        const reviewer = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        });

        if (!reviewer || reviewer.role !== AudienceEnum.DepartmentHead || !reviewer.department) {
            return res.status(FORBIDDEN).json({ message: "Access denied. You must be a department head." });
        }

        const page = parseInt((req.query.page as string) || "1");
        const limit = parseInt((req.query.limit as string) || "20");
        const offset = (page - 1) * limit;

        // ----------------------
        // Fetch finalized results with nested relations
        // ----------------------
        const allResults = await db.query.finalizedResults.findMany({
            where: (fr, { eq }) => eq(fr.status, FinalizedResultStatusEnum.Pending),
            with: {
                courseOffering: {
                    with: {
                        course: true,
                        programBatch: { with: { program: true } },
                    },
                },
                submittedByUser: true,
                reviewedByUser: true, // optional
            },
        });

        const results = allResults as unknown as FinalizedResultWithRelations[];

        // ----------------------
        // Filter only results for the reviewer's department
        // ----------------------
        const filtered = results.filter(
            (r) => r.courseOffering?.programBatch?.program?.departmentTitle === reviewer.department
        );

        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + limit);

        return res.status(OK).json({
            results: paginated,
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server error." });
    }
};