import { API_BASE_URL } from "../../../constants";
import { ToggleLikeCommentResponse } from "../../../constants/social/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/comments/public`;

export const likeComment = async (commentId: string): Promise<ToggleLikeCommentResponse> => {
    const start = performance?.now?.() ?? Date.now();

    const res = await fetch(`${LOCAL_BASE_URL}/${commentId}/like`, {
        method: "POST",
        credentials: "include",
    });

    const end = performance?.now?.() ?? Date.now();
    console.log(`likeCommentApi took ${(end - start).toFixed(2)}ms`);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to like comment");

    return data as ToggleLikeCommentResponse;
};

export const unlikeComment = async (commentId: string): Promise<ToggleLikeCommentResponse> => {
    const start = performance?.now?.() ?? Date.now();

    const res = await fetch(`${LOCAL_BASE_URL}/${commentId}/unlike`, {
        method: "POST",
        credentials: "include",
    });

    const end = performance?.now?.() ?? Date.now();
    console.log(`unlikeCommentApi took ${(end - start).toFixed(2)}ms`);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to unlike comment");

    return data as ToggleLikeCommentResponse;
};