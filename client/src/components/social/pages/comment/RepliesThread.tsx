import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createComment, deleteComment, getRepliesForComment, updateComment } from "../../../../api/social/comment/comment-api";
import { CreateCommentPayload, GetCommentsResponse, ToggleLikeCommentResponse } from "../../../../constants/social/interfaces";
import { SelectInput } from "../../../ui/Input";
import CommentCard from "./CommentCard";
import { StatusMessage } from "../../../ui/StatusMessage";
import Modal from "../../../ui/Modal";
import { likeComment, unlikeComment } from "../../../../api/social/comment/comment-user-api";

interface RepliesThreadProps {
    postId: string;
    parentId: string;
    parentContent: string;
    isExpanded?: boolean;
}

export const RepliesThread: React.FC<RepliesThreadProps> = ({
    postId,
    parentId,
    parentContent,
    isExpanded = true,
}) => {
    const [replyContent, setReplyContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "top" | "best">("newest");
    const queryClient = useQueryClient();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useInfiniteQuery<
        GetCommentsResponse,
        Error,
        InfiniteData<GetCommentsResponse>,
        [string, string],
        string | null
    >({
        queryKey: ["replies", parentId],
        queryFn: async ({ pageParam }: { pageParam?: string | null }) =>
            getRepliesForComment(postId, parentId, {
                sort: sortBy,
                limit: 5,
                offsetKey: pageParam ?? null,
            }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.meta.nextOffsetKey ?? null,
        enabled: isExpanded,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2,
    });


    const createReplyMutation = useMutation<
        { message: string },
        Error,
        CreateCommentPayload
    >({
        mutationFn: (payload) => createComment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["replies", parentId] });
            setReplyContent("");
            setIsReplying(false);
        },
    });

    const toggleLikeReplyMutation = useMutation<
        ToggleLikeCommentResponse,
        Error,
        { id: string; likedByMe: boolean },
        { previousData: InfiniteData<GetCommentsResponse> | undefined }
    >({
        mutationFn: async ({ id, likedByMe }) => {
            return likedByMe ? unlikeComment(id) : likeComment(id);
        },

        onMutate: async ({ id, likedByMe }) => {
            await queryClient.cancelQueries({ queryKey: ["replies", parentId] });

            const previousData = queryClient.getQueryData<InfiniteData<GetCommentsResponse>>([
                "replies",
                parentId,
            ]);

            queryClient.setQueryData(["replies", parentId], (oldData: any) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        comments: page.comments.map((comment: any) => {
                            if (comment.id === id) {
                                const liked = !likedByMe;
                                const likeCount = liked
                                    ? comment.likeCount + 1
                                    : Math.max(comment.likeCount - 1, 0);

                                return { ...comment, likedByMe: liked, likeCount };
                            }
                            return comment;
                        }),
                    })),
                };
            });

            return { previousData };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["replies", parentId], context.previousData);
            }
        },

        onSuccess: ({ liked, likeCount }, { id }) => {
            queryClient.setQueryData(["replies", parentId], (oldData: any) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        comments: page.comments.map((comment: any) =>
                            comment.id === id ? { ...comment, likedByMe: liked, likeCount } : comment
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
            queryClient.invalidateQueries({ queryKey: ["replies", parentId] });
            setEditingCommentId(null);
            setEditingContent("");
        },
    });

    const deleteCommentMutation = useMutation<{ message: string }, Error, string>({
        mutationFn: (commentId) => deleteComment(commentId),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["replies", parentId] });
        },

        onError: (error) => {
            alert(error.message || "Failed to delete comment");
        },
    });


    const handleReplySubmit = () => {
        if (!replyContent.trim()) return;
        createReplyMutation.mutate({
            postId,
            parentId,
            content: replyContent,
        });
    };

    const sortOptions = [
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "top", label: "Top Liked" },
        { value: "best", label: "Best" },
    ];

    const hasNoReplies =
        status === "success" &&
        data?.pages.every((page) => page.comments.length === 0);

    return (
        <div className="space-y-2">

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

            {data?.pages.flatMap((page) =>
                page.comments.map((reply) => (
                    <CommentCard
                        key={reply.id}
                        content={reply.content}
                        createdAt={reply.createdAt}
                        author={reply.author}
                        likeCount={reply.likeCount}
                        onEdit={() => {
                            setEditingCommentId(reply.id);
                            setEditingContent(reply.content);
                        }}
                        onLike={() =>
                            toggleLikeReplyMutation.mutate({ id: reply.id, likedByMe: reply.likedByMe })
                        }
                        onDelete={() => {
                            if (confirm("Are you sure you want to delete this comment?")) {
                                deleteCommentMutation.mutate(reply.id);
                            }
                        }}
                        repliedToContent={parentContent}
                        likedByMe={reply.likedByMe}
                    />
                ))
            )}

            <StatusMessage status={status as "error"} error={error} />
            {hasNoReplies && (
                <StatusMessage status="success">
                    No replies yet. Be the first one to reply!
                </StatusMessage>
            )}

            {hasNextPage && (
                <button
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                    className="text-sm text-blue-600 hover:underline"
                >
                    {isFetchingNextPage ? "Loading more..." : "Load more replies"}
                </button>
            )}

            {isReplying && (
                <div className="mt-2">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        rows={3}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                    />
                    <div className="mt-1 flex gap-2">
                        <button
                            onClick={handleReplySubmit}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            Post Reply
                        </button>
                        <button
                            onClick={() => setIsReplying(false)}
                            className="px-3 py-1 text-gray-500 text-sm hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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
        </div>
    );
};
