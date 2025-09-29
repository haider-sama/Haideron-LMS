import { API_BASE_URL } from "../../../shared/constants";
import { AssessmentPayload, AssessmentResultEntry, GetAssessmentResultsResponse, GetCourseAssessmentsResponse } from "../../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/assessment`;

export async function createAssessment(
    courseOfferingId: string,
    payload: AssessmentPayload
): Promise<{ message: string }> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${courseOfferingId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            }
        );

        const data = await res.json();
        
        if (!res.ok) {
            const error = new Error(data.message || "Failed to create assessment");
            (error as any).zodErrors = data.errors || null;
            throw error;
        }

        return data;
    } catch (err) {
        console.error("Error creating assessment:", err);
        throw err;
    }
}

export async function updateAssessment(
    assessmentId: string,
    payload: AssessmentPayload
): Promise<{ message: string }> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${assessmentId}`,
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
            const error = new Error(data.message || "Failed to update assessment");
            (error as any).zodErrors = data.errors || null; // attach field errors if any
            throw error;
        }

        return data;
    } catch (err) {
        console.error("Error updating assessment:", err);
        throw err;
    }
}

export async function deleteAssessmentById(
    assessmentId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${assessmentId}`,
            {
                method: "DELETE",
                credentials: "include",
            }
        );

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Failed to delete assessment");
            throw error;
        }

        return {
            success: true,
            message: data.message || "Assessment deleted successfully",
        };
    } catch (err) {
        console.error("Error deleting assessment:", err);
        return {
            success: false,
            message:
                (err as any)?.message || "Network error or server unreachable.",
        };
    }
}

export const getCourseAssessments = async (
    courseOfferingId: string
): Promise<GetCourseAssessmentsResponse> => {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${courseOfferingId}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || "Failed to fetch assessments.");
        }

        const data: GetCourseAssessmentsResponse = await res.json();
        return data;
    } catch (error: any) {
        console.error("Error fetching assessments:", error);
        throw new Error(error.message || "Unexpected error occurred.");
    }
};

export const submitBulkAssessmentResults = async (
    assessmentId: string,
    results: AssessmentResultEntry[]
): Promise<{ message: string }> => {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${assessmentId}/results`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ results }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Failed to update assessment");
            (error as any).zodErrors = data.errors || null; // attach field errors if any
            throw error;
        }

        return data;
    } catch (err) {
        console.error("Error submitting bulk results:", err);
        throw err;
    }
};

export const getAssessmentResults = async (
    assessmentId: string
): Promise<GetAssessmentResultsResponse> => {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${assessmentId}/results`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const data = await res.json();
        
        if (!res.ok) {
            const error = new Error(data.message || "Failed to fetch assessment results");
            (error as any).zodErrors = data.errors || null;
            throw error;
        }

        return data as GetAssessmentResultsResponse;
    } catch (err) {
        console.error("Error fetching assessment results:", err);
        throw err;
    }
};