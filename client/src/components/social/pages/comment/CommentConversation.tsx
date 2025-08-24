// import React, { useState } from "react";
// import { useInfiniteQuery, useMutation, useQueryClient } from "react-query";
// import { createComment, deleteComment, getCommentsForPost, toggleBestComment, toggleLikeOnComment, updateComment } from "../../../../../api/social/commentApi";
// import { CreateCommentPayload } from "../../../../../constants/social/social-types";
// import PageHeading from "../../../../ui/PageHeading";
// import { StatusMessage } from "../../../../ui/social/StatusMessage";
// import CommentCard from "./CommentCard";
// import Modal from "../../../../ui/Modal";
// import { RepliesThread } from "./RepliesThread";
// import { SelectInput } from "../../../../account/Input";
// import { CommentBox } from "./CommentBox";
// import { useToast } from "../../../../../context/ToastContext";

// interface CommentConversationProps {
//     postId: string;
// }

// const CommentConversation: React.FC<CommentConversationProps> = ({ postId }) => {
//     const queryClient = useQueryClient();
//     const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
//     const [editingContent, setEditingContent] = useState("");
//     const [replyingToId, setReplyingToId] = useState<string | null>(null);
//     const [replyContent, setReplyContent] = useState("");
//     const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
//     const [sortBy, setSortBy] = useState<"newest" | "oldest" | "top" | "best">("newest");
//     const toast = useToast();

//     const {
//         data,
//         fetchNextPage,
//         hasNextPage,
//         isFetchingNextPage,
//         status,
//         error,
//     } = useInfiniteQuery(
//         ["comments", postId, sortBy],
//         ({ pageParam = 1 }) =>
//             getCommentsForPost(postId, {
//                 page: pageParam,
//                 limit: 10,
//                 sort: sortBy, // send sort
//             }),
//         {
//             getNextPageParam: (lastPage) => {
//                 const nextPage = lastPage.meta.page + 1;
//                 return nextPage <= lastPage.meta.pages ? nextPage : undefined;
//             },
//             keepPreviousData: true,
//         }
//     );

//     const createCommentMutation = useMutation(
//         (payload: CreateCommentPayload) => createComment(payload),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["comments", postId]);
//             },
//         }
//     );

//     const handleCreateComment = (html: string) => {
//         if (!html.trim()) return;
//         createCommentMutation.mutate({ postId, content: html });
//     };

//     const handleReplySubmit = (parentId: string) => {
//         if (!replyContent.trim()) return;
//         createCommentMutation.mutate({
//             postId,
//             content: replyContent,
//             parentId, // send reply as child
//         });
//         setReplyingToId(null);
//         setReplyContent("");
//     };

//     const toggleLikeMutation = useMutation(
//         async (commentId: string) => {
//             return await toggleLikeOnComment(commentId); // this returns { liked, likeCount }
//         },
//         {
//             // Optional: instant visual feedback
//             onMutate: async (commentId) => {
//                 await queryClient.cancelQueries(["comments", postId, sortBy]);

//                 const previousData = queryClient.getQueryData(["comments", postId, sortBy]);

//                 queryClient.setQueryData(["comments", postId, sortBy], (oldData: any) => {
//                     if (!oldData) return oldData;

//                     return {
//                         ...oldData,
//                         pages: oldData.pages.map((page: any) => ({
//                             ...page,
//                             comments: page.comments.map((comment: any) => {
//                                 if (comment._id === commentId) {
//                                     const liked = !comment.likedByMe;
//                                     const likeCount = liked
//                                         ? comment.likeCount + 1
//                                         : Math.max(comment.likeCount - 1, 0);

//                                     return {
//                                         ...comment,
//                                         likedByMe: liked,
//                                         likeCount,
//                                     };
//                                 }
//                                 return comment;
//                             }),
//                         })),
//                     };
//                 });

//                 return { previousData }; // for rollback on error
//             },
//             onError: (err, commentId, context: any) => {
//                 // rollback if error
//                 if (context?.previousData) {
//                     queryClient.setQueryData(["comments", postId, sortBy], context.previousData);
//                 }
//             },
//             onSuccess: ({ liked, likeCount }, commentId) => {
//                 // Ensure latest value from server still wins
//                 queryClient.setQueryData(["comments", postId, sortBy], (oldData: any) => {
//                     if (!oldData) return oldData;

//                     const newPages = oldData.pages.map((page: any) => ({
//                         ...page,
//                         comments: page.comments.map((comment: any) => {
//                             if (comment._id === commentId) {
//                                 return {
//                                     ...comment,
//                                     likedByMe: liked,
//                                     likeCount,
//                                 };
//                             }
//                             return comment;
//                         }),
//                     }));

//                     return { ...oldData, pages: newPages };
//                 });
//             },
//         }
//     );

//     const updateCommentMutation = useMutation(
//         ({ commentId, content }: { commentId: string; content: string }) =>
//             updateComment(commentId, { content }),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["comments", postId]);
//                 setEditingCommentId(null);
//                 setEditingContent("");
//             },
//         }
//     );

//     const deleteCommentMutation = useMutation(
//         (commentId: string) => deleteComment(commentId),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["comments", postId]);
//             },
//             onError: (error: any) => {
//                 alert(error.message || "Failed to delete comment");
//             },
//         }
//     );

//     const useToggleBestComment = (postId: string) => {
//         const queryClient = useQueryClient();

//         return useMutation({
//             mutationFn: (commentId: string) => toggleBestComment(commentId),
//             onSuccess: (data) => {
//                 toast.success(data?.message || "Updated best comment status.");
//                 queryClient.invalidateQueries(["comments", postId]);
//             },
//             onError: (error: any) => {
//                 toast.error(error.message || "Failed to toggle best comment");
//             },
//         });
//     };

