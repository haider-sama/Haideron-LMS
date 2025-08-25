import { useEffect, useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { ForumStatusEnum, ForumTypeEnum } from "../../../../../server/src/shared/social.enums";
import { useToast } from "../../../context/ToastContext";
import { AddForum, getAllowedForumTypesForAudience } from "../../../components/social/pages/forum/AddForum";
import { AudienceEnum } from "../../../../../server/src/shared/enums";
import { useNavigate } from "react-router-dom";
import { Post } from "../../../constants/social/interfaces";
import { getForums } from "../../../api/social/forum/forum-api";
import { MAX_PAGE_LIMIT } from "../../../constants";
import { filterPostsByForumId } from "../../../api/social/post/post-api";
import { useQueries, useQuery } from "@tanstack/react-query";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { SelectInput } from "../../../components/ui/Input";
import { FiPlus } from "react-icons/fi";
import SearchBar from "../../../components/ui/SearchBar";
import ForumContainer from "../../../components/social/pages/forum/ForumContainer";
import { Pagination } from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import RequestForumCreation from "../../../components/social/pages/forum/RequestFormCreation";
import FeatureDisabledPage from "../../forbidden/FeatureDisabledPage";
import { useSettings } from "../../../hooks/admin/useSettings";


const ForumPage: React.FC = () => {
    const { user, isLoggedIn, isAdmin, isCommunityAdmin } = usePermissions();
    const [showCreateForumModal, setShowCreateForumModal] = useState(false);
    const [type, setType] = useState<ForumTypeEnum | undefined>(undefined);
    const [status, setStatus] = useState<ForumStatusEnum | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [showMyForums, setShowMyForums] = useState(false);
    const toast = useToast();
    const allowedForumTypes = getAllowedForumTypesForAudience(user?.role as AudienceEnum);
    const [showArchived, setShowArchived] = useState(false);

    const navigate = useNavigate();

    const { publicSettings, isLoading: isSettingsLoading } = useSettings(); // user-mode public settings
    const isForumsEnabled = publicSettings?.allowForums ?? false;

    // --- Main forums query ---
    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: [
            "forums",
            type,
            status,
            searchQuery,
            page,
            showArchived,
            showMyForums,
            user?.id,
        ],
        queryFn: () =>
            getForums({
                page,
                limit: MAX_PAGE_LIMIT,
                type,
                status,
                search: searchQuery,
                showArchived, // boolean
                createdBy: showMyForums ? user?.id : undefined,
            }),
        staleTime: 1000 * 60,
        enabled: isForumsEnabled,
    });

    // Trigger toast in useEffect, not in queryFn
    useEffect(() => {
        if (isError) {
            toast.error((error as any)?.message || "Failed to load forums");
        }
    }, [isError, error]);

    const forumIds = data?.forums?.map(f => f.id) ?? [];

    // --- Post count queries for each forum ---
    const postCountQueries = useQueries({
        queries: forumIds.map(forumId => ({
            queryKey: ["forum-posts", forumId],
            queryFn: () =>
                filterPostsByForumId(forumId, {
                    limit: 1,
                    lastPostCreatedAt: new Date().toISOString()
                }),
            staleTime: 1000 * 60,
            retry: 2,
            enabled: isForumsEnabled,
        })),
    });

    // Compute forumPostCounts aligned with API response
    const forumPostCounts: Record<
        string,
        { isLoading: boolean; isError: boolean; count: number; latestPost: Post | null }
    > = {};

    postCountQueries.forEach((query, index) => {
        const forumId = forumIds[index];
        const latestPost = query.data?.posts?.[0] ?? null;

        forumPostCounts[forumId] = {
            isLoading: query.isLoading ?? false,
            isError: query.isError ?? false,
            count: query.data?.posts?.length ?? 0,
            latestPost,
        };
    });

    // Reset page to 1 when filter/search changes
    useEffect(() => {
        setPage(1);
    }, [type, status, searchQuery, showArchived]);

    if (isSettingsLoading) {
        return <TopCenterLoader />;
    }

    if (!isForumsEnabled) {
        return <FeatureDisabledPage
            heading="Forums Disabled"
            message="The forums feature has been disabled by the administrators. Please contact them for more information."
            homeUrl="/"
        />;
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Forums</h1>

                    {isFetching && <TopCenterLoader />}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">

                        {user && (
                            <label className="inline-flex items-center text-xs gap-2">
                                <input
                                    type="checkbox"
                                    checked={showMyForums}
                                    onChange={(e) => setShowMyForums(e.target.checked)}
                                    className="form-checkbox"
                                />
                                My Forums
                            </label>
                        )}

                        {(isAdmin || isCommunityAdmin) && (
                            <label className="inline-flex items-center text-xs gap-2">
                                <input
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)}
                                    className="form-checkbox"
                                />
                                Show Archived
                            </label>
                        )}

                        <SelectInput
                            name="type"
                            className="text-xs"
                            value={type ?? "all"}
                            onChange={(e) =>
                                setType(e.target.value === "" ? undefined : (e.target.value as ForumTypeEnum))
                            }
                            options={[
                                { label: "All Forums", value: "" },
                                ...allowedForumTypes.map((type) => ({
                                    label: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                                    value: type,
                                })),
                            ]}
                        />

                        {isAdmin && (
                            <SelectInput
                                name="status"
                                className="text-xs"
                                value={status ?? "all"}
                                onChange={(e) =>
                                    setStatus(e.target.value === "" ? undefined : (e.target.value as ForumStatusEnum))
                                }
                                options={[
                                    { label: "All Statuses", value: "" },
                                    ...Object.values(ForumStatusEnum).map((statusValue) => ({
                                        label: statusValue.charAt(0).toUpperCase() + statusValue.slice(1),
                                        value: statusValue,
                                    })),
                                ]}
                            />
                        )}


                        {isLoggedIn ? (
                            <button
                                onClick={() => setShowCreateForumModal(true)}
                                className="inline-flex items-center justify-center gap-2 px-2 py-1 bg-gray-50 border border-gray-300 text-primary
                                rounded shadow-sm text-sm hover:bg-gray-100 hover:border-gray-400 whitespace-nowrap"
                            >
                                <FiPlus className="text-sm" />
                                {isAdmin || isCommunityAdmin ? "Add Forum" : "Request Forum"}
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/login")}
                                className="inline-flex items-center justify-center gap-2 px-2 py-1 bg-white border border-gray-300 text-gray-500
                                rounded shadow-sm text-sm hover:bg-gray-50 hover:border-gray-400 whitespace-nowrap"
                            >
                                <FiPlus className="text-sm" />
                                Login to Create Forum
                            </button>
                        )}

                        <SearchBar onSearch={(q) => setSearchQuery(q)} value={""} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <ForumContainer
                        data={data}
                        isLoading={isLoading}
                        isError={isError}
                        forumPostCounts={forumPostCounts}
                    />
                </div>

                {data?.meta && (
                    <div className="flex justify-end">
                        <Pagination
                            currentPage={data.meta.page}
                            totalPages={data.meta.pages}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}

                {showCreateForumModal && (
                    <Modal isOpen={showCreateForumModal} onClose={() => setShowCreateForumModal(false)}>
                        {isAdmin ? (
                            <AddForum audience={user?.role as AudienceEnum} />
                        ) : (
                            <RequestForumCreation audience={user?.role as AudienceEnum} />
                        )}
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default ForumPage;