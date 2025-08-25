import { useLocation, useParams } from "react-router-dom";
import { ForumWithDetails } from "../../../constants/social/interfaces";
import { useState } from "react";
import { getForumBySlug } from "../../../api/social/forum/forum-api";
import { useQuery } from "@tanstack/react-query";
import { getForumMembershipStatus } from "../../../api/social/forum/forum-user-api";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import ForumHeader from "../../../components/social/pages/forum/ForumHeader";
import ForumInfoCard from "../../../components/social/pages/forum/ForumInfoCard";
import Modal from "../../../components/ui/Modal";
import { ForumStatusEnum, ForumTypeEnum } from "../../../../../server/src/shared/social.enums";
import { CreatePost } from "../../../components/social/pages/post/CreatePost";
import ForumPosts from "./ForumPosts";

const ForumDetailPage = () => {
    const { slug } = useParams();
    const { state } = useLocation();
    const initialForum: ForumWithDetails | null = state?.forum;
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);


    const { data: forum, isLoading: forumLoading, isError: forumError } = useQuery<ForumWithDetails | null>({
        queryKey: ['forum-by-slug', slug],
        queryFn: async () => {
            if (!slug) throw new Error('No slug');

            const res = await getForumBySlug(slug);

            // Map backend response to frontend type
            const mapped: ForumWithDetails = {
                id: res.id,
                slug: res.slug,
                title: res.title,
                description: res.description,
                type: ForumTypeEnum.PUBLIC,      // use proper enum
                status: ForumStatusEnum.APPROVED,   // use proper enum
                createdBy: res.createdBy.id,      // string ID
                createdAt: res.createdAt,
                updatedAt: undefined,
                isArchived: false,
                postCount: 0,                     // default until you fetch posts
                creator: res.createdBy,           // full ForumCreator object
                moderators: res.moderators,
                latestPost: null,
                iconUrl: undefined,
            };

            return mapped;
        },
        initialData: initialForum,
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    const { data: membership, isLoading: membershipLoading, refetch: refetchMembership } = useQuery({
        queryKey: ['forum-membership', forum?.id],
        queryFn: () => forum ? getForumMembershipStatus(forum.id) : Promise.reject('No forum ID'),
        enabled: !!forum,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    if (!forum || forumLoading || forumError) {
        return (
            <StatusMessage
                status={forumLoading ? 'loading' : 'error'}
                error={forumError}
                loadingText="Loading forum..."
                errorText="Forum not found or could not be loaded."
                className="p-6 justify-center text-center"
            />
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <ForumHeader
                forum={forum}
                isMember={!!membership?.isMember}
                isLoading={membershipLoading}
                refetchMembership={refetchMembership}
                onCreatePostClick={() => setShowCreatePostModal(true)}
            />
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <ForumPosts forum={forum} />
                </div>

                <aside className="md:w-80">
                    <ForumInfoCard forum={forum} memberCount={membership?.memberCount ?? 0} />
                </aside>
            </div>

            {showCreatePostModal && (
                <Modal isOpen={true} onClose={() => setShowCreatePostModal(false)}>
                    <CreatePost
                        forumId={forum.id}
                        onClose={() => setShowCreatePostModal(false)} // optional callback
                    />
                </Modal>
            )}

        </div>
    );
};

export default ForumDetailPage;