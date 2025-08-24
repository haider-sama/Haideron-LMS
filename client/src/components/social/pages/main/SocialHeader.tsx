import React from "react";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import ForumUserDropdown from "../account/ForumUserDropdown";
import { useAuth } from "../../../../hooks/auth/useAuth";
import { ReleaseBadge } from "../../../ui/ReleaseBadge";
import { GLOBAL_TITLE } from "../../../../constants";
import SearchBar from "../../../ui/SearchBar";
import SocialBreadcrumbs from "../../ui/SocialBreadcrumbs";


const SocialHeader: React.FC = () => {
    const { user, isLoggedIn, handleLogout } = useAuth();

    return (
        <div className="bg-gray-50 text-white shadow-md">
            <div className="border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="text-xl font-semibold tracking-wide flex items-center text-primary antialiased">
                        <span className="drop-shadow-sm">{GLOBAL_TITLE}</span>
                        <ReleaseBadge />
                    </div>
                    <div className="flex items-center gap-4">
                        <SearchBar
                            value={""}
                            onSearch={(query: string) => {
                                console.log('Search:', query);
                            }}
                        />
                        <div className="flex items-center gap-4">
                            {isLoggedIn && user ? (
                                <ForumUserDropdown
                                    username={
                                        user.forumProfile?.username ??
                                        user.forumProfile?.displayName ??
                                        user.firstName ??
                                        "Unknown User" // final fallback
                                    }
                                    email={user.email ?? ""}
                                    avatarUrl={user?.avatarURL ?? undefined}  // normalize null -> undefined
                                    onLogout={handleLogout}
                                />
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        title="Login"
                                        className="text-gray-600 hover:text-gray-800 transition"
                                    >
                                        <FaSignInAlt size={24} />
                                    </Link>
                                    <Link
                                        to="/register"
                                        title="Register"
                                        className="text-gray-600 hover:text-gray-800 transition"
                                    >
                                        <FaUserPlus size={24} />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-4">
                <SocialBreadcrumbs />
            </div>
        </div>
    );
};

export default SocialHeader;