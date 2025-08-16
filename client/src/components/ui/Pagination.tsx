import { useState } from "react";
import { BsChevronDoubleRight, BsChevronDown, BsChevronUp } from "react-icons/bs";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const [customPage, setCustomPage] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

    const handleGo = () => {
        const page = parseInt(customPage);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
            setCustomPage("");
            setShowDropdown(false);
        }
    };

    const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)
        .map((num) => (currentPage > 3 ? num + currentPage - 3 : num))
        .filter((page) => page <= totalPages);

    return (
        <div className="flex justify-center items-center flex-wrap gap-2 mt-6 relative">
            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 border dark:border-darkBorderLight rounded text-xs ${currentPage === page
                        ? "bg-primary text-white border-primary"
                        : "hover:bg-gray-100 dark:hover:bg-darkMuted"
                        }`}
                >
                    {page}
                </button>
            ))}

            {/* NEXT */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border rounded dark:border-darkBorderLight text-sm uppercase ${currentPage === totalPages
                    ? "text-gray-400 border-gray-300"
                    : "hover:bg-gray-100 dark:hover:bg-darkMuted"
                    }`}
            >
                Next
            </button>

            {/* LAST PAGE */}
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-100 dark:hover:bg-darkMuted dark:border-darkBorderLight "
                title="Go to last page"
            >
                <BsChevronDoubleRight size={16} />
            </button>

            {/* Page Info Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-4 py-1 border rounded text-sm hover:bg-gray-100 dark:hover:bg-darkMuted dark:border-darkBorderLight dark:text-darkTextSecondary"
                >
                    Page {currentPage} of {totalPages}
                    {showDropdown ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
                </button>

                {showDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded p-4 z-10 dark:bg-darkSurface dark:border-darkBorderLight">
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            placeholder="Page number"
                            value={customPage}
                            onChange={(e) => setCustomPage(e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm mb-2 dark:bg-darkMuted dark:border-darkBorderLight"
                        />
                        <button
                            onClick={handleGo}
                            className="w-full bg-primary text-white rounded py-1 text-sm hover:opacity-90 dark:bg-darkSidebar"
                        >
                            Go
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};