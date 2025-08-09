// components/ui/PageHeading.tsx
import React from "react";

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const PageHeading: React.FC<PageHeadingProps> = ({ title, subtitle, className = "" }) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-darkTextPrimary">
          {title}
        </h2>
        {subtitle && (
          <p className="text-md text-gray-600 dark:text-darkTextMuted mt-2">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageHeading;
