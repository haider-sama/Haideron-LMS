import React from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";

interface MaintenanceBannerProps {
    enabled?: boolean;
    message?: string;
}

const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({
    enabled = false,
    message = "The application is currently in maintenance mode. Some features may be unavailable.",
}) => {
    if (!enabled) return null;

    return (
        <div className="flex items-center justify-center w-full bg-green-600 text-white py-2 px-6 gap-2 shadow-md">
            {/* Icon */}
            <AiOutlineCheckCircle className="w-6 h-6 flex-shrink-0 animate-pulse" />

            {/* Message */}
            <span className="text-sm md:text-base font-medium">
                {message}
            </span>
        </div>
    );
};

export default MaintenanceBanner;
