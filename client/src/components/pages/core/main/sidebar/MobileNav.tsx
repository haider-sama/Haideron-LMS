import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navLinks } from '../../../../../shared/constants';
import { useAuth } from '../../../../../features/auth/hooks/useAuth';

const MobileNav = () => {
    const [expandedMenus, setExpandedMenus] = useState<{ [label: string]: boolean }>({});
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isVisible = (roles?: string[]) => {
        if (!roles) return true;
        return !!user?.role && roles.includes(user.role);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50
                bg-white border-t border-gray-200 
                h-16 flex justify-around items-center">
            {navLinks.filter(link => isVisible(link.roles)).map((link, idx) => {
                const isExpanded = expandedMenus[link.label] || false;
                const isActive = location.pathname === link.href;

                return (
                    <div key={idx} className="relative flex flex-col items-center">
                        <button
                            className="focus:outline-none text-gray-800  
                        p-2 rounded hover:bg-gray-100"
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
                            {isActive && (
                                <span className="absolute -top-2 left-0 right-0 h-1 bg-blue-400 rounded-full" />
                            )}
                        </button>

                        {link.subLinks && isExpanded && (
                            <div className="absolute bottom-14 w-44 
                          bg-white 
                          text-gray-800
                          border border-gray-300 
                          rounded-md shadow-lg z-50">
                                <ul className="py-1 text-sm">
                                    {link.subLinks.map((subLink, subIdx) => (
                                        <li key={subIdx}>
                                            <Link
                                                to={subLink.href}
                                                className="block px-4 py-2 hover:bg-gray-100"
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

        </div>
    );
};

export default MobileNav;
