import React from "react";
import { useLocation, matchPath } from "react-router-dom";
import { FaChartBar, FaUser, FaUsers } from "react-icons/fa";
import { GLOBAL_TITLE } from "../../../../constants";
import { getForumFooterInfo } from "../../../../api/social/forum/forum-user-api";
import { useQuery } from "@tanstack/react-query";

export const ForumFooter: React.FC = () => {
    const location = useLocation();
    const pathname = location.pathname;

    // Match routes
    const isMainPage = pathname === "/forums";
    const isForumView = matchPath("/forums/:slug", pathname);
    const isPostView = matchPath("/forums/:forumSlug/:postSlug", pathname);

    const shouldShowForumFooter = isForumView || isPostView;

    const shouldShowMainContent = isMainPage;
    const shouldShowForumContent = shouldShowForumFooter;

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    
    const { data, isLoading, isError } = useQuery({
        queryKey: ["forumFooterInfo"],
        queryFn: getForumFooterInfo,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // replaces cacheTime
        retry: false,
        refetchOnWindowFocus: false,
        enabled: isOnline,        // disables fetching when offline
    });

    return (
        <div className="bg-gray-100 border-t border-gray-300 text-sm text-gray-700 p-4 space-y-4">
            {(shouldShowMainContent || shouldShowForumContent) && !isLoading && !isError && data && (
                <>
                    {shouldShowMainContent && (
                        <>
                            <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FaUsers /> Who is online
                                </h4>
                                <p>
                                    In total there are <strong>{data.online.total}</strong> users online ::
                                    <strong> {data.online.registered}</strong> registered,{" "}
                                    <strong>{data.online.hidden}</strong> hidden and{" "}
                                    <strong>{data.online.guests}</strong> guests
                                </p>
                                <p>
                                    Registered users:{" "}
                                    {data.registeredUsernames.length > 0 ? data.registeredUsernames.join(", ") : "None"}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FaChartBar /> Statistics
                                </h4>
                                <p>
                                    Total posts <strong>{data.statistics.totalPosts.toLocaleString()}</strong> • Total topics{" "}
                                    <strong>{data.statistics.totalTopics.toLocaleString()}</strong> • Total members{" "}
                                    <strong>{data.statistics.totalMembers.toLocaleString()}</strong>
                                    <br />
                                    Our newest member <strong>{data.statistics.newestMember}</strong>
                                </p>
                            </div>
                        </>
                    )}

                    {shouldShowForumContent && (
                        <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FaUser /> Who is online
                            </h4>
                            <p>
                                Users browsing this forum:{" "}
                                <em>
                                    {data.online.registered === 0
                                        ? "No registered users"
                                        : `${data.online.registered} registered user(s)`}{" "}
                                    and {data.online.guests} guest(s)
                                </em>
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Shared Bottom Info */}
            <div className="border-t border-gray-300 pt-4 text-xs text-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    Built by <strong>Haider-sama</strong> for the {GLOBAL_TITLE} LMS Forum Module.
                    <br />
                    Designed & developed with dedication to learning.
                </div>
                {/*TODO: add admin settings to allow/display these pages using backend*/}
                {/* <div className="flex gap-4 text-blue-600 underline">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="#">Forum Rules</a>
                </div> */}
            </div>
        </div>
    );
};