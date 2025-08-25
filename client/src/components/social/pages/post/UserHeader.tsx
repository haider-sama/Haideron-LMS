import React from "react";
import { formatDistanceToNow } from "date-fns";
import { FaClock, FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import { usePostBadges } from "../../../../hooks/badges/usePostBadges";
import { useInlineRoleBadge } from "../../../../hooks/badges/useInlineRoleBadge";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { Post, PostAuthor } from "../../../../constants/social/interfaces";

interface UserHeaderProps {
    author: PostAuthor;
    post: Post;
}

const UserHeader: React.FC<UserHeaderProps> = ({ author, post }) => {
    const postBadges = usePostBadges(post);
    const role = author.role as AudienceEnum;
    const { className, style } = useInlineRoleBadge(role);

    const isEdited = !!post.lastEditedAt;

    const createdAtFormatted = formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
    });

    const updatedAtFormatted = isEdited
        ? formatDistanceToNow(new Date(post.lastEditedAt!), { addSuffix: true })
        : null;

    const displayName =
        author.forumProfile?.displayName ||
        author.forumProfile?.username ||
        "Anonymous";

    return (
        <div className="flex items-center justify-between gap-4 px-2 py-4 border-b border-gray-300">
            {/* Left: Author Info */}
            <div className="flex items-center gap-2">
                <Link to={`/forums/profile/${author.forumProfile?.username || author.id}`}>
                    {author.avatarURL ? (
                        <img
                            src={author.avatarURL}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Posted by</span>
                    <span className="font-medium text-primary">{displayName}</span>
                    {role && (
                        <span className={className} style={style}>
                            {role.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                    {postBadges.map((badge) => (
                        <span
                            key={badge.label}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}
                        >
                            {badge.icon}
                            {badge.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Right: Timestamps */}
            <div className="flex flex-col items-end text-xs text-muted-foreground text-right min-w-fit space-y-0.5">
                <div className="flex items-center gap-1">
                    <FaClock className="text-xs text-gray-600" />
                    <span>{createdAtFormatted}</span>
                </div>
                {isEdited && updatedAtFormatted && (
                    <div className="flex items-center gap-1">
                        <FaEdit className="text-xs text-gray-600" />
                        <span>edited {updatedAtFormatted}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserHeader;
