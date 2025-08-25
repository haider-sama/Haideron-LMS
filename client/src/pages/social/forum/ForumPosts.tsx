import React, { useRef, useEffect, useState } from "react";
import { FilterPostsParams, FilterPostsResponse, ForumWithDetails, Post, PostMetrics, PostVoteResponse } from "../../../constants/social/interfaces";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostTypeEnum } from "../../../../../server/src/shared/social.enums";
import { usePermissions } from "../../../hooks/usePermissions";
import { filterPostsByForumId, filterPostsByUserId } from "../../../api/social/post/post-api";
import { SelectInput } from "../../../components/ui/Input";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import Modal from "../../../components/ui/Modal";
import { useToast } from "../../../context/ToastContext";
import { downvoteOnPost, upvoteOnPost } from "../../../api/social/post/post-user-api";
import { EditPost } from "../../../components/social/pages/post/EditPost";
import PostCard from "../../../components/social/pages/post/PostCard";

const ForumPosts: React.FC<{ forum: ForumWithDetails }> = ({ forum }) => {
    const observerRef = useRef<HTMLDivElement | null>(null);

    const queryClient = useQueryClient();
    const toast = useToast();

    const [postType, setPostType] = useState<PostTypeEnum>();
    const [sortBy, setSortBy] = useState<"recent" | "top" | "trending">("recent");
    const [archived, setArchived] = useState<"true" | "false" | "all">("false");
    const { user, isAdmin, isCommunityAdmin, isLoggedIn } = usePermissions();
    const [showMyPosts, setShowMyPosts] = useState<"all" | "mine" | "mineForum">("all");
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
    } = useInfiniteQuery<FilterPostsResponse, Error>({
        queryKey: [
            "forumPosts",
            forum.id,
            postType,
            sortBy,
            archived,
            showMyPosts,
            user?.id,
        ],
        queryFn: async (context) => {
            // context.pageParam is unknown by default
            const pageParam = context.pageParam as string | undefined;

            const lastPostCreatedAt = pageParam ?? new Date().toISOString();

            const params: FilterPostsParams = {
                limit: 10,
                ...(postType ? { type: postType } : {}),
                sort: sortBy,
                lastPostCreatedAt, // always included
                ...((isAdmin || isCommunityAdmin) && archived !== "all" ? { archived } : {}),
                ...(!(isAdmin || isCommunityAdmin) ? { archived: "false" } : {}),
            };

            if (showMyPosts === "mine" && user?.id) {
                return filterPostsByUserId(user.id, params);
            }

            if (showMyPosts === "mineForum" && user?.id && forum.id) {
                return filterPostsByUserId(user.id, params);
            }

            return filterPostsByForumId(forum.id, params);
        },
        enabled: showMyPosts === "all" || !!user?.id,
        getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
        initialPageParam: undefined,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

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
                    downvoteCount = Math.max(oldMetrics.downvoteCount - 1, 0);
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
        onError: (_err, postId) => {
            // refetch from server if error
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
            toast.error(_err.message || "Failed to upvote post");
        },
        onSettled: (_data, _err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forum.id] });
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
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
                    upvoteCount = Math.max(oldMetrics.upvoteCount - 1, 0);
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
        onError: (_err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
            toast.error(_err.message || "Failed to downvote post");
        },
        onSettled: (_data, _err, postId) => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forum.id] });
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
        },
    });

    const handleUpvote = (postId: string) => {
        if (!upvoteMutation.isPending) {
            upvoteMutation.mutate(postId);
        }
    };

    const handleDownvote = (postId: string) => {
        if (!downvoteMutation.isPending) {
            downvoteMutation.mutate(postId);
        }
    };

    // Scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1 }
        );

        const current = observerRef.current;
        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        };
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const postTypeOptions = [
        { label: "All Types", value: "" },
        ...Object.values(PostTypeEnum).map((type) => ({
            label: type.charAt(0) + type.slice(1).toLowerCase(), // e.g., "Text"
            value: type,
        })),
    ];

    const sortOptions = [
        { label: "Recent", value: "recent" },
        { label: "Top", value: "top" },
        { label: "Trending", value: "trending" },
    ];

    const archivedOptions = [
        { label: "All", value: "all" },
        { label: "Active", value: "false" },
        { label: "Archived", value: "true" },
    ];

    return (
        <div className="p-4 space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
                <SelectInput
                    className="text-xs"
                    label="Post Type"
                    value={postType ?? "all"}
                    onChange={(e) => {
                        const val = e.target.value;
                        setPostType(val === "" ? undefined : (val as PostTypeEnum));
                    }}
                    options={postTypeOptions}
                />
                <SelectInput
                    className="text-xs"
                    label="Sort By"
                    value={sortBy}
                    onChange={(e) => {
                        const val = e.target.value as "recent" | "top" | "trending";
                        setSortBy(val);
                    }}
                    options={sortOptions}
                />

                {(isAdmin || isCommunityAdmin) && (
                    <SelectInput
                        className="text-xs"
                        label="Archived"
                        value={archived}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "true" || val === "false" || val === "all") {
                                setArchived(val);
                            }
                        }}
                        options={archivedOptions}
                    />
                )}

                {isLoggedIn && (
                    <SelectInput
                        className="text-xs"
                        label="Posts"
                        value={showMyPosts}
                        onChange={(e) => setShowMyPosts(e.target.value as "all" | "mine" | "mineForum")}
                        options={[
                            { label: "All Posts", value: "all" },
                            { label: "My Posts", value: "mine" },
                            { label: "My Posts in This Forum", value: "mineForum" },
                        ]}
                    />
                )}
            </div>

            <StatusMessage
                status={status as "idle" | "loading" | "error" | "success"}
                error={error}
                loadingText="Loading posts..."
                errorText="Failed to load posts."
            >
                {(() => {
                    const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

                    const pinnedPosts = allPosts.filter((post) => post.isPinned);
                    const nonPinnedPosts = allPosts.filter((post) => !post.isPinned);

                    if (allPosts.length === 0) {
                        return (
                            <div className="flex justify-center text-gray-400 text-sm py-8">
                                No posts available.
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-4">
                            {/* Pinned Posts (only on 'recent' sort) */}
                            {sortBy === "recent" && pinnedPosts.length > 0 && (
                                <div className="mb-4 border-b pb-2">
                                    {pinnedPosts.map((post) => (
                                        <PostCard
                                            key={`pinned-${post.id}`}
                                            forum={forum as ForumWithDetails}
                                            post={post}
                                            onUpvote={handleUpvote}
                                            onDownvote={handleDownvote}
                                            onEditPost={setEditingPost}
                                            mode="preview"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Non-pinned posts */}
                            {nonPinnedPosts.map((post) => (
                                <PostCard
                                    key={`post-${post.id}`}
                                    forum={forum as ForumWithDetails}
                                    post={post}
                                    onUpvote={handleUpvote}
                                    onDownvote={handleDownvote}
                                    onEditPost={setEditingPost}
                                    mode="preview"
                                />
                            ))}
                        </div>
                    );
                })()}
            </StatusMessage>

            {/* Infinite Scroll Loader */}
            <div ref={observerRef} />
            {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-gray-600">
                    <TopCenterLoader />
                    <span>Loading more posts...</span>
                </div>
            )}

            {editingPost && (
                <Modal isOpen={!!editingPost} onClose={() => setEditingPost(null)}>
                    <EditPost post={editingPost} onClose={() => setEditingPost(null)} />
                </Modal>
            )}
        </div>
    );
};

export default ForumPosts;
