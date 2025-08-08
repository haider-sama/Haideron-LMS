export enum ForumTypeEnum {
    COURSE = "course",                     // For course-specific forums (e.g., r/course-cs101)
    PROGRAM = "program",                   // For academic programs (e.g., BS-CS, MBA)
    DEPARTMENT = "department",             // For department-wide discussions
    FACULTY = "faculty",                   // For discussions across faculties (e.g., Faculty of Engineering)
    UNIVERSITY = "university",             // Campus-wide forums
    STUDENT_GROUP = "student-group",       // Official or informal student-run societies or clubs
    EVENT = "event",                       // Temporary forums for seminars, hackathons, orientations
    ANNOUNCEMENT = "announcement",         // One-way or locked threads for university announcements
    RESEARCH = "research",                 // Research lab groups or faculty research areas
    ADMIN = "admin",                       // Staff/admin-only internal communication
    PUBLIC = "public",                     // Public-facing forums (e.g., prospective students)
    SUPPORT = "support",                   // For help, FAQs, and support requests
    ALUMNI = "alumni",                     // Discussion space for graduates
    GENERAL = "general",                   // Catch-all or misc discussions
}

export enum ForumStatusEnum {
    PENDING = "pending",     // newly created, awaiting admin approval
    APPROVED = "approved",   // visible and active
    REJECTED = "rejected",   // denied by admin
}

export enum PostTypeEnum {
    TEXT = "TEXT",
    LINK = "LINK",
    MEDIA = "MEDIA",
    QUESTION = "QUESTION",
}

export enum ReportTargetType {
    Post = "Post",
    Comment = "Comment",
    User = "User",
    Message = "Message",
    Reply = "Reply",
}

export enum VoteTypeEnum {
    UPVOTE = "UPVOTE",
    DOWNVOTE = "DOWNVOTE",
}

export enum ForumBadgeEnum {
    ProPoster = "pro-poster",               // 50+ posts
    CommentMaster = "comment-master",       // 100+ comments
    Beloved = "beloved",                    // 200+ likes (post + comment)
    ForumLeader = "forum-leader",           // 5+ forums joined
    RisingStar = "rising-star",             // 10+ reputation
    ActiveContributor = "active-contributor", // 7+ days active posting
    Debater = "debater",                    // 25+ comments in threads
    Critic = "critic",                      // 50+ comment likes
    PopularPoster = "popular-poster",       // 100+ post likes
    Veteran = "veteran",                    // Joined > 1 year ago
}

export enum VisibilityEnum {
    private = "private",
    public = "public",
}