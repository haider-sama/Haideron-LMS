import { API_BASE_URL } from "../../constants";
import { AddSemesterPayload, GetSemestersResponse, UpdateSemesterPayload, UpdateSemesterResponse } from "../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/semester`;

export async function addSemesterToCatalogue({
    programCatalogueId,
    semesterNo,
    courses = [],
}: AddSemesterPayload): Promise<{ message: string }> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ programCatalogueId, semesterNo, courses }),
        });

        const data = await res.json();

        if (!res.ok) {
            const error: any = new Error(data.message || "Failed to add semester");
            if (data.errors) {
                error.fieldErrors = data.errors; // zod validation errors
            }
            throw error;
        }

        return data;
    } catch (err) {
        console.error("createSemester error:", err);
        throw err;
    }
};

export async function getSemestersByCatalogue(
    catalogueId: string
): Promise<GetSemestersResponse> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/?catalogueId=${catalogueId}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to fetch semesters");
        }

        return await res.json();
    } catch (err) {
        console.error("getSemestersByCatalogue error:", err);
        throw err;
    }
};

export async function updateSemester(
    semesterId: string,
    updates: UpdateSemesterPayload
): Promise<UpdateSemesterResponse> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${semesterId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(updates),
        });

        const data = await res.json();

        if (!res.ok) {
            const error: any = new Error(data.message || "Failed to update semester");
            if (data.errors) {
                error.fieldErrors = data.errors; // zod validation errors
            }
            throw error;
        }

        return data;
    } catch (err) {
        console.error("updateSemester error:", err);
        throw err;
    }
};

export async function deleteSemester(
    semesterId: string
): Promise<{ message: string }> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${semesterId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to delete semester");
        }

        return await res.json();
    } catch (err) {
        console.error("deleteSemester error:", err);
        throw err;
    }
};
