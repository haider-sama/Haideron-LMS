import React from "react";
import { useToast } from "../../../../shared/context/ToastContext";
import { FiLogOut } from "react-icons/fi";
import { useDeleteSession, useLogoutAllDevices, useSessions } from "../../hooks/useSessions";
import { useAuth } from "../../hooks/useAuth";
import { UserSession } from "../../../../../../server/src/shared/interfaces";
import { Button } from "../../../../components/ui/Button";

const SkeletonSession: React.FC = () => (
    <div className="relative flex flex-col border rounded-lg p-4 bg-white shadow-sm animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
    </div>
);

const SecuritySettings: React.FC = () => {
    const toast = useToast();
    const { user, handleLogout } = useAuth();
    const { data: sessions, isLoading } = useSessions(!!user);
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Security Settings
                </h2>
                <p className="text-sm text-gray-600">
                    Manage your active sessions and log out from devices you no longer use.
                </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                {/* Current Device */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800">Log Out</h3>
                        <p className="text-sm text-gray-600">
                            You are logged in as <span className="font-medium">{user?.email}</span>.
                        </p>
                    </div>
                </div>

                <Button
                    variant="gray"
                    size="sm"
                    fullWidth={false}
                    onClick={handleLogout}
                    icon={<FiLogOut size={16} />}
                >
                    Log Out of This Device
                </Button>

                {/* Logout All Devices */}
                <div className="flex items-center gap-4 mb-4 mt-6">
                    <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800">
                            Log Out of All Devices
                        </h3>
                        <p className="text-sm text-gray-600">
                            You are logged in as <span className="font-medium">{user?.email}</span>.
                        </p>
                    </div>
                </div>

                <Button
                    variant="red"
                    size="sm"
                    fullWidth={false}
                    onClick={handleLogoutAllDevices}
                    icon={<FiLogOut size={16} />}
                >
                    Log Out of All Devices
                </Button>
                <p className="text-xs text-gray-600 mt-1">
                    This will log you out from every device where your account is signed in. Useful if you lost access to a device or suspect unauthorized access.
                </p>
            </div>

            {/* Active Sessions */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-md font-semibold text-gray-800 mb-4">
                    Active Sessions
                </h3>

                <ul className="space-y-4">
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, idx) => <SkeletonSession key={idx} />)
                        : sessions?.map((session: UserSession, idx: number) => (
                            <li
                                key={idx}
                                className="relative flex items-start justify-between border rounded-lg p-4 bg-white shadow-sm"
                            >
                                <div>
                                    <p className="text-sm text-gray-800 font-medium">
                                        {(session.userAgent?.device || "Unknown Device")} · {(session.userAgent?.os || "Unknown OS")}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {session.userAgent?.browser}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Last active:{" "}
                                        {session.updatedAt
                                            ? new Date(session.updatedAt).toLocaleString()
                                            : "Unknown"}
                                    </p>
                                </div>
                                {idx === 0 ? (
                                    <span className="text-green-600 text-xs font-medium px-2 py-1 bg-green-100 rounded">
                                        This device
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleLogoutSingleDevice(session.id)}
                                        className="absolute bottom-4 right-4 text-xs text-red-600 border border-red-600 px-2 py-1 rounded hover:bg-red-50 transition-all"
                                    >
                                        Log out of this device
                                    </button>
                                )}
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
};

export default SecuritySettings;
