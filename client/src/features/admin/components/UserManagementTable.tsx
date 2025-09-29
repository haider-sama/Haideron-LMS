import React from "react";
import { FiCheckCircle, FiEdit, FiRefreshCw, FiTrash2, FiXCircle } from "react-icons/fi";
import { fetchUserProfileById, updateUserById } from "../../../api/admin/admin-api";
import { GLOBAL_TITLE } from "../../../shared/constants";
import { truncateName } from "../../../shared/utils/truncate-name";
import { User } from "../../../../../server/src/shared/interfaces";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import Modal from "../../../components/ui/Modal";
import UserProfile from "../../../pages/account/UserProfile";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { Helmet } from "react-helmet-async";
import { useUserManagement } from "../../../hooks/admin/useUserManagement";
import { usePermissions } from "../../auth/hooks/usePermissions";
import { AudienceEnum } from "../../../../../server/src/shared/enums";
import { Pagination } from "../../../components/ui/Pagination";
import { Button } from "../../../components/ui/Button";
import { SelectInput } from "../../../components/ui/Input";
import SearchBar from "../../../components/ui/SearchBar";

const UserManagementTable: React.FC = () => {
    const { user } = usePermissions();
    const { users, totalPages, isLoading, search, setSearch, page, setPage,
        selectedUserId, isModalOpen, handleViewUser, handleCloseModal,
        isDeleting, isResetting, newPassword, setNewPassword, handleOpenModal,
        selectedUser, modalType, deleteUserMutation, resetPasswordMutation,
        roleOptions, departmentOptions, roleFilter, setRoleFilter,
        departmentFilter, setDepartmentFilter,
    } =
        useUserManagement(user?.role as AudienceEnum);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Admin Panel - User Management</title>
            </Helmet>

            <div className="mb-4">
                <Breadcrumbs items={generateBreadcrumbs('/admin/user-management')} />

                <div className="mt-2">
                    {/* Top row: Heading left, Search and Filters right */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex-shrink-0">
                            <PageHeading title="User Management" />
                        </div>

                        {/* Container for Search and Filters */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
                            <SearchBar
                                value={search}
                                onSearch={(query) => setSearch(query)}
                                showAdvanced={false}
                            />

                            <div className="grid grid-cols-2 gap-2 mt-2 md:mt-0 md:flex md:gap-2 md:grid-cols-none md:w-auto">
                                <SelectInput
                                    value={roleFilter || ""}
                                    onChange={(e) => setRoleFilter(e.target.value || null)}
                                    options={roleOptions}
                                    placeholder="Filter by Role"
                                    className="text-xs max-w-full"
                                />

                                <SelectInput
                                    value={departmentFilter || ""}
                                    onChange={(e) => setDepartmentFilter(e.target.value || null)}
                                    options={departmentOptions}
                                    placeholder="Filter by Department"
                                    className="text-xs max-w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>


                <div className="mt-4 overflow-x-auto border rounded-sm border-gray-300 bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-darkTextSecondary">
                            <tr className="border-b border-gray-300 dark:border-darkBorderLight">
                                <th className="px-4 py-2">Avatar</th>
                                <th className="px-4 py-2">First Name</th>
                                <th className="px-4 py-2">Last Name</th>
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
                            ) : users && users.length > 0 ? (
                                users.map((user) => (
                                    <tr
                                        key={user.id.toString()}
                                        className="border-b last:border-b-0 hover:bg-gray-50 dark:border-darkBorderLight dark:hover:bg-darkMuted transition"
                                    >
                                        <td className="px-4 py-2">
                                            {user.avatarURL ? (
                                                <img
                                                    src={user.avatarURL}
                                                    alt="avatar"
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkMuted text-gray-400 dark:text-darkTextSecondary text-sm font-semibold">
                                                    {(user.firstName?.[0] || "").toUpperCase()}
                                                    {(user.lastName?.[0] || "").toUpperCase()}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {truncateName(user.firstName ?? "N/A")}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {truncateName(user.lastName ?? "N/A")}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">
                                            {truncateName(user.email)}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                            {truncateName(user.city ?? "N/A")}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                            {truncateName(user.role ?? AudienceEnum.Guest)}
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
                                                <FiEdit className="w-4 h-4 text-blue-500" />
                                            </button>

                                            <button
                                                onClick={() => handleOpenModal("reset", user.id)}
                                                disabled={isResetting === user.id}
                                                className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                                title="Reset password"
                                            >
                                                <FiRefreshCw className="w-4 h-4 text-yellow-500" />
                                            </button>

                                            <button
                                                onClick={() => handleOpenModal("delete", user.id)}
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

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        handleCloseModal();
                        setNewPassword(""); // clear on close
                    }}
                >
                    {(modalType === "reset" || modalType === "delete") && selectedUser && (
                        <div className="flex flex-col items-center justify-center p-6 min-h-[200px]">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                {modalType === "reset" ? (
                                    <>
                                        <FiRefreshCw className="text-yellow-500" />
                                        Reset Password
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 className="text-red-500" />
                                        Delete User
                                    </>
                                )}
                            </h2>

                            {modalType === "reset" && (
                                <>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full max-w-sm p-2 border rounded mb-6 dark:border-darkBorderLight dark:bg-darkMuted"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <div className="flex justify-center gap-4 w-full max-w-sm">
                                        <Button variant="light" size="md" fullWidth={false}
                                            onClick={() => {
                                                handleCloseModal();
                                                setNewPassword("");
                                            }}
                                            disabled={isResetting === selectedUser.id}
                                        >
                                            Cancel
                                        </Button>
                                        <Button variant="yellow" size="md" fullWidth={false}
                                            onClick={() => {
                                                if (!newPassword) return;
                                                resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
                                            }}
                                            disabled={isResetting === selectedUser.id}
                                            loadingText="Resetting..." isLoading={isResetting === selectedUser.id}
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                </>
                            )}

                            {modalType === "delete" && (
                                <>
                                    <p className="mb-6 max-w-sm text-center text-sm text-gray-600 dark:text-darkTextSecondary">
                                        Are you sure you want to delete{" "}
                                        <strong>
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </strong>
                                        ? This action cannot be undone.
                                    </p>
                                    <div className="flex justify-center gap-4 w-full max-w-sm">
                                        <Button variant="light" size="md" fullWidth={false}
                                            onClick={() => handleCloseModal()}
                                            disabled={isDeleting === selectedUser.id}
                                        >
                                            Cancel
                                        </Button>
                                        <Button variant="red" size="md" fullWidth={false}
                                            onClick={() => deleteUserMutation.mutate(selectedUser.id)}
                                            disabled={isDeleting === selectedUser.id}
                                            loadingText="Deleting..." isLoading={isDeleting === selectedUser.id}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {modalType === null && selectedUserId && (
                        <UserProfile
                            userId={selectedUserId}
                            fetchUser={fetchUserProfileById}
                            updateUser={updateUserById as (id: string, data: Partial<User>) => Promise<any>}
                        />
                    )}
                </Modal>

                {/* Pagination Controls */}
                <div className="flex justify-end">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
        </div>
    );
};

export default UserManagementTable;
