import { API_BASE_URL } from "../../../shared/constants";
import { EnrollStudentPayload, PaginatedUserResponse, StudentEnrollment } from "../../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/batch/enrollments`;

export async function createStudentBatchEnrollment(
    payload: EnrollStudentPayload
): Promise<{ message: string; results?: { studentId: string; status: string; reason?: string }[] }> {
    const res = await fetch(`${LOCAL_BASE_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to create course student batch enrollment");
        if (data.errors) error.errors = data.errors;
        throw error;
    }

    return data;
}

export async function listStudentsInBatch(
    programBatchId: string
): Promise<StudentEnrollment[]> {
    const res = await fetch(
        `${LOCAL_BASE_URL}/${programBatchId}/students`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch students");
    }

    // Ensure each record has a valid student
    const valid: StudentEnrollment[] = (data.students || []).filter(
        (record: any) => record?.student && record.student.id
    );

    return valid;
}

export async function listStudentsInAllBatches(): Promise<StudentEnrollment[]> {
    const res = await fetch(
        `${LOCAL_BASE_URL}/enrolled-students`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    const data = await res.json();
    console.log(data)
    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch enrolled students");
    }

    // Filter out invalid records and ensure type safety
    const valid: StudentEnrollment[] = (data.students || []).filter(
        (record: any) => record?.student && record.student.id
    );

    return valid;
}

export async function removeStudentFromBatch(
    payload: { studentId: string; programBatchId: string }
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to remove student from batch");
    }

    return data;
}

export async function softRemoveStudentFromBatch(
    payload: { studentId: string; programBatchId: string }
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/remove`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to soft-remove student from batch");
    }

    return data;
}

export async function reinstateStudentInBatch(
    payload: { studentId: string; programBatchId: string }
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/reinstate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to reinstate student in batch");
    }

    return data;
}

export async function fetchPaginatedStudentsByDepartment(
    department: string,
    page = 1,
    limit = 20,
    search = "",
    hideEnrolled = false
): Promise<PaginatedUserResponse> {
    const queryParams = new URLSearchParams({
        department,
        page: page.toString(),
        limit: limit.toString(),
    });

    if (search.trim()) {
        queryParams.append("search", search.trim());
    }

    if (hideEnrolled) {
        queryParams.append("hideEnrolled", "true");
    }

    const res = await fetch(
        `${LOCAL_BASE_URL}/students?${queryParams.toString()}`,
        { credentials: "include" }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.data?.length === 0 ? "Failed to fetch students" : "Failed to fetch students");
    }

    return data;
}