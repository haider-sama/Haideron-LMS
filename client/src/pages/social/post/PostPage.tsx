import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ForumWithDetails, Post, PostMetrics, PostVoteResponse } from "../../../constants/social/interfaces";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import PostCard from "../../../components/social/pages/post/PostCard";
import { EditPost } from "../../../components/social/pages/post/EditPost";
import Modal from "../../../components/ui/Modal";
import { getPostBySlug } from "../../../api/social/post/post-api";
import { downvoteOnPost, upvoteOnPost } from "../../../api/social/post/post-user-api";
import { useToast } from "../../../context/ToastContext";
import CommentConversation from "../../../components/social/pages/comment/CommentConversation";
import { useSettings } from "../../../hooks/admin/useSettings";
import FeatureDisabledPage from "../../forbidden/FeatureDisabledPage";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";

const PostPage: React.FC = () => {
    const { forumSlug, postSlug } = useParams<{ forumSlug: string; postSlug: string }>();
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const queryClient = useQueryClient();
    const toast = useToast();
    const { isLoggedIn } = usePermissions();

    const { publicSettings, isLoading: isSettingsLoading } = useSettings(); // user-mode public settings
    const isPostsEnabled = publicSettings?.allowPosts ?? false;

    const {
        data,
        status,
        error,
    } = useQuery<{ post: Post }, Error>({
        queryKey: ["post", postSlug],
        queryFn: () => getPostBySlug(postSlug!),
        enabled: !!postSlug || isPostsEnabled,
    });

    const post = data?.post;

    const upvoteMutation = useMutation<PostVoteResponse, Error, string>({
        mutationFn: (postId) => upvoteOnPost(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ["postMetrics", postId] });

            queryClient.setQueryData<PostMetrics>(["postMetrics", postId], (oldMetrics) => {
                if (!oldMetrics) return oldMetrics;

                let upvoteCount = oldMetrics.upvoteCount;
                let downvoteCount = oldMetrics.downvoteCount;

                // Handle switching votes
                if (oldMetrics.userVote === "DOWNVOTE") {
                    downvoteCount = Math.max(downvoteCount - 1, 0);
                }
                if (oldMetrics.userVote !== "UPVOTE") {
                    upvoteCount += 1;
                }

                return {
                    ...oldMetrics,
                    upvoteCount,
                    downvoteCount,
                    userVote: "UPVOTE",
                };
            });
        },
        onError: (err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
            toast.error(err.message || "Failed to upvote post");
        },
        onSettled: (_data, _err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forumSlug] });
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
            queryClient.invalidateQueries({ queryKey: ["post", postSlug] });
        },
    });

    const downvoteMutation = useMutation<PostVoteResponse, Error, string>({
        mutationFn: (postId) => downvoteOnPost(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ["postMetrics", postId] });

            queryClient.setQueryData<PostMetrics>(["postMetrics", postId], (oldMetrics) => {
                if (!oldMetrics) return oldMetrics;

                let upvoteCount = oldMetrics.upvoteCount;
                let downvoteCount = oldMetrics.downvoteCount;

                // Handle switching votes
                if (oldMetrics.userVote === "UPVOTE") {
                    upvoteCount = Math.max(upvoteCount - 1, 0);
                }
                if (oldMetrics.userVote !== "DOWNVOTE") {
                    downvoteCount += 1;
                }

                return {
                    ...oldMetrics,
                    upvoteCount,
                    downvoteCount,
                    userVote: "DOWNVOTE",
                };
            });
        },
        onError: (err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
            toast.error(err.message || "Failed to downvote post");
        },
        onSettled: (_data, _err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forumSlug] });
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
            queryClient.invalidateQueries({ queryKey: ["post", postSlug] });
        },
    });

    const handleUpvote = (postId: string) => {
        if (isLoggedIn && !upvoteMutation.isPending) {
            upvoteMutation.mutate(postId);
        }
    };

    const handleDownvote = (postId: string) => {
        if (isLoggedIn && !downvoteMutation.isPending) {
            downvoteMutation.mutate(postId);
        }
    };

    if (isSettingsLoading) {
        return <TopCenterLoader />;
    }

    if (!isPostsEnabled) {
        return <FeatureDisabledPage
            heading="Posts Disabled"
            message="The posts feature has been disabled by the administrators. Please contact them for more information."
            homeUrl="/"
        />;
    }

    return (
        <div className="p-4 space-y-6 max-w-4xl w-full mx-auto my-8">
            <StatusMessage
                status={status as "idle" | "loading" | "error" | "success"}
                error={error}
                loadingText="Loading post..."
                errorText="Failed to load post."
            >
                {!post && "Post not found."}
            </StatusMessage>

            {post && (
                <PostCard
                    forum={{ slug: forumSlug } as ForumWithDetails}
                    post={post}
                    onUpvote={handleUpvote}
                    onDownvote={handleDownvote}
                    onEditPost={setEditingPost}
                    mode="full"
                />
            )}

            {post && <CommentConversation postId={post.id} />}

            {editingPost && (
                <Modal isOpen={!!editingPost} onClose={() => setEditingPost(null)}>
                    <EditPost post={editingPost} onClose={() => setEditingPost(null)} />
                </Modal>
            )}
        </div>
    );
};

export default PostPage;
