import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';

interface SubLink {
    label: string;
    href: string;
    icon?: React.ElementType;
    roles?: string[];
}

interface SidebarItemProps {
    label: string;
    icon: React.ElementType;
    href?: string;
    subLinks?: SubLink[];
    collapsed: boolean;
    isExpanded: boolean;
    toggleSubMenu: (label: string) => void;
    isVisible: (roles?: string[]) => boolean;
    setCollapsed: (v: boolean) => void;
}

const SidebarItem = ({
    label,
    icon: Icon,
    href,
    subLinks,
    collapsed,
    isExpanded,
    toggleSubMenu,
    isVisible,
    setCollapsed,
}: SidebarItemProps) => {
    // Renders an item with subLinks
    if (subLinks) {
        return (
            <>
                <button
                    onClick={() => collapsed ? setCollapsed(false) : toggleSubMenu(label)}
                    className="flex items-center w-full text-sm px-4 h-10 rounded hover:bg-gray-100 dark:hover:bg-darkSurface text-gray-800 dark:text-gray-200"
                    data-tooltip-id="sidebar-tooltip"
                    data-tooltip-content={collapsed ? label : ''}
                >
                    <span className="flex items-center gap-2">
                        <Icon className="text-lg flex-shrink-0" />
                    </span>
                    <span
                        className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                            }`}
                    >
                        {label}
                    </span>
                    {!collapsed && (
                        <FaChevronDown
                            className={`ml-auto text-xs transition-transform transform ${isExpanded ? 'rotate-180' : ''
                                }`}
                        />
                    )}
                </button>

                {!collapsed && isExpanded && (
                    <ul className="mt-1 ml-8 flex flex-col gap-1">
                        {subLinks
                            .filter(sub => isVisible(sub.roles))
                            .map((sub, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={sub.href}
                                        className="flex items-center px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-darkSurface text-gray-800 dark:text-gray-200"
                                        data-tooltip-id="sidebar-tooltip"
                                        data-tooltip-content={collapsed ? sub.label : ''}
                                    >
                                        {sub.icon && <sub.icon className="text-base mr-2" />}
                                        <span>{sub.label}</span>
                                    </Link>
                                </li>
                            ))}
                    </ul>
                )}
            </>
        );
    }

    // Renders a direct link
    return (
        <Link
            to={href!}
            className="flex items-center px-4 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-darkSurface text-gray-800 dark:text-gray-200"
            data-tooltip-id="sidebar-tooltip"
            data-tooltip-content={collapsed ? label : ''}
        >
            <span className="flex items-center gap-2">
                <Icon className="text-lg flex-shrink-0" />
            </span>
            <span
                className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                    }`}
            >
                {label}
            </span>
        </Link>
    );
};

export default SidebarItem;
