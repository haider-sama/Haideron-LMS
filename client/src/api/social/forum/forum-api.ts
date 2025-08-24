import { ForumStatusEnum } from "../../../../../server/src/shared/social.enums";
import { API_BASE_URL } from "../../../constants";
import { CreateForumPayload, ForumBySlugResponse, ForumListResponse, ForumQueryParams } from "../../../constants/social/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/forums`;

export const createForum = async (
    payload: CreateForumPayload
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to create forum");
        if (data.errors) {
            error.fieldErrors = data.errors; // zod validation errors
        }
        throw error;
    }

    return data;
};

export const getForums = async (
    params: ForumQueryParams
): Promise<ForumListResponse> => {
    // Convert boolean to string because backend expects query params as strings
    const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
    );

    const query = new URLSearchParams(
        Object.entries(filteredParams).map(([k, v]) => [k, String(v)])
    ).toString();

    const res = await fetch(`${LOCAL_BASE_URL}/?${query}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch forums");
    }


    return data as ForumListResponse;
};

export const getForumBySlug = async (
    slug: string
): Promise<ForumBySlugResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${slug}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch forum");
    }

    return data as ForumBySlugResponse;
};

export const updateForum = async (
    forumId: string,
    payload: CreateForumPayload
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/update`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to update forum");
        if (data.errors) {
            error.fieldErrors = data.errors; // zod validation errors
        }
        throw error;
    }

    return data;
};

export const archiveForum = async (
    forumId: string
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/archive`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to archive forum");
    }

    return data;
};

export const restoreForum = async (
    forumId: string
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/restore`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to restore forum");
    }

    return data;
};

export const updateForumStatus = async (
    forumId: string,
    payload: { status: ForumStatusEnum }
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to update forum status");
    }

    return data;
};

export const uploadForumIcon = async (
    forumId: string,
    file: File
): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("icon", file); // backend expects `req.file`

    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/upload/icon`, {
        method: "POST",
        credentials: "include",
        body: formData, // no headers → browser sets multipart/form-data
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to upload forum icon");
    }

    return data;
};

export const deleteForumIcon = async (
    forumId: string
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/delete/icon`, {
        method: "DELETE",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to delete forum icon");
    }

    return data;
};

export const assignModeratorToForum = async (
    forumId: string,
    userId: string
): Promise<{ message: string}> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/moderators`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to assign moderator.");
    }

    return data;
};

export const removeModeratorFromForum = async (
    forumId: string,
    userId: string
): Promise<{ message: string}> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${forumId}/moderators/${userId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to remove moderator.");
    }

    return data;
};