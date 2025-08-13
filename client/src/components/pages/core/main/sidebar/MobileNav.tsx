import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineLogin, HiOutlineUserAdd } from 'react-icons/hi';
import { ALLOW_PUBLIC_REGISTRATION, navLinks } from '../../../../../constants';
import SidebarUserDropdown from './SidebarUserDropdown';
import { useAuth } from '../../../../../hooks/auth/useAuth';

const MobileNav = () => {
    const [expandedMenus, setExpandedMenus] = useState<{ [label: string]: boolean }>({});
    const { user, isLoggedIn, handleLogout } = useAuth();
    const navigate = useNavigate();

    const isVisible = (roles?: string[]) => {
        if (!roles) return true;
        return !!user?.role && roles.includes(user.role);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50
                bg-white dark:bg-darkSurface 
                border-t border-gray-200 dark:border-darkBorderLight 
                h-16 flex justify-around items-center">
            {navLinks.filter(link => isVisible(link.roles)).map((link, idx) => {
                const isExpanded = expandedMenus[link.label] || false;

                return (
                    <div key={idx} className="relative flex flex-col items-center">
                        <button
                            className="focus:outline-none text-gray-800 dark:text-darkTextPrimary 
                        p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted/40"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (link.subLinks) {
                                    setExpandedMenus(prev => ({
                                        [link.label]: !prev[link.label],
                                    }));
                                } else {
                                    navigate(link.href!);
                                    setExpandedMenus({});
                                }
                            }}
                        >
                            <link.icon size={22} />
                        </button>

                        {link.subLinks && isExpanded && (
                            <div className="absolute bottom-14 w-44 
                          bg-white dark:bg-darkSurface 
                          text-gray-800 dark:text-darkTextPrimary 
                          border border-gray-300 dark:border-darkBorderLight 
                          rounded-md shadow-lg z-50">
                                <ul className="py-1 text-sm">
                                    {link.subLinks.map((subLink, subIdx) => (
                                        <li key={subIdx}>
                                            <Link
                                                to={subLink.href}
                                                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-darkMuted/40"
                                                onClick={() => setExpandedMenus({})}
                                            >
                                                {subLink.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })}

            {isLoggedIn && user ? (
                <div className="flex justify-center">
                    <SidebarUserDropdown
                        fullName={`${user.firstName} ${user.lastName}`}
                        email={user.email}
                        avatarUrl={user.avatarURL}
                        onLogout={handleLogout}
                        collapsed={false}
                        showDetails={false}
                    />
                </div>
            ) : (
                <>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-800 dark:text-darkTextPrimary 
                    p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted/40"
                    >
                        <HiOutlineLogin size={22} />
                    </button>
                    {ALLOW_PUBLIC_REGISTRATION === true && (
                        <button
                            onClick={() => navigate('/register')}
                            className="text-gray-800 dark:text-darkTextPrimary 
                    p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted/40"
                        >
                            <HiOutlineUserAdd size={22} />
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default MobileNav;
