import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ForumWithDetails } from "../../../../constants/social/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { fetchPaginatedUsers } from "../../../../api/admin/admin-api";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../../constants";
import { assignModeratorToForum, removeModeratorFromForum } from "../../../../api/social/forum/forum-api";
import { Helmet } from "react-helmet-async";
import PageHeading from "../../../ui/PageHeading";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { truncateName } from "../../../../utils/truncate-name";
import { FiUserPlus, FiUserX } from "react-icons/fi";
import { Pagination } from "../../../ui/Pagination";
import { PaginatedUserResponse } from "../../../../constants/core/interfaces";
import { useUserManagement } from "../../../../hooks/admin/useUserManagement";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { usePermissions } from "../../../../hooks/usePermissions";


interface ForumModeratorsModalProps {
    forum: ForumWithDetails;
    onClose: () => void;
}

const ForumModeratorsModal: React.FC<ForumModeratorsModalProps> = ({ forum }) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const { user } = usePermissions();
    const { page, setPage, search, setSearch, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);


    const { data, isPending, refetch } = useQuery<PaginatedUserResponse>({
        queryKey: ["forum-users", forum.id, page, debouncedSearch],
        queryFn: () => fetchPaginatedUsers(page, MAX_PAGE_LIMIT, debouncedSearch),
        staleTime: 1000 * 60 * 5,
    });

    const assignMutation = useMutation({
        mutationFn: (userId: string) => assignModeratorToForum(forum.id, userId),
        onSuccess: () => {
            toast.success("Moderator assigned successfully");
            queryClient.invalidateQueries({ queryKey: ["forums"] });
            refetch(); // refresh users
        },
        onError: (err: any) => toast.error(err.message || "Failed to assign moderator"),
    });

    const removeMutation = useMutation({
        mutationFn: (userId: string) => removeModeratorFromForum(forum.id, userId),
        onSuccess: () => {
            toast.success("Moderator removed successfully");
            queryClient.invalidateQueries({ queryKey: ["forums"] });
            refetch();
        },
        onError: (err: any) => toast.error(err.message || "Failed to remove moderator"),
    });

    const isForumModerator = (userId: string) => {
        return forum.moderators.some((mod) => mod.id === userId);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Assign Moderators</title>
            </Helmet>

            <div className="mb-4">
                <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <PageHeading title="Assign Forum Moderators" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
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
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isPending ? (
                            <tr>
                                <td colSpan={5} className="text-center px-4 py-6">
                                    <TopCenterLoader />
                                </td>
                            </tr>
                        ) : data?.data?.length ? (
                            data.data.map((user) => (
                                <tr
                                    key={user.id}
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
                                    <td className="px-4 py-2 font-medium dark:text-darkTextPrimary">
                                        {user.firstName} {user.lastName}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">
                                        {truncateName(user.email)}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                        {user.role}
                                    </td>
                                    <td className="px-4 py-2 text-center space-x-1">
                                        {!isForumModerator(user.id) ? (
                                            <button
                                                onClick={() => assignMutation.mutate(user.id)}
                                                disabled={assignMutation.isPending}
                                                className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                                title="Assign moderator"
                                            >
                                                <FiUserPlus className="w-4 h-4 text-green-500" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => removeMutation.mutate(user.id)}
                                                disabled={removeMutation.isPending}
                                                className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                                title="Remove moderator"
                                            >
                                                <FiUserX className="w-4 h-4 text-red-500" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <Pagination
                    currentPage={page}
                    totalPages={data?.totalPages ?? 1}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
};

export default ForumModeratorsModal;
