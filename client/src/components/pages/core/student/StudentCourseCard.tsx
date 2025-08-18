import React, { useMemo } from "react";
import { FiEye } from "react-icons/fi";
import clsx from "clsx";

interface StudentCourseCardProps {
    title: string;
    code: string;
    isEnrolled: boolean;
    onEnrollClick?: () => void;
    onDeEnrollClick?: () => void;
    onViewClick?: () => void;
    showEnrollButtons?: boolean;
    isDeEnrolling?: boolean;
    enrollmentDeadline?: string;
}

const colorPalette = [
    "bg-rose-200", "bg-pink-200", "bg-purple-200", "bg-indigo-200",
    "bg-blue-200", "bg-cyan-200", "bg-teal-200", "bg-green-200",
    "bg-lime-200", "bg-yellow-200", "bg-amber-200", "bg-orange-200",
];

// Deterministic hash function based on course code
const getColorForCode = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
};

const StudentCourseCard: React.FC<StudentCourseCardProps> = ({
    title,
    code,
    isEnrolled,
    onEnrollClick,
    onDeEnrollClick,
    onViewClick,
    isDeEnrolling,
    enrollmentDeadline,
}) => {
    const colorClass = useMemo(() => getColorForCode(code), [code]);
    const now = new Date();
    const deadline = enrollmentDeadline ? new Date(enrollmentDeadline) : null;
    const canDeEnroll = deadline ? now <= deadline : true;

    return (
        <div className="w-full max-w-sm rounded-sm overflow-hidden shadow-sm border border-gray-300 dark:border-darkBorderLight bg-white dark:bg-darkPrimary flex flex-col">

            {/* Colored Top */}
            <div className={clsx("h-24", colorClass)} />

            {/* Content */}
            <div className="px-4 py-3 flex flex-col gap-1 flex-grow">
                <h3 className="text-base font-semibold text-gray-900 dark:text-darkTextPrimary">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-darkTextMuted">{code}</p>
            </div>

            {/* Bottom Actions */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-darkBorderLight flex items-center justify-between">
                <button
                    onClick={onViewClick}
                    className="text-blue-600 dark:text-darkBlurple hover:text-blue-800 dark:hover:text-darkBlurpleHover flex items-center gap-1 text-sm"
                >
                    <FiEye className="w-4 h-4" />
                </button>

                {isEnrolled && canDeEnroll ? (
                    <button
                        onClick={onDeEnrollClick}
                        disabled={!onDeEnrollClick || isDeEnrolling}
                        className={`px-4 py-1 text-xs rounded transition border border-gray-200 dark:border-darkBorderLight ${isDeEnrolling
                            ? "bg-gray-200 dark:bg-darkMuted text-gray-500 dark:text-darkTextMuted cursor-wait"
                            : "bg-red-100 dark:bg-darkMuted text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
                            }`}
                    >
                        {isDeEnrolling ? "De-enrolling..." : "De-enroll"}
                    </button>
                ) : !isEnrolled ? (
                    <button
                        onClick={onEnrollClick}
                        className="text-sm px-4 py-1 rounded font-medium border flex items-center gap-2 transition bg-blue-100 dark:bg-darkBlurple text-blue-700 dark:text-darkTextPrimary hover:bg-blue-200 dark:hover:bg-darkBlurpleHover border-gray-200 dark:border-darkBorderLight focus:ring-4 focus:ring-blue-200 dark:focus:ring-darkTextSecondary/30"
                    >
                        Enroll
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default StudentCourseCard;
