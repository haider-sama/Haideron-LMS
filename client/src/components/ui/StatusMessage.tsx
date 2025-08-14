import { FiLoader, FiAlertCircle, FiInfo } from "react-icons/fi";
import { ReactNode } from "react";

interface StatusMessageProps {
    status: "idle" | "loading" | "error" | "success";
    error?: unknown;
    loadingText?: string;
    errorText?: string;
    className?: string;
    children?: ReactNode; // for empty or fallback message display
}

export const StatusMessage = ({
    status,
    error,
    loadingText = "Loading...",
    errorText = "Something went wrong.",
    className = "",
    children,
}: StatusMessageProps) => {
    if (status === "loading") {
        return (
            <div className={`flex items-center gap-2 text-gray-600 animate-pulse ${className}`}>
                <FiLoader className="animate-spin" />
                <span>{loadingText}</span>
            </div>
        );
    }

    if (status === "error") {
        const message = (error as any)?.message || errorText;
        return (
            <div className={`flex items-center gap-2 text-red-600 ${className}`}>
                <FiAlertCircle />
                <span>{message}</span>
            </div>
        );
    }

    if (status === "success" && children) {
        return (
            <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
                <FiInfo />
                <span>{children}</span>
            </div>
        );
    }

    return null;
};
