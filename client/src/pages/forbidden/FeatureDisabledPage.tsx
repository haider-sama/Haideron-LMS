import React from "react";
import { FiArrowLeft } from "react-icons/fi";
import { getButtonClass } from "../../components/ui/ButtonClass";

interface FeatureDisabledPageProps {
    heading?: string;
    message?: string;
    homeUrl?: string;
}

const FeatureDisabledPage: React.FC<FeatureDisabledPageProps> = ({
    heading = "Feature Disabled",
    message = "This feature has been disabled by the administrators. Please contact them for access or more information.",
    homeUrl = "/",
}) => {
    const imageUrl = "/no-entry.png"; // illustration

    return (
        <div className="flex items-center justify-center py-8 bg-gray-50 dark:bg-darkSurface">
            <div className="text-center flex flex-col items-center px-4">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt="Feature Disabled"
                        className="w-40 h-40 object-contain mb-4"
                    />
                )}

                <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {heading}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md text-md leading-snug mb-6">
                    {message}
                </p>

                <a
                    href={homeUrl}
                    className={getButtonClass({
                        bg: "bg-blue-500",
                        hoverBg: "hover:bg-blue-600",
                        text: "text-white",
                        hoverText: "hover:text-white",
                        focusRing: "focus:ring-4 focus:ring-blue-300",
                        extra: "flex items-center justify-center mx-auto px-4 py-2 rounded-md",
                    })}
                >
                    <FiArrowLeft className="mr-2 text-lg" />
                    Go Home
                </a>
            </div>
        </div>
    );
};

export default FeatureDisabledPage;