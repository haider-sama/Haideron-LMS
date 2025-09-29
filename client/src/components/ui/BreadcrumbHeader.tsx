import React from "react";
import { FiChevronRight } from "react-icons/fi";

interface Crumb {
    label: string;
    icon?: React.ElementType;
    href?: string; // optional link
}

interface BreadcrumbHeaderProps {
    items: Crumb[];
    padding?: string; // optional padding for the whole breadcrumb container
}

const BreadcrumbHeader: React.FC<BreadcrumbHeaderProps> = ({ items }) => {
    return (
        <nav
            className="w-full text-sm px-8 py-2 border-b border-gray-300"
            aria-label="Breadcrumb"
        >
            <ol className="flex flex-wrap items-center gap-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const Icon = item.icon;

                    const badgeClasses = `flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                        ${isLast ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-600"}`;

                    return (
                        <React.Fragment key={index}>
                            {item.href ? (
                                <a href={item.href} className={badgeClasses}>
                                    {Icon && <Icon className="w-3 h-3" />}
                                    {item.label}
                                </a>
                            ) : (
                                <span className={badgeClasses}>
                                    {Icon && <Icon className="w-3 h-3" />}
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <FiChevronRight
                                    className="text-gray-400 shrink-0"
                                    size={16}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
};

export default BreadcrumbHeader;
