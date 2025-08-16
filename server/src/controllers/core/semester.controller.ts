import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../constants/http";
import { AudienceEnum } from "../../shared/enums";
import { semesterCourses, semesters } from "../../db/schema";
import { db } from "../../db/db";
import { eq, and, inArray } from "drizzle-orm";
import { addSemesterSchema, updateSemesterSchema } from "../../utils/validators/lms-schemas/semesterSchemas";

type CatalogueWithProgram = {
    id: string;
    programId: string;
    program: {
        departmentTitle: string;
    };
};

export const addSemesterToCatalogue = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const parsed = addSemesterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { programCatalogueId, semesterNo, courses: courseIds } = parsed.data;

        // Fetch programCatalogue along with program data
        const catalogue = await db.query.programCatalogues.findFirst({
            where: (pc, { eq }) => eq(pc.id, programCatalogueId),
            with: { program: true },
        }) as CatalogueWithProgram | null;

        // Tell TypeScript what `catalogue` looks like
        if (!catalogue || !catalogue.program) {
            return res.status(NOT_FOUND).json({ message: "Program catalogue not found" });
        }

        // Authorization check: Admin or DepartmentHead of matching department only
        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to add semester to this catalogue",
            });
        }

        // Check if semester already exists in this catalogue
        const existingSemester = await db.query.semesters.findFirst({
            where: (s, { and, eq }) => and(eq(s.programCatalogueId, programCatalogueId), eq(s.semesterNo, semesterNo)),
        });

        if (existingSemester) {
            return res.status(CONFLICT).json({
                message: `Semester number ${semesterNo} already exists in this catalogue`,
            });
        }

        // Validate courses - fetch by IDs and compare lengths
        let validCourseIds: string[] = [];
        if (courseIds?.length) {
            const foundCourses = await db.query.courses.findMany({
                where: (c, { inArray }) => inArray(c.id, courseIds),
                columns: { id: true },
            });

            if (foundCourses.length !== courseIds.length) {
                return res.status(BAD_REQUEST).json({
                    message: "One or more course IDs are invalid or do not exist",
                });
            }
            validCourseIds = courseIds;
        }

        // Insert new semester
        const [newSemester] = await db
            .insert(semesters)
            .values({
                programCatalogueId: programCatalogueId,
                semesterNo,
            })
            .returning();

        // Associate courses with the semester if any
        if (validCourseIds.length > 0) {
            // Assuming you have a join table like semester_courses (semesterId, courseId)
            await db.insert(semesterCourses).values(
                validCourseIds.map((courseId) => ({
                    semesterId: newSemester.id,
                    courseId,
                }))
            );
        }

        return res.status(CREATED).json({
            message: "Semester added to catalogue successfully",
        });
    } catch (err: any) {
        console.error("Error while adding semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while adding semester",
            error: err.message
        });
    }
};

export const getSemestersInCatalogue = async (req: Request, res: Response) => {
    try {
        const { catalogueId } = req.query;
        const userId = req.userId;

        // Validate catalogueId param
        if (!catalogueId || typeof catalogueId !== "string") {
            return res.status(BAD_REQUEST).json({ message: "Invalid or missing catalogueId" });
        }

        // Fetch user for authorization
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Fetch catalogue with program info
        const catalogue = await db.query.programCatalogues.findFirst({
            where: (pc, { eq }) => eq(pc.id, catalogueId),
            with: { program: true },
        }) as CatalogueWithProgram | null;

        if (!catalogue || !catalogue.program) {
            return res.status(NOT_FOUND).json({ message: "Program catalogue not found" });
        }

        // Authorization check
        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to view semesters of this catalogue",
            });
        }

        // Fetch semesters with courses
        const semesters = await db.query.semesters.findMany({
            where: (s, { eq }) => eq(s.programCatalogueId, catalogueId),
            with: {
                semesterCourses: {
                    with: {
                        course: {
                            columns: {
                                code: true,
                                title: true,
                                creditHours: true,
                            },
                        },
                    },
                },
            },
            orderBy: (s, { asc }) => asc(s.semesterNo),
        });

        return res.status(OK).json({
            message: "Semesters fetched successfully",
            semesters,
        });
    } catch (err: any) {
        console.error("Error while fetching semesters:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching semesters",
            error: err.message,
        });
    }
};

