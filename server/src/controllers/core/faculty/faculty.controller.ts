import { Request, Response } from "express";
import { BAD_REQUEST, CONFLICT, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, UNAUTHORIZED } from "../../../constants/http";
import { AudienceEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../../shared/enums";
import { teacherInfo, teacherQualifications, users } from "../../../db/schema";
import { db } from "../../../db/db";
import { eq, sql, and, ilike, gte, lte, inArray } from "drizzle-orm";
import { facultyRegisterSchema, updateFacultySchema } from "../../../utils/validators/lms-schemas/facultySchemas";
import { hashValue } from "../../../utils/bcrypt";

export const registerFacultyMember = async (req: Request, res: Response) => {
    const userId = req.userId;

    const parsed = facultyRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid input",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { email, password, department, teacherInfo: teacherInfoData } = parsed.data;

    try {
        // Get the current user (requester)
        const requester = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
                role: true,
                department: true,
            },
        });

        if (!requester) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Role-based access check
        if (
            requester.role !== AudienceEnum.DepartmentHead &&
            requester.role !== AudienceEnum.Admin
        ) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can register faculty",
            });
        }

        // Department Head restriction
        if (
            requester.role === AudienceEnum.DepartmentHead &&
            requester.department !== department
        ) {
            return res.status(FORBIDDEN).json({
                message: "Department Heads can only register faculty in their own department",
            });
        }

        // Check department validity
        if (!Object.values(DepartmentEnum).includes(department)) {
            return res.status(BAD_REQUEST).json({ message: "Invalid department" });
        }

        // Check if email already exists
        const existingUser = await db.query.users.findFirst({
            where: (user, { eq }) => eq(user.email, email),
        });
        if (existingUser) {
            return res.status(CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await hashValue(password);

        // Insert faculty user
        const [newUser] = await db
            .insert(users)
            .values({
                email,
                password: hashedPassword,
                department,
                role: AudienceEnum.DepartmentTeacher,
                createdAt: new Date(),
                lastOnline: new Date(),
                isEmailVerified: false,
            })
            .returning();

        // Insert teacher info (if provided)
        if (teacherInfoData) {
            await db.insert(teacherInfo).values({
                userId: newUser.id,
                designation: teacherInfoData.designation,
                joiningDate: teacherInfoData.joiningDate
                    ? new Date(teacherInfoData.joiningDate).toISOString().split("T")[0] // 'YYYY-MM-DD'
                    : null,
                facultyType: teacherInfoData.facultyType,
                subjectOwner: teacherInfoData.subjectOwner ?? false,
            });
        }

        return res.status(CREATED).json({
            message: "Faculty member registered successfully!",
        });
    } catch (err: any) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot register faculty member" });
    }
};

export const fetchFacultyMembers = async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const userId = req.userId;

    try {
        const requester = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
                role: true,
                department: true,
            },
        });

        if (!requester) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }
        if (requester.role !== AudienceEnum.DepartmentHead && requester.role !== AudienceEnum.Admin) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can view faculty info"
            });
        }

        // --- If teacherId provided -> Fetch single faculty ---
        if (teacherId) {
            const teacher = await db.query.users.findFirst({
                where: (u, { and, eq }) => and(
                    eq(u.id, teacherId),
                    eq(u.role, AudienceEnum.DepartmentTeacher)
                ),
                with: {
                    teacherInfo: {
                        with: {
                            qualifications: true // <-- fetch qualifications inside teacherInfo
                        }
                    }
                },
                columns: { password: false },
            });

            if (!teacher) {
                return res.status(NOT_FOUND).json({ message: "Teacher not found" });
            }

            if (
                requester.role === AudienceEnum.DepartmentHead &&
                teacher.department !== requester.department
            ) {
                return res.status(UNAUTHORIZED).json({ message: "Teacher does not belong to your department" });
            }

            return res.status(OK).json(teacher);
        }

        // --- Otherwise -> Paginated list ---
        const {
            page = "1",
            limit = "20",
            search,
            designation,
            facultyType,
            subjectOwner,
            joiningDateFrom,
            joiningDateTo,
            department,
        } = req.query as Record<string, string | undefined>;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const whereClauses = [eq(users.role, AudienceEnum.DepartmentTeacher)];

        if (requester.role === AudienceEnum.DepartmentHead) {
            whereClauses.push(eq(users.department, requester.department!));
        } else if (requester.role === AudienceEnum.Admin && department) {
            whereClauses.push(eq(users.department, department as string));
        }

        // Full-text search on users.search_vector using PostgreSQL `to_tsquery`
        if (search) {
            whereClauses.push(sql`search_vector @@ plainto_tsquery('simple', ${search})`);
        }

        // Filters from teacherInfo
        if (designation) {
            whereClauses.push(eq(teacherInfo.designation, designation as string));
        }
        if (facultyType) {
            whereClauses.push(eq(teacherInfo.facultyType, facultyType as string));
        }
        if (subjectOwner !== undefined) {
            whereClauses.push(eq(teacherInfo.subjectOwner, subjectOwner === "true"));
        }
        if (joiningDateFrom) {
            whereClauses.push(gte(teacherInfo.joiningDate, joiningDateFrom as string));
        }
        if (joiningDateTo) {
            whereClauses.push(lte(teacherInfo.joiningDate, joiningDateTo as string));
        }

        // Query with join
        const facultyMembers = await db
            .select({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                avatarURL: users.avatarURL,
                city: users.city,
                country: users.country,
                department: users.department,
                role: users.role,

                // Select teacherInfo fields under a nested object
                teacherInfo: {
                    designation: teacherInfo.designation,
                    facultyType: teacherInfo.facultyType,
                    joiningDate: teacherInfo.joiningDate,
                    subjectOwner: teacherInfo.subjectOwner,
                    // id: teacherInfo.id,
                    // userId: teacherInfo.userId,
                },
            })
            .from(users)
            .leftJoin(teacherInfo, eq(users.id, teacherInfo.userId))
            .where(and(...whereClauses))
            .limit(limitNum)
            .offset(offset);

        const totalFacultyResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .leftJoin(teacherInfo, eq(users.id, teacherInfo.userId))
            .where(and(...whereClauses));

        const totalFaculty = Number(totalFacultyResult[0]?.count ?? 0);

        return res.status(OK).json({
            data: facultyMembers,
            page,
            totalPages: Math.ceil(totalFaculty / limitNum),
            totalFaculty,
        });
    } catch (error) {
        console.error("Error fetching faculty:", error);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Cannot fetch faculty info" });
    }
};

