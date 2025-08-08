import { AudienceEnum, DepartmentEnum } from "./enums";

export type UserType = {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fatherName: string;
    city: string;
    country: string;
    avatarURL?: string;
    createdAt: string;
    lastOnline: string;
    department: DepartmentEnum;
    address: string;
    isEmailVerified: boolean;
    role: AudienceEnum;

    forumProfile?: {
        username: string;
        displayName?: string;
        bio?: string;
        signature?: string;
        interests?: string[];
        badges?: string[];
        reputation?: number;
        visibility?: "public" | "private";
        postCount?: number;
        commentCount?: number;
        joinedAt?: string; // or Date
    };

    teacherInfo?: {
        designation: string;
        joiningDate: string; // or Date
        facultyType: string;
        subjectOwner: boolean;
        qualifications: {
            degree: string;
            passingYear: number;
            institutionName: string;
            majorSubjects: string[];
        }[];
    };
};