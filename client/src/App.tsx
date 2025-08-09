import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"
import { AudienceEnum } from "../../server/src/shared/enums";
import { useToast } from "./context/ToastContext";
import { useEffect } from "react";
import Spinner from "./components/ui/Spinner";
import useAutoRefreshToken from "./hooks/useAutoRefreshToken";
import { setToastBridge } from "./lib/toastBridge";
import { useTheme } from "./hooks/useTheme";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "./hooks/auth/useAuth";
import { useDashboards } from "./hooks/auth/useDashboards";

function App() {
    const { user, isLoggedIn, hasCheckedAuth } = useAuth();
    const toast = useToast();
    const { mode, hydrate, isHydrated } = useTheme();

    // First load only: hydrate theme
    useEffect(() => {
        const stored = localStorage.getItem("theme") as "light" | "dark" | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const final = stored || (prefersDark ? "dark" : "light");
        hydrate(final);
    }, []);

    // Only apply after hydration
    useEffect(() => {
        if (!isHydrated) return;
        document.documentElement.classList.toggle("dark", mode === "dark");
        localStorage.setItem("theme", mode);
    }, [mode, isHydrated]);

    useAutoRefreshToken();

    useEffect(() => {
        setToastBridge((type, message) => {
            toast[type](message);
        });
    }, [toast]);

    // Load dashboards using role
    const { faculty, student, head } = useDashboards(user?.role, isLoggedIn);

    const isDashboardLoading =
        (user?.role === AudienceEnum.Student && student.isLoading) ||
        (user?.role === AudienceEnum.DepartmentTeacher && faculty.isLoading) ||
        (user?.role === AudienceEnum.DepartmentHead && head.isLoading);

    if (!hasCheckedAuth || isDashboardLoading) return <Spinner />;

    return (
        <>
            <BrowserRouter>
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
                    <AppRoutes isLoggedIn={isLoggedIn} role={user?.role ?? AudienceEnum.User} />
                </GoogleOAuthProvider>
            </BrowserRouter>
        </>
    )
}

export default App;