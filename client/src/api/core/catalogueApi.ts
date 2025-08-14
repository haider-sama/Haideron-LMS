import { ProgramCatalogue } from "../../../../server/src/shared/interfaces";
import { API_BASE_URL } from "../../constants";
import { GetCataloguesListResponse } from "../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/catalogue`;

export async function createProgramCatalogue(
    programId: string,
    catalogueYear: number
): Promise<any> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                programId: programId,
                catalogueYear,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || "Failed to create catalogue");
            (error as any).zodErrors = data.errors || null;
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Catalogue creation failed:", error);
        throw error;
    }
};

export async function getCataloguesByProgram({
    programId,
    year,
    search,
    page = 1,
    limit = 20,
}: {
    programId: string;
    year?: number;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<GetCataloguesListResponse> {
    try {
        const query = new URLSearchParams({
            programId,
            page: page.toString(),
            limit: limit.toString(),
        });

        if (year) query.append("year", year.toString());
        if (search && search.trim() !== "") query.append("search", search.trim());

        const response = await fetch(`${LOCAL_BASE_URL}/?${query.toString()}`, {
            method: "GET",
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch catalogues");
        }

        return data;
    } catch (error) {
        console.error("Failed to fetch catalogues:", error);
        throw error;
    }
};

export async function getCatalogueById(catalogueId: string): Promise<ProgramCatalogue> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${catalogueId}`, {
            method: "GET",
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch catalogue");
        }

        return data.catalogue;
    } catch (error) {
        console.error("Error fetching catalogue:", error);
        throw error;
    }
};

export async function updateCatalogueById(
    catalogueId: string,
    updates: Partial<Pick<ProgramCatalogue, "programId" | "catalogueYear">>
): Promise<{ message: string; catalogue: ProgramCatalogue }> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${catalogueId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || "Failed to create catalogue");
            (error as any).zodErrors = data.errors || null;
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Catalogue update failed:", error);
        throw error;
    }
};

export async function deleteCatalogueById(catalogueId: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${catalogueId}`, {
            method: "DELETE",
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete catalogue");
        }

        return data;
    } catch (error) {
        console.error("Catalogue deletion failed:", error);
        throw error;
    }
};