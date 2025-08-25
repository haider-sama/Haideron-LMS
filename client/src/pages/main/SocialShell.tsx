import { Outlet } from "react-router-dom";
import SocialHeader from "../../components/social/pages/main/SocialHeader";
import { ForumFooter } from "../../components/social/pages/main/ForumFooter";
import MaintenanceBanner from "../../components/permissions/MaintenanceBanner";
import { useSettings } from "../../hooks/admin/useSettings";

export const SocialShell = () => {
    const { publicSettings } = useSettings(); // user-mode public settings

    return (
        <div className="min-h-screen flex flex-col dark:bg-darkSurface dark:text-darkTextPrimary overflow-hidden">
            <MaintenanceBanner enabled={publicSettings?.maintenanceMode} />

            <header className="shrink-0">
                <SocialHeader />
            </header>

            <main className="flex-1 flex flex-col overflow-y-auto px-4 py-6">
                <Outlet />
            </main>

            <footer className="shrink-0">
                <ForumFooter />
            </footer>
        </div>
    );
};

export default SocialShell;