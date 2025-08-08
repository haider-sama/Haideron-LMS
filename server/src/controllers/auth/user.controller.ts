import { Request, Response } from "express";
import dotenv from "dotenv";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "../../constants/http";
import { updateUserProfileSchema } from "../../utils/validators/lmsSchemas/authSchemas";
import { AudienceEnum, DegreeEnum } from "../../shared/enums";
import { db } from "../../db/db";
import { forumProfiles, teacherInfo, teacherQualifications, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TeacherQualification } from "../../shared/interfaces";
import { VisibilityEnum } from "../../shared/social.enums";

dotenv.config();

const adminAllowedFields = [
    'firstName', 'lastName', 'displayName', 'fatherName',
    'city', 'country', 'address', 'department',
    'email', 'role',
] as const;

const deptHeadAllowed = [
    'firstName', 'lastName', 'displayName', 'fatherName',
    'city', 'country', 'address',
] as const;

function assignStringFields<T extends string>(
    keys: readonly T[],
    from: any,
    to: Partial<Record<T, string | null | undefined>>
) {
    for (const key of keys) {
        if (typeof from[key] === 'string' || from[key] === null) {
            to[key] = from[key];
        }
    }
}

export async function updateUserProfile(req: Request, res: Response) {
    const parsed = updateUserProfileSchema.safeParse(req.body);
    const userId = req.userId;

    if (!parsed.success) {
        return res.status(BAD_REQUEST).json({
            message: "Invalid profile data",
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        // 1. Load user with minimal info (role)
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        const role = user.role;
        const data = parsed.data;
        const disallowedFields: string[] = [];

        // 2. Load existing forumProfile and teacherInfo once
        const forumProfile = await db
            .select()
            .from(forumProfiles)
            .where(eq(forumProfiles.userId, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        const teacherInfoRow = await db
            .select()
            .from(teacherInfo)
            .where(eq(teacherInfo.userId, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        // 3. Prepare update objects
        const userUpdates: Partial<typeof users.$inferSelect> = {};
        const forumProfileUpdates: Partial<typeof forumProfiles.$inferSelect> = {};
        const teacherInfoUpdates: Partial<typeof teacherInfo.$inferSelect> = {};
        let qualificationsToUpdate: any[] | null = null;

        // 4. Handle forumProfile updates for all roles
        if ('forumProfile' in data && data.forumProfile) {
            const mergedForumProfile = {
                ...forumProfile,
                ...data.forumProfile,
            };

            if (!mergedForumProfile.username?.trim()) {
                return res.status(BAD_REQUEST).json({ message: "forumProfile.username is required" });
            }

            forumProfileUpdates.username = mergedForumProfile.username;
            forumProfileUpdates.displayName = mergedForumProfile.displayName ?? null;
            forumProfileUpdates.bio = mergedForumProfile.bio ?? '';
            forumProfileUpdates.signature = mergedForumProfile.signature ?? '';
            forumProfileUpdates.interests = mergedForumProfile.interests ?? null;
            forumProfileUpdates.badges = mergedForumProfile.badges ?? null;
            forumProfileUpdates.reputation = mergedForumProfile.reputation ?? 0;
            forumProfileUpdates.visibility = mergedForumProfile.visibility ?? 'public';
            forumProfileUpdates.postCount = mergedForumProfile.postCount ?? 0;
            forumProfileUpdates.commentCount = mergedForumProfile.commentCount ?? 0;
            forumProfileUpdates.joinedAt = mergedForumProfile.joinedAt ?? new Date();
        }

        // 5. Handle teacherInfo and qualifications for DepartmentTeacher
        if ('teacherInfo' in data && data.teacherInfo) {
            if (role === AudienceEnum.DepartmentTeacher) {
                if (data.teacherInfo.qualifications) {
                    if (!teacherInfoRow) {
                        return res.status(NOT_FOUND).json({ message: "Teacher info not found" });
                    }
                    // We will handle qualifications update inside transaction below
                    qualificationsToUpdate = data.teacherInfo.qualifications.map((qual: any) => ({
                        teacherInfoId: teacherInfoRow.id,
                        degree: qual.degree,
                        passingYear: qual.passingYear,
                        institutionName: qual.institutionName,
                        majorSubjects: qual.majorSubjects,
                    }));
                }
                // You might want to handle other teacherInfo fields here if applicable
            } else {
                disallowedFields.push('teacherInfo');
            }
        }

        // 6. Handle top-level user updates by role
        if (role === AudienceEnum.Admin) {
            assignStringFields(adminAllowedFields, data, userUpdates);
        } else if (role === AudienceEnum.DepartmentHead) {
            assignStringFields(deptHeadAllowed, data, userUpdates);

            const disallowed = Object.keys(data).filter(
                (field) => !['forumProfile', 'teacherInfo', ...deptHeadAllowed].includes(field)
            );
            disallowedFields.push(...disallowed);
        } else {
            // Other roles cannot update top-level fields except forumProfile and teacherInfo
            const topLevelKeys = Object.keys(data).filter(
                (k) => !['forumProfile', 'teacherInfo'].includes(k)
            );
            disallowedFields.push(...topLevelKeys);
        }

        if (disallowedFields.length > 0) {
            return res.status(FORBIDDEN).json({
                message: `You are not allowed to update: ${disallowedFields.join(', ')}`,
            });
        }

        // 7. Run all updates in a single transaction
        await db.transaction(async (tx) => {
            // Update user
            if (Object.keys(userUpdates).length > 0) {
                await tx
                    .update(users)
                    .set(userUpdates)
                    .where(eq(users.id, userId))
                    .execute();
            }

            // Update or insert forumProfile
            if (Object.keys(forumProfileUpdates).length > 0) {
                if (forumProfile) {
                    await tx
                        .update(forumProfiles)
                        .set(forumProfileUpdates)
                        .where(eq(forumProfiles.userId, userId))
                        .execute();
                } else {
                    if (!forumProfileUpdates.username) {
                        throw new Error("forumProfile.username is required for new profile");
                    }
                    await tx.insert(forumProfiles).values({
                        id: crypto.randomUUID(),
                        userId,
                        username: forumProfileUpdates.username,
                        displayName: forumProfileUpdates.displayName,
                        bio: forumProfileUpdates.bio,
                        signature: forumProfileUpdates.signature,
                        interests: forumProfileUpdates.interests,
                        badges: forumProfileUpdates.badges,
                        reputation: forumProfileUpdates.reputation,
                        visibility: forumProfileUpdates.visibility,
                        postCount: forumProfileUpdates.postCount,
                        commentCount: forumProfileUpdates.commentCount,
                        joinedAt: forumProfileUpdates.joinedAt,
                    }).execute();
                }
            }

            // Update or insert teacherInfo
            if (Object.keys(teacherInfoUpdates).length > 0) {
                if (teacherInfoRow) {
                    await tx
                        .update(teacherInfo)
                        .set(teacherInfoUpdates)
                        .where(eq(teacherInfo.userId, userId))
                        .execute();
                } else {
                    if (
                        !teacherInfoUpdates.designation ||
                        !teacherInfoUpdates.facultyType
                    ) {
                        throw new Error("Missing required fields for teacherInfo insert");
                    }

                    await tx.insert(teacherInfo).values({
                        id: crypto.randomUUID(),
                        userId,
                        designation: teacherInfoUpdates.designation,
                        facultyType: teacherInfoUpdates.facultyType,
                        joiningDate: teacherInfoUpdates.joiningDate,
                        subjectOwner: teacherInfoUpdates.subjectOwner,
                    }).execute();
                }
            }

            // Update teacher qualifications if needed
            if (qualificationsToUpdate) {
                // Delete old qualifications
                await tx.delete(teacherQualifications)
                    .where(eq(teacherQualifications.teacherInfoId, teacherInfoRow!.id))
                    .execute();

                if (qualificationsToUpdate.length > 0) {
                    await tx.insert(teacherQualifications)
                        .values(qualificationsToUpdate)
                        .execute();
                }
            }
        });

        // 8. Fetch updated user profile including forumProfile and teacherInfo for full response
        const updatedUser = await db
            .select({
                // users table columns (except password)
                userId: users.id,
                email: users.email,
                fatherName: users.fatherName,
                firstName: users.firstName,
                lastName: users.lastName,
                city: users.city,
                country: users.country,
                avatarURL: users.avatarURL,
                lastOnline: users.lastOnline,
                address: users.address,
                isEmailVerified: users.isEmailVerified,
                pendingEmail: users.pendingEmail,
                emailChangeToken: users.emailChangeToken,
                emailChangeExpiresAt: users.emailChangeExpiresAt,
                role: users.role,
                department: users.department,
                resetPasswordToken: users.resetPasswordToken,
                resetPasswordExpiresAt: users.resetPasswordExpiresAt,
                tokenVersion: users.tokenVersion,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,

                // forumProfiles columns (nullable if no profile)
                forumProfileId: forumProfiles.id,
                forumUserId: forumProfiles.userId,
                forumUsername: forumProfiles.username,
                forumDisplayName: forumProfiles.displayName,
                forumBio: forumProfiles.bio,
                forumSignature: forumProfiles.signature,
                forumInterests: forumProfiles.interests,
                forumBadges: forumProfiles.badges,
                forumReputation: forumProfiles.reputation,
                forumVisibility: forumProfiles.visibility,
                forumPostCount: forumProfiles.postCount,
                forumCommentCount: forumProfiles.commentCount,
                forumJoinedAt: forumProfiles.joinedAt,

                // teacherInfo columns (nullable if no teacherInfo)
                teacherInfoId: teacherInfo.id,
                teacherUserId: teacherInfo.userId,
                teacherDesignation: teacherInfo.designation,
                teacherJoiningDate: teacherInfo.joiningDate,
                teacherFacultyType: teacherInfo.facultyType,
                teacherSubjectOwner: teacherInfo.subjectOwner,
            })
            .from(users)
            .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .leftJoin(teacherInfo, eq(teacherInfo.userId, users.id))
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);


        if (!updatedUser) {
            return res.status(NOT_FOUND).json({ message: "User not found after update" });
        }

        const response = {
            id: updatedUser.userId,
            email: updatedUser.email,
            fatherName: updatedUser.fatherName,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            city: updatedUser.city,
            country: updatedUser.country,
            avatarURL: updatedUser.avatarURL,
            lastOnline: updatedUser.lastOnline,
            address: updatedUser.address,
            isEmailVerified: updatedUser.isEmailVerified,
            role: updatedUser.role,
            department: updatedUser.department,
            createdAt: updatedUser.createdAt,

            forumProfile: updatedUser.forumProfileId ? {
                id: updatedUser.forumProfileId,
                userId: updatedUser.forumUserId,
                username: updatedUser.forumUsername,
                displayName: updatedUser.forumDisplayName,
                bio: updatedUser.forumBio,
                signature: updatedUser.forumSignature,
                interests: updatedUser.forumInterests,
                badges: updatedUser.forumBadges,
                reputation: updatedUser.forumReputation,
                visibility: updatedUser.forumVisibility,
                postCount: updatedUser.forumPostCount,
                commentCount: updatedUser.forumCommentCount,
                joinedAt: updatedUser.forumJoinedAt,
            } : null,

            teacherInfo: updatedUser.teacherInfoId ? {
                id: updatedUser.teacherInfoId,
                userId: updatedUser.teacherUserId,
                designation: updatedUser.teacherDesignation,
                joiningDate: updatedUser.teacherJoiningDate,
                facultyType: updatedUser.teacherFacultyType,
                subjectOwner: updatedUser.teacherSubjectOwner,
            } : null,
        };

        return res.status(OK).json(response);

    } catch (err) {
        console.error("Failed to update profile:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            message: "Failed to update profile. Please try again later.",
        });
    }
}

export async function getUserProfile(req: Request, res: Response) {
    const userId = req.userId;

    try {
        // Fetch user joined with forumProfile and teacherInfo + teacherQualifications
        const user = await db
            .select({
                userId: users.id,
                email: users.email,
                displayName: users.firstName,  // no displayName on users table? Use firstName or adjust accordingly
                firstName: users.firstName,
                lastName: users.lastName,
                fatherName: users.fatherName,
                city: users.city,
                country: users.country,
                avatarURL: users.avatarURL,
                address: users.address,
                department: users.department,
                createdAt: users.createdAt,
                lastOnline: users.lastOnline,
                isEmailVerified: users.isEmailVerified,
                role: users.role,

                // forumProfile fields (nullable)
                forumProfileId: forumProfiles.id,
                forumUsername: forumProfiles.username,
                forumDisplayName: forumProfiles.displayName,
                forumBio: forumProfiles.bio,
                forumSignature: forumProfiles.signature,
                forumInterests: forumProfiles.interests,
                forumBadges: forumProfiles.badges,
                forumReputation: forumProfiles.reputation,
                forumVisibility: forumProfiles.visibility,
                forumPostCount: forumProfiles.postCount,
                forumCommentCount: forumProfiles.commentCount,
                forumJoinedAt: forumProfiles.joinedAt,

                // teacherInfo fields (nullable)
                teacherInfoId: teacherInfo.id,
                teacherDesignation: teacherInfo.designation,
                teacherJoiningDate: teacherInfo.joiningDate,
                teacherFacultyType: teacherInfo.facultyType,
                teacherSubjectOwner: teacherInfo.subjectOwner,
            })
            .from(users)
            .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
            .leftJoin(teacherInfo, eq(teacherInfo.userId, users.id))
            .where(eq(users.id, userId))
            .limit(1)
            .execute()
            .then(rows => rows[0]);

        if (!user) {
            return res.status(NOT_FOUND).json({ message: "User not found" });
        }

        let qualifications: TeacherQualification[] = [];

        if (user.teacherInfoId) {
            const rawQualifications = await db
                .select({
                    id: teacherQualifications.id,
                    teacherInfoId: teacherQualifications.teacherInfoId,
                    degree: teacherQualifications.degree,
                    passingYear: teacherQualifications.passingYear,
                    institutionName: teacherQualifications.institutionName,
                    majorSubjects: teacherQualifications.majorSubjects,
                })
                .from(teacherQualifications)
                .where(eq(teacherQualifications.teacherInfoId, user.teacherInfoId))
                .execute();

            qualifications = rawQualifications.map(q => ({
                ...q,
                degree: q.degree as DegreeEnum, // cast string to enum here
            }));
        }

        const sanitizedProfile = {
            id: user.userId,
            email: user.email,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            fatherName: user.fatherName,
            city: user.city,
            country: user.country,
            avatarURL: user.avatarURL,
            address: user.address,
            department: user.department,
            createdAt: user.createdAt,
            lastOnline: user.lastOnline,
            isEmailVerified: user.isEmailVerified,
            role: user.role,

            forumProfile: user.forumProfileId
                ? {
                    username: user.forumUsername,
                    displayName: user.forumDisplayName,
                    bio: user.forumBio,
                    signature: user.forumSignature,
                    interests: user.forumInterests,
                    badges: user.forumBadges,
                    reputation: user.forumReputation,
                    visibility: user.forumVisibility,
                    postCount: user.forumPostCount,
                    commentCount: user.forumCommentCount,
                    joinedAt: user.forumJoinedAt,
                }
                : undefined,

            teacherInfo: user.teacherInfoId
                ? {
                    designation: user.teacherDesignation,
                    joiningDate: user.teacherJoiningDate,
                    facultyType: user.teacherFacultyType,
                    subjectOwner: user.teacherSubjectOwner,
                    qualifications: qualifications.map(q => ({
                        degree: q.degree,
                        passingYear: q.passingYear,
                        institutionName: q.institutionName,
                        majorSubjects: q.majorSubjects,
                    })),
                }
                : undefined,
        };

        res.json(sanitizedProfile);
    } catch (err) {
        console.error("Failed to fetch user profile:", err);
        res.status(INTERNAL_SERVER_ERROR).json({
            message: "Cannot get user profile. Please try again.",
        });
    }
}

export async function getUserForumProfile(req: Request, res: Response) {
    const { userIdOrUsername } = req.params;

    try {
        let user;

        // Detect if userIdOrUsername is a UUID (simple regex for UUID v4)
        const isUUIDv4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdOrUsername);

        if (isUUIDv4) {
            // Lookup by user id (UUID)
            user = await db
                .select({
                    userId: users.id,
                    role: users.role,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    lastOnline: users.lastOnline,
                    avatarURL: users.avatarURL,

                    forumProfileId: forumProfiles.id,
                    forumUsername: forumProfiles.username,
                    forumDisplayName: forumProfiles.displayName,
                    forumBio: forumProfiles.bio,
                    forumSignature: forumProfiles.signature,
                    forumInterests: forumProfiles.interests,
                    forumBadges: forumProfiles.badges,
                    forumReputation: forumProfiles.reputation,
                    forumVisibility: forumProfiles.visibility,
                    forumPostCount: forumProfiles.postCount,
                    forumCommentCount: forumProfiles.commentCount,
                    forumJoinedAt: forumProfiles.joinedAt,
                })
                .from(users)
                .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
                .where(eq(users.id, userIdOrUsername))
                .limit(1)
                .execute()
                .then(rows => rows[0]);
        } else {
            // Lookup by forumProfile.username
            user = await db
                .select({
                    userId: users.id,
                    role: users.role,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    lastOnline: users.lastOnline,
                    avatarURL: users.avatarURL,

                    forumProfileId: forumProfiles.id,
                    forumUsername: forumProfiles.username,
                    forumDisplayName: forumProfiles.displayName,
                    forumBio: forumProfiles.bio,
                    forumSignature: forumProfiles.signature,
                    forumInterests: forumProfiles.interests,
                    forumBadges: forumProfiles.badges,
                    forumReputation: forumProfiles.reputation,
                    forumVisibility: forumProfiles.visibility,
                    forumPostCount: forumProfiles.postCount,
                    forumCommentCount: forumProfiles.commentCount,
                    forumJoinedAt: forumProfiles.joinedAt,
                })
                .from(users)
                .leftJoin(forumProfiles, eq(forumProfiles.userId, users.id))
                .where(eq(forumProfiles.username, userIdOrUsername))
                .limit(1)
                .execute()
                .then(rows => rows[0]);
        }

        if (!user || !user.forumProfileId) {
            return res.status(404).json({ message: "Forum profile not found." });
        }

        if (user.forumVisibility === VisibilityEnum.private) {
            return res.status(FORBIDDEN).json({ message: "This forum profile is private." });
        }

        // Return sanitized public forum profile data
        const publicProfile = {
            id: user.userId,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            lastOnline: user.lastOnline,
            avatarURL: user.avatarURL,
            forumProfile: {
                username: user.forumUsername,
                displayName: user.forumDisplayName,
                bio: user.forumBio,
                signature: user.forumSignature,
                interests: user.forumInterests,
                badges: user.forumBadges,
                reputation: user.forumReputation,
                postCount: user.forumPostCount,
                commentCount: user.forumCommentCount,
                joinedAt: user.forumJoinedAt,
            },
        };

        return res.json(publicProfile);
    } catch (err) {
        console.error("Error fetching forum profile:", err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch forum profile." });
    }
}