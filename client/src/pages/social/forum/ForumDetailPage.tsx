// import { useLocation, useParams } from "react-router-dom";
// import { Forum } from "../../../constants/social/social-types";
// import ForumHeader from "../../../components/pages/social/pages/forum/ForumHeader";
// import ForumInfoCard from "../../../components/pages/social/pages/forum/ForumInfoCard";
// import { getForumBySlug, getForumMembershipStatus } from "../../../api/social/forumApi";
// import { useQuery } from "react-query";
// import { useState } from "react";
// import Modal from "../../../components/ui/Modal";
// import { CreatePost } from "../../../components/pages/social/pages/post/CreatePost";
// import ForumPosts from "./ForumPosts";
// import { StatusMessage } from "../../../components/ui/social/StatusMessage";

// const ForumDetailPage = () => {
//     const { slug } = useParams();
//     const { state } = useLocation();
//     const initialForum: Forum | undefined = state?.forum;
//     const [showCreatePostModal, setShowCreatePostModal] = useState(false);

//     // Try getting forum from location.state or fetch via slug
//     const {
//         data: forum,
//         isLoading: forumLoading,
//         isError: forumError,
//     } = useQuery(
//         ["forum-by-slug", slug],
//         () => slug ? getForumBySlug(slug) : Promise.reject("No slug"),
//         {
//             initialData: initialForum, // use state if available
//             enabled: !!slug,
//         }
//     );

//     const {
//         data: membership,
//         isLoading,
//         refetch,
//     } = useQuery(
//         ["forum-membership", forum?._id],
//         () => forum ? getForumMembershipStatus(forum._id) : Promise.reject("No forum ID"),
//         {
//             enabled: !!forum,
//             refetchOnWindowFocus: false,         // Don't refetch when switching tabs
//             refetchOnReconnect: false,           // Don't refetch when internet reconnects
//             staleTime: 1000 * 60 * 5,            // Consider fresh for 5 minutes
//             cacheTime: 1000 * 60 * 30,           // Cache it for 30 minutes after last use
//             retry: 1,                            // Retry only once on failure
//         }
//     );

//     if (!forum || forumLoading || forumError) {
//         return (
//             <StatusMessage
//                 status={forumLoading ? "loading" : "error"}
//                 error={forumError}
//                 loadingText="Loading forum..."
//                 errorText="Forum not found or could not be loaded."
//                 className="p-6 justify-center text-center"
//             />
//         );
//     }

//     return (
//         <div className="max-w-6xl mx-auto px-4 py-8">
//             <ForumHeader
//                 forum={forum}
//                 isMember={!!membership?.isMember}
//                 isLoading={isLoading}
//                 refetchMembership={refetch}
//                 onCreatePostClick={() => setShowCreatePostModal(true)}
//             />
//             <div className="flex flex-col md:flex-row gap-6">
//                 {/* Main content */}
//                 <div className="flex-1">
//                     {/* forum content/posts here */}
//                     <ForumPosts forum={forum} />
//                 </div>

//                 {/* Sidebar */}
//                 <aside className="md:w-80">
//                     <ForumInfoCard forum={forum} memberCount={membership?.memberCount ?? 0} />
//                 </aside>
//             </div>

//             {showCreatePostModal && (
//                 <Modal isOpen={true} onClose={() => setShowCreatePostModal(false)}>
//                     <CreatePost
//                         forumId={forum._id}
//                         onClose={() => setShowCreatePostModal(false)} // optional callback
//                     />
//                 </Modal>
//             )}

//         </div>
//     );
// };

// export default ForumDetailPage;