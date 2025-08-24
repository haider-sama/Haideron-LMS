import React, { useState } from "react";
import ForumCard from "./ForumCard";
import { EditForum } from "./EditForum";
import { ChangeForumStatus } from "./ChangeForumStatus";
import ForumModeratorsModal from "./ForumModeratorsModal";
import { ForumListResponse, ForumWithDetails, Post } from "../../../../constants/social/interfaces";
import { usePermissions } from "../../../../hooks/usePermissions";
import Modal from "../../../ui/Modal";
import { useToast } from "../../../../context/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveForum, restoreForum } from "../../../../api/social/forum/forum-api";

interface ForumContainerProps {
    data?: ForumListResponse;
    isLoading: boolean;
    isError: boolean;
    forumPostCounts: Record<
        string,
        {
            isLoading: boolean;
            isError: boolean;
            count: number;
            latestPost: Post | null;
        }
    >;
}

const ForumContainer: React.FC<ForumContainerProps> = ({
    data,
    isLoading,
    isError,
    forumPostCounts,
}) => {
    const { user, isAdmin, isCommunityAdmin, isForumModerator, isForumCurator } = usePermissions();
    const toast = useToast();
    const queryClient = useQueryClient();

    const [editingForum, setEditingForum] = useState<ForumWithDetails | null>(null);
    const [statusChangingForum, setStatusChangingForum] = useState<ForumWithDetails | null>(null);
    const [moderatorModalForum, setModeratorModalForum] = useState<ForumWithDetails | null>(null);

    const handleEdit = (forum: ForumWithDetails) => setEditingForum(forum);
    const handleChangeStatus = (forum: ForumWithDetails) => setStatusChangingForum(forum);
    const handleOpenModeratorsModal = (forum: ForumWithDetails) =>
        setModeratorModalForum(forum);

    // --- Archive Forum Mutation ---
    const archiveMutation = useMutation({
        mutationFn: archiveForum, // async (forumId: string) => ...
        onSuccess: () => {
            toast.success("Forum archived successfully");
            queryClient.invalidateQueries({ queryKey: ["forums"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to archive forum");
        },
    });

    const handleArchive = (forumId: string) => {
        if (confirm("Are you sure you want to archive this forum?")) {
            archiveMutation.mutate(forumId);
        }
    };

    const restoreMutation = useMutation({
        mutationFn: restoreForum, // async (forumId: string) => ...
        onSuccess: () => {
            toast.success("Forum restored successfully");
            queryClient.invalidateQueries({ queryKey: ["forums"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to restore forum");
        },
    });

    const handleRestore = (forumId: string) => {
        if (confirm("Are you sure you want to restore this forum?")) {
            restoreMutation.mutate(forumId);
        }
    };

    return (
        <div className="max-w-6xl mx-auto mt-6 rounded-md border border-gray-300 bg-white shadow-sm overflow-x-auto">
            <table className="min-w-full table-auto">
                <thead className="bg-gray-100 text-gray-600 text-xs font-medium border-b border-gray-300">
                    <tr>
                        <th className="text-left px-4 py-2 w-2/5">TOPICS</th>
                        <th className="text-center px-4 py-2 w-1/12">POSTS</th>
                        <th className="text-left px-4 py-2 w-1/4">LATEST POST</th>
                        {(isAdmin || isCommunityAdmin || isForumModerator || isForumCurator) && (
                            <>
                                <th className="text-center px-4 py-2 w-1/6">STATUS</th>
                                <th className="text-right px-4 py-2 w-1/12">ACTIONS</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {isLoading && (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">
                                Loading forums...
                            </td>
                        </tr>
                    )}
                    {isError && (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-red-500">
                                Failed to load forums.
                            </td>
                        </tr>
                    )}
                    {!isLoading && !isError && data?.forums?.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">
                                No forums available yet.
                            </td>
                        </tr>
                    )}
                    {!isLoading &&
                        !isError &&
                        data?.forums?.map((forum) => {
                            const isCreator = forum.creator.id === user?.id;
                            const canPerformActions = isAdmin || isCommunityAdmin || isCreator;
                            const postCountInfo = forumPostCounts[forum.id] || { isLoading: true, isError: false, count: 0 };

                            return <ForumCard
                                key={forum.id}
                                forum={forum}
                                canPerformActions={canPerformActions}
                                isAdmin={isAdmin}
                                isArchiving={archiveMutation.isPending}
                                onArchive={handleArchive}
                                isRestoring={restoreMutation.isPending}
                                onRestore={handleRestore}
                                onEdit={handleEdit}
                                onChangeStatus={handleChangeStatus}
                                onOpenModerators={() => handleOpenModeratorsModal(forum)}
                                postCount={postCountInfo.count}
                                isPostCountLoading={postCountInfo.isLoading}
                                isPostCountError={postCountInfo.isError}
                                latestPost={postCountInfo.latestPost}
                            />;
                        })}
                </tbody>
            </table>

            {editingForum && (
                <Modal isOpen={true} onClose={() => setEditingForum(null)}>
                    <EditForum forum={editingForum} onClose={() => setEditingForum(null)} />
                </Modal>
            )}

            {statusChangingForum && (
                <Modal isOpen={true} onClose={() => setStatusChangingForum(null)}>
                    <ChangeForumStatus
                        forum={statusChangingForum}
                        onClose={() => setStatusChangingForum(null)}
                    />
                </Modal>
            )}

            {moderatorModalForum && (
                <Modal isOpen={true} onClose={() => setModeratorModalForum(null)}>
                    <ForumModeratorsModal
                        forum={moderatorModalForum}
                        onClose={() => setModeratorModalForum(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ForumContainer;
