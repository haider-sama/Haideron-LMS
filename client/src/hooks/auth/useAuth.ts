import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserWithRelations } from "../../../../server/src/shared/interfaces";
import { validateToken } from "../../api/auth/token-api";
import { useToast } from "../../context/ToastContext";
import { login, loginWithGoogle, logout } from "../../api/auth/auth-api";

export function useAuth() {
    const queryClient = useQueryClient();
    const toast = useToast();

    const {
        data: user,
        isLoading,
        isError,
        isFetched,
    } = useQuery<UserWithRelations | null>({
        queryKey: ["validateToken"],
        queryFn: validateToken,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });

    // Email/password login
    const emailLogin = useMutation({
        mutationFn: login,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
        },
        onError: (err: any) => {
            const errors = err?.response?.data?.errors;
            if (Array.isArray(errors)) {
                errors.forEach((e: any) => toast.error(e.message));
            } else {
                toast.error(err?.response?.data?.message || "Login failed");
            }
        },
    });

    // Google login
    const googleLogin = useMutation({
        mutationFn: loginWithGoogle,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Google login failed");
        },
    });

    // Logout
    const handleLogout = async () => {
        try {
            await logout();
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
        } catch {
            toast.error("Error while logging out");
        }
    };

    return {
        user,
        isLoggedIn: !!user,
        hasCheckedAuth: isFetched,
        isLoading,
        isError,
        emailLogin,
        googleLogin,
        handleLogout,
    };
}