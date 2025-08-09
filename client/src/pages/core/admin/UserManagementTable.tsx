import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiEye, FiRefreshCw, FiTrash2, FiXCircle } from "react-icons/fi";
import { deleteUserById, fetchPaginatedUsers, fetchUserProfileById, resetUserPasswordByAdmin, updateUserById } from "../../../api/admin/admin-api"; // <-- replace old fetchAllUsers
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../constants";
import PaginationControl from "../../../components/ui/PaginationControl";
import { truncateName } from "../../../utils/truncate-name";
import { User } from "../../../../../server/src/shared/interfaces";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import Modal from "../../../components/ui/Modal";
import UserProfile from "../account/UserProfile";
import { useToast } from "../../../context/ToastContext";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery } from "@tanstack/react-query";

const UserManagementTable: React.FC = () => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [page, setPage] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // userId being deleted
    const [isResetting, setIsResetting] = useState<string | null>(null);
    const toast = useToast();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['users', page, debouncedSearch],
        queryFn: () => fetchPaginatedUsers(page, MAX_PAGE_LIMIT, debouncedSearch),
        placeholderData: (prev) => prev, // replaces keepPreviousData: true
        staleTime: 1000 * 60 * 5,
    });

    const handleViewUser = (userId: string) => {
        setSelectedUserId(userId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedUserId(null);
        setIsModalOpen(false);
    };

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const deleteUserMutation = useMutation({
        mutationFn: (userId: string) => deleteUserById(userId),
        onSuccess: () => {
            toast.success("User deleted successfully");
            refetch(); // still fine to call refetch here
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete user");
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
            resetUserPasswordByAdmin(userId, newPassword),
        onSuccess: () => {
            toast.success("Password reset successfully");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to reset password");
        },
    });

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Admin Panel - User Management</title>
            </Helmet>
            <div className="mb-4">
                <Breadcrumbs items={generateBreadcrumbs('/admin/user-management')} />

                <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <PageHeading title="User Management" />
                    <input
                        type="text"
                        placeholder="Search by name, email, city..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                        dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                    />
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-darkTextSecondary">
                        <tr>
                            <th className="px-4 py-2">Avatar</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">City</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Department</th>
                            <th className="px-4 py-2">Email Verified</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={8} className="text-center px-4 py-6">
                                    <TopCenterLoader />
                                </td>
                            </tr>
                        ) : data?.data && data.data.length > 0 ? (
                            data.data.map((user) => (
                                <tr
                                    key={user.id.toString()}
                                    className="border-b hover:bg-gray-50 dark:border-darkBorderLight dark:hover:bg-darkMuted transition"
                                >
                                    <td className="px-4 py-2">
                                        {user.avatarURL ? (
                                            <img
                                                src={user.avatarURL}
                                                alt="avatar"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkMuted text-gray-700 dark:text-darkTextSecondary text-sm font-semibold">
                                                {(user.firstName?.[0] || "").toUpperCase()}
                                                {(user.lastName?.[0] || "").toUpperCase()}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800 dark:text-darkTextPrimary">
                                        {user.firstName} {user.lastName}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">
                                        {truncateName(user.email)}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                        {truncateName(user.department ?? "")}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                        {user.role}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                        {truncateName(user.department ?? "")}
                                    </td>
                                    <td className="px-4 py-2">
                                        {user.isEmailVerified ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full font-medium text-xs dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/30">
                                                <FiCheckCircle size={12} />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full font-medium text-xs dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/30">
                                                <FiXCircle size={12} />
                                                Not Verified
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-2 text-center space-x-1">
                                        <button
                                            onClick={() => handleViewUser(user.id.toString())}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                            title="View user details"
                                        >
                                            <FiEye className="w-4 h-4 text-blue-500" />
                                        </button>

                                        <button
                                            onClick={async () => {
                                                const newPassword = prompt("Enter new password for the user:");
                                                if (!newPassword) return;
                                                setIsResetting(user.id);
                                                resetPasswordMutation.mutate(
                                                    { userId: user.id, newPassword },
                                                    { onSettled: () => setIsResetting(null) }
                                                );
                                            }}
                                            disabled={isResetting === user.id}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                            title="Reset password"
                                        >
                                            <FiRefreshCw className="w-4 h-4 text-yellow-500" />
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (
                                                    window.confirm("Are you sure you want to delete this user?") &&
                                                    window.confirm("This action cannot be undone. Are you absolutely sure?")
                                                ) {
                                                    setIsDeleting(user.id);
                                                    deleteUserMutation.mutate(user.id, {
                                                        onSettled: () => setIsDeleting(null),
                                                    });
                                                }
                                            }}
                                            disabled={isDeleting === user.id}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                            title="Delete user"
                                        >
                                            <FiTrash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted"
                                >
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                {selectedUserId && (
                    <UserProfile
                        userId={selectedUserId}
                        fetchUser={fetchUserProfileById}
                        updateUser={updateUserById as (id: string, data: Partial<User>) => Promise<any>}
                    />
                )}
            </Modal>

            {/* Pagination Controls */}
            <PaginationControl page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </div>
    );
};

export default UserManagementTable;
