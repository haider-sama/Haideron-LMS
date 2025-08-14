import { StrengthEnum } from "../../../../server/src/shared/enums";
import { PLO, Program } from "../../../../server/src/shared/interfaces";
import { API_BASE_URL } from "../../constants";
import { AddPLOPayload, AddPLOsResponse, GetProgramResponse, GetProgramsListResponse, GetProgramsParams, PEOUpdatePayload, PEOWithMappings, RegisterProgramPayload } from "../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/program`;

export async function registerProgram(payload: RegisterProgramPayload): Promise<{ message: string }> {
    const res = await fetch(`${LOCAL_BASE_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
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

export async function getPrograms(
    params: GetProgramsParams = {}
): Promise<GetProgramsListResponse> {
    const { page = 1, limit = 20, ...filters } = params;
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...Object.fromEntries(
            Object.entries(filters)
                .filter(([_, value]) => value !== undefined && value !== "")
                .map(([key, value]) => [key, String(value)])
        ),
    });

    const url = `${LOCAL_BASE_URL}/?${queryParams.toString()}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch programs");
        }

        return (await response.json()) as GetProgramsListResponse;
    } catch (err: any) {
        console.error("getPrograms error:", err.message);
        throw err;
    }
}

export async function getProgramById(programId: string): Promise<GetProgramResponse> {
    if (!programId) throw new Error("Program ID is required");

    const url = `${LOCAL_BASE_URL}/${programId}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            credentials: "include", // send cookies if needed
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch program");
        }

        return await response.json();
    } catch (err: any) {
        console.error("getProgramById error:", err.message);
        throw err;
    }
};

export async function updateProgramById(
    programId: string,
    payload: RegisterProgramPayload
): Promise<Program> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${programId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            const error: any = new Error(data.message || "Failed to update program");
            if (data.errors) {
                error.fieldErrors = data.errors; // zod validation errors
            }
            throw error;
        }

        return data.program;
    } catch (err: any) {
        console.error("updateProgramById error:", err.message);
        throw err;
    }
};

export async function deleteProgramById(programId: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${programId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete program");
        }

        return data;
    } catch (err: any) {
        console.error("Delete program error:", err.message);
        throw err;
    }
};

export async function addPLOsToProgram(
    programId: string,
    plos: AddPLOPayload[]
): Promise<AddPLOsResponse> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${programId}/plos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ plos }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || "Failed to add PLOs");
            (error as any).zodErrors = data.errors || null; // zod validation errors
            throw error;
        }

        return data as AddPLOsResponse;
    } catch (error: any) {
        console.error("addPLOsToProgram error:", error.message);
        throw error;
    }
}

export async function getPLOsForProgram(
    programId: string
): Promise<{ message: string, plos: PLO[] }> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${programId}/plos`, {
            method: "GET",
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch PLOs");
        }

        return data;
    } catch (error: any) {
        console.error("getPLOsForProgram error:", error.message);
        throw error;
    }
};

export async function updatePLO(
    programId: string,
    ploId: string,
    payload: AddPLOPayload
): Promise<{ message: string; plo: PLO }> {
    try {
        if (!ploId) throw new Error("PLO ID is missing");

        const response = await fetch(
            `${LOCAL_BASE_URL}/${programId}/plos/${ploId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || "Failed to update PLO");
            (error as any).zodErrors = data.errors || null;
            throw error;
        }

        return data;
    } catch (error: any) {
        console.error("updatePLOInProgram error:", error.message);
        throw error;
    }
}

export async function deletePLO(
    programId: string,
    ploId: string
): Promise<{ message: string }> {
    try {
        if (!programId || !ploId) throw new Error("Program ID and PLO ID are required");

        const res = await fetch(`${LOCAL_BASE_URL}/${programId}/plos/${ploId}`, {
            method: "DELETE",
            credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to delete PLO");
        }

        return data;
    } catch (error: any) {
        console.error("deletePLOFromProgram error:", error.message);
        throw error;
    }
}

export async function addPEOsToProgram(
    programId: string,
    peos: {
        title: string;
        description: string;
        ploMapping: { plo: string; strength: StrengthEnum }[];
    }[]
): Promise<{ message: string }> {
    try {
        if (!programId || !Array.isArray(peos) || peos.length === 0) {
            throw new Error("Program ID and at least one PEO are required");
        }

        const res = await fetch(`${LOCAL_BASE_URL}/${programId}/peos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ peos }),
        });

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Failed to add PEOs");
            (error as any).zodErrors = data.errors || null; // backend sends Zod field errors
            throw error;
        }

        return data;
    } catch (error: any) {
        console.error("addPEOsToProgram error:", error.message);
        throw error;
    }
}

export async function getPEOsForProgram(
    programId: string
): Promise<{ message: string; peos: PEOWithMappings[] }> {
    try {
        const response = await fetch(`${LOCAL_BASE_URL}/${programId}/peos`, {
            method: "GET",
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch PEOs");
        }

        return {
            message: data.message,
            peos: data.peos,
        };
    } catch (error: any) {
        console.error("getPEOsByProgramId error:", error.message);
        throw error;
    }
}

export async function updatePEOInProgram(
    programId: string,
    peoId: string,
    updatedPEO: PEOUpdatePayload
): Promise<{ message: string }> {
    try {
        const response = await fetch(
            `${LOCAL_BASE_URL}/${programId}/peos/${peoId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(updatedPEO),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(result.message || "Failed to update PEO");
            (error as any).zodErrors = result.errors || null;
            throw error;
        }

        return { message: result.message };
    } catch (error: any) {
        console.error("updatePEOInProgram error:", error.message);
        throw error;
    }
}

export const deletePEO = async (programId: string, peoId: string) => {
    const res = await fetch(`${LOCAL_BASE_URL}/${programId}/peos/${peoId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete PEO");
    }

    return res.json();
};