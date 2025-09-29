import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { FaBars, FaTimes } from 'react-icons/fa';
import { navLinks } from '../../../../../shared/constants';
import SidebarItem from './SidebarItem';
import MobileNav from './MobileNav';
import { useAuth } from '../../../../../features/auth/hooks/useAuth';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true'; // true means collapsed
    });
    const [expandedMenus, setExpandedMenus] = useState<{ [label: string]: boolean }>({});
    const { user } = useAuth();

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    }, [collapsed]);

    const isVisible = (roles?: string[]) => {
        if (!roles) return true;
        return !!user?.role && roles.includes(user.role);
    };

    const toggleSubMenu = (label: string) => {
        setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <>
            <aside
                className={`hidden md:flex h-full bg-white border-r border-gray-300 shadow-md transition-all duration-300 ease-in-out flex-col ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Top Bar */}
                <div className="relative flex items-center h-16 border-b group px-4 border-gray-200">
                    {collapsed ? (
                        <>
                            <FaBars
                                className="text-xl text-gray-800 group-hover:opacity-0 transition-opacity duration-200"
                                data-tooltip-id="sidebar-tooltip"
                                data-tooltip-content="Expand Sidebar"
                            />
                            <button
                                onClick={() => setCollapsed(false)}
                                className="absolute text-xl text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                data-tooltip-id="sidebar-tooltip"
                                data-tooltip-content="Expand Sidebar"
                            >
                                <FaTimes />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/"
                                className="text-xl text-gray-800"
                                data-tooltip-id="sidebar-tooltip"
                                data-tooltip-content="Go to Home"
                            >
                                <FaBars />
                            </Link>
                            <button
                                onClick={() => setCollapsed(true)}
                                className="ml-auto text-xl text-gray-800"
                                data-tooltip-id="sidebar-tooltip"
                                data-tooltip-content="Collapse Sidebar"
                            >
                                <FaTimes />
                            </button>
                        </>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="flex flex-col">
                        {navLinks
                            .filter(link => isVisible(link.roles))
                            .map((link, idx) => (
                                <li key={idx}>
                                    <SidebarItem
                                        {...link}
                                        collapsed={collapsed}
                                        isExpanded={expandedMenus[link.label] || false}
                                        toggleSubMenu={toggleSubMenu}
                                        isVisible={isVisible}
                                        setCollapsed={setCollapsed}
                                    />
                                </li>
                            ))}
                    </ul>
                </nav>
            </aside>

            <MobileNav />

            <Tooltip
                id="sidebar-tooltip"
                place="right"
                style={{
                    backgroundColor: '#000000',
                    color: '#F9FAFB',
                    fontSize: '12px',
                    borderRadius: '8px',
                }}
            />
        </>

    );
};

export default Sidebar;
