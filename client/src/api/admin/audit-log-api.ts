import { API_BASE_URL } from "../../constants";
import { FetchAuditLogsFilters, PaginatedAuditLogResponse } from "../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/audit-logs`;

export const fetchPaginatedAuditLogs = async (
    page = 1,
    limit = 20,
    search = "",
    filters: FetchAuditLogsFilters = {}
): Promise<PaginatedAuditLogResponse> => {
    const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });

    if (search.trim()) queryParams.append("search", search.trim());

    Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== "") queryParams.append(key, value.toString().trim());
    });

    const res = await fetch(`${LOCAL_BASE_URL}/?${queryParams.toString()}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to fetch audit logs");
    }

    return res.json();
};