import { API_BASE_URL } from "../../constants";
import clientApi from "./clientApi";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/auth`;

export const validateToken = async () => {
    try {
        const res = await clientApi.get(`/api/v1/auth/validate-token`);
        return res.data;
    } catch (err: any) {
        if (err.response?.status === 401) {
            return null; // Not logged in
        }

        return null;
    }
};

export const refreshToken = async () => {
    const res = await fetch(`${LOCAL_BASE_URL}/refresh-token`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to refresh token");
    }

    return res.json();
};
