import { API_BASE_URL } from "../../../constants";
import { EnrolledStudentsResponse, FacultyDashboardContextResponse, GetAssignedCourseOfferingsResponse } from "../../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/teacher`;

export const getAllAssignedCourseOfferings = async (
    semesterId: string
): Promise<GetAssignedCourseOfferingsResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/assigned-course-offerings?semesterId=${semesterId}`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch assigned course offerings");
    }

    const data: GetAssignedCourseOfferingsResponse = await res.json();
    return data;
};

export const getFacultyDashboardContext = async (): Promise<FacultyDashboardContextResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/dashboard`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    return data;
};

export async function fetchEnrolledStudentsForCourse(
    offeringId: string,
    section: string,
    options?: { page?: number; limit?: number; search?: string }
): Promise<EnrolledStudentsResponse> {
    const { page = 1, limit = 20, search = "" } = options || {};
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
    });

    const url = `${LOCAL_BASE_URL}/courses/${offeringId}/sections/${section}/enrolled-students?${queryParams}`;

    const res = await fetch(url, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch enrolled students");
    }

    const data = (await res.json()) as EnrolledStudentsResponse;
    return data;
}