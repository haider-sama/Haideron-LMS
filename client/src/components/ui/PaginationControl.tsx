import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    const pages: number[] = [];

    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex justify-center items-center gap-2 mt-6 text-sm select-none">
      {/* Previous */}
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 px-2 py-1 text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100
               disabled:opacity-50 disabled:cursor-not-allowed
               dark:text-darkTextPrimary dark:bg-darkSurface dark:border-darkBorderLight dark:hover:bg-darkHover"
      >
        <FiChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {visiblePages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-4 py-2 rounded-md transition text-sm ${p === page
              ? "bg-blue-400 text-white font-medium shadow"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:hover:bg-darkHover"
              }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Next */}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 px-4 py-1 text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100
               disabled:opacity-50 disabled:cursor-not-allowed
               dark:text-darkTextPrimary dark:bg-darkSurface dark:border-darkBorderLight dark:hover:bg-darkHover"
      >
        Next
        <FiChevronRight className="h-4 w-4" />
      </button>
    </div>

  );
};

export default Pagination;
