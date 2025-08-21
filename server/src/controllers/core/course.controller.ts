import { Request, Response } from "express";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../constants/http";
import { AudienceEnum, ClassSectionEnum, DepartmentEnum } from "../../shared/enums";
import { cloPloMappings, clos, courseCoRequisites, coursePreRequisites, courses, courseSections, courseSectionTeachers, semesterCourses } from "../../db/schema";
import { db } from "../../db/db";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { createCourseSchema, updateCourseSchema } from "../../utils/validators/lms-schemas/semesterSchemas";
import { writeAuditLog } from "../../utils/logs/writeAuditLog";
import { isValidUUID } from "../../utils/validators/lms-schemas/isValidUUID";
import { getNumberQueryParam, getStringQueryParam } from "../../utils/validators/sanitizer/queryParams";

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

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "COURSE_CREATED",
            actorId: userId,
            entityType: "course",
            entityId: newCourse.id,
            metadata: {
                ip: req.ip,
                programId: newCourse.programId,
                programCatalogueId: newCourse.programCatalogueId,
                title: newCourse.title,
                code: newCourse.code,
                codePrefix: newCourse.codePrefix,
                subjectLevel: newCourse.subjectLevel,
                subjectType: newCourse.subjectType,
                contactHours: newCourse.contactHours,
                creditHours: newCourse.creditHours,
                knowledgeArea: newCourse.knowledgeArea,
                domain: newCourse.domain,
                createdBy: newCourse.createdBy,
                createdAt: newCourse.createdAt,
            },
        });

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

        // --- Extract and type query params from req.query ---
        const semesterId = getStringQueryParam(req.query.semesterId);
        const title = getStringQueryParam(req.query.title);
        const code = getStringQueryParam(req.query.code);
        const subjectLevel = getStringQueryParam(req.query.subjectLevel);
        const subjectType = getStringQueryParam(req.query.subjectType);
        const knowledgeArea = getStringQueryParam(req.query.knowledgeArea);
        const domain = getStringQueryParam(req.query.domain);
        const programId = getStringQueryParam(req.query.programId);
        const search = getStringQueryParam(req.query.search);

        if (semesterId) {
            if (!isValidUUID(semesterId)) {
                return res.status(BAD_REQUEST).json({ message: "Invalid semester ID" });
            }
        }

        if (programId) {
            if (!isValidUUID(programId)) {
                return res.status(BAD_REQUEST).json({ message: "Invalid program ID" });
            }
        }

        // Pagination defaults
        const page = getNumberQueryParam(req.query.page, 1);
        const limit = getNumberQueryParam(req.query.limit, 20);

        const pageNum = page && page > 0 ? page : 1;
        const pageSize = limit && limit > 0 ? Math.min(limit, 100) : 20;
        const offsetVal = (pageNum - 1) * pageSize;


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
                    semesterCourses: {
                        with: {
                            course: true, // directly get the course object
                        },
                    },
                    programCatalogue: {
                        with: {
                            program: true,
                        },
                    },
                },
            });

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

        // NEW: Optional full-text search
        if (search && typeof search === "string" && search.trim().length > 0) {
            baseConditions.push(
                sql`${courses.searchVector} @@ plainto_tsquery('simple', ${search.trim()})`
            );
        }

        const finalWhere = baseConditions.length > 0 ? and(...baseConditions) : undefined;

        // Query total count
        const totalCourses = await db
            .select({
                count: sql<number>`count(*)`.mapWith(Number),  // map to number
            })
            .from(courses)
            .where(finalWhere);

        // Query paginated courses
        const coursesList = await db.query.courses.findMany({
            where: finalWhere,
            orderBy: (c) => desc(c.createdAt),
            limit,
            offset: offsetVal,
            with: {
                // You can populate related entities if needed
                // e.g. preRequisites: true, coRequisites: true
            },
        });

        const totalCount = totalCourses[0]?.count ?? 0;
        const totalPages = Math.ceil(totalCount / pageSize);

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

        if (!isValidUUID(courseId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid course ID" });
        }

        // Fetch user
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true, id: true },
        });

        if (!user || !Object.values(DepartmentEnum).includes(user.department as DepartmentEnum)) {
            return res.status(FORBIDDEN).json({
                message: "You must belong to a valid department to view course details",
            });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isFaculty = user.role === AudienceEnum.DepartmentTeacher;

        // Fetch course + program
        const course = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.id, courseId),
            with: { program: true },
        });

        if (!course) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // --- Always fetch CLOs (since faculty also needs them) ---
        const clos = await db.query.clos.findMany({ where: (clo, { eq }) => eq(clo.courseId, courseId) });
        const cloIds = clos.map(c => c.id);

        const cloPloMappingsRows = cloIds.length > 0
            ? await db.query.cloPloMappings.findMany({
                where: (m, { inArray }) => inArray(m.cloId, cloIds),
            })
            : [];

        const closWithMappings = clos.map(c => ({
            ...c,
            ploMappings: cloPloMappingsRows.filter(m => m.cloId === c.id),
        }));

        // ----------------------
        // ROLE BASED RESPONSES
        // ----------------------

        // 1. Admin → full access
        if (isAdmin) {
            const [preRequisites, coRequisites, sections, sectionTeachers] = await Promise.all([
                db.query.coursePreRequisites.findMany({ where: (pr, { eq }) => eq(pr.courseId, courseId) }),
                db.query.courseCoRequisites.findMany({ where: (cr, { eq }) => eq(cr.courseId, courseId) }),
                db.query.courseSections.findMany({ where: (sec, { eq }) => eq(sec.courseId, courseId) }),
                db.query.courseSectionTeachers.findMany({ where: (st, { eq }) => eq(st.courseId, courseId) }),
            ]);

            const fullCourse = {
                ...course,
                preRequisites,
                coRequisites,
                sections,
                sectionTeachers,
                clos: closWithMappings,
            };

            return res.status(OK).json({ message: "Course fetched successfully", course: fullCourse });
        }

        // 2. Department Head → full access but only for their own department
        if (isDeptHead) {
            if (course.program?.departmentTitle !== user.department) {
                return res.status(FORBIDDEN).json({ message: "You cannot access courses from another department" });
            }

            const [preRequisites, coRequisites, sections, sectionTeachers] = await Promise.all([
                db.query.coursePreRequisites.findMany({ where: (pr, { eq }) => eq(pr.courseId, courseId) }),
                db.query.courseCoRequisites.findMany({ where: (cr, { eq }) => eq(cr.courseId, courseId) }),
                db.query.courseSections.findMany({ where: (sec, { eq }) => eq(sec.courseId, courseId) }),
                db.query.courseSectionTeachers.findMany({ where: (st, { eq }) => eq(st.courseId, courseId) }),
            ]);

            const fullCourse = {
                ...course,
                preRequisites,
                coRequisites,
                sections,
                sectionTeachers,
                clos: closWithMappings,
            };

            return res.status(OK).json({ message: "Course fetched successfully", course: fullCourse });
        }

        // 3. Faculty → only basic course info + CLOs (if assigned)
        if (isFaculty) {
            const sectionTeachers = await db.query.courseSectionTeachers.findMany({ where: (st, { eq }) => eq(st.courseId, courseId) });

            const isAssigned = sectionTeachers.some(st => String(st.teacherId) === String(user.id));
            if (!isAssigned) {
                return res.status(FORBIDDEN).json({ message: "You are not assigned to teach this course" });
            }

            const basicCourse = {
                id: course.id,
                title: course.title,
                code: course.code,
                codePrefix: course.codePrefix,
                description: course.description,
                creditHours: course.creditHours,
                contactHours: course.contactHours,
                knowledgeArea: course.knowledgeArea,
                domain: course.domain,
                subjectType: course.subjectType,
                subjectLevel: course.subjectLevel,
                program: course.program,
                clos: closWithMappings,
            };

            return res.status(OK).json({ message: "Course fetched successfully", course: basicCourse });
        }

        // 4. Everyone else → deny
        return res.status(FORBIDDEN).json({ message: "You do not have permission to view this course" });

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

        if (!isValidUUID(courseId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid course ID" });
        }

        // console.log("🚀 updateCourseById called");
        // console.log("Course ID:", courseId);
        // console.log("User ID:", userId);
        // console.log("Request body:", JSON.stringify(req.body, null, 2));

        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, id: true, department: true },
        });

        // console.log("Fetched user:", user);

        if (!user) {
            console.warn("User not found");

            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const isAdmin = user.role === AudienceEnum.Admin;
        const isDeptHead = user.role === AudienceEnum.DepartmentHead;
        const isFaculty = user.role === AudienceEnum.DepartmentTeacher;

        // console.log("Roles:", { isAdmin, isDeptHead, isFaculty });

        if (!isAdmin && !isDeptHead && !isFaculty) {
            console.warn("User not authorized based on role");

            return res.status(FORBIDDEN).json({ message: "You are not authorized to update a course" });
        }

        // Fetch course + program details
        const existingCourse = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.id, courseId),
            with: {
                program: true, // OK
            },
        });

        // console.log("Fetched existing course:", existingCourse);

        if (!existingCourse) {
            return res.status(NOT_FOUND).json({ message: "Course not found" });
        }

        // If user is faculty, fetch sectionTeachers separately
        type SectionTeacherRow = {
            id: string;
            courseId: string;
            section: string;
            teacherId: string;
        };

        let sectionTeachers: SectionTeacherRow[] = [];
        if (isFaculty) {
            sectionTeachers = await db.query.courseSectionTeachers.findMany({
                where: (st, { eq }) => eq(st.courseId, courseId),
            });

            // console.log("Faculty section teachers:", sectionTeachers);
        }

        // Role-based access checks
        if (isDeptHead) {
            if (user.department !== existingCourse.program?.departmentTitle) {
                console.warn("Dept head not in same department");
                return res.status(FORBIDDEN).json({
                    message: "You are not authorized to update this course (different department).",
                });
            }
        } else if (isFaculty) {
            // Check if faculty is assigned as section teacher
            const isAssigned = sectionTeachers.some(st => st.teacherId === user.id);
            // console.log("Faculty assignment check:", isAssigned);
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

        // console.log("Validating payload with Zod schema...");

        const parsed = updateCourseSchema.safeParse(req.body);
        if (!parsed.success) {

            console.error("Validation FAILED");
            console.error("Zod error object:", parsed.error);
            console.error("Flattened field errors:", parsed.error.flatten().fieldErrors);

            return res.status(BAD_REQUEST).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const data = parsed.data;

        // console.log("Validation SUCCESS, parsed data:", JSON.stringify(data, null, 2));

        // Update the course

        // console.log("Updating course in DB...");

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

        // console.log("Course updated successfully:", updatedCourse);

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
                if (clo.ploMappings && clo.ploMappings.length > 0) {
                    // Get current mappings for this CLO
                    const existingMappings = await db.query.cloPloMappings.findMany({
                        where: (pm, { eq }) => eq(pm.cloId, cloId),
                        columns: { id: true, ploId: true, strength: true },
                    });
                    const existingMappingIds = existingMappings.map(m => m.id);

                    // (a) Update existing mappings
                    for (const mapping of clo.ploMappings) {
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
                    const newMappings = clo.ploMappings.filter(m => !m.id);
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
                    const incomingMappingIds = clo.ploMappings.filter(m => m.id).map(m => m.id);
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
                const incomingIds = data.preRequisites.map(pr => pr.preReqCourseId);

                // Insert new prerequisites
                const toInsert = data.preRequisites.filter(pr => !existingIds.includes(pr.preReqCourseId));
                if (toInsert.length > 0) {
                    await db.insert(coursePreRequisites).values(
                        toInsert.map(pr => ({
                            courseId,
                            preReqCourseId: pr.preReqCourseId,
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
                const incomingIds = data.coRequisites.map(cr => cr.coReqCourseId);

                // Insert new co-requisites
                const toInsert = data.coRequisites.filter(cr => !existingIds.includes(cr.coReqCourseId));
                if (toInsert.length > 0) {
                    await db.insert(courseCoRequisites).values(
                        toInsert.map(cr => ({
                            courseId,
                            coReqCourseId: cr.coReqCourseId,
                        }))
                    );
                }

                // Delete removed co-requisites
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
                // Fetch existing sections from DB
                const existing = await db.query.courseSections.findMany({
                    where: (sec, { eq }) => eq(sec.courseId, courseId),
                    columns: { section: true },
                });

                const existingSections = existing.map(sec => sec.section); // ["A", "B"]
                const incomingSections = data.sections.map(s => s.section); // ["A", "C"] from objects

                // Insert new sections
                const toInsert = incomingSections.filter(sec => !existingSections.includes(sec));
                if (toInsert.length > 0) {
                    await db.insert(courseSections).values(
                        toInsert.map(sec => ({
                            courseId,
                            section: sec,
                        }))
                    );
                }

                // Delete removed sections
                const toDelete = existingSections
                    .filter(sec => !incomingSections.includes(sec as ClassSectionEnum));
                if (toDelete.length > 0) {
                    await db.delete(courseSections)
                        .where(and(
                            eq(courseSections.courseId, courseId),
                            inArray(courseSections.section, toDelete)
                        ));
                }
            }

            if (data.sectionTeachers) {
                // Fetch existing from DB
                const existing = await db.query.courseSectionTeachers.findMany({
                    where: (st, { eq }) => eq(st.courseId, courseId),
                    columns: { id: true, section: true, teacherId: true },
                });

                // For quick lookups by section
                const existingBySection = new Map(existing.map(st => [st.section, st]));

                // Track sections in incoming payload
                const incomingSections = new Set(data.sectionTeachers.map(st => st.section));

                // 1. UPDATE existing section rows if teacher changed
                for (const st of data.sectionTeachers) {
                    const match = existingBySection.get(st.section);
                    if (match) {
                        if (match.teacherId !== st.teacherId) {
                            await db.update(courseSectionTeachers)
                                .set({ teacherId: st.teacherId })
                                .where(eq(courseSectionTeachers.id, match.id));
                        }
                    } else {
                        // 2. INSERT if section not found at all
                        await db.insert(courseSectionTeachers).values({
                            courseId,
                            section: st.section,
                            teacherId: st.teacherId,
                        });
                    }
                }

                // 3. DELETE rows where the section is missing from incoming
                const toDeleteIds = existing
                    .filter(e => !incomingSections.has(e.section as ClassSectionEnum))
                    .map(e => e.id);

                if (toDeleteIds.length > 0) {
                    await db.delete(courseSectionTeachers)
                        .where(inArray(courseSectionTeachers.id, toDeleteIds));
                }
            }
        }

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "COURSE_UPDATED",
            actorId: userId,
            entityType: "course",
            entityId: courseId,
            metadata: {
                ip: req.ip,
                updatedFields: parsed.data, // the Zod-validated update payload
                updatedAt: new Date(),
                // Optional: include program context
                programId: existingCourse.program?.id,
                department: existingCourse.program?.departmentTitle,
                // Track related entities updates
                closUpdated: data.clos?.map(c => ({
                    id: c.id,
                    code: c.code,
                    title: c.title,
                    description: c.description,
                    ploMappings: c.ploMappings,
                })),
                preRequisitesUpdated: data.preRequisites,
                coRequisitesUpdated: data.coRequisites,
                sectionsUpdated: data.sections,
                sectionTeachersUpdated: data.sectionTeachers,
            },
        });

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

        if (!isValidUUID(courseId)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid course ID" });
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
                program: true, // must match the key in coursesRelations
            },
        });

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

        // --- AUDIT LOG --- //
        await writeAuditLog(db, {
            action: "COURSE_ARCHIVED",
            actorId: userId,
            entityType: "course",
            entityId: courseId,
            metadata: {
                ip: req.ip,
                programId: course.program?.id,
                department: course.program?.departmentTitle,
                archivedAt: new Date(),
            },
        });

        return res.status(OK).json({ message: "Course archived successfully" });

    } catch (err: any) {
        console.error("Error while archiving course:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Error while archiving course",
            error: err.message,
        });
    }
};