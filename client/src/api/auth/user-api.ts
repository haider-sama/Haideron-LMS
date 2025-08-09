import { UserType } from "../../../../server/src/shared/types";
import { API_BASE_URL } from "../../constants";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/auth` || "";

export const fetchUserProfile = async () => {
    const res = await fetch(`${LOCAL_BASE_URL}/profile`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error('Failed to fetch user profile');
    }

    return res.json();
};

export const updateUserProfile = async (userData: Partial<UserType>): Promise<UserType> => {
    const res = await fetch(`${LOCAL_BASE_URL}/update/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    const data = await res.json();
    // console.log("Received response:", data);
    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to update profile");
        if (data.errors) {
            error.errors = data.errors; // Attach Zod field errors
        }
        throw error;
    }

    return data;
};

export const getUserForumProfile = async (userIdOrUsername: string) => {
    const res = await fetch(`${LOCAL_BASE_URL}/profile/${userIdOrUsername}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch user's forum profile");
    }

    return res.json();
};