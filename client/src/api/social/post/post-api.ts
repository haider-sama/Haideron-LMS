import { API_BASE_URL } from "../../../constants";
import { CreatePostPayload, FilterPostsParams, FilterPostsResponse, Post, UpdatePostPayload } from "../../../constants/social/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/posts`;

export const createPost = async (
    payload: CreatePostPayload
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to create post");
        if (data.errors) {
            error.fieldErrors = data.errors; // zod validation errors
        }
        throw error;
    }

    return data;
};

export const filterAllPosts = async (
    params: FilterPostsParams
): Promise<FilterPostsResponse> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(
        `${LOCAL_BASE_URL}/?${query}`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch posts");
    }

    return data;
};

export const filterPostsByForumId = async (
    forumId: string,
    params: FilterPostsParams
): Promise<FilterPostsResponse> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(
        `${LOCAL_BASE_URL}/forums/${forumId}?${query}`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch forum posts");
    }

    return data;
};

export const filterPostsByUserId = async (
    userId: string,
    params: FilterPostsParams
): Promise<FilterPostsResponse> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(
        `${LOCAL_BASE_URL}/users/${userId}?${query}`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch user posts");
    }

    return data;
};

export const getPostBySlug = async (slug: string): Promise<{ post: Post }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${slug}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch post by slug");
    }

    return data;
};

export const getPostById = async (postId: string): Promise<{ post: Post }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${postId}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch post by ID");
    }

    return data;
};

export const updatePost = async (
    postId: string,
    payload: UpdatePostPayload
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/update`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to update post.");
    }

    return data;
};

export const archivePost = async (
    postId: string
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/archive`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to archive post.");
    }

    return data;
};

// --- Restore Post ---
export const restorePost = async (
    postId: string
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/restore`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to restore post.");
    }

    return data;
};

export const togglePinPost = async (
    postId: string,
    pin: boolean
): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/pin`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pin }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to toggle pin status.");
    }

    return data;
};