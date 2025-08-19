import { FinalizedResultStatusEnum } from "../../../../../server/src/shared/enums";
import { API_BASE_URL } from "../../../constants";
import { FetchPendingFinalizedResultsResponse, FinalizeResultsResponse, GradingRule, SaveGradingSchemeResponse, WithdrawFinalizedResultResponse } from "../../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/results`;

export async function saveGradingScheme(
    courseOfferingId: string,
    rules: GradingRule[],
    section: string
): Promise<SaveGradingSchemeResponse> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${courseOfferingId}/grading-scheme`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ rules, section }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Failed to save grading scheme.',
            };
        }

        return {
            success: true,
            message: data.message,
            scheme: data.scheme,
        };
    } catch (err) {
        console.error('Error saving grading scheme:', err);
        return {
            success: false,
            message: 'Network error or server unreachable.',
        };
    }
}

export async function finalizeAssessmentResults(
    courseOfferingId: string,
    section: string
): Promise<FinalizeResultsResponse> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${courseOfferingId}/finalize`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ section }),
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Failed to finalize assessment results.',
            };
        }

        return {
            success: true,
            message: data.message,
            grades: data.grades,
        };
    } catch (err) {
        console.error('Error finalizing assessment results:', err);
        return {
            success: false,
            message: 'Network error or server unreachable.',
        };
    }
}

export async function withdrawFinalizedResult(
    courseOfferingId: string,
    section: string
): Promise<WithdrawFinalizedResultResponse> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${courseOfferingId}/withdraw`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ section }),
        });

        const data = await res.json();

        return {
            success: res.ok,
            message: data.message || 'Failed to withdraw finalized result.',
        };
    } catch (error) {
        console.error('Error withdrawing finalized result:', error);
        return { success: false, message: 'Network error or server unreachable.' };
    }
}

export async function fetchPendingFinalizedResults(
    page = 1,
    limit = 20
): Promise<FetchPendingFinalizedResultsResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    try {
        const res = await fetch(`${LOCAL_BASE_URL}/review/pending?${params}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to fetch pending results.");
        }

        return res.json();
    } catch (error: any) {
        console.error("Error fetching pending finalized results:", error);
        throw new Error(error.message || "Network error or server unreachable.");
    }
}

export async function reviewFinalizedResult(
    resultId: string,
    status: Exclude<FinalizedResultStatusEnum, "Pending">
): Promise<string> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/review/${resultId}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to review result.");
        }

        return data.message; // e.g., "Result confirmed successfully."
    } catch (err: any) {
        return Promise.reject(err.message || "Network error or server unreachable.");
    }
}