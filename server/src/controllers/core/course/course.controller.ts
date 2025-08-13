import { Request, Response } from "express";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../../constants/http";
import { AudienceEnum, ClassSectionEnum, DepartmentEnum } from "../../../shared/enums";
import { cloPloMappings, clos, courseCoRequisites, coursePreRequisites, courses, courseSections, semesterCourses } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { createCourseSchema, updateCourseSchema } from "../../../utils/validators/lms-schemas/semesterSchemas";
import { Course, Semester } from "../../../shared/interfaces";

export const createCourse = async (req: Request, res: Response) => {
    try {
        const parsed = createCourseSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const data = parsed.data;

        const userId = req.userId;
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, id: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to create a course",
            });
        }

        // Insert new course
        const [newCourse] = await db
            .insert(courses)
            .values({
                programId: data.programId,
                programCatalogueId: data.programCatalogueId,
                title: data.title,
                code: data.code,
                codePrefix: data.codePrefix,
                description: data.description,
                subjectLevel: data.subjectLevel,
                subjectType: data.subjectType,
                contactHours: data.contactHours,
                creditHours: data.creditHours,
                knowledgeArea: data.knowledgeArea,
                domain: data.domain,
                createdBy: user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return res.status(CREATED).json({
            message: "Course created successfully",
        });
    } catch (err: any) {
        if (err.code === "23505" && err.detail?.includes("courses_code_unique")) {
            // Postgres unique violation on course code
            return res.status(BAD_REQUEST).json({
                message: `A course with the code "${req.body.code}" already exists.`,
                field: "code",
            });
        }

        console.error("Error while creating course:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while creating course",
            error: err.message,
        });
    }
};

export const getCourses = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true, id: true },
        });

        if (!user || !user.department || !Object.values(DepartmentEnum)
            .includes(user.department as DepartmentEnum)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to view courses",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        // Pagination defaults
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // Filters from query
        const {
            semesterId,
            title,
            code,
            subjectLevel,
            subjectType,
            knowledgeArea,
            domain,
            programId,
        } = req.query;

        // Base filter conditions for courses table
        const baseConditions: any[] = [];

        // Handle department head filtering: restrict to their department's program(s)
        let deptProgramId: string | null = null;
        if (isDeptHead) {
            const userDept = user.department;

            if (!userDept) {
                return res.status(FORBIDDEN).json({ message: "User department is not set" });
            }

            const deptProgram = await db.query.programs.findFirst({
                where: (p, { eq }) => eq(p.departmentTitle, userDept),
                columns: { id: true },
            });

            if (!deptProgram) {
                return res.status(OK).json({
                    message: "No program found for your department",
                    courses: [],
                    page,
                    totalPages: 0,
                    totalCourses: 0,
                });
            }
            deptProgramId = deptProgram.id;
        }

        // If semesterId provided, get course IDs from semester_courses join
        if (semesterId && typeof semesterId === "string") {
            // Validate semester exists and permissions
            const semester = await db.query.semesters.findFirst({
                where: (s, { eq }) => eq(s.id, semesterId),
                with: {
                    programCatalogue: {
                        columns: { programId: true },
                        with: {
                            program: {
                                columns: { departmentTitle: true },
                            },
                        },
                    },
                    semesterCourses: {
                        columns: { courseId: true },
                    },
                },
            }) as Semester | null;

            if (!semester) {
                return res.status(NOT_FOUND).json({ message: "Semester not found" });
            }

            const semesterDept = semester.programCatalogue?.program?.departmentTitle;
            if (!semesterDept) {
                return res.status(NOT_FOUND).json({ message: "Program not found in semester catalogue" });
            }

            // Check permissions for DeptHead
            if (!isAdmin && isDeptHead && semesterDept !== user.department) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to access courses from another department.",
                });
            }

            const semesterCourseIds = semester.semesterCourses?.map(sc => sc.courseId) || [];

            if (!semesterCourseIds.length) {
                return res.status(OK).json({
                    message: `No courses assigned to semester`,
                    courses: [],
                    page,
                    totalPages: 0,
                    totalCourses: 0,
                });
            }

            // Filter courses to those in semester
            baseConditions.push(inArray(courses.id, semesterCourseIds));

            // Also filter by DeptHead's program if needed
            if (isDeptHead && deptProgramId) {
                baseConditions.push(eq(courses.programId, deptProgramId));
            }
        } else {
            // No semesterId: fetch all courses with filters and program restrictions
            if (isAdmin) {
                if (programId && typeof programId === "string") {
                    baseConditions.push(eq(courses.programId, programId));
                }
            } else if (isDeptHead && deptProgramId) {
                baseConditions.push(eq(courses.programId, deptProgramId));
            }
        }

        // Apply other filters from query params
        if (title && typeof title === "string") {
            baseConditions.push(sql`LOWER(${courses.title}) LIKE LOWER(${`%${title}%`})`);
        }
        if (code && typeof code === "string") {
            baseConditions.push(sql`LOWER(${courses.code}) LIKE LOWER(${`%${code}%`})`);
        }
        if (subjectLevel && typeof subjectLevel === "string") {
            baseConditions.push(eq(courses.subjectLevel, subjectLevel));
        }
        if (subjectType && typeof subjectType === "string") {
            baseConditions.push(eq(courses.subjectType, subjectType));
        }
        if (knowledgeArea && typeof knowledgeArea === "string") {
            baseConditions.push(eq(courses.knowledgeArea, knowledgeArea));
        }
        if (domain && typeof domain === "string") {
            baseConditions.push(eq(courses.domain, domain));
        }

        // Query total count
        const totalCourses = await db
            .select({
                count: sql<number>`count(*)`.mapWith(Number),  // map to number
            })
            .from(courses)
            .where(baseConditions.length > 0 ? and(...baseConditions) : undefined);

        // Query paginated courses
        const coursesList = await db.query.courses.findMany({
            where: baseConditions.length > 0 ? and(...baseConditions) : undefined,
            orderBy: (c) => desc(c.createdAt),
            limit,
            offset,
            with: {
                // You can populate related entities if needed
                // e.g. preRequisites: true, coRequisites: true
            },
        });

        const totalCount = totalCourses[0]?.count ?? 0;
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(OK).json({
            message: semesterId ? `Courses for semester` : "All courses",
            courses: coursesList,
            page,
            totalPages,
            totalCourses: totalCount,
        });
    } catch (err: any) {
        console.error("Error while fetching courses:", err);
        return res.status(500).json({
            message: "Error while fetching courses",
            error: err.message,
        });
    }
};

