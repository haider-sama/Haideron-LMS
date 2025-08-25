import React from "react";
import { useLocation, matchPath } from "react-router-dom";
import { FaChartBar, FaUser, FaUsers } from "react-icons/fa";
import { GLOBAL_TITLE } from "../../../../constants";
import { getForumFooterInfo } from "../../../../api/social/forum/forum-user-api";
import { useQuery } from "@tanstack/react-query";

export const ForumFooter: React.FC = () => {
    const location = useLocation();
    const pathname = location.pathname;

    const isMainPage = pathname === "/forums";
    const isForumView = matchPath("/forums/:slug", pathname);
    const isPostView = matchPath("/forums/:forumSlug/:postSlug", pathname);

    const shouldShowForumFooter = isForumView || isPostView;
    const shouldShowMainContent = isMainPage;
    const shouldShowForumContent = shouldShowForumFooter;

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // Always fetch forum footer info (or fallback to empty/default values)
    const { data} = useQuery({
        queryKey: ["forumFooterInfo"],
        queryFn: getForumFooterInfo,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
        enabled: isOnline,
        initialData: {
            online: { total: 0, registered: 0, hidden: 0, guests: 0 },
            registeredUsernames: [],
            statistics: { totalPosts: 0, totalTopics: 0, totalMembers: 0, newestMember: "N/A" },
        },
    });

    const footerData = data || {
        online: { total: 0, registered: 0, hidden: 0, guests: 0 },
        registeredUsernames: [],
        statistics: { totalPosts: 0, totalTopics: 0, totalMembers: 0, newestMember: "N/A" },
    };


    return (
        <div className="bg-gray-100 border-t border-gray-300 text-sm text-gray-700 p-4 space-y-4">
            {(shouldShowMainContent || shouldShowForumContent) && (
                <>
                    {shouldShowMainContent && (
                        <>
                            <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FaUsers /> Who is online
                                </h4>
                                <p>
                                    In total there are <strong>{footerData.online.total}</strong> users online ::
                                    <strong> {footerData.online.registered}</strong> registered,{" "}
                                    <strong>{footerData.online.hidden}</strong> hidden and{" "}
                                    <strong>{footerData.online.guests}</strong> guests
                                </p>
                                <p>
                                    Registered users:{" "}
                                    {footerData.registeredUsernames.length > 0
                                        ? footerData.registeredUsernames.join(", ")
                                        : "None"}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FaChartBar /> Statistics
                                </h4>
                                <p>
                                    Total posts <strong>{footerData.statistics.totalPosts.toLocaleString()}</strong> •
                                    Total topics <strong>{footerData.statistics.totalTopics.toLocaleString()}</strong> •
                                    Total members <strong>{footerData.statistics.totalMembers.toLocaleString()}</strong>
                                    <br />
                                    Our newest member <strong>{footerData.statistics.newestMember}</strong>
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
                                    {footerData.online.registered === 0
                                        ? "No registered users"
                                        : `${footerData.online.registered} registered user(s)`}{" "}
                                    and {footerData.online.guests} guest(s)
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
