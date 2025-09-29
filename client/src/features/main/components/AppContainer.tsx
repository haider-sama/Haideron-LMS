import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/pages/core/main/sidebar/Sidebar";
import { useSettings } from "../../../hooks/admin/useSettings";
import MaintenanceBanner from "../../../components/permissions/MaintenanceBanner";
import Header from "./Header";
import BreadcrumbHeader from "../../../components/ui/BreadcrumbHeader";
import { useBreadcrumbs } from "../../../shared/context/BreadcrumbContext";
import { useEffect } from "react";

export const AppContainer = () => {
    const { publicSettings } = useSettings(); // fetch public settings (user mode)
    const { crumbs, setDefaultCrumbs } = useBreadcrumbs();

    // Generate default breadcrumbs on route change
    useEffect(() => {
        setDefaultCrumbs(location.pathname);
    }, [location.pathname, setDefaultCrumbs]);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <MaintenanceBanner enabled={publicSettings?.maintenanceMode} />

            <Header />
            {crumbs.length > 0 && <BreadcrumbHeader items={crumbs} />}

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
