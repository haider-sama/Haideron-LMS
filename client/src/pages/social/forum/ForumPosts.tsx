// import React, { useRef, useEffect, useState } from "react";
// import { useInfiniteQuery, useMutation, useQueryClient } from "react-query";
// import { filterPostsByForumId, filterPostsByUserId, voteOnPost } from "../../../api/social/postApi";
// import PostCard from "../../../components/pages/social/pages/post/PostCard";
// import { PostTypeEnum, VoteTypeEnum } from "../../../../../server/src/shared/social.enums";
// import { SelectInput } from "../../../components/account/Input";
// import TopCenterLoader from "../../../components/ui/TopCenterLoader";
// import { usePermissions } from "../../../hooks/usePermissions";
// import { Forum, Post } from "../../../constants/social/social-types";
// import { EditPost } from "../../../components/pages/social/pages/post/EditPost";
// import Modal from "../../../components/ui/Modal";
// import { StatusMessage } from "../../../components/ui/social/StatusMessage";

// const ForumPosts: React.FC<{ forum: Forum }> = ({ forum }) => {
//     const observerRef = useRef<HTMLDivElement | null>(null);
//     const queryClient = useQueryClient();
//     const [postType, setPostType] = useState<PostTypeEnum>();
//     const [sortBy, setSortBy] = useState<"recent" | "top" | "trending">("recent");
//     const [archived, setArchived] = useState<"true" | "false" | "all">("false");
//     const { user, isAdmin, isCommunityAdmin, isLoggedIn } = usePermissions();
//     const [showMyPosts, setShowMyPosts] = useState<"all" | "mine" | "mineForum">("all");
//     const [editingPost, setEditingPost] = useState<Post | null>(null);

//     const {
//         data,
//         fetchNextPage,
//         hasNextPage,
//         isFetchingNextPage,
//         status,
//         error,
//     } = useInfiniteQuery(
//         ["forumPosts", forum._id, postType, sortBy, archived, showMyPosts, user?._id],
//         ({ pageParam = 1 }) => {
//             const params = {
//                 page: pageParam,
//                 limit: 10,
//                 ...(postType ? { type: postType } : {}),
//                 sort: sortBy,
//                 archived: (isAdmin || isCommunityAdmin) ? archived : "false",
//             };

//             if (showMyPosts === "mine" && user?._id) {
//                 return filterPostsByUserId(user._id, params); // global
//             }

//             if (showMyPosts === "mineForum" && user?._id && forum._id) {
//                 return filterPostsByUserId(user._id, { ...params, forumId: forum._id }); // scoped
//             }

//             return filterPostsByForumId(forum._id, params); // default: all posts in forum
//         },
//         {
//             enabled: showMyPosts === "all" || !!user?._id,
//             getNextPageParam: (lastPage) => {
//                 const nextPage = lastPage.meta.page + 1;
//                 return nextPage <= lastPage.meta.pages ? nextPage : undefined;
//             },
//         }
//     );

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
//                 queryClient.invalidateQueries(["forumPosts", forum._id]);
//                 queryClient.invalidateQueries(["postMetrics", postId]);
//             },
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
//                 queryClient.invalidateQueries(["forumPosts", forum._id]);
//                 queryClient.invalidateQueries(["postMetrics", postId]);
//             },
//         }
//     );

//     const handleUpvote = (postId: string) => {
//         if (!upvoteMutation.isLoading) {
//             upvoteMutation.mutate(postId);
//         }
//     };

//     const handleDownvote = (postId: string) => {
//         if (!downvoteMutation.isLoading) {
//             downvoteMutation.mutate(postId);
//         }
//     };

//     // Scroll observer
//     useEffect(() => {
//         const observer = new IntersectionObserver(
//             (entries) => {
//                 const first = entries[0];
//                 if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
//                     fetchNextPage();
//                 }
//             },
//             { threshold: 1 }
//         );

//         const current = observerRef.current;
//         if (current) observer.observe(current);

//         return () => {
//             if (current) observer.unobserve(current);
//         };
//     }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

//     const postTypeOptions = [
//         { label: "All Types", value: "" },
//         ...Object.values(PostTypeEnum).map((type) => ({
//             label: type.charAt(0) + type.slice(1).toLowerCase(), // e.g., "Text"
//             value: type,
//         })),
//     ];

