import { User } from "../../../../server/src/shared/interfaces";
import { API_BASE_URL } from "../../constants";
import { BulkRegisterError, BulkRegisterResult, FetchUsersFilters, PublicUser } from "../../constants/core/interfaces";
import { BulkUser, PaginatedUserResponse } from "../../constants/core/interfaces";

const LOCAL_BASE_URL = `${API_BASE_URL}/api/v1/admin`;

export const bulkRegisterUsers = async (
    users: BulkUser[]
): Promise<{ results: BulkRegisterResult[]; errors?: Record<string, string[]> }> => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/bulk-register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ users }),
        });

        const data = await res.json();

        if (!res.ok) {
            const errorResponse: BulkRegisterError = {
                message: data.message || "Bulk registration failed",
                errors: data.errors,
            };
            throw errorResponse;
        }

        return data;
    } catch (err: any) {
        // console.error("Bulk registration error:", error);
        throw {
            message: err.message || "Unexpected error during bulk registration",
            errors: err.errors || undefined,
        };
    }
};

export const deleteUserById = async (userId: string): Promise<{ message: string }> => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include', // Include credentials for cookies or sessions
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error deleting user');
        }

        return res.json(); // Expected to return { message: "User deleted successfully" }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const resetUserPasswordByAdmin = async (userId: string, newPassword: string) => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/users/${userId}/password-reset`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: newPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
            if (data?.errors?.password?.length) {
                const passwordErrors = data.errors.password.join(", ");
                throw new Error(passwordErrors);
            }

            throw new Error(data.message || 'Error resetting password');
        }

        return data;
    } catch (error) {
        console.error('Admin password reset error:', error);
        throw error;
    }
};

export const updateUserById = async (
    userId: string,
    userData: Partial<User>
): Promise<User> => {
    const res = await fetch(`${LOCAL_BASE_URL}/users/${userId}/update/`, {
        method: 'PUT',
        credentials: 'include',  // assuming session or cookie auth
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (!res.ok) {
        const error = new Error(data.message || 'Failed to update user');
        (error as any).response = res;
        (error as any).body = data;
        throw error;
    }

    return data;
};

export const fetchPaginatedUsers = async (
    page = 1,
    limit = 20,
    search = "",
    filters: FetchUsersFilters = {}
): Promise<PaginatedUserResponse> => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (search.trim()) {
        queryParams.append("search", search.trim());
    }

    // Append filters if provided and not empty
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== "") {
            queryParams.append(key, value.toString().trim());
        }
    });

    const res = await fetch(
        `${LOCAL_BASE_URL}/users?${queryParams.toString()}`,
        {
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to fetch users");
    }

    return res.json();
};

export const fetchUserProfileById = async (userId: string): Promise<PublicUser> => {
    try {
        const res = await fetch(`${LOCAL_BASE_URL}/users/${userId}`, {
            method: 'GET',
            credentials: 'include', // Include credentials for authentication if needed
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Error fetching user');
        }

        const user: PublicUser = {
            id: data.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            fatherName: data.fatherName,
            city: data.city,
            country: data.country,
            address: data.address,
            department: data.department,
            isEmailVerified: data.isEmailVerified,
            role: data.role,
            createdAt: data.createdAt,
            lastOnline: data.lastOnline,
            avatarURL: data.avatarURL,
        };

        return user;
    } catch (error) {
        throw error; // Re-throw the error after logging it
    }
};