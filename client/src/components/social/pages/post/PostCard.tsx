import React from "react";
import { ForumWithDetails, Post, PostMetrics } from "../../../../constants/social/interfaces";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { PostTypeEnum } from "../../../../../../server/src/shared/social.enums";
import { truncateName } from "../../../../utils/truncate-name";
import { FiArchive, FiEdit3, FiRotateCw } from "react-icons/fi";
import { FaArrowDown, FaArrowUp, FaThumbtack } from "react-icons/fa";
import LazyMedia from "../../ui/LazyMedia";
import { useQuery } from "@tanstack/react-query";
import { getPostMetrics } from "../../../../api/social/post/post-user-api";
import { usePostActions } from "../../../../hooks/social/usePostsHooks";
import UserHeader from "./UserHeader";
import { PostMetricHeader } from "./PostMetricHeader";

interface PostCardProps {
    forum: ForumWithDetails;
    post: Post;
    onUpvote: (postId: string) => void;
    onDownvote: (postId: string) => void;
    onEditPost?: (post: Post) => void;
    mode?: "preview" | "full";
}

const PostCard: React.FC<PostCardProps> = ({
    forum,
    post,
    onUpvote,
    onDownvote,
    onEditPost,
    mode = "preview"
}) => {
    const authorId = post.author?.id;
    const author = post.author ?? null;

    const { isOwner, canManage, isLoggedIn } = usePermissions({ authorId });

    const navigate = useNavigate();

    const { archive, restore, togglePin } = usePostActions(forum.id);

    const handleArchive = () => archive.mutate(post.id);
    const handleRestore = () => restore.mutate(post.id);
    const handlePinToggle = () => togglePin.mutate({ postId: post.id, pin: !post.isPinned });

    const handleUpvote = () => {
        isLoggedIn ? onUpvote(post.id) : navigate("/login");
    };

    const handleDownvote = () => {
        isLoggedIn ? onDownvote(post.id) : navigate("/login");
    };

    const { data: metrics } = useQuery<PostMetrics, Error>({
        queryKey: ["postMetrics", post.id],
        queryFn: () => getPostMetrics(post.id),
        staleTime: 1000 * 60, // 1 minute
        refetchOnWindowFocus: false,
    });

    // Access the metrics
    const upvoteCount = metrics?.upvoteCount ?? post.upvoteCount;
    const downvoteCount = metrics?.downvoteCount ?? post.downvoteCount;
    const voteScore = upvoteCount - downvoteCount;

    const upvoteDominates = upvoteCount > downvoteCount;
    const downvoteDominates = downvoteCount > upvoteCount;

    const scoreColor = upvoteDominates
        ? "text-blue-600"
        : downvoteDominates
            ? "text-red-600"
            : "text-muted-foreground";

    const upArrowColor = upvoteDominates ? "text-blue-600" : "text-gray-400";
    const downArrowColor = downvoteDominates ? "text-red-600" : "text-gray-400";

    const handlePostRedirect = () => {
        if (mode === "preview") {
            navigate(`/forums/${forum?.slug}/${post?.slug}`);
        }
    };

    const mediaUrls = post.mediaUrls ?? [];

    return (
        <div className="flex rounded-sm border border-gray-300 bg-card p-4 gap-6">
            {/* Vote Column */}
            <div className="flex flex-col items-center pt-2 min-w-md">
                <button
                    onClick={handleUpvote}
                    title="Upvote this post"
                    className={`transition hover:text-primary ${upArrowColor}`}
                >
                    <FaArrowUp size={16} />
                </button>
                <div className={`py-2 text-sm font-medium transition ${scoreColor}`}>
                    {voteScore}
                </div>
                <button
                    onClick={handleDownvote}
                    title="Downvote this post"
                    className={`transition hover:text-destructive ${downArrowColor}`}
                >
                    <FaArrowDown size={16} />
                </button>
            </div>

            {/* Post Content */}
            <div className="flex flex-col w-full space-y-4">
                {author && <UserHeader author={author} post={post} />}

                <div
                    onClick={mode === "preview" ? handlePostRedirect : undefined}
                    className={mode === "preview" ? "hover:cursor-pointer space-y-4" : "space-y-4"}
                >
                    {/* Media Post */}
                    {mediaUrls.length > 0 && (
                        <div
                            className={
                                mediaUrls.length === 1
                                    ? "flex justify-center"
                                    : "grid grid-cols-1 sm:grid-cols-2 gap-4"
                            }
                        >
                            {mediaUrls.map((url, i) => (
                                <LazyMedia key={i} src={url} alt={`media-${i}`} isSingle={mediaUrls.length === 1} />
                            ))}
                        </div>
                    )}

                    {/* Link Post */}
                    {post.type === PostTypeEnum.LINK && post.linkPreview && (
                        <a
                            href={post.linkPreview.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg p-4 bg-muted hover:bg-muted/70 transition"
                        >
                            <div className="flex gap-4">
                                {post.linkPreview.image && (
                                    <img
                                        src={post.linkPreview.image}
                                        alt="link-preview"
                                        className="w-20 h-20 object-cover rounded-md"
                                    />
                                )}
                                <div className="flex flex-col space-y-1">
                                    <div className="text-sm font-medium text-foreground">{post.linkPreview.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-2">
                                        {post.linkPreview.description}
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1">{post.linkPreview.url}</div>
                                </div>
                            </div>
                        </a>
                    )}

                    {/* Text Post (fallback) */}
                    {post.content?.trim() ? (
                        <div className="text-base text-gray-600 whitespace-pre-line">
                            {mode === "preview"
                                ? truncateName(post.content, 250)
                                : post.content}
                        </div>
                    ) : !post.mediaUrls?.length && !post.linkPreview ? (
                        <div className="text-muted-foreground text-gray-600 italic text-sm">[No content]</div>
                    ) : null}

                </div>

                <div className="flex items-center justify-between">
                    <PostMetricHeader postId={post.id} isLoggedIn={isLoggedIn} />

                    {canManage && (
                        <div className="flex items-center gap-3">
                            {post.isArchived ? (
                                <button
                                    onClick={handleRestore}
                                    title="Restore Post"
                                    className="p-2 rounded hover:bg-green-100 text-green-600 transition-colors"
                                >
                                    <FiRotateCw size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleArchive}
                                    title="Archive Post"
                                    className="p-2 rounded hover:bg-red-100 text-red-500 transition-colors"
                                >
                                    <FiArchive size={16} />
                                </button>
                            )}
                            <button
                                onClick={handlePinToggle}
                                title={post.isPinned ? "Unpin Post" : "Pin Post"}
                                className={`p-2 rounded transition-colors ${post.isPinned
                                    ? "text-yellow-600 hover:bg-yellow-100"
                                    : "text-blue-500 hover:bg-blue-100"
                                    }`}
                            >
                                <FaThumbtack size={16} className={post.isPinned ? "rotate-45" : ""} />
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => onEditPost?.(post)}
                                    title="Edit Post"
                                    className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                                >
                                    <FiEdit3 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;
