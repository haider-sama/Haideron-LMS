import {
    DegreeEnum, FacultyTypeEnum,
    TeacherDesignationEnum, DepartmentEnum,
    AudienceEnum,
} from "./enums";
import { ForumBadgeEnum, VisibilityEnum } from "./social.enums";

export interface User {
    id: string; 
    email: string;
    password: string;
    fatherName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    country?: string | null;
    avatarURL?: string | null;
    lastOnline: Date;
    address?: string | null;
    isEmailVerified: boolean;
    pendingEmail?: string | null;
    emailChangeToken?: string | null;
    emailChangeExpiresAt?: Date | null;
    role: AudienceEnum;
    department?: DepartmentEnum | null;
    resetPasswordToken?: string | null;
    resetPasswordExpiresAt?: Date | null;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
}

// TeacherInfo table row type
export interface TeacherInfo {
    id: string;
    userId: string;
    designation: TeacherDesignationEnum;
    joiningDate?: Date | null;
    facultyType: FacultyTypeEnum;
    subjectOwner: boolean;
}

// TeacherQualification row type
export interface TeacherQualification {
    id: string;
    teacherInfoId: string;
    degree: DegreeEnum;
    passingYear: number;
    institutionName: string;
    majorSubjects: string[];
}

// ForumProfile row type
export interface ForumProfile {
    id: string;
    userId: string;
    username: string;
    displayName?: string | null;
    bio: string;
    signature: string;
    interests?: string[] | null;
    badges?: ForumBadgeEnum[] | null;
    reputation: number;
    visibility: VisibilityEnum;
    postCount: number;
    commentCount: number;
    joinedAt: Date;
}

export interface UserWithRelations extends User {
  teacherInfo?: TeacherInfoWithQualifications | null;
  forumProfile?: ForumProfile | null;
}

export interface TeacherInfoWithQualifications extends TeacherInfo {
  qualifications?: TeacherQualification[];
}