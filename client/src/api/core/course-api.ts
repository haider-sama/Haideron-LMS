import { Course } from "../../../../server/src/shared/interfaces";
import { API_BASE_URL } from "../../shared/constants";
import { CourseFilters, CreateCoursePayload, GetCoursesResponse, UpdateCoursePayload, UpdateCourseResponse } from "../../shared/constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/course`;

export async function createCourse(
    payload: CreateCoursePayload
): Promise<{
    message: string;
}> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            const error: any = new Error(data.message || "Failed to create course");
            if (data.errors) {
                error.fieldErrors = data.errors; // zod validation errors
            }
            throw error;
        }

        return data;
    } catch (err) {
        console.error("addCourseToSemester error:", err);
        throw err;
    }
};

export async function getCourses(
    filters: CourseFilters
): Promise<GetCoursesResponse> {
    try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });

        const res = await fetch(`${LOCAL_BASE_URL}/?${params.toString()}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to fetch courses");
        }

        const data = await res.json();
        
        return data;
    } catch (err) {
        console.error("getCoursesInSemester error:", err);
        throw err;
    }
};

export async function getCourseById(courseId: string): Promise<Course> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${courseId}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to fetch course");
        }

        const data = await res.json();

        return data.course;
    } catch (err) {
        console.error("getCourseById error:", err);
        throw err;
    }
};

export async function updateCourseById(
    courseId: string,
    updates: UpdateCoursePayload
): Promise<UpdateCourseResponse> {
    try {
        // console.log("UPDATE PAYLOAD SENT TO BACKEND:", JSON.stringify(updates, null, 2));
        const res = await fetch(`${LOCAL_BASE_URL}/${courseId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(updates),
        });

        const data = await res.json();

        if (!res.ok) {
            const error: any = new Error(data.message || "Failed to update program");
            if (data.errors) {
                error.fieldErrors = data.errors; // zod validation errors
            }
            throw error;
        }

        return data;
    } catch (err) {
        console.error("updateCourse error:", err);
        throw err;
    }
};

export async function deleteCourseById(courseId: string): Promise<{ message: string }> {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/${courseId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to delete course");
        }

        return await res.json();
    } catch (err) {
        console.error("deleteCourse error:", err);
        throw err;
    }
};