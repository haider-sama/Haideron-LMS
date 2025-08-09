import React from "react";
import { useToast } from "../../context/ToastContext";
import { FiLogOut } from "react-icons/fi";
import { getButtonClass } from "../ui/ButtonClass";
import { useDeleteSession, useLogoutAllDevices, useSessions } from "../../hooks/auth/useSessions";
import { useAuth } from "../../hooks/auth/useAuth";
import { UserSession } from "../../constants/core/interfaces";

const SecuritySettings: React.FC = () => {
    const toast = useToast();
    const { user, handleLogout } = useAuth();
    const { data: sessions } = useSessions(!!user);
    const deleteSession = useDeleteSession();
    const logoutAll = useLogoutAllDevices();

    const handleLogoutAllDevices = async () => {
        try {
            await logoutAll.mutateAsync();
            toast.success("Logged out from all devices");
        } catch (err: any) {
            toast.error("Error while logging out from all devices");
        }
    };

    const handleLogoutSingleDevice = async (sessionId: string) => {
        try {
            await deleteSession.mutateAsync(sessionId);
            toast.success("Logged out from this device");
        } catch (err: any) {
            toast.error("Error while logging out from this device");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-darkTextPrimary mb-2">
                    Security Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-darkTextSecondary">
                    Manage your active sessions and log out from devices you no longer use.
                </p>
            </div>

            <div className="bg-gray-50 dark:bg-darkSurface border border-gray-200 dark:border-darkBorderLight rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800 dark:text-darkTextPrimary">Log Out</h3>
                        <p className="text-sm text-gray-600 dark:text-darkTextSecondary">
                            You are logged in as <span className="font-medium">{user?.email}</span>.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className={getButtonClass({
                        bg: "bg-red-600",
                        hoverBg: "hover:bg-white dark:hover:bg-transparent",
                        text: "text-white",
                        hoverText: "hover:text-red-600 dark:hover:text-red-400",
                        focusRing: "focus:ring-4 focus:ring-red-300",
                        extra: "w-full sm:w-fit px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200 border border-gray-200 dark:border-darkBorderLight",
                    })}
                >
                    <FiLogOut />
                    Log Out of This Device
                </button>

                <div className="flex items-center gap-4 mb-4 mt-6">
                    <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800 dark:text-darkTextPrimary">
                            Log Out of All Devices
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-darkTextSecondary">
                            You are logged in as <span className="font-medium">{user?.email}</span>.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogoutAllDevices}
                    className={getButtonClass({
                        bg: "bg-yellow-500",
                        hoverBg: "hover:bg-white dark:hover:bg-transparent",
                        text: "text-white",
                        hoverText: "hover:text-yellow-600 dark:hover:text-yellow-400",
                        focusRing: "focus:ring-4 focus:ring-yellow-300",
                        extra: "w-full sm:w-fit px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200 border border-gray-200 dark:border-darkBorderLight",
                    })}
                >
                    <FiLogOut />
                    Log Out of All Devices
                </button>
                <p className="text-xs text-gray-600 dark:text-darkTextMuted mt-1">
                    This will log you out from every device where your account is signed in. Useful if you lost access to a device or suspect unauthorized access.
                </p>
            </div>

            {sessions && sessions.length > 0 && (
                <div className="bg-gray-50 dark:bg-darkSurface border border-gray-200 dark:border-darkBorderLight rounded-xl p-6 shadow-sm">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-darkTextPrimary mb-2">
                        Active Sessions
                    </h3>
                    <ul className="space-y-4">
                        {sessions.map((session: UserSession, idx: number) => (
                            <li
                                key={idx}
                                className="relative flex items-start justify-between border rounded-lg p-4 bg-white dark:bg-darkMuted dark:border-darkBorderLight shadow-sm"
                            >
                                <div>
                                    <p className="text-sm text-gray-800 dark:text-darkTextPrimary font-medium">
                                        {(session.userAgent?.device || "Unknown Device")} · {(session.userAgent?.os || "Unknown OS")}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-darkTextSecondary">
                                        {session.userAgent?.browser}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-darkTextSecondary">
                                        IP: {session.ip || "Unknown"}
                                        {session.userAgent?.location && ` · ${session.userAgent.location}`}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-darkTextMuted">
                                        Last active:{" "}
                                        {session.updatedAt
                                            ? new Date(session.updatedAt).toLocaleString()
                                            : "Unknown"}
                                    </p>
                                </div>
                                {idx === 0 ? (
                                    <span className="text-green-600 text-xs font-medium px-2 py-1 bg-green-100 dark:bg-opacity-10 rounded">
                                        This device
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleLogoutSingleDevice(session._id)}
                                        className="absolute bottom-4 right-4 text-xs text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                    >
                                        Log out of this device
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

    );

};

export default SecuritySettings;
