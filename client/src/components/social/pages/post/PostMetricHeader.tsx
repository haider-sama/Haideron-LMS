// import { FaHeart, FaArrowUp, FaArrowDown, FaComments, FaRegHeart } from "react-icons/fa";
// import { useQuery, useMutation, useQueryClient } from "react-query";
// import React from "react";
// import { Metric } from "./Metric";
// import { getPostMetrics, likePost, unlikePost } from "../../../../../api/social/postApi";
// import { useNavigate } from "react-router-dom";
// import numeral from "numeral";

// interface PostMetricHeaderProps {
//     postId: string;
//     isLoggedIn: boolean;
// }

// export const PostMetricHeader: React.FC<PostMetricHeaderProps> = ({ postId, isLoggedIn }) => {
//     const queryClient = useQueryClient();
//     const navigate = useNavigate();
//     const { data: queryData } = useQuery(["postMetrics", postId], () => getPostMetrics(postId), {
//         retry: false,
//     });

//     const likeMutation = useMutation(() => likePost(postId), {
//         onMutate: async () => {
//             await queryClient.cancelQueries(["postMetrics", postId]);

//             const previousData = queryClient.getQueryData<any>(["postMetrics", postId]);

//             queryClient.setQueryData(["postMetrics", postId], (old: any) => ({
//                 ...old,
//                 hasLiked: true,
//                 likeCount: (old?.likeCount || 0) + 1,
//             }));

//             return { previousData };
//         },
//         onError: (_err, _vars, context) => {
//             if (context?.previousData) {
//                 queryClient.setQueryData(["postMetrics", postId], context.previousData);
//             }
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries(["postMetrics", postId]);
//         },
//     });

//     const unlikeMutation = useMutation(() => unlikePost(postId), {
//         onMutate: async () => {
//             await queryClient.cancelQueries(["postMetrics", postId]);

//             const previousData = queryClient.getQueryData<any>(["postMetrics", postId]);

//             queryClient.setQueryData(["postMetrics", postId], (old: any) => ({
//                 ...old,
//                 hasLiked: false,
//                 likeCount: Math.max(0, (old?.likeCount || 1) - 1),
//             }));

//             return { previousData };
//         },
//         onError: (_err, _vars, context) => {
//             if (context?.previousData) {
//                 queryClient.setQueryData(["postMetrics", postId], context.previousData);
//             }
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries(["postMetrics", postId]);
//         },
//     });

//     const handleLikeClick = () => {
//         if (!isLoggedIn) {
//             navigate("/login");
//             return;
//         }

//         if (hasLiked) {
//             unlikeMutation.mutate();
//         } else {
//             likeMutation.mutate();
//         }
//     };

//     const likeCount = numeral(queryData?.likeCount || 0).format("0.[0]a");
//     const upvoteCount = numeral(queryData?.upvoteCount || 0).format("0.[0]a");
//     const downvoteCount = numeral(queryData?.downvoteCount || 0).format("0.[0]a");
//     const commentCount = numeral(queryData?.commentCount || 0).format("0.[0]a");
//     const hasLiked = queryData?.hasLiked;
//     const userVote = queryData?.userVote;

//     return (
//         <div className="flex flex-wrap items-center justify-start gap-6 px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
//             <Metric
//                 icon={
//                     hasLiked ? (
//                         <FaHeart className="text-red-600" />
//                     ) : (
//                         <FaRegHeart className="text-gray-400 hover:text-red-600 transition" />
//                     )
//                 }
//                 label="Likes"
//                 count={likeCount}
//                 highlight={hasLiked}
//                 onClick={handleLikeClick}
//                 disabled={likeMutation.isLoading || unlikeMutation.isLoading}
//             />
//             <Metric icon={<FaArrowUp />} label="Upvotes" count={upvoteCount} highlight={userVote === "UPVOTE"} />
//             <Metric icon={<FaArrowDown />} label="Downvotes" count={downvoteCount} highlight={userVote === "DOWNVOTE"} />
//             <Metric icon={<FaComments />} label="Comments" count={commentCount} />
//         </div>
//     );
// };