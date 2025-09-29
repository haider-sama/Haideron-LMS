import {
    DegreeEnum, FacultyTypeEnum,
    TeacherDesignationEnum, DepartmentEnum,
    AudienceEnum,
    ClassSectionEnum,
    DomainEnum,
    KnowledgeAreaEnum,
    SubjectTypeEnum,
    SubjectLevelEnum,
    StrengthEnum,
} from "./enums";

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

    isTwoFAEnabled: boolean | null;
    twoFASecret: string;
    
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


export interface UserWithRelations extends User {
    teacherInfo?: TeacherInfoWithQualifications | null;
}

export interface TeacherInfoWithQualifications extends TeacherInfo {
    qualifications?: TeacherQualification[];
}

export interface UserSession {
    id: string; // UUID
    userId: string; // UUID (foreign key to users)
    ip?: string | null; // IP address, nullable
    userAgent?: {
        browser?: string;
        os?: string;
        device?: string;
        raw?: string;
    } | null;
    lastUsed: Date;    // timestamp with timezone
    createdAt: Date;   // timestamp with timezone
    updatedAt: Date;   // timestamp with timezone
}

export interface Program {
    id: string;
    title: string;
    programLevel: DegreeEnum;
    departmentTitle: DepartmentEnum;
    maxDurationYears: number;
    minCreditHours: number;
    maxCreditHours: number;
    requirements?: string | null;
    vision?: string | null;
    mission?: string | null;
    createdBy: string; // user ID
    isArchived: boolean;
    archivedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PLO {
    id: string;
    code: string;          // e.g., "PLO1"
    title: string;
    description: string;
    programId: string;
}

// PEO
export interface PEO {
    id: string;
    title: string;
    description: string;
    programId: string;
    position: number;      // ordering
}

// Mapping between PEO and PLO
export interface PEO_PLO_Mapping {
    id: string;
    peoId: string;
    ploId: string;
    strength: StrengthEnum;
}

export interface ProgramCatalogue {
    id: string;
    programId: string;
    catalogueYear: number;
    createdBy: {
        firstName: string,
        lastName: string,
    },
    isArchived: boolean;
    archivedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;

    program?: Program | null;
}

export interface Course {
    id: string;
    programId: string;
    programCatalogueId: string;

    title: string;
    code: string;
    codePrefix: string;
    description: string;

    subjectLevel: SubjectLevelEnum;
    subjectType: SubjectTypeEnum;
    contactHours: number;
    creditHours: number;
    knowledgeArea: KnowledgeAreaEnum;
    domain: DomainEnum;

    createdBy: string;
    createdAt: Date;
    updatedAt: Date;

    preRequisites?: Array<{
        courseId: string;
        preReqCourseId: string;
    }>;

    coRequisites?: Array<{
        courseId: string;
        coReqCourseId: string;
    }>;

    sectionTeachers?: Array<{
        courseId: string;
        section: ClassSectionEnum;
        teacherId: string;
    }>;

    sections?: Array<{
        courseId: string;
        section: ClassSectionEnum;
    }>;
    
}
