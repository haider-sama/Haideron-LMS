import { pgTable, serial, text, varchar, integer, boolean, timestamp, pgEnum, date, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { AudienceEnum, DegreeEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../../shared/enums";
import { ForumBadgeEnum, VisibilityEnum } from "../../../shared/social.enums";
import { relations } from "drizzle-orm";

export const audienceEnum = pgEnum("audience_enum", Object.values(AudienceEnum) as [string, ...string[]]);
export const departmentEnum = pgEnum("department_enum", Object.values(DepartmentEnum) as [string, ...string[]]);
export const degreeEnum = pgEnum("degree_enum", Object.values(DegreeEnum) as [string, ...string[]]);
export const facultyTypeEnum = pgEnum("faculty_type_enum", Object.values(FacultyTypeEnum) as [string, ...string[]]);
export const teacherDesignationEnum = pgEnum("teacher_designation_enum", Object.values(TeacherDesignationEnum) as [string, ...string[]]);
export const forumBadgeEnum = pgEnum("forum_badge_enum", Object.values(ForumBadgeEnum) as [string, ...string[]]);
export const visibilityEnum = pgEnum("visibility_enum", Object.values(VisibilityEnum) as [string, ...string[]]);

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    fatherName: text("father_name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    city: text("city"),
    country: text("country"),
    avatarURL: text("avatar_url"),
    lastOnline: timestamp("last_online", { withTimezone: false }).notNull(),
    address: text("address"),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    pendingEmail: text("pending_email"),
    emailChangeToken: text("email_change_token"),
    emailChangeExpiresAt: timestamp("email_change_expires_at", { withTimezone: false }),
    role: audienceEnum("role").default(AudienceEnum.Guest).notNull(),
    department: departmentEnum("department"),
    resetPasswordToken: text("reset_password_token"),
    resetPasswordExpiresAt: timestamp("reset_password_expires_at", { withTimezone: false }),
    tokenVersion: integer("token_version").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const teacherInfo = pgTable("teacher_info", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    designation: teacherDesignationEnum("designation").notNull(),
    joiningDate: date("joining_date"),
    facultyType: facultyTypeEnum("faculty_type").notNull(),
    subjectOwner: boolean("subject_owner").default(false).notNull(),
}, (table) => [
    index("idx_teacher_info_user_id").on(table.userId),
]);


export const teacherQualifications = pgTable("teacher_qualifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherInfoId: uuid("teacher_info_id").notNull().references(() => teacherInfo.id, { onDelete: "cascade" }), // Changed to UUID
    degree: degreeEnum("degree").notNull(),
    passingYear: integer("passing_year").notNull(),
    institutionName: text("institution_name").notNull(),
    majorSubjects: jsonb("major_subjects").$type<string[]>().notNull(),
}, (table) => ({
    teacherInfoIdIdx: index("idx_teacher_qualifications_teacher_info_id").on(table.teacherInfoId),
}));

export const forumProfiles = pgTable("forum_profiles", {
    id: uuid("id").defaultRandom().primaryKey(), // Changed to UUID
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Changed to UUID
    username: varchar("username", { length: 255 }).notNull().unique(),
    displayName: text("display_name"),
    bio: text("bio").default(""),
    signature: text("signature").default(""),
    interests: jsonb("interests").$type<string[]>(),
    badges: jsonb("badges").$type<ForumBadgeEnum[]>(),
    reputation: integer("reputation").default(0),
    visibility: visibilityEnum("visibility").default("public"),
    postCount: integer("post_count").default(0),
    commentCount: integer("comment_count").default(0),
    joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
    userIdIdx: index("idx_forum_profiles_user_id").on(table.userId),
}));

// Users -> TeacherInfo & ForumProfiles
export const usersRelations = relations(users, ({ one, many }) => ({
    teacherInfo: one(teacherInfo, {
        fields: [users.id],
        references: [teacherInfo.userId],
    }),
    forumProfiles: one(forumProfiles, {
        fields: [users.id],
        references: [forumProfiles.userId],
    }),
}));

// TeacherInfo -> User & TeacherQualifications
export const teacherInfoRelations = relations(teacherInfo, ({ one, many }) => ({
    user: one(users, {
        fields: [teacherInfo.userId],
        references: [users.id],
    }),
    qualifications: many(teacherQualifications),
}));

// TeacherQualifications -> TeacherInfo
export const teacherQualificationsRelations = relations(teacherQualifications, ({ one }) => ({
    teacherInfo: one(teacherInfo, {
        fields: [teacherQualifications.teacherInfoId],
        references: [teacherInfo.id],
    }),
}));

// ForumProfiles -> User
export const forumProfilesRelations = relations(forumProfiles, ({ one }) => ({
    user: one(users, {
        fields: [forumProfiles.userId],
        references: [users.id],
    }),
}));
