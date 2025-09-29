import React, { useState } from 'react';
import { FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { truncateName } from '../../../shared/utils/truncate-name';
import { IconType } from 'react-icons';
import AccountSettingsOverlay from '../../auth/components/account/AccountSettingsOverlay';


interface UserDropdownProps {
    fullName: string | null;
    email: string;
    avatarUrl?: string | null;
    onLogout: () => void;
    showDetails?: boolean;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
    fullName,
    email,
    avatarUrl,
    onLogout,
}) => {
    const [open, setOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const userDropdownLinks: {
        label: string;
        href?: string;
        icon: IconType;
        onClick?: () => void;
        danger?: boolean;
    }[] = [
            {
                label: 'Settings',
                icon: FaCog,
                onClick: () => {
                    setOpen(false);
                    setSettingsOpen(true);
                },
            },
            {
                label: 'Logout',
                icon: FaSignOutAlt,
                onClick: () => {
                    setOpen(false);
                    onLogout();
                },
                danger: true,
            },
        ];

    return (
        <div className="relative w-full">
            <button
                onClick={() => setOpen(!open)}
                className="group flex items-center w-full px-4 py-1 text-sm rounded
               hover:bg-gray-200 dark:hover:bg-darkSurface"
                aria-haspopup="true"
                aria-expanded={open}
            >
                {/* Avatar */}
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={`${fullName} avatar`}
                        className="w-8 h-8 rounded-full object-cover border border-gray-800 group-hover:border-gray-200 dark:border-darkBorderLight flex-shrink-0"
                    />
                ) : (
                    <FaUserCircle className="w-8 h-8 text-gray-600 dark:text-darkTextMuted flex-shrink-0" />
                )}

                {/* Text + Chevron Wrapper */}
                <div
                    className={`flex items-center justify-between ml-3 overflow-hidden transition-all duration-300 ease-in-out
                    hidden md:flex`} // Add these responsive classes
                >
                    <div className="flex flex-col text-left whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-sm text-gray-200 dark:text-darkTextPrimary group-hover:text-gray-600">{truncateName(fullName ?? "N/A")}</span>
                        <span className="text-xs text-gray-400 dark:text-darkTextMuted">{email}</span>
                    </div>
                    <FaChevronDown
                        className={`ml-2 w-4 h-4 transform transition-transform duration-300 ease-in-out
                    ${open ? 'rotate-180' : ''} text-gray-600 dark:text-darkTextMuted`}
                    />
                </div>
            </button>

            {/* Dropdown opens above */}
            {open && (
                <div className="absolute top-full mt-2 right-2 w-48 bg-white dark:bg-darkSurface border border-gray-300 dark:border-darkBorderLight rounded-md shadow-lg z-50">
                    <ul className="p-1 text-primary text-sm">
                        {userDropdownLinks.map((item, idx) => (
                            <li key={idx}>
                                {item.href ? (
                                    <Link
                                        to={item.href}
                                        onClick={() => setOpen(false)}
                                        role="menuitem"
                                        className={`flex items-center px-4 py-2 transition-colors rounded-sm
                                        hover:bg-blue-400 hover:text-white 
                                        dark:hover:bg-darkBlurple dark:hover:text-white
                                        ${item.danger ? 'text-red-600 hover:bg-red-600 dark:hover:bg-red-600' : 'text-gray-800 dark:text-darkTextSecondary'}`}
                                    >
                                        <item.icon className="mr-3" />
                                        {item.label}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={item.onClick}
                                        role="menuitem"
                                        className={`flex items-center w-full px-4 py-2 transition-colors rounded-sm
                                        ${item.danger
                                                ? 'text-red-600 hover:bg-red-600 hover:text-white dark:hover:bg-red-600'
                                                : 'hover:bg-blue-400 hover:text-white dark:hover:bg-darkBlurple dark:hover:text-white text-gray-800 dark:text-darkTextSecondary'}`}
                                    >
                                        <item.icon className="mr-3" />
                                        {item.label}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <AccountSettingsOverlay
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </div>

    );
};

export default UserDropdown;
