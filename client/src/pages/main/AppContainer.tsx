import { Outlet } from "react-router-dom";
import Sidebar from "../../components/pages/core/main/sidebar/Sidebar";
import { useSettings } from "../../hooks/admin/useSettings";
import MaintenanceBanner from "../../components/permissions/MaintenanceBanner";

export const AppContainer = () => {
    const { publicSettings } = useSettings(); // fetch public settings (user mode)

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <MaintenanceBanner enabled={publicSettings?.maintenanceMode} />

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto dark:bg-darkSurface dark:text-darkTextPrimary">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppContainer;
