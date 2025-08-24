import React from "react";
import ModeratorsList from "./ModeratorsList";
import { FaArchive, FaEdit, FaExchangeAlt, FaUndo } from "react-icons/fa";
import { FiImage, FiUserPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ForumWithDetails, Post } from "../../../../constants/social/interfaces";
import { useStatusBadge } from "../../../../hooks/badges/useStatusBadges";
import { truncateName } from "../../../../utils/truncate-name";

dayjs.extend(relativeTime);

interface ForumCardProps {
    forum: ForumWithDetails;
    canPerformActions: boolean;
    isAdmin: boolean;
    isArchiving: boolean;
    onArchive: (forumId: string) => void;
    isRestoring: boolean;
    onRestore: (forumId: string) => void;
    onEdit: (forum: ForumWithDetails) => void;
    onChangeStatus: (forum: ForumWithDetails) => void;
    onOpenModerators: (forum: ForumWithDetails) => void;
    postCount: number;
    isPostCountLoading: boolean;
    isPostCountError: boolean;
    latestPost?: Post | null;
}

const ForumCard: React.FC<ForumCardProps> = ({
    forum,
    canPerformActions,
    isAdmin,
    isArchiving,
    onArchive,
    isRestoring,
    onRestore,
    onEdit,
    onChangeStatus,
    onOpenModerators,
    postCount,
    isPostCountLoading,
    isPostCountError,
    latestPost
}) => {
    const { label, className } = useStatusBadge(forum.status);

    return (
        <tr className="border-b hover:bg-gray-100 transition">
            {/* Forum Info */}
            <td className="flex items-start gap-4 px-4 py-2">
                {forum.iconUrl ? (
                    <img
                        src={forum.iconUrl}
                        alt={`${forum.title} icon`}
                        className="w-10 h-10 rounded-md object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <FiImage size={16} />
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-gray-800">
                        <Link
                            to={`/forums/${forum.slug}`}
                            state={{ forum }}
                            className="hover:underline hover:text-primary transition"
                        >
                            {forum.title}
                        </Link>
                    </h3>
                    <p className="text-gray-600 text-sm">{truncateName(forum.description ?? '', 50)}</p>
                    <ModeratorsList
                        forumSlug={forum.slug}
                        moderators={forum.moderators?.filter(mod => mod.id !== forum.creator.id) || []}
                        groupLeader={{
                            id: forum.creator.id,
                            firstName: forum.creator.firstName || "User",
                            lastName: forum.creator.lastName || "",
                            email: forum.creator.email || "N/A",
                            avatarURL: forum.creator.avatarURL,
                        }}
                    />
                </div>
            </td>

            {/* Post Count */}
            <td className="text-center px-4 py-3">
                {isPostCountLoading ? (
                    <span className="text-gray-400 text-sm">Loading...</span>
                ) : isPostCountError ? (
                    <span className="text-red-500 text-sm">Error</span>
                ) : (
                    <>
                        <div className="text-sm font-medium">{postCount}</div>
                        <div className="text-xs text-gray-500">Posts</div>
                    </>
                )}
            </td>

            {/* Latest Post (placeholder) */}
            <td className="px-4 py-3 text-sm text-gray-600 max-w-[240px] truncate">
                {latestPost ? (
                    <div className="flex items-start gap-2">
                        {/* Avatar */}
                        {latestPost.author.avatarURL ? (
                            <img
                                src={latestPost.author.avatarURL}
                                alt="Avatar"
                                className="w-6 h-6 rounded object-cover mt-1"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded bg-gray-300 text-xs text-white flex items-center justify-center font-semibold mt-1">
                                {`${latestPost.author.forumProfile?.displayName?.[0] ?? ""}${latestPost.author.forumProfile?.username?.[0] ?? ""}`}
                            </div>
                        )}

                        {/* Author info */}
                        <div className="flex flex-col">
                            <span className="font-medium truncate">
                                by{" "}
                                {latestPost.author.forumProfile?.username ??
                                    latestPost.author.forumProfile?.displayName ??
                                    ""}
                            </span>

                            <span className="text-xs text-gray-600">
                                {dayjs(latestPost.createdAt).format("ddd MMM D, YYYY h:mm a")}
                            </span>

                            <div className="text-gray-700 truncate text-sm">
                                {truncateName(latestPost.content || "", 30)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400">No recent posts</span>
                )}
            </td>

            {/* Status */}
            {isAdmin && (
                <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${className}`}>
                        {label}
                    </span>
                </td>
            )}

            {/* Actions */}
            {canPerformActions && (
                <td className="text-right px-4 py-3">
                    <div className="flex justify-end gap-2 text-gray-600">
                        {/* Admin-specific actions */}
                        {isAdmin && (
                            <>
                                {forum.isArchived ? (
                                    <button
                                        onClick={() => onRestore(forum.id)}
                                        title="Restore"
                                        className={`hover:text-green-600 ${isRestoring ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={isRestoring}
                                    >
                                        <FaUndo />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onArchive(forum.id)}
                                            title="Archive"
                                            className={`hover:text-yellow-500 ${isArchiving ? "opacity-50 cursor-not-allowed" : ""}`}
                                            disabled={isArchiving}
                                        >
                                            <FaArchive />
                                        </button>
                                        <button
                                            onClick={() => onChangeStatus(forum)}
                                            title="Change Status"
                                            className="hover:text-blue-600"
                                        >
                                            <FaExchangeAlt />
                                        </button>
                                        <button
                                            onClick={() => onOpenModerators(forum)}
                                            title="Manage Moderators"
                                            className="hover:text-purple-600"
                                        >
                                            <FiUserPlus />
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* All allowed users can edit */}
                        <button
                            onClick={() => onEdit(forum)}
                            title="Edit"
                            className="hover:text-green-600"
                        >
                            <FaEdit />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );
};

export default ForumCard;
