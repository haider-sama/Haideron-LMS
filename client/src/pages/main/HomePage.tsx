import React from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiLogIn } from "react-icons/fi";
import { getButtonClass } from "../../components/ui/ButtonClass";
import { usePermissions } from "../../hooks/usePermissions";

const HomePage: React.FC = () => {
    const { user, isLoggedIn } = usePermissions();

    return (
        <div className="min-h-screen text-primary flex items-center justify-center px-4">
            <div className="max-w-4xl text-center space-y-12">
                {/* Hero Section */}
                <header className="space-y-6">
                    {isLoggedIn && user ? (
                        <>
                            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                                Welcome back, <span className="text-accent">{user.firstName || "User"}</span>
                            </h1>
                            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
                                Access your courses, track progress, and make the most of your learning journey with A LMS.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl font-bold leading-tight">
                                A <span className="text-accent">REVOLUTION</span> is in progress...
                            </h1>
                            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
                                A modern, lightweight outcome-based learning management system designed for universities and educators to manage courses, students, and assessments with ease.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                                <Link to="/register" className="w-full sm:w-auto">
                                    <button
                                        className={getButtonClass({
                                            bg: "bg-primary",
                                            hoverBg: "hover:bg-white",
                                            text: "text-white",
                                            hoverText: "hover:text-primary",
                                            focusRing: "focus:ring-4 focus:ring-gray-200",
                                            extra: "w-full text-sm px-5 py-2 transition-all duration-200 font-medium rounded flex items-center justify-center gap-2",
                                        })}
                                    >
                                        <FiBookOpen className="w-5 h-5" />
                                        Get Started
                                    </button>
                                </Link>

                                <Link to="/login" className="w-full sm:w-auto">
                                    <button
                                        className={getButtonClass({
                                            bg: "bg-white",
                                            hoverBg: "hover:bg-primary",
                                            text: "text-primary",
                                            hoverText: "hover:text-white",
                                            focusRing: "focus:ring-4 focus:ring-gray-200",
                                            extra: "w-full text-sm px-5 py-2 transition-all duration-200 font-medium rounded border border-gray-300 flex items-center justify-center gap-2",
                                        })}
                                    >
                                        <FiLogIn className="w-5 h-5" />
                                        Login
                                    </button>
                                </Link>
                            </div>
                        </>
                    )}
                </header>

            </div>

        </div>
    );
};

export default HomePage;
