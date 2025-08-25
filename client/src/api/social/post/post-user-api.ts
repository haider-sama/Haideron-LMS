import { API_BASE_URL } from "../../../constants";
import { PostLikeResponse, PostMetrics, PostVoteResponse } from "../../../constants/social/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/posts/public`;

export const likePost = async (postId: string): Promise<PostLikeResponse> => {
    const start = performance.now(); // start timer

    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/like`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    const end = performance.now(); // end timer
    console.log(`[API] likePost(${postId}) took ${(end - start).toFixed(2)} ms`);

    if (!res.ok) {
        throw new Error(data.message || "Failed to like post.");
    }

    return data as PostLikeResponse;
};

export const unlikePost = async (postId: string): Promise<PostLikeResponse> => {
    const start = performance.now(); // start timer

    const res = await fetch(`${LOCAL_BASE_URL}//${postId}/unlike`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    const end = performance.now(); // end timer
    console.log(`[API] unlikePost(${postId}) took ${(end - start).toFixed(2)} ms`);

    if (!res.ok) {
        throw new Error(data.message || "Failed to unlike post.");
    }

    return data as PostLikeResponse;
};

export const upvoteOnPost = async (postId: string): Promise<PostVoteResponse> => {
    const start = performance.now(); // start timer

    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/upvote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();


    const end = performance.now(); // end timer
    console.log(`[API] upvotePost(${postId}) took ${(end - start).toFixed(2)} ms`);

    if (!res.ok) {
        throw new Error(data.message || "Failed to upvote post.");
    }

    return data as PostVoteResponse;
};

export const downvoteOnPost = async (postId: string): Promise<PostVoteResponse> => {
    const start = performance.now(); // start timer

    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/downvote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    const data = await res.json();

    const end = performance.now(); // end timer
    console.log(`[API] downvotePost(${postId}) took ${(end - start).toFixed(2)} ms`);


    if (!res.ok) {
        throw new Error(data.message || "Failed to downvote post.");
    }

    return data as PostVoteResponse;
};

export const getPostMetrics = async (postId: string): Promise<PostMetrics> => {
    const res = await fetch(`${LOCAL_BASE_URL}/${postId}/metrics`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch post metrics.");
    }

    return data as PostMetrics;
};