export const getCourseById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(BAD_REQUEST).json({ message: "Course ID is required" });
        }

        // Fetch user info (role, department)
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true, id: true },
        });

        if (
            !user ||
            !user.department ||
            !Object.values(DepartmentEnum).includes(user.department as DepartmentEnum)
        ) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to view course details",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isFaculty = user.role === AudienceEnum.DepartmentTeacher;

        // Fetch course with program info
        const course = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.id, courseId),
            with: {
                program: {
                    columns: { departmentTitle: true, id: true, createdBy: true },
                },
            },
        }) as Course | null;

        if (!course) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // Admins can access all courses
        if (isAdmin) {
            return res.status(OK).json({
                message: "Course fetched successfully",
                course,
            });
        }

        // Department Head access check
        if (isDeptHead) {
            if (course?.program?.departmentTitle !== user.department) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to access courses from another department",
                });
            }
            return res.status(OK).json({
                message: "Course fetched successfully",
                course,
            });
        }

        // Faculty access check: load assigned teachers from course_section_teachers
        if (isFaculty) {
            const assignedSectionTeachers = await db.query.courseSectionTeachers.findMany({
                where: (cst, { eq }) => eq(cst.courseId, courseId),
                columns: { teacherId: true },
            });
            const isAssigned = assignedSectionTeachers.some(
                (st) => String(st.teacherId) === String(user.id)
            );

            if (!isAssigned) {
                return res.status(FORBIDDEN).json({
                    message: "You are not assigned to teach this course",
                });
            }

            return res.status(OK).json({
                message: "Course fetched successfully",
                course,
            });
        }

        // Default deny access
        return res.status(FORBIDDEN).json({
            message: "You do not have permission to view this course",
        });
    } catch (err: any) {
        console.error("Error fetching course by ID:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while fetching course",
            error: err.message,
        });
    }
};

