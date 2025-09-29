import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserWithRelations } from "../../../../../server/src/shared/interfaces";
import { validateToken } from "../services/token-api";
import { useToast } from "../../../shared/context/ToastContext";
import { login, loginWith2FA, loginWithGoogle, logout } from "../services/auth-api";
import { useState } from "react";

export function useAuth() {
    const queryClient = useQueryClient();
    const toast = useToast();
    const [is2FARequired, setIs2FARequired] = useState(false);

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

    const TwoFALogin = useMutation({
        mutationFn: loginWith2FA,
        onSuccess: async (res) => {
            if (res.twoFARequired) {
                setIs2FARequired(true);
                toast.neutral("Two-Factor Authentication required. Please enter your 2FA code.");
                return; // stop here, don’t show success toast yet
            }

            toast.success("Login Successful!");
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

    const isLoggingIn = emailLogin.isPending || googleLogin.isPending || TwoFALogin.isPending;

    return {
        user,
        isLoggedIn: !!user,
        hasCheckedAuth: isFetched,
        isLoading,
        isError,
        emailLogin,
        TwoFALogin,
        is2FARequired,
        googleLogin,
        isLoggingIn,
        handleLogout,
    };
}