export const enum AppErrorCode {
    InvalidAccessToken = "InvalidAccessToken",
};

export enum AudienceEnum {
    Guest = "Guest",
    Student = "Student",
    DepartmentTeacher = "DepartmentTeacher",
    DepartmentHead = "DepartmentHead",
    Admin = "Admin",  // @root

    ForumModerator = "ForumModerator",      // assigned per forum
    ForumCurator = "ForumCurator",          // can create new forums
    CommunityAdmin = "CommunityAdmin",      // can manage all forums + assign mods
};

export enum DepartmentEnum {
    NA = "N/A",

    // Engineering Core
    CSE = "Computer Science and Engineering",
    SE = "Software Engineering",
    CE = "Civil Engineering",
    ME = "Mechanical Engineering",
    EE = "Electrical Engineering",
    EEE = "Electrical and Electronic Engineering",
    CHE = "Chemical Engineering",
    PE = "Petroleum Engineering",
    AE = "Automotive Engineering",
    AAE = "Aerospace Engineering",
    IE = "Industrial Engineering",
    MME = "Metallurgical and Materials Engineering",
    BME = "Biomedical Engineering",
    ENV = "Environmental Engineering",
    MT = "Mechatronics Engineering",
    MCE = "Mining and Civil Engineering",
    TE = "Telecommunication Engineering",
    GE = "Geological Engineering",
    TECP = "Textile Engineering",

    // Architecture & Planning
    ARCH = "Architecture",
    CRP = "City and Regional Planning",
    ID = "Industrial Design",
    UD = "Urban Design",

    // Sciences & Applied Sciences
    PHY = "Physics",
    MATH = "Mathematics",
    CHEM = "Chemistry",
    APPSCI = "Applied Sciences",
    NATSCI = "Natural Sciences",
    STATS = "Statistics",

    // Computer & Data Sciences
    DS = "Data Science",
    IT = "Information Technology",
    AI = "Artificial Intelligence",
    CYBER = "Cybersecurity",

    // Management & Humanities
    HSS = "Humanities and Social Sciences",
    MS = "Management Sciences",
    EM = "Engineering Management",
    ECO = "Economics",
    ACC = "Accounting and Finance",
    BBA = "Business Administration",
    PSY = "Psychology",
    LAW = "Law",

    // Emerging / Interdisciplinary
    BIOINFO = "Bioinformatics",
    NANO = "Nanotechnology",
    ENERGY = "Energy Systems Engineering",
    RENEW = "Renewable Energy Engineering",
    ROBOT = "Robotics Engineering",

    // (optional)
    TET = "Transport Engineering and Management",
    POLY = "Polymer and Process Engineering",
    GT = "Geomatics Engineering",
}

export enum VerificationCodeType {
    EmailVerification = "email_verification",
    ResetPassword = "reset_password",
    EmailChange = "email_change",
};

export enum ClassSectionEnum {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F"
};

export enum TeacherDesignationEnum {
    Professor = "Professor",
    Assistant_Professor = "Assistant Professor",
    Associate_Professor = "Associate Professor",
    Lecturer = "Lecturer",
};

export enum FacultyTypeEnum {
    Permanent = "Permanent",
    Contractual = "Contractual",
};

export enum DegreeEnum {
    BS = "BS",
    MS = 'MS',
    MPhil = 'MPhil',
    PhD = 'PhD',
};

export enum SubjectLevelEnum {
    FirstYear = "1st Year",
    SecondYear = "2nd Year",
    ThirdYear = "3rd Year",
    FourthYear = "4th Year",
    MS = "MS",
    MSC = "MSC",
    PhD = "PhD",
};

export enum SubjectTypeEnum {
    Theory = "Theory",
    Lab = "Lab",
    Thesis = "Thesis",
};

export enum KnowledgeAreaEnum {
    Technology = "Technology",
    Engineering = "Engineering",
    Science = "Science",
    Mathematics = "Mathematics",
    ComputerScience = "Computer Science",
    Business = "Business",
    Management = "Management",
    Economics = "Economics",
    HealthSciences = "Health Sciences",
    Humanities = "Humanities",
    SocialSciences = "Social Sciences",
    Arts = "Arts",
    Design = "Design",
    Law = "Law",
    Education = "Education",
    EnvironmentalStudies = "Environmental Studies",
    Communication = "Communication",
    Agriculture = "Agricultural Sciences",
    Architecture = "Architecture and Planning",
    Interdisciplinary = "Interdisciplinary Studies",
}

export enum DomainEnum {
    Engineering = "Engineering",
    NonEngineering = "Non-Engineering",
    Computing = "Computing",
    Management = "Management",
    Health = "Health",
    Science = "Science",
    Humanities = "Humanities",
    Arts = "Arts and Design",
    Legal = "Legal",
    Education = "Education",
    TechnicalVocational = "Technical and Vocational",
}

export enum StrengthEnum {
    Low = "Low",
    Medium = "Medium",
    High = "High",
};

export enum TermEnum {
    Fall = "Fall",
    Spring = "Spring",
    Summer = "Summer",
};

export enum BatchEnrollmentStatus {
    Active = "Active",
    Graduated = "Graduated",
    Dropped = "Dropped"
};

export enum AssessmentTypeEnum {
    Quiz = "Quiz",
    Assignment = "Assignment",
    MidTerm = "Midterm",
    Final = "Final",
    Project = "Project",
};

export enum FinalizedResultStatusEnum {
    Pending = "Pending",
    Confirmed = "Confirmed",
    Rejected = "Rejected",
};