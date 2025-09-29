import { API_BASE_URL } from "../../../shared/constants";
import { CourseOffering, CourseOfferingCreateInput, CourseOfferingUpdateInput } from "../../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/offerings`;

export async function createCourseOfferings(
    activatedSemesterId: string,
    offerings: CourseOfferingCreateInput[]
): Promise<CourseOffering[]> {
    const res = await fetch(`${LOCAL_BASE_URL}/${activatedSemesterId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerings }),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to create course offerings");
        if (data.errors) error.errors = data.errors;
        throw error;
    }

    return data.data;
};

export async function getCourseOfferings(
    activatedSemesterId: string
): Promise<{ offerings: CourseOffering[] }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${activatedSemesterId}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch course offerings");
    return data;
};

export async function updateCourseOffering(
    offeringId: string,
    payload: CourseOfferingUpdateInput
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${offeringId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to update course offerings");
        if (data.errors) error.errors = data.errors;
        throw error;
    }

    return data.data;
};

export async function deleteCourseOffering(offeringId: string): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${offeringId}`, {
        method: "DELETE",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete course offering");
    return data;
};