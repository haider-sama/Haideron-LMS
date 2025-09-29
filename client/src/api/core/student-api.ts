import { API_BASE_URL } from "../../shared/constants";
import { EnrolledCourse, EnrollInCoursePayload, StudentDashboardContextResponse, TranscriptResponse } from "../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/student`;

export async function enrollInCourse(
    courseOfferingId: string,
    payload: EnrollInCoursePayload
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${courseOfferingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to enroll in course");
        if (data.errors) {
            error.fieldErrors = data.errors; // zod validation errors
        }
        throw error;
    }

    return data;
};

export async function deEnrollFromCourse(
    courseOfferingId: string,
    payload: EnrollInCoursePayload
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${courseOfferingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to deEnroll from course");
        if (data.errors) {
            error.fieldErrors = data.errors; // zod validation errors
        }
        throw error;
    }

    return data;
};

export async function getEnrolledCourses(): Promise<EnrolledCourse[]> {
    const res = await fetch(`${LOCAL_BASE_URL}/courses`, {
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch enrolled courses");

    return data;
};

export async function getStudentDashboardContext(): Promise<StudentDashboardContextResponse> {
    const res = await fetch(`${LOCAL_BASE_URL}/dashboard`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch student dashboard context");

    return data;
};

export const getTranscript = async (): Promise<TranscriptResponse> => {
    const res = await fetch(`${LOCAL_BASE_URL}/transcript`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch transcript");
    }

    return data;
};