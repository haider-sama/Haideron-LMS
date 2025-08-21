import axios from "axios";
import { API_BASE_URL } from "../../constants";
import { RegisterPayload, VerifyEmailResponse } from "../../constants/core/interfaces";
import { LoginFormData } from "../../constants/core/interfaces";
import clientApi from "./clientApi";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/auth`;

export const login = async ({ email, password }: LoginFormData) => {
    try {
        const response = await clientApi.post("/api/v1/auth/login", { email, password });
        return response.data;
    } catch (error: any) {
        if (error.response?.data) {
            const wrappedError = new Error(error.response.data.message || "Login failed") as any;
            wrappedError.response = { data: error.response.data };
            throw wrappedError;
        }
        throw new Error("Network error");
    }
};

export const loginWithGoogle = async (token: string) => {
    const response = await axios.post("/api/v1/auth/login/google", { token });
    return response.data;
};

export const logout = async () => {
    await clientApi.post("/api/v1/auth/logout");
    window.location.href = "/login"; // Redirect after logout
};

export const logoutAllDevices = async () => {
    await clientApi.post("/api/v1/auth/logout-all"); // or "/logout-all" based on your route
    window.location.href = "/login"; // Redirect to login page after full logout
};

export const deleteSessionById = async (sessionId: string) => {
    const res = await clientApi.delete(`/api/v1/auth/sessions/${sessionId}`);
    return res.data;
};

export const fetchSessions = async () => {
    const res = await clientApi.get("/api/v1/auth/sessions");
    return res.data;
};

export const register = async (formData: RegisterPayload) => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/register`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Registration failed") as any;
            error.response = { data };
            throw error;
        }

        return data;
    } catch (error) {
        // console.error('Registration Error:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/reset-password/${token}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error resetting password");
    }

    return res.json();
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error sending reset password email");
    }

    return res.json();
};

export const resendPasswordResetEmail = async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/resend-password-reset`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error resending password reset email");
    }

    return res.json();
};

export const uploadAvatar = async (file: File, targetUserId?: string): Promise<Response> => {
    const formData = new FormData();
    formData.append("avatar", file);

    // append targetUserId if provided
    const url = targetUserId
        ? `${LOCAL_BASE_URL}/users/${targetUserId}/upload-avatar`
        : `${LOCAL_BASE_URL}/upload-avatar`;

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to upload avatar");
        }

        return response;
    } catch (error) {
        console.error("Error uploading avatar:", error);
        throw error;
    }
};

export const deleteAvatar = async (targetUserId?: string): Promise<Response> => {
    const url = targetUserId
        ? `${LOCAL_BASE_URL}/users/${targetUserId}/delete/avatar`
        : `${LOCAL_BASE_URL}/delete/avatar`;

    try {
        const response = await fetch(url, {
            method: "DELETE",
            credentials: "include",
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to delete avatar");
        }

        return response;
    } catch (err) {
        throw err;
    }
};

export const verifyEmail = async (code: string): Promise<VerifyEmailResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/verify-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error verifying email");
    }

    return res.json();
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${LOCAL_BASE_URL}/resend-verification-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error resending verification email");
    }

    return res.json();
};

export const requestEmailChange = async (email: string) => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/request-email-change`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Request failed") as any;
            error.response = { data };
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const verifyEmailChange = async (code: string) => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/verify-email-change`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Verification failed") as any;
            error.response = { data };
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
};