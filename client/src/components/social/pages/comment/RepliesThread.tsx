// import { useInfiniteQuery, useMutation, useQueryClient } from "react-query";
// import { useState } from "react";
// import CommentCard from "./CommentCard";
// import { CreateCommentPayload } from "../../../../../constants/social/social-types";
// import { createComment, deleteComment, getRepliesForComment, toggleLikeOnComment, updateComment } from "../../../../../api/social/commentApi";
// import Modal from "../../../../ui/Modal";
// import { StatusMessage } from "../../../../ui/social/StatusMessage";
// import { SelectInput } from "../../../../account/Input";

// interface RepliesThreadProps {
//     postId: string;
//     parentId: string;
//     isExpanded?: boolean;
// }

// export const RepliesThread: React.FC<RepliesThreadProps> = ({
//     postId,
//     parentId,
//     isExpanded = true,
// }) => {
//     const [replyContent, setReplyContent] = useState("");
//     const [isReplying, setIsReplying] = useState(false);
//     const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
//     const [editingContent, setEditingContent] = useState("");
//     const [sortBy, setSortBy] = useState<"newest" | "oldest" | "top" | "best">("newest");
//     const queryClient = useQueryClient();

//     const {
//         data,
//         fetchNextPage,
//         hasNextPage,
//         isFetchingNextPage,
//         status,
//         error,
//     } = useInfiniteQuery(
//         ["replies", parentId],
//         ({ pageParam = 1 }) =>
//             getRepliesForComment(postId, parentId, {
//                 page: pageParam,
//                 limit: 5,
//                 sort: sortBy,
//             }),
//         {
//             enabled: isExpanded,
//             getNextPageParam: (lastPage) => {
//                 const nextPage = lastPage.meta.page + 1;
//                 return nextPage <= lastPage.meta.pages ? nextPage : undefined;
//             },
//             keepPreviousData: true,
//         }
//     );

//     // console.log("Replies:", data);

//     const createReplyMutation = useMutation(
//         (payload: CreateCommentPayload) => createComment(payload),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["replies", parentId]);
//                 setReplyContent("");
//                 setIsReplying(false);
//             },
//         }
//     );

//     const toggleLikeReplyMutation = useMutation(
//         async (commentId: string) => {
//             return await toggleLikeOnComment(commentId); // returns { liked, likeCount }
//         },
//         {
//             onMutate: async (commentId) => {
//                 await queryClient.cancelQueries(["replies", parentId]);

//                 const previousData = queryClient.getQueryData(["replies", parentId]);

//                 queryClient.setQueryData(["replies", parentId], (oldData: any) => {
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

//                 return { previousData };
//             },
//             onError: (err, commentId, context: any) => {
//                 if (context?.previousData) {
//                     queryClient.setQueryData(["replies", parentId], context.previousData);
//                 }
//             },
//             onSuccess: ({ liked, likeCount }, commentId) => {
//                 queryClient.setQueryData(["replies", parentId], (oldData: any) => {
//                     if (!oldData) return oldData;

//                     return {
//                         ...oldData,
//                         pages: oldData.pages.map((page: any) => ({
//                             ...page,
//                             comments: page.comments.map((comment: any) => {
//                                 if (comment._id === commentId) {
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
//             },
//         }
//     );

//     const updateCommentMutation = useMutation(
//         ({ commentId, content }: { commentId: string; content: string }) =>
//             updateComment(commentId, { content }),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["replies", parentId]);
//                 setEditingCommentId(null);
//                 setEditingContent("");
//             },
//         }
//     );

//     const deleteCommentMutation = useMutation(
//         (commentId: string) => deleteComment(commentId),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["replies", parentId]);
//             },
//             onError: (error: any) => {
//                 alert(error.message || "Failed to delete comment");
//             },
//         }
//     );


//     const handleReplySubmit = () => {
//         if (!replyContent.trim()) return;
//         createReplyMutation.mutate({
//             postId,
//             parentId,
//             content: replyContent,
//         });
//     };

//     const sortOptions = [
//         { value: "newest", label: "Newest" },
//         { value: "oldest", label: "Oldest" },
//         { value: "top", label: "Top Liked" },
//         { value: "best", label: "Best" },
//     ];

//     const hasNoReplies = status === "success" &&
//         data?.pages.every((page) => page.comments.length === 0);

//     return (
//         <div className="space-y-2">

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

//             {data?.pages.flatMap((page) =>
//                 page.comments.map((reply) => (
//                     <CommentCard
//                         key={reply._id}
//                         content={reply.content}
//                         createdAt={reply.createdAt}
//                         author={reply.author}
//                         likeCount={reply.likeCount}
//                         onEdit={() => {
//                             setEditingCommentId(reply._id);
//                             setEditingContent(reply.content);
//                         }}
//                         onLike={() => toggleLikeReplyMutation.mutate(reply._id)}
//                         onDelete={() => {
//                             if (confirm("Are you sure you want to delete this comment?")) {
//                                 deleteCommentMutation.mutate(reply._id);
//                             }
//                         }}
//                         onReply={() => setIsReplying(true)}
//                         repliedToContent={reply.parentContent}
//                         likedByMe={reply.likedByMe}
//                     />
//                 ))
//             )}

//             <StatusMessage status={status} error={error} />
//             {hasNoReplies && (
//                 <StatusMessage status="success">
//                     No replies yet. Be the first one to reply!
//                 </StatusMessage>
//             )}

//             {hasNextPage && (
//                 <button
//                     disabled={isFetchingNextPage}
//                     onClick={() => fetchNextPage()}
//                     className="text-sm text-blue-600 hover:underline"
//                 >
//                     {isFetchingNextPage ? "Loading more..." : "Load more replies"}
//                 </button>
//             )}

//             {isReplying && (
//                 <div className="mt-2">
//                     <textarea
//                         className="w-full p-2 border border-gray-300 rounded text-sm"
//                         rows={3}
//                         value={replyContent}
//                         onChange={(e) => setReplyContent(e.target.value)}
//                         placeholder="Write your reply..."
//                     />
//                     <div className="mt-1 flex gap-2">
//                         <button
//                             onClick={handleReplySubmit}
//                             className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
//                         >
//                             Post Reply
//                         </button>
//                         <button
//                             onClick={() => setIsReplying(false)}
//                             className="px-3 py-1 text-gray-500 text-sm hover:underline"
//                         >
//                             Cancel
//                         </button>
//                     </div>
//                 </div>
//             )}

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
//         </div>
//     );
// };
