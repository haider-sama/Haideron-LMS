import { FaHeart, FaArrowUp, FaArrowDown, FaComments, FaRegHeart } from "react-icons/fa";
import React from "react";
import { Metric } from "./Metric";
import { useNavigate } from "react-router-dom";
import numeral from "numeral";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPostMetrics, likePost, unlikePost } from "../../../../api/social/post/post-user-api";
import { PostMetrics } from "../../../../constants/social/interfaces";
import { VoteTypeEnum } from "../../../../../../server/src/shared/social.enums";

interface PostMetricHeaderProps {
    postId: string;
    isLoggedIn: boolean;
}

export const PostMetricHeader: React.FC<PostMetricHeaderProps> = ({ postId, isLoggedIn }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: metrics } = useQuery<PostMetrics>({
        queryKey: ["postMetrics", postId],
        queryFn: () => getPostMetrics(postId),
        retry: false,
        staleTime: 1000 * 60 * 1, // 1 minute
        refetchOnWindowFocus: false,
    });

    const likeMutation = useMutation({
        mutationFn: () => likePost(postId),
        // Optimistic update
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["postMetrics", postId] });
            const previousMetrics = queryClient.getQueryData<PostMetrics>(["postMetrics", postId]);

            if (previousMetrics) {
                queryClient.setQueryData(["postMetrics", postId], {
                    ...previousMetrics,
                    hasLiked: true,
                    likeCount: previousMetrics.likeCount + 1,
                });
            }

            return { previousMetrics };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousMetrics) {
                queryClient.setQueryData(["postMetrics", postId], context.previousMetrics);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
        },
    });

    const unlikeMutation = useMutation({
        mutationFn: () => unlikePost(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["postMetrics", postId] });
            const previousMetrics = queryClient.getQueryData<PostMetrics>(["postMetrics", postId]);

            if (previousMetrics) {
                queryClient.setQueryData(["postMetrics", postId], {
                    ...previousMetrics,
                    hasLiked: false,
                    likeCount: Math.max(previousMetrics.likeCount - 1, 0),
                });
            }

            return { previousMetrics };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousMetrics) {
                queryClient.setQueryData(["postMetrics", postId], context.previousMetrics);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["postMetrics", postId] });
        },
    });
    
    const handleLikeClick = () => {
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        if (metrics?.hasLiked) {
            unlikeMutation.mutate();
        } else {
            likeMutation.mutate();
        }
    };

    const likeCount = numeral(metrics?.likeCount || 0).format("0.[0]a");
    const upvoteCount = numeral(metrics?.upvoteCount || 0).format("0.[0]a");
    const downvoteCount = numeral(metrics?.downvoteCount || 0).format("0.[0]a");
    const commentCount = numeral(metrics?.commentCount || 0).format("0.[0]a");
    const userVote = metrics?.userVote;
    const hasLiked = metrics?.hasLiked || false;

    return (
        <div className="flex flex-wrap items-center justify-start gap-6 px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
            <Metric
                icon={
                    hasLiked ? (
                        <FaHeart className="text-red-600" />
                    ) : (
                        <FaRegHeart className="text-gray-400 hover:text-red-600 transition" />
                    )
                }
                label="Likes"
                count={likeCount}
                highlight={hasLiked}
                onClick={handleLikeClick}
            />
            <Metric icon={<FaArrowUp />} label="Upvotes" count={upvoteCount} highlight={userVote === VoteTypeEnum.UPVOTE} />
            <Metric icon={<FaArrowDown />} label="Downvotes" count={downvoteCount} highlight={userVote === VoteTypeEnum.DOWNVOTE} />
            <Metric icon={<FaComments />} label="Comments" count={commentCount} />
        </div>
    );
};