//     const toggleBestCommentMutation = useToggleBestComment(postId);

//     // const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     //     if (e.key === "Enter" && !e.shiftKey) {
//     //         e.preventDefault();
//     //         handleCreateComment();
//     //     }
//     // };

//     const sortOptions = [
//         { value: "newest", label: "Newest" },
//         { value: "oldest", label: "Oldest" },
//         { value: "top", label: "Top Liked" },
//         { value: "best", label: "Best" },
//     ];

//     const hasNoComments = status === "success" &&
//         data?.pages.every((page) => page.comments.length === 0);

//     return (
//         <div className="my-8 space-y-4">
//             <PageHeading title="Comments" subtitle="Join the conversation — share your thoughts below" />

//             {/* Filters */}
//             <div className="flex flex-wrap gap-4 items-end">
//                 <SelectInput
//                     className="text-xs"
//                     label="Sort By"
//                     value={sortBy}
//                     onChange={(e) => {
//                         const val = e.target.value as typeof sortBy;
//                         setSortBy(val);
//                     }}
//                     options={sortOptions}
//                 />
//             </div>

//             <CommentBox
//                 onSubmit={(html) => {
//                     // optional: strip empty tags or validate here
//                     handleCreateComment(html);
//                 }}
//             />

//             <StatusMessage status={status} error={error} />
//             {hasNoComments && (
//                 <StatusMessage status="success">
//                     No comments yet. Be the first to join the discussion!
//                 </StatusMessage>
//             )}

//             {data?.pages.map((page, pageIndex) => (
//                 <div key={pageIndex} className="space-y-4">
//                     {page.comments.map((comment: any) => (
//                         <div key={comment._id} className="space-y-2">
//                             {/* Parent Comment */}
//                             <CommentCard
//                                 content={comment.content}
//                                 createdAt={comment.createdAt}
//                                 author={comment.author}
//                                 likeCount={comment.likeCount}
//                                 onEdit={() => {
//                                     setEditingCommentId(comment._id);
//                                     setEditingContent(comment.content);
//                                 }}
//                                 onLike={() => toggleLikeMutation.mutate(comment._id)}
//                                 onDelete={() => {
//                                     if (confirm("Are you sure you want to delete this comment?")) {
//                                         deleteCommentMutation.mutate(comment._id);
//                                     }
//                                 }}
//                                 onReply={() => setReplyingToId(comment._id)}
//                                 likedByMe={comment.likedByMe}
//                                 onToggleBest={() => toggleBestCommentMutation.mutate(comment._id)}
//                                 isBest={comment.isBest}
//                             />

//                             {/* Inline reply input */}
//                             {replyingToId === comment._id && (
//                                 <div className="ml-36 mt-2">
//                                     <textarea
//                                         className="w-full p-2 border border-gray-300 rounded text-sm"
//                                         rows={3}
//                                         value={replyContent}
//                                         onChange={(e) => setReplyContent(e.target.value)}
//                                         placeholder="Write your reply..."
//                                     />
//                                     <div className="mt-1 flex gap-2">
//                                         <button
//                                             onClick={() => handleReplySubmit(comment._id)}
//                                             className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-white hover:text-blue-600 border border-gray-200"
//                                         >
//                                             Post Reply
//                                         </button>
//                                         <button
//                                             onClick={() => setReplyingToId(null)}
//                                             className="px-3 py-1 text-gray-500 text-sm hover:underline"
//                                         >
//                                             Cancel
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Nested replies (if any) */}
//                             <div className="ml-32 mt-2">
//                                 {comment.childrenCount > 0 && (
//                                     <button
//                                         className="text-sm text-blue-500 hover:underline mb-2"
//                                         onClick={() =>
//                                             setExpandedReplies(prev => ({
//                                                 ...prev,
//                                                 [comment._id]: !prev[comment._id],
//                                             }))
//                                         }
//                                     >
//                                         {expandedReplies[comment._id] ? "Hide replies" : `View ${comment.childrenCount} ${comment.childrenCount > 1 ? "replies" : "reply"}`}
//                                     </button>
//                                 )}

//                                 {expandedReplies[comment._id] && (
//                                     <RepliesThread postId={postId} parentId={comment._id} />
//                                 )}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             ))}

//             {
//                 hasNextPage && (
//                     <div className="text-center">
//                         <button
//                             onClick={() => fetchNextPage()}
//                             disabled={isFetchingNextPage}
//                             className="mt-4 text-blue-600 hover:underline"
//                         >
//                             {isFetchingNextPage ? "Loading more..." : "Load more"}
//                         </button>
//                     </div>
//                 )
//             }

//             {editingCommentId && (
//                 <Modal
//                     isOpen={!!editingCommentId}
//                     onClose={() => setEditingCommentId(null)}
//                 >
//                     <div className="space-y-4">
//                         {/* Modal title */}
//                         <h2 className="text-lg font-semibold text-gray-800">Edit Comment</h2>

//                         {/* Textarea */}
//                         <textarea
//                             value={editingContent}
//                             onChange={(e) => setEditingContent(e.target.value)}
//                             className="w-full p-2 border border-gray-300 rounded"
//                             rows={4}
//                         />

//                         {/* Action buttons */}
//                         <div className="flex justify-end gap-2">
//                             <button
//                                 onClick={() => setEditingCommentId(null)}
//                                 className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={() => {
//                                     updateCommentMutation.mutate({
//                                         commentId: editingCommentId,
//                                         content: editingContent,
//                                     });
//                                     setEditingCommentId(null); // Optional: close after save
//                                 }}
//                                 className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
//                             >
//                                 Save
//                             </button>
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//         </div >
//     );
// };

// export default CommentConversation;
