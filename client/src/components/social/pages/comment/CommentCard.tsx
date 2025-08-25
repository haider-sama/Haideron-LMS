import { FC } from "react";
import { FiEdit3, FiFileText, FiMessageSquare, FiThumbsUp, FiTrash2, FiUser } from "react-icons/fi";
import clsx from "clsx";
import { FaStar } from "react-icons/fa";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useRoleBadge } from "../../../../hooks/badges/useRoleBadges";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { Link } from "react-router-dom";
import { truncateName } from "../../../../utils/truncate-name";
import numeral from "numeral";
import { CommentAuthor } from "../../../../constants/social/interfaces";

interface CommentCardProps {
    content: string;
    author?: CommentAuthor;
    createdAt?: string;
    className?: string;
    likeCount?: number;
    onEdit?: () => void;
    onLike?: () => void;
    onDelete?: () => void;
    onReply?: () => void;
    repliedToContent?: string;

    likedByMe?: boolean;
    isBest?: boolean;
    onToggleBest?: () => void;
}

const CommentCard: FC<CommentCardProps> = ({
    content,
    author,
    createdAt,
    className,
    likeCount,
    onEdit,
    onLike,
    onDelete,
    onReply,
    repliedToContent,
    likedByMe,
    isBest,
    onToggleBest,
}) => {
    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        })
        : "";

    const { isOwner, canManage, isLoggedIn } = usePermissions({ authorId: author?.id });
    const { RoleBadge } = useRoleBadge(author?.role as AudienceEnum, "forum", "xs");

    return (
        <div className={clsx("relative flex border border-gray-300 bg-gray-100 overflow-hidden", className)}>
            {/* Left: Author info */}
            <div className="w-32 flex flex-col items-center gap-2 px-2 py-4 bg-gray-100 relative">
                <Link
                    to={`/forums/profile/${author?.username || author?.id}`}
                    className="flex flex-col items-center gap-2"
                >
                    {author?.avatarURL ? (
                        <div className="w-24 h-24 rounded-md overflow-hidden border border-gray-300">
                            <img
                                src={author.avatarURL}
                                alt={author.displayName || "User Avatar"}
                                className="w-full h-full object-cover"
                                width={96}
                                height={96}
                            />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-600 rounded-md border border-gray-300">
                            <FiUser size={28} />
                        </div>
                    )}

                    <div className="text-center text-sm text-blue-600 font-semibold hover:underline">
                        {author?.displayName || "Anonymous"}
                    </div>
                </Link>

                <div>
                    <RoleBadge />
                </div>

                {/* Custom border line (not full height) */}
                <div className="absolute top-4 bottom-4 right-0 w-px bg-gray-300" />
            </div>

            {/* Right: Comment Content */}
            <div className="flex-1 p-4 relative pb-10"> {/* <== Note the extra bottom padding for buttons */}
                {/* Top-right: Edit/Delete */}
                {(isOwner || canManage) && (onEdit || onDelete || onToggleBest) && (
                    <div className="absolute top-2 right-2 flex gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="text-gray-500 hover:text-blue-600 transition"
                                aria-label="Edit Comment"
                                title="Edit Comment"
                            >
                                <FiEdit3 size={16} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="text-gray-500 hover:text-red-600 transition"
                                aria-label="Delete Comment"
                                title="Delete Comment"
                            >
                                <FiTrash2 size={16} />
                            </button>
                        )}
                        {onToggleBest && (
                            <button
                                onClick={onToggleBest}
                                className={`text-gray-500 hover:text-yellow-500 transition ${isBest ? 'text-yellow-600' : ''
                                    }`}
                                aria-label={isBest ? 'Unmark Best Comment' : 'Mark as Best Comment'}
                                title={isBest ? 'Unmark Best Comment' : 'Mark as Best Comment'}
                            >
                                <FaStar size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Metadata */}
                <div className="flex items-center text-xs text-gray-600 mb-2 gap-1">
                    <FiFileText size={14} className="text-gray-500" />
                    <span>
                        Posted by <span className="text-blue-600 font-semibold">
                            {author?.username}
                        </span>
                        {createdAt && <> &raquo; {formattedDate}</>}
                    </span>
                </div>

                {repliedToContent && (
                    <div className="bg-white border border-gray-300 rounded p-2 mb-2 text-sm text-gray-600 whitespace-pre-wrap">
                        {truncateName(repliedToContent, 100)}
                    </div>
                )}

                {/* Content */}
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{content}</div>

                {/* Bottom-left: Reply */}
                {isLoggedIn && onReply && (
                    <button
                        onClick={onReply}
                        className="absolute bottom-2 left-2 text-gray-500 hover:text-blue-600 border border-transparent hover:border-blue-400 bg-transparent hover:bg-blue-50 transition px-2 py-1 rounded flex items-center gap-1"
                        aria-label="Reply to Comment"
                        title="Reply to Comment"
                    >
                        <FiMessageSquare size={16} />
                        <span className="text-xs font-medium">Reply</span>
                    </button>
                )}

                {/* Bottom-right: Like */}
                {onLike && (
                    <button
                        onClick={onLike}
                        className={`absolute bottom-2 right-2 transition flex items-center gap-1 ${likedByMe ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                            }`}
                        aria-label="Like Comment"
                        title={likedByMe ? 'Unlike Comment' : 'Like Comment'}
                    >
                        <FiThumbsUp size={16} />
                        <span className="text-xs">{numeral(likeCount ?? 0).format("0.[0]a")}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CommentCard;