export async function updateFacultyMember(req: Request, res: Response) {
    const { teacherId } = req.params;
    const userId = req.userId;

    const parsed = updateFacultySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const {
        teacherInfo: teacherInfoData,
        firstName,
        lastName,
        city,
        country,
        address,
        department,
        role,
    } = parsed.data;

    try {
        // Get the current user (requester)
        const requester = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
                role: true,
                department: true,
            },
        });

        if (!requester) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        // Role-based access check
        if (
            requester.role !== AudienceEnum.DepartmentHead &&
            requester.role !== AudienceEnum.Admin
        ) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can update faculty",
            });
        }

        // Find the teacher to update
        const teacher = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, teacherId),
            columns: { password: false },
        });

        if (!teacher) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }

        if (teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(NOT_FOUND).json({ message: "User is not a teacher" });
        }

        // Department Head restriction on updating others
        if (
            requester.role === AudienceEnum.DepartmentHead &&
            teacher.department !== requester.department
        ) {
            return res.status(UNAUTHORIZED).json({
                message: "Teacher does not belong to your department",
            });
        }

        // Department Head restriction on certain fields
        if (
            requester.role === AudienceEnum.DepartmentHead &&
            (department !== undefined || role !== undefined)
        ) {
            return res.status(FORBIDDEN).json({
                message: "Department Heads are not allowed to change department or role",
            });
        }

        // Build update object for users table
        const updateData: Partial<typeof users.$inferInsert> = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (city !== undefined) updateData.city = city;
        if (country !== undefined) updateData.country = country;
        if (address !== undefined) updateData.address = address;
        if (department !== undefined) updateData.department = department;
        if (role !== undefined) updateData.role = role;

        // Update user
        if (Object.keys(updateData).length > 0) {
            await db.update(users)
                .set(updateData)
                .where(eq(users.id, teacherId));
        }

        // Update teacherInfo if provided
        if (teacherInfoData !== undefined) {
            // Find existing teacherInfo
            let existingInfo = await db.query.teacherInfo.findFirst({
                where: (t, { eq }) => eq(t.userId, teacherId),
            });

            if (existingInfo) {
                // Update existing teacherInfo
                await db.update(teacherInfo)
                    .set({
                        designation: teacherInfoData.designation,
                        joiningDate: teacherInfoData.joiningDate
                            ? new Date(teacherInfoData.joiningDate).toISOString().split("T")[0]
                            : null,
                        facultyType: teacherInfoData.facultyType,
                        subjectOwner: teacherInfoData.subjectOwner ?? false,
                    })
                    .where(eq(teacherInfo.userId, teacherId));
            } else {
                // Insert new teacherInfo
                await db.insert(teacherInfo).values({
                    userId: teacherId,
                    designation: teacherInfoData.designation as TeacherDesignationEnum,
                    joiningDate: teacherInfoData.joiningDate
                        ? new Date(teacherInfoData.joiningDate).toISOString().split("T")[0]
                        : null,
                    facultyType: teacherInfoData.facultyType as FacultyTypeEnum,
                    subjectOwner: teacherInfoData.subjectOwner ?? false,
                });

                // Re-fetch inserted record to get its id
                existingInfo = await db.query.teacherInfo.findFirst({
                    where: (t, { eq }) => eq(t.userId, teacherId),
                });
            }

            // Update qualifications if present
            if (teacherInfoData.qualifications !== undefined && existingInfo) {
                const existingQualifications = await db.query.teacherQualifications.findMany({
                    where: (q, { eq }) => eq(q.teacherInfoId, existingInfo.id),
                });

                const existingById = new Map(existingQualifications.map(q => [q.id, q]));
                const payloadIds = new Set<string>();

                for (const q of teacherInfoData.qualifications) {
                    if (q.id && existingById.has(q.id)) {
                        // Update existing qualification
                        await db.update(teacherQualifications)
                            .set({
                                degree: q.degree,
                                passingYear: q.passingYear,
                                institutionName: q.institutionName,
                                majorSubjects: q.majorSubjects,
                            })
                            .where(eq(teacherQualifications.id, q.id));

                        payloadIds.add(q.id);
                    } else {
                        // Insert new qualification
                        const inserted = await db.insert(teacherQualifications)
                            .values({
                                teacherInfoId: existingInfo.id,
                                degree: q.degree,
                                passingYear: q.passingYear,
                                institutionName: q.institutionName,
                                majorSubjects: q.majorSubjects,
                            })
                            .returning();

                        if (inserted.length > 0) {
                            payloadIds.add(inserted[0].id);
                        }
                    }
                }

                // Delete qualifications not in payload anymore
                const toDeleteIds = existingQualifications
                    .filter(q => !payloadIds.has(q.id))
                    .map(q => q.id);

                if (toDeleteIds.length > 0) {
                    await db.delete(teacherQualifications)
                        .where(inArray(teacherQualifications.id, toDeleteIds));
                }
            }
        }

        // Fetch updated record
        const updatedUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, teacherId),
            with: {
                teacherInfo: true,
            },
            columns: { password: false },
        });

        if (!updatedUser) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }

        return res.status(OK).json(updatedUser);
    } catch (err: any) {
        console.error("Error updating faculty:", err);
        res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Cannot update teacher info" });
    }
};

