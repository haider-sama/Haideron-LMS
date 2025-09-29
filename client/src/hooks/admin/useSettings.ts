import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/context/ToastContext';
import { AdminSettings } from '../../shared/constants/admin/interfaces';
import { fetchAdminSettingsFrontend, fetchPublicSettingsFrontend, updateAdminSettings } from '../../api/admin/admin-api';

export const useSettings = (isAdminMode = false) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    // Local state for editing (only relevant in admin mode)
    const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);

    // ---------- Fetch Public Settings ----------
    const publicQuery = useQuery({
        queryKey: ['settings', 'public'],
        queryFn: async () => {
            try {
                return await fetchPublicSettingsFrontend();
            } catch (err: any) {
                toast.error(err.message || 'Failed to load public settings');
                throw err;
            }
        },
        staleTime: 60_000,
    });

    // ---------- Admin Settings ----------
    const adminQuery = useQuery({
        queryKey: ['settings', 'admin'],
        queryFn: async () => {
            const data = await fetchAdminSettingsFrontend();
            return data;
        },
        enabled: isAdminMode,
        staleTime: 60_000,
    });

    // Watch for changes and update local state
    useEffect(() => {
        if (adminQuery.data) {
            setAdminSettings(adminQuery.data);
        }
        if (adminQuery.error) {
            toast.error((adminQuery.error as any)?.message || 'Failed to load admin settings');
        }
    }, [adminQuery.data, adminQuery.error]);

    // ---------- Mutation for updating admin settings ----------
    const mutation = useMutation({
        mutationFn: (updated: Partial<AdminSettings>) => updateAdminSettings(updated),
        onSuccess: (updated) => {
            toast.success('Settings updated successfully!');
            setAdminSettings(updated);
            queryClient.invalidateQueries({ queryKey: ['settings', 'admin'] });
        },
        onError: (err: any) => toast.error(err.message || 'Failed to update settings'),
    });

    // ---------- Custom debounce ----------
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);
    const debouncedSave = (updated: Partial<AdminSettings>, delay = 700) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            mutation.mutate(updated);
        }, delay);
    };

    // ---------- Handler to update local state + trigger debounced save ----------
    const handleAdminChange = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
        setAdminSettings(prev => {
            if (!prev) return prev;
            const newState = { ...prev, [key]: value };
            debouncedSave(newState); // trigger debounced save
            return newState;
        });
    };

    const saveAdminSettings = () => {
        if (!adminSettings) return;
        mutation.mutate(adminSettings);
    };

    // ---------- Derived values ----------
    const publicSettings = publicQuery.data;
    const isLoading = publicQuery.isLoading || (isAdminMode && adminQuery.isLoading);
    const isUpdating = mutation.isPending;

    return {
        publicSettings,
        adminSettings,
        handleAdminChange,
        saveAdminSettings,
        isLoading,
        isUpdating,
        refetchPublic: publicQuery.refetch,
        refetchAdmin: adminQuery.refetch,
    };
};
