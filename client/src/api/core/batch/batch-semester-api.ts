import { TermEnum } from "../../../../../server/src/shared/enums";
import { Course } from "../../../../../server/src/shared/interfaces";
import { API_BASE_URL } from "../../../constants";
import { ActivatedSemester, GetActivatedSemestersResponse } from "../../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/batch/semesters`;

export async function activateSemester(payload: {
    programBatchId: string;
    semesterNo: number;
    term: TermEnum;
    startedAt?: string;
}): Promise<{ message: string; activatedSemester: ActivatedSemester }> {
    const res = await fetch(`${LOCAL_BASE_URL}/activate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to activate semester");
        if (data.errors) error.errors = data.errors;
        throw error;
    }

    return data;    // { message, activatedSemester }
};

export async function getSemestersByBatch(batchId: string): Promise<GetActivatedSemestersResponse> {
    const res = await fetch(`${LOCAL_BASE_URL}/${batchId}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch semesters");

    return data;
}

export async function updateBatchSemester(
    batchSemesterId: string,
    payload: {
        isActive?: boolean;
        term?: TermEnum;
        semesterNo?: number;
        startedAt?: string;
        endedAt?: string;
        enrollmentDeadline?: string;
    }
): Promise<{ message: string; updatedSemester?: ActivatedSemester }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${batchSemesterId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to update semester");
        if (data.errors) error.fieldErrors = data.errors;
        throw error;
    }

    return data;
}

export async function completeBatchSemester(
    batchSemesterId: string
): Promise<{ message: string; updatedSemester?: ActivatedSemester }> {
    const res = await fetch(
        `${LOCAL_BASE_URL}/${batchSemesterId}`,
        {
            method: "PATCH",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to complete semester");
        throw error;
    }

    return data;
}

export async function deleteBatchSemester(batchSemesterId: string): Promise<{ message: string }> {
    const res = await fetch(
        `${LOCAL_BASE_URL}/${batchSemesterId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to delete batch semester");
        throw error;
    }

    return data;
}

export const getCatalogueCoursesForActivatedSemester = async (
    activatedSemesterId: string
): Promise<Course[]> => {
    const res = await fetch(
        `${LOCAL_BASE_URL}/${activatedSemesterId}/courses`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch catalogue courses");
    }

    return data.courses;
};