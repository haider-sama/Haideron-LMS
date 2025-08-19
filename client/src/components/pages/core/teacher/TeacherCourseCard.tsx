import React, { useMemo } from "react";
import { FiClipboard, FiEdit, FiMoreVertical, FiUsers } from "react-icons/fi";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import clsx from "clsx";

interface CourseCardProps {
    title: string;
    code: string;
    onEdit: () => void;
    onViewStudents: () => void;
    onViewAssessments: () => void;
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

const TeacherCourseCard: React.FC<CourseCardProps> = ({
    title,
    code,
    onEdit,
    onViewStudents,
    onViewAssessments,
}) => {
    const colorClass = useMemo(() => getColorForCode(code), [code]);

    return (
        <div className="w-full max-w-sm rounded-sm overflow-hidden shadow-sm border border-gray-300 dark:border-darkBorderLight bg-white dark:bg-darkPrimary flex flex-col">

            {/* Colored Top */}
            <div className={clsx("h-28 relative", colorClass)}>
                <Menu as="div" className="absolute top-2 right-2 z-10">
                    <MenuButton className="text-primary dark:text-gray-800 hover:text-black dark:hover:text-white">
                        <FiMoreVertical className="w-5 h-5" />
                    </MenuButton>

                    <MenuItems className="absolute right-0 mt-2 w-44 origin-top-right bg-white dark:bg-darkSurface rounded-md shadow-sm border border-gray-300 dark:border-darkBorderLight p-2 z-50 text-sm">
                        <MenuItem
                            as="button"
                            onClick={onViewStudents}
                            className="flex items-center gap-2 w-full text-left font-medium p-2 transition hover:bg-gray-200 dark:hover:bg-darkMuted dark:text-darkTextPrimary rounded-md"
                        >
                            <FiUsers className="w-4 h-4" />
                            View Students
                        </MenuItem>
                        <MenuItem
                            as="button"
                            onClick={onViewAssessments}
                            className="flex items-center gap-2 w-full text-left p-2 transition hover:bg-gray-200 dark:hover:bg-darkMuted dark:text-darkTextPrimary rounded-md"
                        >
                            <FiClipboard className="w-4 h-4" />
                            Manage Assessments
                        </MenuItem>
                    </MenuItems>
                </Menu>
            </div>

            {/* Course Info */}
            <div className="px-4 py-3 flex flex-col gap-1 flex-grow">
                <h3 className="text-base font-semibold text-gray-900 dark:text-darkTextPrimary">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-darkTextMuted">{code}</p>
            </div>

            {/* Bottom Bar */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-darkBorderLight flex items-center justify-start">
                <button
                    onClick={onEdit}
                    className="text-blue-600 dark:text-darkBlurple hover:text-blue-800 dark:hover:text-darkBlurpleHover"
                    title="Edit Course"
                >
                    <FiEdit className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default TeacherCourseCard;
