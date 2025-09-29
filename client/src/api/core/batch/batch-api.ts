import { API_BASE_URL } from "../../../shared/constants";
import { PaginatedBatches, ProgramBatch } from "../../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/batch`;

export async function createProgramBatch(
    programId: string,
    programCatalogueId: string,
    sessionYear: number
): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, programCatalogueId, sessionYear }),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to create program");
        if (data.errors) {
            error.fieldErrors = data.errors; // zod validation errors
        }
        throw error;
    }

    return data;
};

export async function getBatchesByProgram(
    programId: string,
    page = 1,
    limit = 20
): Promise<PaginatedBatches> {
    const params = new URLSearchParams({
        programId,
        page: page.toString(),
        limit: limit.toString(),
    });

    const res = await fetch(`${LOCAL_BASE_URL}/?${params}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch program batches");
    }

    return data;
}

export async function getBatchById(batchId: string): Promise<{ batch: ProgramBatch }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${batchId}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch batch");
    return data;
}

export async function updateBatchById(
    batchId: string,
    updates: Partial<Pick<ProgramBatch, "sessionYear" | "isActive">>
): Promise<{ message: string; updatedBatch: ProgramBatch }> {
    const res = await fetch(`${LOCAL_BASE_URL}/${batchId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });

    const data = await res.json();

    if (!res.ok) {
        const error: any = new Error(data.message || "Failed to update batch");
        if (data.errors) error.fieldErrors = data.errors;
        throw error;
    }

    return data; // { message, updatedBatch }
}