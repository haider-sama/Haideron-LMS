import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { FaBars, FaTimes } from 'react-icons/fa';
import { ALLOW_PUBLIC_REGISTRATION, navLinks } from '../../../../../constants';
import SidebarItem from './SidebarItem';
import { HiOutlineLogin, HiOutlineUserAdd } from 'react-icons/hi';
import SidebarUserDropdown from './SidebarUserDropdown';
import MobileNav from './MobileNav';
import { useAuth } from '../../../../../hooks/auth/useAuth';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true'; // true means collapsed
    });
    const [expandedMenus, setExpandedMenus] = useState<{ [label: string]: boolean }>({});
    const { user, isLoggedIn, handleLogout } = useAuth();

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
                className={`hidden md:flex h-full bg-white dark:bg-darkSidebar border-r border-gray-300 dark:border-darkBorderLight shadow-md transition-all duration-300 ease-in-out flex-col ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Top Bar */}
                <div className="relative flex items-center h-16 border-b group px-4 border-gray-200 dark:border-darkBorderLight">
                    {collapsed ? (
                        <>
                            <FaBars
                                className="text-xl text-gray-800 dark:text-darkTextMuted group-hover:opacity-0 transition-opacity duration-200"
                                data-tooltip-id="sidebar-tooltip"
                                data-tooltip-content="Expand Sidebar"
                            />
                            <button
                                onClick={() => setCollapsed(false)}
                                className="absolute text-xl text-gray-800 dark:text-darkTextMuted opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                                className="text-xl text-gray-800 dark:text-darkTextPrimary"
                                data-tooltip-id="sidebar-tooltip"
                                data-tooltip-content="Go to Home"
                            >
                                <FaBars />
                            </Link>
                            <button
                                onClick={() => setCollapsed(true)}
                                className="ml-auto text-xl text-gray-800 dark:text-darkTextMuted"
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

                {/* Auth Section */}
                <div className="border-t border-gray-200 dark:border-darkBorderLight">
                    <ul className="flex flex-col py-4">
                        {isLoggedIn && user ? (
                            <li>
                                <SidebarUserDropdown
                                    fullName={user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'N/A'}
                                    onLogout={handleLogout}
                                    email={user.email}
                                    avatarUrl={user.avatarURL}
                                    collapsed={collapsed}
                                />
                            </li>
                        ) : (
                            <>
                                <li>
                                    <Link
                                        to="/login"
                                        className="flex items-center w-full text-sm px-4 h-10 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition-colors text-gray-800 dark:text-darkTextPrimary"
                                        data-tooltip-id="sidebar-tooltip"
                                        data-tooltip-content={collapsed ? 'Login' : ''}
                                    >
                                        <HiOutlineLogin className="text-lg flex-shrink-0" />
                                        <span
                                            className={`ml-3 transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                                                }`}
                                        >
                                            Login
                                        </span>
                                    </Link>
                                </li>
                                {ALLOW_PUBLIC_REGISTRATION === true && (
                                    <li>
                                        <Link
                                            to="/register"
                                            className="flex items-center w-full text-sm px-4 h-10 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition-colors text-gray-800 dark:text-darkTextPrimary"
                                            data-tooltip-id="sidebar-tooltip"
                                            data-tooltip-content={collapsed ? 'Register' : ''}
                                        >
                                            <HiOutlineUserAdd className="text-lg flex-shrink-0" />
                                            <span
                                                className={`ml-3 transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                                                    }`}
                                            >
                                                Register
                                            </span>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
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
