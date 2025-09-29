import React from "react";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { ALLOW_PUBLIC_REGISTRATION, GLOBAL_TITLE } from "../../../shared/constants";
import UserDropdown from "./UserDropdown";
import { Button } from "../../../components/ui/Button";

const Header: React.FC = () => {
    const { user, isLoggedIn, handleLogout } = useAuth();

    return (
        <header className="bg-primary">
            <div className="mx-auto px-8 py-2 flex items-center justify-between">

                <div className="flex items-center gap-2 text-xl font-medium tracking-wide text-primary antialiased">
                    <span
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                        className="drop-shadow-sm text-white"
                    >
                        {GLOBAL_TITLE}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {isLoggedIn && user ? (
                        <UserDropdown
                            fullName={user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'N/A'}
                            onLogout={handleLogout}
                            email={user.email}
                            avatarUrl={user.avatarURL}
                        />
                    ) : (
                        <>
                            <Link to="/login" title="Login" className="w-fit">
                                <Button
                                    variant="gray"
                                    size="sm"
                                    fullWidth={false}
                                    icon={<FaSignInAlt size={14} />}
                                >
                                    Login
                                </Button>
                            </Link>

                            {ALLOW_PUBLIC_REGISTRATION === true && (
                                <Link to="/register" title="Register" className="w-fit">
                                    <Button
                                        variant="green"
                                        size="sm"
                                        fullWidth={false}
                                        icon={<FaUserPlus size={14} />}
                                    >
                                        Register
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
