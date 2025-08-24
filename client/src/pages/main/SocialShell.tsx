import { Outlet } from "react-router-dom";
import SocialHeader from "../../components/social/pages/main/SocialHeader";
import { ForumFooter } from "../../components/social/pages/main/ForumFooter";

export const SocialShell = () => {
    return (
        <div className="min-h-screen flex flex-col dark:bg-darkSurface dark:text-darkTextPrimary">
            {/* Top Header */}
            <header className="shrink-0">
                <SocialHeader />
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-6">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="shrink-0">
                <ForumFooter />
            </footer>
        </div>
    );
};


export default SocialShell;
