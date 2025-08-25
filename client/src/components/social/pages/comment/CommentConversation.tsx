import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useToast } from "../../../../context/ToastContext";
import { createComment, deleteComment, getCommentsForPost, toggleBestComment, updateComment } from "../../../../api/social/comment/comment-api";
import { CreateCommentPayload, GetCommentsResponse, ToggleLikeCommentResponse } from "../../../../constants/social/interfaces";
import PageHeading from "../../../ui/PageHeading";
import { likeComment, unlikeComment } from "../../../../api/social/comment/comment-user-api";
import { SelectInput } from "../../../ui/Input";
import { CommentBox } from "./CommentBox";
import { StatusMessage } from "../../../ui/StatusMessage";
import CommentCard from "./CommentCard";
import Modal from "../../../ui/Modal";
import { RepliesThread } from "./RepliesThread";

interface CommentConversationProps {
    postId: string;
}

const CommentConversation: React.FC<CommentConversationProps> = ({ postId }) => {
    const queryClient = useQueryClient();
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "top" | "best">("newest");
    const toast = useToast();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useInfiniteQuery<
        GetCommentsResponse,          // TData
        Error,                        // TError
        InfiniteData<GetCommentsResponse>, // TQueryFnData
        [string, string, string],     // TQueryKey — update tuple length here
        string | null                 // TPageParam
    >({
        queryKey: ["comments", postId, sortBy],
        queryFn: async ({ pageParam }: { pageParam?: string | null }) =>
            getCommentsForPost(postId, {
                sort: sortBy,
                limit: 10,
                offsetKey: pageParam ?? null,
            }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.meta.nextOffsetKey ?? null,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2,
    });

    const createCommentMutation = useMutation<
        { message: string },
        Error,
        CreateCommentPayload
    >({
        mutationFn: (payload) => createComment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", postId, sortBy] });
        },
    });

    const handleCreateComment = (html: string) => {
        if (!html.trim()) return;
        createCommentMutation.mutate({ postId, content: html });
    };

    const handleReplySubmit = (parentId: string) => {
        if (!replyContent.trim()) return;
        createCommentMutation.mutate({
            postId,
            content: replyContent,
            parentId, // reply to parent
        });
        setReplyingToId(null);
        setReplyContent("");
    };

    const toggleLikeMutation = useMutation<
        ToggleLikeCommentResponse,
        Error,
        { id: string; likedByMe: boolean }
    >({
        mutationFn: async ({ id, likedByMe }) => {
            return likedByMe ? unlikeComment(id) : likeComment(id);
        },
        onSuccess: ({ liked, likeCount }, { id }) => {
            queryClient.setQueryData(["comments", postId, sortBy], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        comments: page.comments.map((comment: any) =>
                            comment.id === id
                                ? { ...comment, likedByMe: liked, likeCount }
                                : comment
                        ),
                    })),
                };
            });
        },
    });

    const updateCommentMutation = useMutation<
        { message: string },
        Error,
        { commentId: string; content: string }
    >({
        mutationFn: ({ commentId, content }) =>
            updateComment(commentId, { content }),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", postId, sortBy] });
            setEditingCommentId(null);
            setEditingContent("");
        },
    });

    const deleteCommentMutation = useMutation<
        { message: string },
        Error,
        string
    >({
        mutationFn: (commentId) => deleteComment(commentId),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", postId, sortBy] });
        },

        onError: (error) => {
            alert(error.message || "Failed to delete comment");
        },
    });

    const useToggleBestComment = (postId: string) => {
        const queryClient = useQueryClient();

        return useMutation<
            { message: string },
            Error,
            string
        >({
            mutationFn: (commentId) => toggleBestComment(commentId),

            onSuccess: (data) => {
                toast.success(data?.message || "Updated best comment status.");
                queryClient.invalidateQueries({ queryKey: ["comments", postId, sortBy] });
            },

            onError: (error) => {
                toast.error(error.message || "Failed to toggle best comment");
            },
        });
    };

    const toggleBestCommentMutation = useToggleBestComment(postId);

    const sortOptions = [
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "top", label: "Top Liked" },
        { value: "best", label: "Best" },
    ];

    const hasNoComments = status === "success" &&
        data?.pages.every((page) => page.comments.length === 0);

    return (
        <div className="my-8 space-y-4">
            <PageHeading title="Comments" subtitle="Join the conversation — share your thoughts below" />

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
                <SelectInput
                    className="text-xs"
                    label="Sort By"
                    value={sortBy}
                    onChange={(e) => {
                        const val = e.target.value as typeof sortBy;
                        setSortBy(val);
                    }}
                    options={sortOptions}
                />
            </div>

            <CommentBox
                onSubmit={(html) => {
                    // optional: strip empty tags or validate here
                    handleCreateComment(html);
                }}
            />

            <StatusMessage status={status as "error"} error={error} />
            {hasNoComments && (
                <StatusMessage status="success">
                    No comments yet. Be the first to join the discussion!
                </StatusMessage>
            )}

            {data?.pages.map((page, pageIndex) => (
                <div key={pageIndex} className="space-y-4">
                    {page.comments.map((comment: any) => (
                        <div key={comment.id} className="space-y-2">
                            {/* Parent Comment */}
                            <CommentCard
                                content={comment.content}
                                createdAt={comment.createdAt}
                                author={comment.author}
                                likeCount={comment.likeCount}
                                onEdit={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingContent(comment.content);
                                }}
                                onLike={() => toggleLikeMutation.mutate({ id: comment.id, likedByMe: comment.likedByMe })}
                                onDelete={() => {
                                    if (confirm("Are you sure you want to delete this comment?")) {
                                        deleteCommentMutation.mutate(comment.id);
                                    }
                                }}
                                onReply={() => setReplyingToId(comment.id)}
                                likedByMe={comment.likedByMe}
                                onToggleBest={() => toggleBestCommentMutation.mutate(comment.id)}
                                isBest={comment.isBest}
                            />

                            {/* Inline reply input */}
                            {replyingToId === comment.id && (
                                <div className="ml-36 mt-2">
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                        rows={3}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write your reply..."
                                    />
                                    <div className="mt-1 flex gap-2">
                                        <button
                                            onClick={() => handleReplySubmit(comment.id)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-white hover:text-blue-600 border border-gray-200"
                                        >
                                            Post Reply
                                        </button>
                                        <button
                                            onClick={() => setReplyingToId(null)}
                                            className="px-3 py-1 text-gray-500 text-sm hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Nested replies (if any) */}
                            <div className="ml-32 mt-2">
                                {comment.childrenCount > 0 && (
                                    <button
                                        className="text-sm text-blue-500 hover:underline mb-2"
                                        onClick={() =>
                                            setExpandedReplies(prev => ({
                                                ...prev,
                                                [comment.id]: !prev[comment.id],
                                            }))
                                        }
                                    >
                                        {expandedReplies[comment.id] ? "Hide replies" : `View ${comment.childrenCount} ${comment.childrenCount > 1 ? "replies" : "reply"}`}
                                    </button>
                                )}

                                {expandedReplies[comment.id] && (
                                    <RepliesThread
                                        postId={postId}
                                        parentId={comment.id}
                                        parentContent={comment.content}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {
                hasNextPage && (
                    <div className="text-center">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            {isFetchingNextPage ? "Loading more..." : "Load more"}
                        </button>
                    </div>
                )
            }

            {editingCommentId && (
                <Modal
                    isOpen={!!editingCommentId}
                    onClose={() => setEditingCommentId(null)}
                >
                    <div className="space-y-4">
                        {/* Modal title */}
                        <h2 className="text-lg font-semibold text-gray-800">Edit Comment</h2>

                        {/* Textarea */}
                        <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows={4}
                        />

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    updateCommentMutation.mutate({
                                        commentId: editingCommentId,
                                        content: editingContent,
                                    });
                                    setEditingCommentId(null); // Optional: close after save
                                }}
                                className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

        </div >
    );
};

export default CommentConversation;
