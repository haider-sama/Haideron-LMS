import { API_BASE_URL } from "../../constants";
import { FacultyFilterParams, FacultyRegisterPayload, FacultyUpdatePayload, FacultyUser, PaginatedFacultyResponse } from "../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/faculty`;

export async function registerFacultyMember(
    payload: FacultyRegisterPayload):
    Promise<{
        message: string
    }> {

    const res = await fetch(`${LOCAL_BASE_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to register faculty member");
        if (data.errors) {
            error.errors = data.errors;  // zod-validation errors
        }
        throw error;
    }

    return data.user;
};

export async function updateFacultyMember(
    teacherId: string, payload: FacultyUpdatePayload): Promise<FacultyUser> {
    const res = await fetch(`${LOCAL_BASE_URL}/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to update faculty member");
        if (data.errors) {
            error.errors = data.errors;  // zod-validation errors
        }
        throw error;
    }

    return data;
};

export async function getFacultyMemberById(teacherId: string): Promise<FacultyUser> {
    const res = await fetch(`${LOCAL_BASE_URL}/${teacherId}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch faculty member");
    return data;
}

export async function getFacultyMembers(params: FacultyFilterParams = {}): Promise<PaginatedFacultyResponse> {
    const url = new URL(`${LOCAL_BASE_URL}/`);
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") url.searchParams.append(key, String(val));
    });

    const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch faculty list");
    return data;
}

export async function deleteFacultyMember(teacherId: string): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${teacherId}`, {
        method: "DELETE",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete faculty member");
    return data;
}

export const getDepartmentHeadDashboardContext = async () => {
    const res = await fetch(`${LOCAL_BASE_URL}/dashboard/context`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch department head dashboard context');
    }

    return res.json();
};