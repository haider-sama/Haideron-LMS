import React, { useState, ReactNode } from "react";
import PageHeading from "../../components/ui/PageHeading";

export type Tab = {
    label: string;
    content: ReactNode;
};

interface TabbedInterfaceProps {
    title?: string;
    subtitle?: string;
    tabs: Tab[];
    initialIndex?: number;
    className?: string;
}

const TabbedInterface: React.FC<TabbedInterfaceProps> = ({
    title,
    subtitle,
    tabs,
    initialIndex = 0,
    className = "",
}) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    return (
        <div className={`p-8 w-full ${className}`}>
            {/* Optional Page heading */}
            {title && (
                <PageHeading
                    title={title}
                    subtitle={subtitle ?? ""}
                />
            )}

            {/* Tab Headers */}
            <div className="flex border-b border-gray-300 w-full mt-4">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`flex-1 text-center p-4 -mb-px text-sm font-medium border-b-2 transition-colors
                        ${activeIndex === index
                                ? "border-blue-400 text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="py-8">{tabs[activeIndex].content}</div>
        </div>
    );
};

export default TabbedInterface;
