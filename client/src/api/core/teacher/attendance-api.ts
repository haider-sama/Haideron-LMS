import { API_BASE_URL } from "../../../shared/constants";
import { AttendanceSession, GetAttendanceRecordsResponse, GetAttendanceSessionsResponse, MarkAttendanceRecordInput, MarkAttendanceResponse } from "../../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/attendance`;

export async function createAttendanceSession(
    courseOfferingId: string,
    date: string
): Promise<{ message: string }> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${courseOfferingId}`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ date }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            const error = new Error(data.message || "Failed to create assessment");
            (error as any).zodErrors = data.errors || null;
            throw error;
        }

        return data;
    } catch (err: any) {
        return { message: err.message || "Network error or server unreachable." };
    }
}

export async function getAttendanceSessions(courseOfferingId: string): Promise<AttendanceSession[]> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${courseOfferingId}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const data: GetAttendanceSessionsResponse = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to fetch attendance sessions");
        }

        return data.sessions || [];
    } catch (err: any) {
        console.error("Error fetching attendance sessions:", err);
        throw new Error(err.message || "Network error or server unreachable.");
    }
}

export async function markAttendanceRecords(
    sessionId: string,
    records: MarkAttendanceRecordInput[]
): Promise<MarkAttendanceResponse> {
    try {
        const res = await fetch(
            `${LOCAL_BASE_URL}/${sessionId}/records`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ records }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            if (data?.errors) {
                return {
                    message: data.message || "Validation failed",
                    updatedCount: 0,
                };
            }
            throw new Error(data.message || "Failed to mark attendance");
        }

        return {
            message: data.message || "Attendance records updated successfully",
            updatedCount: data.updatedCount || 0,
        };
    } catch (error: any) {
        console.error("Error marking attendance:", error);
        throw new Error(error.message || "Network error or server unreachable.");
    }
}

export async function getAttendanceRecords(sessionId: string): Promise<GetAttendanceRecordsResponse> {
    try {
        const response = await fetch(
            `${LOCAL_BASE_URL}/${sessionId}/records`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch attendance records");
        }

        return {
            message: data.message || "Attendance records fetched successfully",
            records: data.records || [],
        };
    } catch (error: any) {
        console.error("Error fetching attendance records:", error);
        throw new Error(error.message || "Network error or server unreachable.");
    }
}