export async function deleteFacultyMemberById(req: Request, res: Response) {
    try {
        const { teacherId } = req.params;
        const userId = req.userId;

        // Fetch the current user (requester)
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
                role: true,
                department: true,
            },
        });

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        if (
            user.role !== AudienceEnum.DepartmentHead &&
            user.role !== AudienceEnum.Admin
        ) {
            return res.status(FORBIDDEN).json({
                message: "Only Department Heads & Admins can delete faculty members",
            });
        }

        // Fetch the teacher to delete
        const teacher = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, teacherId),
            columns: { password: false },
        });

        if (!teacher) {
            return res.status(NOT_FOUND).json({ message: "Teacher not found" });
        }

        if (teacher.role !== AudienceEnum.DepartmentTeacher) {
            return res.status(NOT_FOUND).json({ message: "User is not a teacher" });
        }

        if (
            user.role === AudienceEnum.DepartmentHead &&
            teacher.department !== user.department
        ) {
            return res.status(UNAUTHORIZED).json({
                message: "Teacher does not belong to your department",
            });
        }

        // Delete the teacher user record
        await db.delete(users).where(eq(users.id, teacherId));

        return res.status(OK).json({ message: "Teacher deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting teacher:", error);
        return res
            .status(INTERNAL_SERVER_ERROR)
            .json({ message: "Error while deleting teacher" });
    }
};

export const getDepartmentHeadDashboardContext = async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        // Fetch only role and department for the user
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true, department: true },
        });

        if (!user || user.role !== AudienceEnum.DepartmentHead) {
            return res.status(NOT_FOUND).json({ message: "User not found or unauthorized" });
        }

        // Fetch the program by departmentTitle
        if (!user.department) {
            return res.status(NOT_FOUND).json({ message: "User's department is not set" });
        }

        const department = user.department; // not null

        const program = await db.query.programs.findFirst({
            where: (p, { eq }) => eq(p.departmentTitle, department),
        });

        if (!program) {
            return res.status(NOT_FOUND).json({ message: "No program found for department" });
        }

        // Fetch the latest programBatch for the program (most recent createdAt)
        const programBatch = await db.query.programBatches.findFirst({
            where: (pb, { eq }) => eq(pb.programId, program.id),
            orderBy: (pb, { desc }) => desc(pb.createdAt),
        });

        let activatedSemesters: any = [];

        if (programBatch) {
            activatedSemesters = await db.query.activatedSemesters.findMany({
                where: (as, { eq }) => eq(as.programBatchId, programBatch.id),
                orderBy: (as, { asc }) => asc(as.semesterNo),
            });
        }

        return res.status(OK).json({
            program,
            programBatch,
            activatedSemesters,
        });
    } catch (err: any) {
        console.error("Department head dashboard context error:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch department head dashboard context",
            error: err.message,
        });
    }
};