import { AssessmentTypeEnum, AudienceEnum, BatchEnrollmentStatus, ClassSectionEnum, DegreeEnum, DepartmentEnum, DomainEnum, FacultyTypeEnum, FinalizedResultStatusEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum, TeacherDesignationEnum, TermEnum } from "../../../../server/src/shared/enums";
import { Course, Program, ProgramCatalogue, TeacherInfo, TeacherInfoWithQualifications, User } from "../../../../server/src/shared/interfaces";

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

export type FetchUsersFilters = {
    email?: string;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    city?: string;
    country?: string;
    role?: AudienceEnum;
    department?: DepartmentEnum;
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

export interface BulkRegisterResult {
    email: string;
    success: boolean;
    message: string;
}

export interface BulkRegisterError {
    message: string;
    errors?: Record<string, string[]>;
}

export interface RegisterProgramPayload {
    title: string;
    programLevel: DegreeEnum;
    departmentTitle: DepartmentEnum;
    maxDurationYears: number;
    requirements?: string;
    vision?: string;
    mission?: string;
}

export interface GetProgramsParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface GetProgramsListResponse {
    message: string;
    programs: ProgramWithCreator[];
    page: number;
    totalPages: number;
    totalPrograms: number;
}

export interface AddPLOPayload {
    code: string;        // /^PLO\d+$/
    title: string;
    description: string;
}

export interface AddPLOsResponse {
    message: string;
    plos: Array<{
        id: string;
        code: string;
        title: string;
        description: string;
        programId: string;
    }>;
}

export interface PEOWithMappings {
    id: string;
    title: string;
    description: string;
    programId: string;
    position: number;
    mappings: {
        ploId: string;
        ploCode: string;
        ploTitle: string;
        ploDescription: string;
        strength: StrengthEnum;
    }[];
}

export interface PEOUpdatePayload {
    title: string;
    description: string;
    ploMapping: {
        plo: string;              // UUID of PLO
        strength: StrengthEnum;
    }[];
}

// PLO inside a PEO (frontend)
export interface PLOFrontend {
    id: string;
    code: string;
    title: string;
    description: string;
}

// PEO with nested PLOs
export interface PEOWithPlos {
    id: string;
    title: string;
    description: string;
    programId: string;
    position: number;
    plos: PLOFrontend[];
}

export interface GetProgramResponse {
    message: string;
    program: Program;
}

export interface PEOFrontend {
    id?: string;
    title: string;
    description: string;
    ploMapping: {
        plo: PLOFrontend;                  // full PLO object for frontend use
        strength: StrengthEnum;
    }[];
}

export interface ProgramWithCreator extends Program {
    createdByFirstName: string;
    createdByLastName: string;
}

export interface GetCataloguesListResponse {
    data: ProgramCatalogue[];
    page: number;
    totalPages: number;
    totalCatalogues: number;
}

export interface AddSemesterPayload {
    programCatalogueId: string; // renamed to match backend
    semesterNo: number;
    courses?: string[];
}

export interface GetSemestersResponse {
    message: string;
    semesters: Semester[];
}

export interface UpdateSemesterPayload {
    semesterNo?: number;
    courses?: string[]; // array of course IDs
}

export interface UpdateSemesterResponse {
    message: string;
    semester: Semester;
}

// export interface AssessmentPayload {
//     type: AssessmentTypeEnum;
//     title: string;
//     weightage: number;
//     dueDate: string; // ISO string
//     clos: string[];
// }

// // Keep this as a type because it's a union
// export type AssessmentResponse =
//     | {
//         success: true;
//         message: string;
//         assessment: Assessment;
//     }
//     | {
//         success: false;
//         message: string;
//         fieldErrors?: Record<string, string[]>;
//     };

export interface PLOMapping {
    id?: string; // optional for new mappings
    ploId: string;
    strength: StrengthEnum;
}

export interface CLO {
    id?: string; // optional for new clos
    code: string;
    title: string;
    description: string;
    ploMappings: PLOMapping[];
}

export interface CreateCoursePayload {
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
}

export interface CourseFilters {
    semesterId?: string;
    page?: number;
    limit?: number;
    title?: string;
    code?: string;
    subjectLevel?: string;
    subjectType?: string;
    knowledgeArea?: string;
    domain?: string;
    programId?: string;
    search?: string;
}

export interface GetCoursesResponse {
    message: string;
    courses: Course[];
    page: number;
    totalPages: number;
    totalCourses: number;
}

export interface UpdateCoursePayload {
    title?: string;
    code?: string;
    codePrefix?: string;
    description?: string;
    subjectLevel?: SubjectLevelEnum;
    subjectType?: SubjectTypeEnum;
    contactHours?: number;
    knowledgeArea?: KnowledgeAreaEnum;
    domain?: DomainEnum;
    preRequisites?: string[];
    coRequisites?: string[];
    clos?: CLO[];
    sectionTeachers?: Array<{
        section: ClassSectionEnum;
        teacherId: string;
    }>;

    sections?: Array<{
        section: ClassSectionEnum;
    }>;
}

export interface UpdateCourseResponse {
    message: string;
    course: Course;
}

export interface EditableCourse {
    programId?: string;
    programCatalogueId?: string;

    title?: string;
    code?: string;
    codePrefix?: string;
    description?: string;

    subjectLevel?: SubjectLevelEnum;
    subjectType?: SubjectTypeEnum;
    contactHours?: number;
    creditHours?: number;
    knowledgeArea?: KnowledgeAreaEnum;
    domain?: DomainEnum;

    preRequisites?: string[]; // just IDs on frontend
    coRequisites?: string[];
    sectionTeachers?: Array<{
        section: ClassSectionEnum;
        teacherId: string;
    }>;
    sections?: Array<{
        section: ClassSectionEnum;
    }>;

    clos?: CLO[];
}

export interface TeacherInfoInput {
    designation: TeacherDesignationEnum;
    joiningDate?: Date | null;
    facultyType: FacultyTypeEnum;
    subjectOwner: boolean;
}

export interface FacultyRegisterPayload {
    email: string;
    password: string;
    department: DepartmentEnum;
    teacherInfo: TeacherInfoInput;
}

export interface TeacherQualificationInput {
    id?: string;  // optional for new qualifications
    teacherInfoId: string;
    degree: DegreeEnum;
    passingYear: number;
    institutionName: string;
    majorSubjects: string[];
}

export interface TeacherInfoWithQualificationsInput extends Partial<Omit<TeacherInfo, 'id' | 'userId'>> {
    id?: string;
    userId?: string;
    qualifications?: TeacherQualificationInput[];
}

export type FacultyUpdatePayload = Partial<Pick<User,
    'firstName' | 'lastName' | 'city' | 'country' | 'address' | 'department' | 'role'>> & {
        teacherInfo?: TeacherInfoWithQualificationsInput;
    };

type FacultyUserSubset = Pick<User,
    "id" | "email" | "firstName" | "lastName" | "avatarURL" | "city" | "country" | "address" | "department" | "role" | "lastOnline" | "isEmailVerified"
>;

export interface FacultyUser extends FacultyUserSubset {
    teacherInfo?: TeacherInfoWithQualifications | null;
}

export interface FacultyFilterParams {
    page?: number;
    limit?: number;
    search?: string; // full-text search on users.search_vector
    designation?: string;
    facultyType?: string;
    subjectOwner?: string; // "true" | "false"
    joiningDateFrom?: string; // ISO date string
    joiningDateTo?: string;   // ISO date string
    department?: string;
}

export interface PaginatedFacultyResponse {
    data: FacultyUser[];
    page: number;
    totalPages: number;
    totalFaculty: number;
}

export interface SemesterCourse {
    courseId: string;
    semesterId: string;
    course: Course; // the full course object
}

export interface Semester {
    id: string;
    programCatalogueId: string;
    semesterNo: number;
    isArchived: boolean;
    archivedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;

    courses?: string[];
    semesterCourses?: SemesterCourse[];
}

export interface ProgramBatch {
    id: string;
    sessionYear: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    programId: string;
    programTitle: string;
    programDepartment: string;

    catalogueYear: number;
    createdByFirstName: string;
    createdByLastName: string;
}

export interface PaginatedBatches {
    message: string;
    batches: ProgramBatch[];
    page: number;
    totalPages: number;
    totalBatches: number;
}

export interface ActivatedSemester {
    id: string;
    programBatchId: string;
    semesterNo: number;
    term: TermEnum;
    isActive: boolean;
    startedAt: string | null;          // ISO 8601 string (or null)
    endedAt: string | null;            // ISO 8601 string (or null)
    enrollmentDeadline: string | null; // ISO 8601 string (or null)
    createdAt: string;                 // ISO 8601 string
    updatedAt: string;                 // ISO 8601 string
}

export interface GetActivatedSemestersResponse {
    message: string;
    semesters: ActivatedSemester[];
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
    id: string;
    course: Course;
    activatedSemester: string;
    sectionSchedules?: Record<string, ScheduleSlot[]>;
    capacityPerSection?: Record<string, number>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CourseOfferingUpdateInput {
    sectionSchedules?: Record<string, ScheduleSlot[]>;
    capacityPerSection?: Record<string, number>;
    isActive?: boolean;
    course?: string; // course ID
    programBatch?: string; // program batch ID
    activatedSemester?: string; // semester ID
}

export interface EnrollStudentPayload {
    studentId?: string;          // optional single student
    studentIds?: string[];       // optional multiple students
    programBatchId: string;
    status?: BatchEnrollmentStatus;
}

export type EnrolledStudent = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
};

export type StudentEnrollment = {
    student: EnrolledStudent;
    status: BatchEnrollmentStatus;
};

export type PaginatedStudentsByDepartmentResponse = {
    data: User[];
    page: number;
    totalPages: number;
    totalUsers: number;
};

// export interface UserPreview {
//     _id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
// }

// export interface ProgramCataloguePreview {
//     catalogueYear: number;
// }

// export interface ProgramPreview {
//     _id: string;
//     title: string;
//     departmentTitle: string;
// }

// export interface ProgramBatch {
//     _id: string;
//     program: ProgramPreview;
//     programCatalogue: ProgramCataloguePreview;
//     sessionYear: number;
//     isActive: boolean;
//     createdBy: UserPreview;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface PaginatedBatches {
//     batches: ProgramBatch[];
//     page: number;
//     totalPages: number;
//     totalBatches: number;
// }

// export interface CourseUpdatePayload {
//     _id: string;
//     title: string;
//     code: string;
//     creditHours: number;
//     department: DepartmentEnum;
//     semester: string; // e.g., "Fall 2025"
//     sectionTeachers: { [section in ClassSectionEnum]?: string };
//     sections: ClassSectionEnum[];
//     isActive: boolean;
//     enrollmentDeadline: string | null; // Dates are usually ISO strings from APIs
//     createdBy: string; // ObjectId as string
//     createdAt?: string; // optional, from Mongoose timestamps
//     updatedAt?: string;
// }


// export interface ActivatedSemester {
//     _id: string;
//     programBatch: string;
//     semesterNo: number;
//     isActive: boolean;
//     term: TermEnum;
//     startedAt?: string;
//     endedAt?: string;
//     enrollmentDeadline?: string;
//     createdAt?: string;
//     updatedAt?: string;
// }

// export interface ActivateSemesterResponse {
//     message: string;
//     activatedSemester: ActivatedSemester;
// }

// export interface StudentBatchEnrollment {
//     _id: string;
//     student: string;
//     programBatch: string;
//     status: BatchEnrollmentStatus;
//     enrolledAt: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface ModifyEnrollmentPayload {
//     studentId: string;
//     programBatchId: string;
// }

// export interface EnrollInCoursePayload {
//     section: string;
// }

// export interface SectionSchedule {
//     day: string;
//     startTime: string;
//     endTime: string;
//     room: string;
// }

// export interface EnrolledCourse {
//     _id: string;
//     enrolledAt: string;
//     section: string;
//     sectionTeacher: {
//         _id: string;
//         name: string;
//         email: string;
//     } | null;
//     courseOffering: CourseOffering;
// }

// export interface StudentDashboardContextResponse {
//     program: Program;
//     programBatch: ProgramBatch;
//     activatedSemesters: ActivatedSemester[];
// }

// export interface CourseInfo {
//     _id: string;
//     title: string;
//     code: string;
// }

// export interface AssignedCourseOffering {
//     offeringId: string;
//     course: Course;
//     assignedSections: string[];
//     programBatch: string;
//     activatedSemester: string;
//     sectionSchedules: Record<string, ScheduleSlot[]>;
//     capacityPerSection: Record<string, number>;
// }

// export interface GetAssignedCourseOfferingsResponse {
//     offerings: AssignedCourseOffering[];
// }

// export interface FacultyDashboardContextResponse {
//     program: Program;
//     programBatch: ProgramBatch;
//     activatedSemesters: ActivatedSemester[];
// }

// export interface EnrolledStudent {
//     _id: string;
//     name: string;
//     email: string;
//     enrolledAt: string;
// }

// export interface EnrolledStudentsResponse {
//     students: EnrolledStudent[];
//     total: number;
//     page: number;
//     pageSize: number;
//     totalPages: number;
// }

// export interface Assessment {
//     _id: string;
//     courseOfferingId: string; // or a populated CourseOffering object if populated
//     type: AssessmentTypeEnum;
//     title: string;
//     weightage: number;
//     dueDate: string; // ISO string returned from backend
//     clos: string[]; // CLO ObjectIds or populate later as needed
//     createdAt: string;
//     updatedAt: string;
// }

// export interface GetCourseAssessmentsResponse {
//     message: string;
//     assessments: Assessment[];
// }

// export interface AssessmentResultEntry {
//     studentId: string;
//     marksObtained: number;
//     totalMarks: number;
// }

// export interface SubmitBulkResultsResponse {
//     message: string;
// }

// export interface AssessmentResultStudent {
//     _id: string;
//     firstName: string;
//     email: string;
// }

// export interface GetAssessmentResultsResponse {
//     results: AssessmentResultApiResponseEntry[];
// }

// export interface AssessmentResultApiResponseEntry {
//     _id: string;
//     assessmentId: string;
//     studentId: {
//         _id: string;
//         name: string;
//         email: string;
//     };
//     marksObtained: number;
//     totalMarks: number;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface GradingRule {
//     grade: string;          // e.g., "A+", "A", "B-", etc.
//     minPercentage: number;  // e.g., 75
//     gradePoint: number;     // e.g., 4.0
// }

// export interface SaveGradingSchemeResponse {
//     success: boolean;
//     message: string;
//     scheme?: {
//         _id: string;
//         courseOffering: string;
//         createdBy: string;
//         rules: GradingRule[];
//         createdAt: string;
//         updatedAt: string;
//     };
// }

// export interface FinalGrade {
//     studentId: string;
//     courseOfferingId: string;
//     weightedPercentage: number;  // e.g., 78.5
//     gradePoint: number;          // e.g., 3.7
//     grade: string;               // e.g., "A"
// }

// export interface FinalizeResultsResponse {
//     success: boolean;
//     message: string;
//     grades?: FinalGrade[];
// }

// export interface FinalizedGrade {
//     studentId: string;
//     grade: string;
//     gradePoint: number;
//     weightedPercentage: number;
// }

// export interface FinalizedResult {
//     _id: string;
//     courseOffering: {
//         _id: string;
//         course: {
//             _id: string;
//             code: string;
//             title: string;
//             creditHours: number;
//         };
//         programBatch: {
//             _id: string;
//             sessionYear: number,
//             program: {
//                 _id: string;
//                 title: string;
//                 departmentTitle: string;
//             };
//         };
//     };
//     section: string;
//     submittedBy: {
//         _id: string;
//         firstName: string;
//         lastName: string;
//         email: string;
//     };
//     status: FinalizedResultStatusEnum;
//     reviewedBy?: string;
//     reviewedAt?: string;
//     results: {
//         studentId: string;
//         grade: string;
//         gradePoint: number;
//         weightedPercentage: number;
//     }[];
// }

// export interface CourseGrade {
//     courseTitle: string;
//     courseCode: string;
//     creditHours: number;
//     grade: string;
//     gradePoint: number;
//     status: string;
// }

// export interface SemesterTranscript {
//     semesterNo: number;
//     term: string;
//     sessionYear: number;
//     startedAt: string;
//     endedAt: string;
//     courses: CourseGrade[];
//     totalCredits: number;
//     totalGradePoints: number;
//     gpa: string;
// }

// export interface TranscriptResponse {
//     semesters: SemesterTranscript[];
//     cgpa: string;
// }

// export interface AttendanceSessionResponse {
//     message: string;
//     session?: any;
//     errors?: Record<string, string[]>;
// }

// export interface AttendanceRecordInput {
//     studentId: string;
//     present: boolean;
// }

// export interface MarkAttendanceResponse {
//     message: string;
//     upsertedCount?: number;
//     modifiedCount?: number;
//     errors?: Record<string, string[]>;
// }

// export interface PLOAchievement {
//     ploId: string;
//     title: string;
//     achievedByPercentage: number;
//     threshold: number;
//     contributingCLOs: {
//         cloId: string;
//         cloCode: string;
//         cloTitle: string;
//         percentage: number;
//         weight: number;
//     }[];
// }

// export interface PLOAchievementResponse {
//     batchId: string;
//     programId: string;
//     ploAchievements: PLOAchievement[];
//     pagination: {
//         total: number;
//         page: number;
//         limit: number;
//         totalPages: number;
//     };
//     summary: {
//         totalStudents: number;
//         totalAssessments: number;
//         totalCLOs: number;
//         totalPLOs: number;
//         averagePLOAchievement: number;
//     };
//     interpretation: {
//         strongPLOs: string[];
//         weakPLOs: string[];
//         message: string;
//     };
// }
