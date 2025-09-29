import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSessionById, fetchSessions, logoutAllDevices } from "../services/auth-api";

export function useSessions(enabled: boolean = true) {
    return useQuery({
        queryKey: ["userSessions"],
        queryFn: fetchSessions,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useDeleteSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSessionById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userSessions"] });
        },
    });
}

export function useLogoutAllDevices() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logoutAllDevices,
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: ["userSessions"] });
        },
    });
}
