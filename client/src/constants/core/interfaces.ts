import { AssessmentTypeEnum, AudienceEnum, BatchEnrollmentStatus, ClassSectionEnum, DegreeEnum, DepartmentEnum, DomainEnum, FacultyTypeEnum, FinalizedResultStatusEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum, TeacherDesignationEnum, TermEnum } from "../../../../server/src/shared/enums";
import { User } from "../../../../server/src/shared/interfaces";

export interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface VerifyEmailResponse {
    user: Pick<User, "email">;
    message?: string;
}

export interface BulkUser {
    email: string;
    password: string;
    role: AudienceEnum;
    department: DepartmentEnum;
    firstName: string;
    lastName: string;
    fatherName: string;
    city: string;
    country: string;
    address: string;
}

export type FetchUsersFilters = {
    email?: string;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    city?: string;
    country?: string;
    role?: AudienceEnum;       // or string if you don't have enum here
    department?: DepartmentEnum; // or string
};

export interface PaginatedUserResponse {
    data: User[];
    page: number;
    totalPages: number;
    totalUsers: number;
}

export type PublicUser = Pick<
    User,
    | "id"
    | "email"
    | "firstName"
    | "lastName"
    | "fatherName"
    | "city"
    | "country"
    | "address"
    | "department"
    | "isEmailVerified"
    | "role"
    | "createdAt"
    | "lastOnline"
    | "avatarURL"
>;

export interface AssessmentPayload {
    type: AssessmentTypeEnum;
    title: string;
    weightage: number;
    dueDate: string; // ISO string
    clos: string[];
}

// Keep this as a type because it's a union
export type AssessmentResponse =
    | {
        success: true;
        message: string;
        assessment: Assessment;
    }
    | {
        success: false;
        message: string;
        fieldErrors?: Record<string, string[]>;
    };

export interface GetProgramsParams {
    page?: number;
    limit?: number;
    search?: string;
    programLevel?: string;
    minCreditHours?: number;
    maxCreditHours?: number;
    maxDurationYears?: number;
}


export interface GetProgramsResponse {
    message: string;
    programs: Program[];
    page: number;
    totalPages: number;
    totalPrograms: number;
}

export interface PLOMapping {
    _id?: string;
    plo: string; // assuming frontend only needs the PLO ID (ObjectId as string)
    strength: StrengthEnum;
}

