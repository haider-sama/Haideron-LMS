import { API_BASE_URL } from "../../../constants";
import { CreateForumPayload, ForumFooterInfo, ForumMembershipResponse, ForumMembershipStatusResponse } from "../../../constants/social/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/forums/public`;

export const requestForumCreation = async (
    payload: CreateForumPayload
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to request forum creation");
    }

    return data;
};

export const getForumMembershipStatus = async (
    forumId: string
): Promise<ForumMembershipStatusResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/membership-status`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result.message || "Failed to get forum membership status");
    }

    return result as ForumMembershipStatusResponse;
};

export const getForumFooterInfo = async (): Promise<ForumFooterInfo> => {
    const res = await fetch(`${LOCAL_BASE_URL}/info`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    const result = await res.json();
    
    if (!res.ok) {
        throw new Error(result.message || "Failed to fetch forum footer info");
    }

    return result as ForumFooterInfo;
};


export const joinForum = async (forumId: string): Promise<ForumMembershipResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/join`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join forum");
    }

    return res.json();
};

export const leaveForum = async (forumId: string): Promise<ForumMembershipResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/leave`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to leave forum");
    }

    return res.json();
};