export const updateCourseById = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.userId;

        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, id: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isFaculty = user.role === AudienceEnum.DepartmentTeacher;

        if (!isAdmin && !isDeptHead && !isFaculty) {
            return res.status(FORBIDDEN).json({ message: "You are not authorized to update a course" });
        }

        // Fetch course + program details
        const existingCourse = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.id, courseId),
            with: {
                program: { columns: { departmentTitle: true } },
                sectionTeachers: true // assuming you have a relation here
            }
        }) as Course | null;

        if (!existingCourse) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // Role-based access checks
        if (isDeptHead) {
            if (user.department !== existingCourse.program?.departmentTitle) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to update this course (different department).",
                });
            }
        } else if (isFaculty) {
            // Check if faculty is assigned as section teacher
            const isAssigned = existingCourse.sectionTeachers?.some(
                (st) => st.teacherId === user.id
            );
            if (!isAssigned) {
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to update this course (not section teacher).",
                });
            }
        } else if (!isAdmin) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to update a course",
            });
        }

        const parsed = updateCourseSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const data = parsed.data;

        // Update the course
        const updatedCourse = await db.update(courses)
            .set({
                title: data.title,
                code: data.code,
                codePrefix: data.codePrefix,
                description: data.description,
                subjectLevel: data.subjectLevel,
                subjectType: data.subjectType,
                contactHours: data.contactHours,
                creditHours: data.creditHours,
                knowledgeArea: data.knowledgeArea,
                domain: data.domain,
                updatedAt: new Date(),
            })
            .where(eq(courses.id, courseId));

            
        if (data.clos) {
            const existingClos = await db.query.clos.findMany({
                where: (c, { eq }) => eq(c.courseId, courseId),
                columns: { id: true },
            });

            const incomingIds = data.clos.filter(c => c.id).map(c => c.id);
            const existingIds = existingClos.map(c => c.id);

            for (const clo of data.clos) {
                let cloId = clo.id;

                // --- 1. Update existing CLO ---
                if (cloId && existingIds.includes(cloId)) {
                    await db.update(clos)
                        .set({
                            code: clo.code,
                            title: clo.title,
                            description: clo.description,
                        })
                        .where(eq(clos.id, cloId));
                }

                // --- 2. Insert new CLO ---
                if (!cloId) {
                    const inserted = await db.insert(clos)
                        .values({
                            courseId,
                            code: clo.code,
                            title: clo.title,
                            description: clo.description,
                        })
                        .returning({ id: clos.id });
                    cloId = inserted[0].id;
                }

                // --- 3. PLO Mapping Logic ---
                if (clo.ploMapping && clo.ploMapping.length > 0) {
                    // Get current mappings for this CLO
                    const existingMappings = await db.query.cloPloMappings.findMany({
                        where: (pm, { eq }) => eq(pm.cloId, cloId),
                        columns: { id: true, ploId: true, strength: true },
                    });
                    const existingMappingIds = existingMappings.map(m => m.id);

                    // (a) Update existing mappings
                    for (const mapping of clo.ploMapping) {
                        if (mapping.id && existingMappingIds.includes(mapping.id)) {
                            await db.update(cloPloMappings)
                                .set({
                                    ploId: mapping.ploId,
                                    strength: mapping.strength,
                                })
                                .where(eq(cloPloMappings.id, mapping.id));
                        }
                    }

                    // (b) Insert new mappings
                    const newMappings = clo.ploMapping.filter(m => !m.id);
                    if (newMappings.length > 0) {
                        await db.insert(cloPloMappings).values(
                            newMappings.map(m => ({
                                cloId,
                                ploId: m.ploId,
                                strength: m.strength,
                            }))
                        );
                    }

                    // (c) Delete removed mappings
                    const incomingMappingIds = clo.ploMapping.filter(m => m.id).map(m => m.id);
                    const mappingsToDelete = existingMappingIds.filter(id => !incomingMappingIds.includes(id));
                    if (mappingsToDelete.length > 0) {
                        await db.delete(cloPloMappings)
                            .where(inArray(cloPloMappings.id, mappingsToDelete));
                    }
                }
            }

            // --- 4. Delete CLOs not in payload ---
            const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
            if (idsToDelete.length > 0) {
                // TODO: optionally check for assessment dependencies before deleting
                await db.delete(clos).where(inArray(clos.id, idsToDelete));
            }
        }

        if (isAdmin || isDeptHead) {
            if (data.preRequisites) {
                const existing = await db.query.coursePreRequisites.findMany({
                    where: (pr, { eq }) => eq(pr.courseId, courseId),
                    columns: { preReqCourseId: true },
                });

                const existingIds = existing.map(pr => pr.preReqCourseId);
                const incomingIds = data.preRequisites;

                // Insert new prerequisites
                const toInsert = incomingIds.filter(id => !existingIds.includes(id));
                if (toInsert.length > 0) {
                    await db.insert(coursePreRequisites).values(
                        toInsert.map(id => ({
                            courseId,
                            preReqCourseId: id,
                        }))
                    );
                }

                // Delete removed prerequisites
                const toDelete = existingIds.filter(id => !incomingIds.includes(id));
                if (toDelete.length > 0) {
                    await db.delete(coursePreRequisites)
                        .where(and(
                            eq(coursePreRequisites.courseId, courseId),
                            inArray(coursePreRequisites.preReqCourseId, toDelete)
                        ));
                }
            }

            if (data.coRequisites) {
                const existing = await db.query.courseCoRequisites.findMany({
                    where: (cr, { eq }) => eq(cr.courseId, courseId),
                    columns: { coReqCourseId: true },
                });

                const existingIds = existing.map(cr => cr.coReqCourseId);
                const incomingIds = data.coRequisites;

                const toInsert = incomingIds.filter(id => !existingIds.includes(id));
                if (toInsert.length > 0) {
                    await db.insert(courseCoRequisites).values(
                        toInsert.map(id => ({
                            courseId,
                            coReqCourseId: id,
                        }))
                    );
                }

                const toDelete = existingIds.filter(id => !incomingIds.includes(id));
                if (toDelete.length > 0) {
                    await db.delete(courseCoRequisites)
                        .where(and(
                            eq(courseCoRequisites.courseId, courseId),
                            inArray(courseCoRequisites.coReqCourseId, toDelete)
                        ));
                }
            }

            if (data.sections) {
                const existing = await db.query.courseSections.findMany({
                    where: (sec, { eq }) => eq(sec.courseId, courseId),
                    columns: { section: true },
                });

                const existingSections = existing.map(sec => sec.section);
                const incomingSections = data.sections;

                const toInsert = incomingSections.filter(sec => !existingSections.includes(sec));
                if (toInsert.length > 0) {
                    await db.insert(courseSections).values(
                        toInsert.map(sec => ({
                            courseId,
                            section: sec,
                        }))
                    );
                }

                const toDelete = existingSections.filter(sec => !incomingSections
                    .includes(sec as ClassSectionEnum));
                if (toDelete.length > 0) {
                    await db.delete(courseSections)
                        .where(and(
                            eq(courseSections.courseId, courseId),
                            inArray(courseSections.section, toDelete)
                        ));
                }
            }
        }

        return res.status(OK).json({
            message: "Course updated successfully",
            course: updatedCourse,
        });
    } catch (err: any) {
        if (err.code === "23505" && err.detail?.includes("courses_code_unique")) {
            return res.status(BAD_REQUEST).json({
                message: `A course with the code "${req.body.code}" already exists.`,
                field: "code",
            });
        }

        console.error("Error while updating course:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while updating course",
            error: err.message,
        });
    }
};

export const deleteCourseById = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(BAD_REQUEST).json({ message: "Course ID is required" });
        }

        const userId = req.userId;
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, id: true, department: true },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;

        if (!isAdmin && !isDeptHead) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to delete a course",
            });
        }

        // Fetch course with department info
        const course = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.id, courseId),
            with: {
                program: { columns: { departmentTitle: true } }
            }
        }) as Course | null;

        if (!course) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // Dept head department check
        if (isDeptHead && course.program?.departmentTitle !== user.department) {
            return res.status(FORBIDDEN).json({
                message: "You are not authorized to delete this course (different department).",
            });
        }

        // Soft delete
        await db.update(courses)
            .set({
                isArchived: true,
                archivedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(courses.id, courseId));

        return res.status(OK).json({ message: "Course archived successfully" });

    } catch (err: any) {
        console.error("Error while archiving course:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while archiving course",
            error: err.message,
        });
    }
};