export interface Program {
    _id: string;
    title: string;
    programLevel: DegreeEnum;
    departmentTitle: DepartmentEnum;
    maxDurationYears: number;
    minCreditHours: number;
    maxCreditHours: number;
    requirements: string;
    vision: string;
    mission: string;
    peos: PEO[];
    createdBy?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface PLO {
    _id?: string;
    code: string;
    title: string;
    description: string;
}

export interface PEO {
    title: string;
    description: string;
    ploMapping: {
        plo: PLO;
        strength: StrengthEnum;
    }[];
}

export interface ProgramCatalogue {
    _id: string;
    program: Program;
    catalogueYear: number;
    createdBy: User | { _id: string; firstName: string; lastName: string; email?: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface Semester {
    _id: string;
    programCatalogue: string;
    semesterNo: number;
    courses: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CLO {
    _id?: string;
    code: string;
    title: string;
    description: string;
    ploMapping: PLOMapping[];
}

export interface AddCourseToSemesterPayload {
    programId: string;
    catalogueId: string;
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
    preRequisites?: string[];
    coRequisites?: string[];
    clos: CLO[];
    sections: ClassSectionEnum[];
}

export interface CourseFilters {
    semesterId: string;
    page?: number;
    limit?: number;
    title?: string;
    code?: string;
    subjectLevel?: string;
    subjectType?: string;
    knowledgeArea?: string;
    domain?: string;
    isActive?: boolean;
}

export interface GetCoursesInSemesterResponse {
    message: string;
    courses: any[]; // You can replace `any` with a proper Course type if needed
    page: number;
    totalPages: number;
    totalCourses: number;
}

export interface UpdateCoursePayload {
    program?: string;
    programCatalogue?: string;
    title?: string;
    code?: string;
    codePrefix?: string;
    description?: string;
    subjectLevel?: string;
    subjectType?: string;
    contactHours?: number;
    knowledgeArea?: string;
    domain?: string;
    preRequisites?: string[];
    coRequisites?: string[];
    clos?: any[]; // optionally define a CLO interface if needed
    sectionTeachers?: Record<string, string>; // section => teacherId
    sections?: string[];
    isActive?: boolean;
}

export interface UpdateCourseResponse {
    message: string;
    course: Course; // replace with Course type if defined
}

export interface DeleteCourseResponse {
    message: string;
    courseId: string;
}

export interface Course {
    _id: string;
    program: string;
    programCatalogue: string;
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
    preRequisites: string[];
    coRequisites: string[];
    clos: CLO[];
    sectionTeachers: Record<string, string>;
    sections: ClassSectionEnum[];
    createdBy: string;
}

// export interface TeacherQualification {
//     degree: string;
//     passingYear: number;
//     institutionName: string;
//     majorSubjects: string[];
// }

// export interface TeacherInfo {
//     designation: TeacherDesignationEnum;
//     joiningDate: Date | null; // Use ISO string for frontend
//     facultyType: FacultyTypeEnum;
//     subjectOwner?: boolean;
//     qualifications?: TeacherQualification[];
// }

// export interface FacultyRegisterPayload {
//     email: string;
//     password: string;
//     department: DepartmentEnum;
//     teacherInfo: TeacherInfo;
// }

// export type FacultyUpdatePayload = Partial<{
//     firstName: string;
//     lastName: string;
//     city: string;
//     country: string;
//     address: string;
//     department: DepartmentEnum;
//     role: AudienceEnum;
//     teacherInfo: TeacherInfo; // can still be required based on your backend validation
// }>;

// export interface FacultyUser {
//     _id: string;
//     email: string;
//     firstName?: string;
//     lastName?: string;
//     avatarURL?: string;
//     city?: string;
//     country?: string;
//     address?: string;
//     department?: DepartmentEnum;
//     role: AudienceEnum;
//     teacherInfo?: TeacherInfo;
//     lastOnline: string;
//     isEmailVerified: boolean;
// }

// export interface PaginatedFacultyResponse {
//     data: FacultyUser[];
//     page: number;
//     totalPages: number;
//     totalFaculty: number;
// }

export interface UserPreview {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface ProgramCataloguePreview {
    catalogueYear: number;
}

export interface ProgramPreview {
    _id: string;
    title: string;
    departmentTitle: string;
}

export interface ProgramBatch {
    _id: string;
    program: ProgramPreview;
    programCatalogue: ProgramCataloguePreview;
    sessionYear: number;
    isActive: boolean;
    createdBy: UserPreview;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedBatches {
    batches: ProgramBatch[];
    page: number;
    totalPages: number;
    totalBatches: number;
}

export interface BulkRegisterResult {
    email: string;
    success: boolean;
    message: string;
}

export interface BulkRegisterError {
    message: string;
    errors?: Record<string, string[]>;
}

export interface CourseUpdatePayload {
    _id: string;
    title: string;
    code: string;
    creditHours: number;
    department: DepartmentEnum;
    semester: string; // e.g., "Fall 2025"
    sectionTeachers: { [section in ClassSectionEnum]?: string };
    sections: ClassSectionEnum[];
    isActive: boolean;
    enrollmentDeadline: string | null; // Dates are usually ISO strings from APIs
    createdBy: string; // ObjectId as string
    createdAt?: string; // optional, from Mongoose timestamps
    updatedAt?: string;
}

export interface CourseType {
    selectedSection: string;
    _id: string;
    title: string;
    code: string;
    creditHours: number;
    department: DepartmentEnum;
    semester: string; // e.g., "Fall 2025"
    sectionTeachers?: {
        [sectionName: string]: {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    sections: string[];
    isActive: boolean;
    enrollmentDeadline: string | null; // ISO string (from backend)
    createdBy: string; // User ID
    createdAt: string;
    updatedAt: string;
}

export interface ActivatedSemester {
    _id: string;
    programBatch: string;
    semesterNo: number;
    isActive: boolean;
    term: TermEnum;
    startedAt?: string;
    endedAt?: string;
    enrollmentDeadline?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ActivateSemesterResponse {
    message: string;
    activatedSemester: ActivatedSemester;
}

export interface GetSemestersResponse {
    message: string;
    semesters: ActivatedSemester[];
}

export interface UpdateSemesterResponse {
    message: string;
    batchSemester: ActivatedSemester;
}

export interface ScheduleSlot {
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
    startTime: string; // "HH:mm"
    endTime: string;
}

export interface CourseOfferingCreateInput {
    courseId: string;
    sectionSchedules?: Record<string, ScheduleSlot[]>;
    capacityPerSection?: Record<string, number>;
}

export interface CourseOffering {
    _id: string;
    course: Course; // You can replace `any` with your `Course` interface if defined
    activatedSemester: string;
    sectionSchedules?: Record<string, ScheduleSlot[]>;
    capacityPerSection?: Record<string, number>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CourseOfferingListResponse {
    offerings: CourseOffering[];
}

export interface CourseOfferingUpdateInput {
    sectionSchedules?: Record<string, ScheduleSlot[]>;
    capacityPerSection?: Record<string, number>;
    isActive?: boolean;
    course?: string; // course ID
    programBatch?: string; // program batch ID
    activatedSemester?: string; // semester ID
}

export interface StudentBatchEnrollment {
    _id: string;
    student: string;
    programBatch: string;
    status: BatchEnrollmentStatus;
    enrolledAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface EnrollStudentPayload {
    studentId: string;
    programBatchId: string;
    status?: BatchEnrollmentStatus;
}

export interface ModifyEnrollmentPayload {
    studentId: string;
    programBatchId: string;
}

export interface EnrollInCoursePayload {
    section: string;
}

export interface SectionSchedule {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
}

export interface EnrolledCourse {
    _id: string;
    enrolledAt: string;
    section: string;
    sectionTeacher: {
        _id: string;
        name: string;
        email: string;
    } | null;
    courseOffering: CourseOffering;
}

export interface StudentDashboardContextResponse {
    program: Program;
    programBatch: ProgramBatch;
    activatedSemesters: ActivatedSemester[];
}

export interface CourseInfo {
    _id: string;
    title: string;
    code: string;
}

export interface AssignedCourseOffering {
    offeringId: string;
    course: Course;
    assignedSections: string[];
    programBatch: string;
    activatedSemester: string;
    sectionSchedules: Record<string, ScheduleSlot[]>;
    capacityPerSection: Record<string, number>;
}

export interface GetAssignedCourseOfferingsResponse {
    offerings: AssignedCourseOffering[];
}

export interface FacultyDashboardContextResponse {
    program: Program;
    programBatch: ProgramBatch;
    activatedSemesters: ActivatedSemester[];
}

export interface EnrolledStudent {
    _id: string;
    name: string;
    email: string;
    enrolledAt: string;
}

export interface EnrolledStudentsResponse {
    students: EnrolledStudent[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface Assessment {
    _id: string;
    courseOfferingId: string; // or a populated CourseOffering object if populated
    type: AssessmentTypeEnum;
    title: string;
    weightage: number;
    dueDate: string; // ISO string returned from backend
    clos: string[]; // CLO ObjectIds or populate later as needed
    createdAt: string;
    updatedAt: string;
}

export interface GetCourseAssessmentsResponse {
    message: string;
    assessments: Assessment[];
}

export interface AssessmentResultEntry {
    studentId: string;
    marksObtained: number;
    totalMarks: number;
}

export interface SubmitBulkResultsResponse {
    message: string;
}

export interface AssessmentResultStudent {
    _id: string;
    firstName: string;
    email: string;
}

export interface GetAssessmentResultsResponse {
    results: AssessmentResultApiResponseEntry[];
}

export interface AssessmentResultApiResponseEntry {
    _id: string;
    assessmentId: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
    };
    marksObtained: number;
    totalMarks: number;
    createdAt: string;
    updatedAt: string;
}

export interface GradingRule {
    grade: string;          // e.g., "A+", "A", "B-", etc.
    minPercentage: number;  // e.g., 75
    gradePoint: number;     // e.g., 4.0
}

export interface SaveGradingSchemeResponse {
    success: boolean;
    message: string;
    scheme?: {
        _id: string;
        courseOffering: string;
        createdBy: string;
        rules: GradingRule[];
        createdAt: string;
        updatedAt: string;
    };
}

export interface FinalGrade {
    studentId: string;
    courseOfferingId: string;
    weightedPercentage: number;  // e.g., 78.5
    gradePoint: number;          // e.g., 3.7
    grade: string;               // e.g., "A"
}

export interface FinalizeResultsResponse {
    success: boolean;
    message: string;
    grades?: FinalGrade[];
}

export interface FinalizedGrade {
    studentId: string;
    grade: string;
    gradePoint: number;
    weightedPercentage: number;
}

export interface FinalizedResult {
    _id: string;
    courseOffering: {
        _id: string;
        course: {
            _id: string;
            code: string;
            title: string;
            creditHours: number;
        };
        programBatch: {
            _id: string;
            sessionYear: number,
            program: {
                _id: string;
                title: string;
                departmentTitle: string;
            };
        };
    };
    section: string;
    submittedBy: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    status: FinalizedResultStatusEnum;
    reviewedBy?: string;
    reviewedAt?: string;
    results: {
        studentId: string;
        grade: string;
        gradePoint: number;
        weightedPercentage: number;
    }[];
}

export interface CourseGrade {
    courseTitle: string;
    courseCode: string;
    creditHours: number;
    grade: string;
    gradePoint: number;
    status: string;
}

export interface SemesterTranscript {
    semesterNo: number;
    term: string;
    sessionYear: number;
    startedAt: string;
    endedAt: string;
    courses: CourseGrade[];
    totalCredits: number;
    totalGradePoints: number;
    gpa: string;
}

export interface TranscriptResponse {
    semesters: SemesterTranscript[];
    cgpa: string;
}

export interface AttendanceSessionResponse {
    message: string;
    session?: any;
    errors?: Record<string, string[]>;
}

export interface AttendanceRecordInput {
    studentId: string;
    present: boolean;
}

export interface MarkAttendanceResponse {
    message: string;
    upsertedCount?: number;
    modifiedCount?: number;
    errors?: Record<string, string[]>;
}

export interface PLOAchievement {
    ploId: string;
    title: string;
    achievedByPercentage: number;
    threshold: number;
    contributingCLOs: {
        cloId: string;
        cloCode: string;
        cloTitle: string;
        percentage: number;
        weight: number;
    }[];
}

export interface PLOAchievementResponse {
    batchId: string;
    programId: string;
    ploAchievements: PLOAchievement[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    summary: {
        totalStudents: number;
        totalAssessments: number;
        totalCLOs: number;
        totalPLOs: number;
        averagePLOAchievement: number;
    };
    interpretation: {
        strongPLOs: string[];
        weakPLOs: string[];
        message: string;
    };
}
