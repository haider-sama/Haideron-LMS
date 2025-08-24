import { API_BASE_URL } from "../../../constants";
import { CreateCommentPayload, GetCommentsParams, GetCommentsResponse } from "../../../constants/social/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/comments`;

export const createComment = async (
    payload: CreateCommentPayload
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
        throw new Error(data.message || "Failed to create comment");
    }

    return data;
};

export const getCommentsForPost = async (
    postId: string,
    params: GetCommentsParams = {}
): Promise<GetCommentsResponse> => {
    const url = new URL(`${LOCAL_BASE_URL}/${postId}`);

    if (params.parentId) url.searchParams.append("parentId", params.parentId);
    if (params.sort) url.searchParams.append("sort", params.sort);
    if (params.limit) url.searchParams.append("limit", String(params.limit));
    if (params.offsetKey) url.searchParams.append("offsetKey", params.offsetKey);

    const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch comments");
    }

    return data as GetCommentsResponse;
};

export const getRepliesForComment = async (
    postId: string,
    parentId: string,
    params: GetCommentsParams = {}
): Promise<GetCommentsResponse> => {
    const url = new URL(
        `${LOCAL_BASE_URL}/${postId}/comments/${parentId}/replies`
    );

    if (params.sort) url.searchParams.append("sort", params.sort);
    if (params.limit) url.searchParams.append("limit", String(params.limit));
    if (params.offsetKey) url.searchParams.append("offsetKey", params.offsetKey);

    const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch replies");

    return data as GetCommentsResponse;
};

export const updateComment = async (
    commentId: string,
    payload: { content: string }
): Promise<{ message: string }> => {
    const res = await fetch(
        `${LOCAL_BASE_URL}/${commentId}/update`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to update comment");
    }

    return data;
};

export const deleteComment = async (
    commentId: string
): Promise<{ message: string }> => {
    const res = await fetch(
        `${LOCAL_BASE_URL}/${commentId}/delete`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to delete comment");
    }

    return data;
};

export const toggleBestComment = async (
    commentId: string
): Promise<{ message: string }> => {
    const url = `${LOCAL_BASE_URL}/${commentId}/markBest`;

    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to toggle best comment");
    }

    return data;
};
