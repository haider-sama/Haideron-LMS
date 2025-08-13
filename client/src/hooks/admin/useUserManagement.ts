import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import {
    fetchPaginatedUsers,
    deleteUserById,
    resetUserPasswordByAdmin,
    bulkRegisterUsers,
    updateUserById
} from "../../api/admin/admin-api";
import { useToast } from "../../context/ToastContext";
import { AudienceEnum, DepartmentEnum } from "../../../../server/src/shared/enums";
import { getAvailableRoles, restrictedRoles } from "../../constants";
import { MAX_PAGE_LIMIT } from "../../constants";
import { User } from "../../../../server/src/shared/interfaces";
import { BulkUser } from "../../constants/core/interfaces";
import { useDebounce } from "../../components/ui/SearchBar";

const INITIAL_USER: BulkUser = {
    email: "",
    password: "",
    role: AudienceEnum.Guest,
    department: DepartmentEnum.NA,
    firstName: "",
    lastName: "",
    fatherName: "",
    city: "",
    country: "",
    address: "",
};

export function useUserManagement(currentUserRole: AudienceEnum) {
    const toast = useToast();
    const queryClient = useQueryClient();

    /** ====== TABLE STATE ====== */
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [page, setPage] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"reset" | "delete" | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);

    /** ====== FORM STATE ====== */
    const [viewMode, setViewMode] = useState<"form" | "table">("table");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [usersFormData, setUsersFormData] = useState<BulkUser[]>([INITIAL_USER]);
    const formRefs = useRef<(HTMLDivElement | null)[]>([]);

    /** ====== EDIT USER FORM ====== */
    const [editFields, setEditFields] = useState<Partial<User>>(INITIAL_USER);

    /** ====== DATA FETCHING ====== */
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["users", page, debouncedSearch, roleFilter, departmentFilter],
        queryFn: () =>
            fetchPaginatedUsers(page, MAX_PAGE_LIMIT, debouncedSearch, {
                role: roleFilter as AudienceEnum || undefined,
                department: departmentFilter as DepartmentEnum || undefined,
            }),
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5,
    });

    const selectedUser = selectedUserId
        ? data?.data?.find((u) => u.id === selectedUserId) || null
        : null;

    /** ====== MUTATIONS ====== */
    const deleteUserMutation = useMutation({
        mutationFn: deleteUserById,
        onSuccess: () => {
            toast.success("User deleted successfully");
            refetch();
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete user"),
    });

    const resetPasswordMutation = useMutation<
        void,
        Error,
        { userId: string; newPassword: string }
    >({
        mutationFn: ({ userId, newPassword }) =>
            resetUserPasswordByAdmin(userId, newPassword),
        onSuccess: () => toast.success("Password reset successfully"),
        onError: (err) => toast.error(err.message || "Failed to reset password"),
    });

    const bulkRegisterMutation = useMutation({
        mutationFn: bulkRegisterUsers,
        onSuccess: ({ results }) => {
            const failed = results.filter((r) => !r.success);
            const success = results.filter((r) => r.success);

            failed.forEach((f) => toast.error(`${f.email}: ${f.message}`));
            if (success.length > 0) {
                toast.success(`${success.length} user(s) registered successfully`);
                setUsersFormData([INITIAL_USER]);
            }
        },
        onError: (err: any) =>
            toast.error(err.message || "Unexpected error occurred"),
        onSettled: () => setIsSubmitting(false),
    });

    const updateUserMutation = useMutation({
        mutationFn: (updatedData: Partial<User>) =>
            updateUserById(selectedUserId!, updatedData),
        onSuccess: () => {
            toast.success("User updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsModalOpen(false);
        },
        onError: async (error: any) => {
            try {
                const res = error.body ?? (await error.response?.json?.());
                if (res?.errors) {
                    Object.values(res.errors).flat().forEach((msg: any) => toast.error(msg));
                } else {
                    toast.error(res?.message || "Failed to update profile.");
                }
            } catch {
                toast.error(error.message || "Failed to update profile.");
            }
        },
    });

    /** ====== EFFECTS ====== */

    /** ====== ACTIONS ====== */
    const handleViewUser = (userId: string) => {
        setSelectedUserId(userId);
        const found = data?.data?.find((u) => u.id === userId);
        if (found) {
            setEditFields({
                firstName: found.firstName || "",
                lastName: found.lastName || "",
                fatherName: found.fatherName || "",
                email: found.email || "",
                department: found.department || DepartmentEnum.NA,
                role: found.role || AudienceEnum.Guest,
                address: found.address || "",
                city: found.city || "",
                country: found.country || "",
            });
        }
        setModalType(null); // profile mode
        setIsModalOpen(true);
    };

    const handleOpenModal = (type: "reset" | "delete", userId: string) => {
        setSelectedUserId(userId);
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedUserId(null);
        setModalType(null);
        setIsModalOpen(false);
    };

    const handleEditChange = (name: keyof User, value: any) => {
        setEditFields((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = () => {
        if (selectedUserId) updateUserMutation.mutate(editFields);
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isSubmitting) return;
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedUsers = results.data.map((row: any) => {
                    let role = Object.values(AudienceEnum).includes(row.role)
                        ? row.role
                        : AudienceEnum.Guest;
                    if (
                        currentUserRole !== AudienceEnum.Admin &&
                        restrictedRoles.includes(role)
                    ) {
                        role = AudienceEnum.Guest;
                    }
                    let department = Object.values(DepartmentEnum).includes(row.department)
                        ? row.department
                        : DepartmentEnum.NA;

                    return {
                        ...INITIAL_USER,
                        ...row,
                        email: (row.email || "").trim(),
                        role,
                        department,
                    };
                });

                setUsersFormData((prev) => [...prev, ...parsedUsers]);
            },
            error: (error) =>
                toast.error("Error parsing CSV: " + error.message),
        });

        e.target.value = "";
    };

    const handleChangeForm = <K extends keyof typeof INITIAL_USER>(
        index: number,
        field: K,
        value: typeof INITIAL_USER[K]
    ) => {
        if (isSubmitting) return;
        const updated = [...usersFormData];
        updated[index] = { ...updated[index], [field]: value };
        setUsersFormData(updated);
    };

    const validateUser = (user: BulkUser) => {
        const requiredFields: (keyof BulkUser)[] = [
            "email", "password", "firstName", "lastName",
            "fatherName", "city", "country", "address",
        ];
        return requiredFields.every((field) => Boolean(user[field]));
    };

    const handleAddUser = () => {
        if (!isSubmitting) setUsersFormData([...usersFormData, { ...INITIAL_USER }]);
    };

    const handleRemoveUser = (index: number) => {
        if (!isSubmitting)
            setUsersFormData(usersFormData.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        for (let i = 0; i < usersFormData.length; i++) {
            const user = usersFormData[i];
            const requiredFields: (keyof typeof INITIAL_USER)[] = [
                "email",
                "password",
                "role",
                "department",
                "firstName",
                "lastName",
                "fatherName",
                "city",
                "country",
                "address",
            ];
            const missing = requiredFields.filter((field) => !user[field]);
            if (missing.length > 0) {
                toast.error(`Please fill all fields for user ${i + 1}`);
                formRefs.current[i]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                return;
            }
        }
        setIsSubmitting(true);
        bulkRegisterMutation.mutate(usersFormData);
    };

    const roleOptions = [
        { label: "All", value: "" },  // "no filter"
        ...Object.values(AudienceEnum).map(role => ({
            label: role,
            value: role,
        })),
    ];

    const departmentOptions = [
        { label: "All", value: "" },  // "no filter"
        ...Object.values(DepartmentEnum).map(dept => ({
            label: dept,
            value: dept,
        })),
    ];

    return {
        /** Table data */
        users: data?.data || [],
        total: data?.totalUsers || 0,
        totalPages: data?.totalPages || 0,
        isLoading,
        search,
        setSearch,
        debouncedSearch,
        page,
        setPage,
        selectedUser,
        selectedUserId,
        isModalOpen,
        modalType,
        handleViewUser,
        handleOpenModal,
        handleCloseModal,
        isDeleting,
        setIsDeleting,
        isResetting,
        setIsResetting,
        deleteUserMutation,
        resetPasswordMutation,

        newPassword,
        setNewPassword,

        roleOptions,
        departmentOptions,
        roleFilter,
        setRoleFilter,
        departmentFilter,
        setDepartmentFilter,
        /** Edit selected user */
        editFields,
        handleEditChange,
        handleSaveEdit,
        isSavingEdit: updateUserMutation.isPending,

        /** Form data */
        viewMode,
        setViewMode,
        usersFormData,
        handleChangeForm,
        validateUser,
        handleAddUser,
        handleRemoveUser,
        handleCSVUpload,
        handleSubmit,
        formRefs,
        isSubmitting,

        /** Permissions */
        availableRoles: getAvailableRoles(currentUserRole),
    };
}