//     const sortOptions = [
//         { label: "Recent", value: "recent" },
//         { label: "Top", value: "top" },
//         { label: "Trending", value: "trending" },
//     ];

//     const archivedOptions = [
//         { label: "All", value: "all" },
//         { label: "Active", value: "false" },
//         { label: "Archived", value: "true" },
//     ];

//     return (
//         <div className="p-4 space-y-6">
//             {/* Filters */}
//             <div className="flex flex-wrap gap-4 items-end">
//                 <SelectInput
//                     className="text-xs"
//                     label="Post Type"
//                     value={postType ?? "all"}
//                     onChange={(e) => {
//                         const val = e.target.value;
//                         setPostType(val === "" ? undefined : (val as PostTypeEnum));
//                     }}
//                     options={postTypeOptions}
//                 />
//                 <SelectInput
//                     className="text-xs"
//                     label="Sort By"
//                     value={sortBy}
//                     onChange={(e) => {
//                         const val = e.target.value as "recent" | "top" | "trending";
//                         setSortBy(val);
//                     }}
//                     options={sortOptions}
//                 />

//                 {(isAdmin || isCommunityAdmin) && (
//                     <SelectInput
//                         className="text-xs"
//                         label="Archived"
//                         value={archived}
//                         onChange={(e) => {
//                             const val = e.target.value;
//                             if (val === "true" || val === "false" || val === "all") {
//                                 setArchived(val);
//                             }
//                         }}
//                         options={archivedOptions}
//                     />
//                 )}

//                 {isLoggedIn && (
//                     <SelectInput
//                         className="text-xs"
//                         label="Posts"
//                         value={showMyPosts}
//                         onChange={(e) => setShowMyPosts(e.target.value as "all" | "mine" | "mineForum")}
//                         options={[
//                             { label: "All Posts", value: "all" },
//                             { label: "My Posts", value: "mine" },
//                             { label: "My Posts in This Forum", value: "mineForum" },
//                         ]}
//                     />
//                 )}
//             </div>

//             {/* Status Messages */}
//             <StatusMessage status={status}
//                 error={error}
//                 loadingText="Loading posts..."
//                 errorText="Failed to load posts.">
//                 {(() => {
//                     const nonPinnedPostsExist = data?.pages.some((page) =>
//                         page.posts.some((post) => !post.isPinned)
//                     );

//                     if (!nonPinnedPostsExist) {
//                         return (
//                             <div className="flex justify-center text-gray-400 text-sm py-8">
//                                 No posts available.
//                             </div>
//                         );
//                     }
//                     return (
//                         <div className="space-y-4">
//                             {/* Pinned Posts (only on 'recent' sort) */}
//                             {sortBy === "recent" &&
//                                 data?.pages[0]?.posts
//                                     .filter((post) => post.isPinned)
//                                     .map((post) => (
//                                         <PostCard
//                                             key={`pinned-${post._id}`}
//                                             forum={{ slug: forum.slug } as Forum}
//                                             post={post}
//                                             onUpvote={handleUpvote}
//                                             onDownvote={handleDownvote}
//                                             onEditPost={setEditingPost}
//                                             mode="preview"
//                                         />
//                                     ))}

//                             {/* Non-pinned posts from all pages */}
//                             {data?.pages.map((page, pageIndex) =>
//                                 page.posts
//                                     .filter((post) => !post.isPinned)
//                                     .map((post) => (
//                                         <PostCard
//                                             key={`post-${post._id}-${pageIndex}`}
//                                             forum={{ slug: forum.slug } as Forum}
//                                             post={post}
//                                             onUpvote={handleUpvote}
//                                             onDownvote={handleDownvote}
//                                             onEditPost={setEditingPost}
//                                             mode="preview"
//                                         />
//                                     ))
//                             )}
//                         </div>
//                     );
//                 })()}
//             </StatusMessage>

//             {/* Infinite Scroll Loader */}
//             <div ref={observerRef} />
//             {isFetchingNextPage && (
//                 <div className="flex items-center gap-2 text-gray-600">
//                     <TopCenterLoader />
//                     <span>Loading more posts...</span>
//                 </div>
//             )}

//             {editingPost && (
//                 <Modal isOpen={!!editingPost} onClose={() => setEditingPost(null)}>
//                     <EditPost post={editingPost} onClose={() => setEditingPost(null)} />
//                 </Modal>
//             )}
//         </div>
//     );
// };

// export default ForumPosts;
