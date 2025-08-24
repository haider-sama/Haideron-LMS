// import React, { useState } from "react";
// import { useParams } from "react-router-dom";
// import { usePermissions } from "../../../hooks/usePermissions";
// import { useMutation, useQuery, useQueryClient } from "react-query";
// import { voteOnPost, getPostBySlug } from "../../../api/social/postApi";
// import { VoteTypeEnum } from "../../../../../server/src/shared/social.enums";
// import PostCard from "../../../components/pages/social/pages/post/PostCard";
// import Modal from "../../../components/ui/Modal";
// import { EditPost } from "../../../components/pages/social/pages/post/EditPost";
// import { Forum, Post } from "../../../constants/social/social-types";
// import CommentConversation from "../../../components/pages/social/pages/comment/CommentConversation";
// import { StatusMessage } from "../../../components/ui/social/StatusMessage";

// const PostPage: React.FC = () => {
//     const { forumSlug, postSlug } = useParams<{ forumSlug: string; postSlug: string }>();
//     const queryClient = useQueryClient();
//     const [editingPost, setEditingPost] = useState<Post | null>(null);

//     const { isLoggedIn } = usePermissions();

//     const {
//         data,
//         status,
//         error,
//     } = useQuery(
//         ["post", postSlug],
//         () => getPostBySlug(postSlug!), // Slug only
//         { enabled: !!postSlug }
//     );

//     const post = data?.post;

//     const upvoteMutation = useMutation(
//         (postId: string) => voteOnPost(postId, VoteTypeEnum.UPVOTE),
//         {
//             onMutate: async (postId) => {
//                 await queryClient.cancelQueries(["postMetrics", postId]);

//                 const previous = queryClient.getQueryData<any>(["postMetrics", postId]);

//                 queryClient.setQueryData(["postMetrics", postId], (old: any) => {
//                     if (!old) return old;

//                     const previousVote = old.userVote;
//                     let upvoteCount = old.upvoteCount || 0;
//                     let downvoteCount = old.downvoteCount || 0;

//                     if (previousVote === "DOWNVOTE") downvoteCount--;
//                     if (previousVote !== "UPVOTE") upvoteCount++;

//                     return {
//                         ...old,
//                         userVote: "UPVOTE",
//                         upvoteCount: Math.max(0, upvoteCount),
//                         downvoteCount: Math.max(0, downvoteCount),
//                     };
//                 });

//                 return { previous, postId };
//             },
//             onError: (_err, _postId, context) => {
//                 if (context?.previous && context.postId) {
//                     queryClient.setQueryData(["postMetrics", context.postId], context.previous);
//                 }
//             },
//             onSuccess: (_, postId) => {
//                 queryClient.invalidateQueries(["post", postSlug]);
//                 queryClient.invalidateQueries(["postMetrics", postId]);
//             }
//         }
//     );

//     const downvoteMutation = useMutation(
//         (postId: string) => voteOnPost(postId, VoteTypeEnum.DOWNVOTE),
//         {
//             onMutate: async (postId) => {
//                 await queryClient.cancelQueries(["postMetrics", postId]);

//                 const previous = queryClient.getQueryData<any>(["postMetrics", postId]);

//                 queryClient.setQueryData(["postMetrics", postId], (old: any) => {
//                     if (!old) return old;

//                     const previousVote = old.userVote;
//                     let upvoteCount = old.upvoteCount || 0;
//                     let downvoteCount = old.downvoteCount || 0;

//                     if (previousVote === "UPVOTE") upvoteCount--;
//                     if (previousVote !== "DOWNVOTE") downvoteCount++;

//                     return {
//                         ...old,
//                         userVote: "DOWNVOTE",
//                         upvoteCount: Math.max(0, upvoteCount),
//                         downvoteCount: Math.max(0, downvoteCount),
//                     };
//                 });

//                 return { previous, postId };
//             },
//             onError: (_err, _postId, context) => {
//                 if (context?.previous && context.postId) {
//                     queryClient.setQueryData(["postMetrics", context.postId], context.previous);
//                 }
//             },
//             onSuccess: (_, postId) => {
//                 queryClient.invalidateQueries(["post", postSlug]);
//                 queryClient.invalidateQueries(["postMetrics", postId]);
//             }
//         }
//     );

//     const handleUpvote = () => {
//         if (isLoggedIn && !upvoteMutation.isLoading && post?._id) {
//             upvoteMutation.mutate(post._id);
//         }
//     };

//     const handleDownvote = () => {
//         if (isLoggedIn && !downvoteMutation.isLoading && post?._id) {
//             downvoteMutation.mutate(post._id);
//         }
//     };

//     return (
//         <div className="p-4 space-y-6 max-w-4xl mx-auto my-8">
//             <StatusMessage
//                 status={status}
//                 error={error}
//                 loadingText="Loading post..."
//                 errorText="Failed to load post."
//             >
//                 {!post && "Post not found."}
//             </StatusMessage>

//             {post && (
//                 <PostCard
//                     forum={{ slug: forumSlug } as Forum}
//                     post={post}
//                     onUpvote={handleUpvote}
//                     onDownvote={handleDownvote}
//                     onEditPost={setEditingPost}
//                     mode="full"
//                 />
//             )}

//             {post && <CommentConversation postId={post._id} />}

//             {editingPost && (
//                 <Modal isOpen={!!editingPost} onClose={() => setEditingPost(null)}>
//                     <EditPost post={editingPost} onClose={() => setEditingPost(null)} />
//                 </Modal>
//             )}
//         </div>
//     );
// };

// export default PostPage;