export const updateSemesterById = async (req: Request, res: Response) => {
    try {
        const { semesterId } = req.params;
        const userId = req.userId;

        // Fetch user for auth
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const parsed = updateSemesterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { semesterNo, courses } = parsed.data;

        // Fetch semester by ID with necessary fields
        const semester = await db.query.semesters.findFirst({
            where: (s, { eq }) => eq(s.id, semesterId),
            columns: {
                id: true,
                semesterNo: true,
                programCatalogueId: true,
            },
        });

        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Semester not found" });
        }

        // Fetch related catalogue with program info
        const catalogue = await db.query.programCatalogues.findFirst({
            where: (pc, { eq }) => eq(pc.id, semester.programCatalogueId),
            with: { program: true },
        }) as CatalogueWithProgram | null;

        if (!catalogue || !catalogue.program) {
            return res.status(NOT_FOUND).json({ message: "Related program catalogue not found" });
        }

        // Authorization check: Admin or DepartmentHead of the relevant department
        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to update this semester",
            });
        }

        // Check uniqueness of semesterNo if it’s updated
        if (semesterNo && semesterNo !== semester.semesterNo) {
            const existing = await db.query.semesters.findFirst({
                where: (s, { and, eq }) =>
                    and(
                        eq(s.programCatalogueId, semester.programCatalogueId),
                        eq(s.semesterNo, semesterNo)
                    ),
            });

            if (existing) {
                return res.status(CONFLICT).json({
                    message: `Semester number ${semesterNo} already exists in this catalogue`,
                });
            }
        }

        // Validate course IDs if provided
        let validCourseIds: string[] = [];
        if (courses) {
            const foundCourses = await db.query.courses.findMany({
                where: (c, { inArray }) => inArray(c.id, courses),
                columns: { id: true },
            });

            if (foundCourses.length !== courses.length) {
                return res.status(BAD_REQUEST).json({
                    message: "One or more course IDs are invalid or not found",
                });
            }
            validCourseIds = courses;
        }

        // Update semester record
        await db
            .update(semesters)
            .set({
                ...(semesterNo && { semesterNo }),
                updatedAt: new Date(),
            })
            .where(eq(semesters.id, semesterId));

        // Sync semester_courses join table without deleting everything

        // Fetch current course links
        const currentCourseLinks = await db.query.semesterCourses.findMany({
            where: eq(semesterCourses.semesterId, semesterId),
            columns: { courseId: true },
        });
        const currentCourseIds = currentCourseLinks.map((link) => link.courseId);

        // Determine which course links to add and remove
        const coursesToAdd = validCourseIds.filter(id => !currentCourseIds.includes(id));
        const coursesToRemove = currentCourseIds.filter(id => !validCourseIds.includes(id));

        // Remove obsolete links only
        if (coursesToRemove.length > 0) {
            await db
                .delete(semesterCourses)
                .where(
                    and(
                        eq(semesterCourses.semesterId, semesterId),
                        inArray(semesterCourses.courseId, coursesToRemove)
                    )
                );
        }

        // Add new links only
        if (coursesToAdd.length > 0) {
            await db.insert(semesterCourses).values(
                coursesToAdd.map(courseId => ({
                    semesterId,
                    courseId,
                }))
            );
        }

        // Fetch and return updated semester with courses
        const updatedSemester = await db.query.semesters.findFirst({
            where: (s, { eq }) => eq(s.id, semesterId),
            with: {
                semesterCourses: {
                    with: {
                        course: {
                            columns: {
                                id: true,
                                code: true,
                                title: true,
                                creditHours: true,
                            },
                        },
                    },
                },
            },
        });
        return res.status(OK).json({
            message: "Semester updated successfully",
            semester: updatedSemester,
        });
    } catch (err: any) {
        console.error("Error while updating semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating semester",
            error: err.message,
        });
    }
};

export const deleteSemesterById = async (req: Request, res: Response) => {
    try {
        const { semesterId } = req.params;
        const userId = req.userId;

        // Fetch user for authorization
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (!semesterId || typeof semesterId !== "string") {
            return res.status(BAD_REQUEST).json({ message: "Invalid semester ID" });
        }

        // Fetch semester by ID
        const semester = await db.query.semesters.findFirst({
            where: (s, { eq }) => eq(s.id, semesterId),
            columns: {
                id: true,
                programCatalogueId: true,
                isArchived: true,
            },
        });

        if (!semester) {
            return res.status(NOT_FOUND).json({ message: "Semester not found" });
        }

        if (semester.isArchived) {
            return res.status(BAD_REQUEST).json({ message: "Semester already archived" });
        }

        // Fetch related program catalogue with program data
        const catalogue = await db.query.programCatalogues.findFirst({
            where: (pc, { eq }) => eq(pc.id, semester.programCatalogueId),
            with: { program: true },
        }) as CatalogueWithProgram | null;

        if (!catalogue || !catalogue.program) {
            return res.status(NOT_FOUND).json({ message: "Associated program catalogue not found" });
        }

        // Authorization check: Admin or DepartmentHead of matching department
        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead =
            user.role === AudienceEnum.DepartmentHead &&
            user.department === catalogue.program.departmentTitle;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to archive semester of this catalogue",
            });
        }

        // Soft delete: update isArchived and archivedAt
        await db
            .update(semesters)
            .set({
                isArchived: true,
                archivedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(semesters.id, semesterId));

        return res.status(OK).json({
            message: "Semester archived successfully",
        });
    } catch (err: any) {
        console.error("Error while archiving semester:", err.message);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while archiving semester",
            error: err.message,
        });
    }
};