import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Modal from "../ui/Modal";
import { FiLoader } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";

interface ProtectedRouteProps {
    element: React.ReactNode;
    isAllowed: boolean;
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    element,
    isAllowed,
    redirectTo = "/",
}) => {
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const queryClient = useQueryClient();

    // Handle offline/online events
    useEffect(() => {
        const handleOffline = () => setShowConnectionModal(true);

        const handleOnline = () => {
            setShowConnectionModal(false);
            // Retry all queries that failed or are stale
            queryClient.getQueryCache().getAll().forEach((query) => {
                const state = query.state;
                if (state.status === "error" || query.isStale()) {
                    query.fetch(); // correct v5 method
                }
            });
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        // Initial check
        if (!navigator.onLine) setShowConnectionModal(true);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, [queryClient]);

    // Optionally, listen for global query errors to show modal for DB/API down
    useEffect(() => {
        const handleOffline = () => setShowConnectionModal(true);

        const handleOnline = () => {
            // Try refetching all failed/stale queries
            queryClient.getQueryCache().getAll().forEach((query) => {
                const state = query.state;
                if (state.status === "error" || query.isStale()) {
                    query.fetch();
                }
            });
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        if (!navigator.onLine) setShowConnectionModal(true);

        // Subscribe to query cache events
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            if ("query" in event) {
                const query = event.query;

                // Show modal on any query error
                if (query.state.status === "error") {
                    setShowConnectionModal(true);
                }

                // Hide modal automatically when all queries are successful
                const anyError = queryClient.getQueryCache().getAll().some(
                    (q) => q.state.status === "error"
                );
                if (!anyError && navigator.onLine) {
                    setShowConnectionModal(false);
                }
            }
        });

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            unsubscribe();
        };
    }, [queryClient]);

    // Redirect only if user is not allowed AND no connection issues
    if (!isAllowed && !showConnectionModal) {
        return <Navigate to={redirectTo} replace />;
    }

    return (
        <>
            {element}
            <Modal
                isOpen={showConnectionModal}
                onClose={() => setShowConnectionModal(false)} // now it can close manually
            >
                <div className="flex flex-col items-center gap-4 p-6">
                    <FiLoader className="animate-spin text-5xl text-blue-500" />
                    <span className="text-lg font-medium">
                        Trying to reconnect...
                    </span>
                </div>
            </Modal>
        </>
    );
};

export default ProtectedRoute;
