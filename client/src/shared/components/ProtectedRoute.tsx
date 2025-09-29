import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
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
    const [showConnectionModal, setShowConnectionModal] = useState(!navigator.onLine);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Handle offline/online + query cache events
    useEffect(() => {
        const handleOffline = () => setShowConnectionModal(true);

        const handleOnline = () => {
            setShowConnectionModal(false);
            // Retry all queries that failed or are stale
            queryClient.getQueryCache().getAll().forEach((query) => {
                if (query.state.status === "error" || query.isStale()) {
                    query.fetch();
                }
            });
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        // Subscribe to query cache events
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            if ("query" in event) {
                const query = event.query;

                if (query.state.status === "error") {
                    setShowConnectionModal(true);
                }

                const anyError = queryClient
                    .getQueryCache()
                    .getAll()
                    .some((q) => q.state.status === "error");

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

    // Defer redirect to after render
    useEffect(() => {
        if (!isAllowed && !showConnectionModal) {
            setShouldRedirect(true);
        }
    }, [isAllowed, showConnectionModal]);

    // Perform navigation once we decide to redirect
    useEffect(() => {
        if (shouldRedirect) {
            navigate(redirectTo, { replace: true });
        }
    }, [shouldRedirect, navigate, redirectTo]);

    if (shouldRedirect) {
        return (
            <div className="flex justify-center items-center h-screen">
                <FiLoader className="animate-spin text-4xl text-blue-500" />
            </div>
        );
    }

    return (
        <>
            {element}
            <Modal
                isOpen={showConnectionModal}
                onClose={() => setShowConnectionModal(false)}
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