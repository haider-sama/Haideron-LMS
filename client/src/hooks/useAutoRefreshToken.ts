import { useEffect } from "react";
import clientApi from "../features/auth/services/clientApi";

export default function useAutoRefreshToken() {
    useEffect(() => {
        // Refresh every 10 minutes
        const interval = setInterval(() => {
            clientApi.post("/api/v1/auth/refresh-token").catch((err) => {
                console.error("Auto-refresh failed:", err);
            });
        }, 10 * 60 * 1000); // 10 minutes

        // Refresh when tab becomes visible again
        // const handleVisibility = () => {
        //     if (document.visibilityState === "visible") {
        //         clientApi.post("/api/v1/auth/refresh-token").catch((err) => {
        //             console.error("Visibility refresh failed:", err);
        //         });
        //     }
        // };

        // document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            // document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);
}
