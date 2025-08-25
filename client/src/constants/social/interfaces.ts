import { ForumBadgeEnum, ForumStatusEnum, ForumTypeEnum, PostTypeEnum } from "../../../../server/src/shared/social.enums";

export interface CreateForumPayload {
    title: string;
    description: string;
    type: ForumTypeEnum;
}

export interface ForumQueryParams {
    page?: number;       // default: 1
    limit?: number;      // default: 10
    type?: ForumTypeEnum;
    status?: ForumStatusEnum;
    search?: string;
    showArchived?: boolean;
    createdBy?: string;  // userId
}

export interface ForumCreator {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    firstName?: string;  // only present if admin
    lastName?: string;   // only present if admin
    avatarURL?: string;
}

export interface LatestPostAuthor {
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
    displayName?: string;
    avatarURL?: string;
}

export interface LatestPost {
    id: string;
    content: string;
    createdAt: string;
    author: LatestPostAuthor;
}

export interface ForumWithDetails {
    id: string;
    title: string;
    description?: string;
    iconUrl?: string;
    type: ForumTypeEnum;
    slug: string;
    status: ForumStatusEnum;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    isArchived?: boolean;

    postCount: number;
    creator: ForumCreator;

    moderators: ForumModerator[];
    latestPost?: LatestPost | null;
}

export interface ForumListResponse {
    forums: ForumWithDetails[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface ForumModerator {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatarURL?: string;
}

export interface ForumBySlugResponse {
    id: string;
    slug: string;
    title: string;
    description?: string;
    createdAt: string;
    createdBy: ForumCreator;
    moderators: ForumModerator[];
}

export interface ForumMembershipResponse {
    message: string;
    membersCount: number;
    isMember: boolean;
}

export interface ForumMembershipStatusResponse {
    isMember: boolean;
    memberCount: number;
}

export interface ForumFooterInfo {
    online: {
        total: number;
        registered: number;
        hidden: number;
        guests: number;
    };
    registeredUsernames: string[];
    statistics: {
        totalPosts: number;
        totalTopics: number;
        totalMembers: number;
        newestMember: string;
    };
}

export interface CreatePostPayload {
    forumId: string; // uuid
    type: PostTypeEnum;
    content?: string;

    linkPreview?: {
        url: string;
        title?: string;
        description?: string;
        image?: string;
    };

    mediaUrls?: string[];
}

export interface Post {
    id: string; // uuid

    forumId: string; // references forums.id
    authorId: string; // references users.id

    type: PostTypeEnum;
    slug: string;

    content?: string;

    linkPreview?: {
        url: string;
        title?: string;
        description?: string;
        image?: string;
    };

    mediaUrls: string[];

    likeCount: number;
    upvoteCount: number;
    downvoteCount: number;

    isPinned: boolean;
    isEdited: boolean;
    isArchived: boolean;

    archivedAt?: Date | null;
    lastEditedAt?: Date | null;

    createdAt: Date;
    updatedAt: Date;

    author: PostAuthor;
}

export interface PostAuthor {
    id: string;
    role: string;
    avatarURL: string | null;
    forumProfile?: ForumProfile | null;
}

export interface ForumProfile {
    username: string;
    displayName?: string | null;
    bio?: string | null;
    reputation: number;
    badges: ForumBadgeEnum[];
}

export interface FilterPostsParams {
    limit: number;
    type?: PostTypeEnum;
    sort?: "recent" | "top" | "trending";
    search?: string;
    archived?: string;
    lastPostCreatedAt: string;
};

export interface FilterPostsResponse {
    posts: Post[];
    meta: {
        limit: number;
        nextCursor: string | null; // ISO date string
    };
}

export type LinkPreview = {
    url: string;
    title?: string;
    description?: string;
    image?: string;
};

export type UpdatePostPayload = {
    content?: string;
    linkPreview?: LinkPreview;
    mediaUrls?: string[];
};

export interface PostLikeResponse {
    message: string;
    liked: boolean;
    likeCount: number;
}

export interface PostVoteResponse {
    upvoteCount: number;
    downvoteCount: number;
    upvoted?: boolean;   // only present on upvote endpoint
    downvoted?: boolean; // only present on downvote endpoint
    message?: string;
}

export interface PostMetrics {
    likeCount: number;
    upvoteCount: number;
    downvoteCount: number;
    commentCount: number;
    hasLiked: boolean;
    userVote: "UPVOTE" | "DOWNVOTE" | null;
}

export interface CreateCommentPayload {
    postId: string;
    parentId?: string | null;
    content: string;
}

export interface GetCommentsParams {
    parentId?: string;
    sort?: "newest" | "oldest" | "top" | "best";
    limit?: number;
    offsetKey?: string | null; // ISO string for cursor
}

export interface CommentAuthor {
    id: string;
    avatarURL: string | null;
    role: string;
    displayName?: string | null;
    username?: string | null;
}

export interface Comment {
    id: string;
    postId: string;
    parentId: string | null;
    authorId: string;
    content: string;
    likeCount: number;
    childrenCount: number;
    isBest: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    likedByMe: boolean;
    author: CommentAuthor;
}

export interface GetCommentsResponse {
    comments: Comment[];
    meta: {
        limit: number;
        nextOffsetKey: string | null;
    };
}

export interface ToggleLikeCommentResponse {
  message: string;
  liked: boolean;
  likeCount: number;
}