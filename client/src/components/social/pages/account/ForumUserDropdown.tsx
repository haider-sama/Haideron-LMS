import React, { useState } from 'react';
import { FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown, FaGraduationCap, FaUserAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { IconType } from 'react-icons';
import { truncateName } from '../../../../utils/truncate-name';
import AccountSettingsOverlay from '../../../account/AccountSettingsOverlay';

interface ForumUserDropdownProps {
    username: string;
    email: string;
    avatarUrl?: string;
    onLogout: () => void;
}

const ForumUserDropdown: React.FC<ForumUserDropdownProps> = ({
    username,
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
                label: 'LMS',
                icon: FaGraduationCap,
                href: '/',
                onClick: () => setOpen(false),
            },
            {
                label: 'Forum Profile',
                icon: FaUserAlt,
                href: '/forums/profile',
                onClick: () => setOpen(false),
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
        <div className="relative inline-block text-left">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center px-3 py-1 border text-sm border-gray-300 rounded-md bg-white hover:bg-gray-100 transition-colors w-full"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={`${username} avatar`}
                        className="w-6 h-6 rounded-full object-cover border border-gray-300"
                    />
                ) : (
                    <FaUserCircle className="w-6 h-6 text-gray-600" />
                )}
                <span className="ml-2 text-sm text-gray-800">
                    {truncateName(username)}
                </span>
                <FaChevronDown
                    className={`ml-2 w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} text-gray-600`}
                />
            </button>

            {open && (
                <div className="absolute top-full mt-2 right-0 w-52 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden">
                    <ul className="py-1 text-sm px-1">
                        {userDropdownLinks.map((item, idx) => (
                            <li key={idx}>
                                {item.href ? (
                                    <Link
                                        to={item.href}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition w-full
                                        ${item.danger
                                                ? 'text-red-600 hover:bg-red-600 hover:text-white'
                                                : 'text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={item.onClick}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition w-full
                                        ${item.danger
                                                ? 'text-red-600 hover:bg-red-600 hover:text-white'
                                                : 'text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                                    >
                                        <item.icon className="w-4 h-4" />
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

export default ForumUserDropdown;
