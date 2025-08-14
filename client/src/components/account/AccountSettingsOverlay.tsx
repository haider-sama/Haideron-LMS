import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import Profile from "../../pages/account/Profile";
import { FiShield, FiUser } from "react-icons/fi";
import { MdOutlineSettingsSuggest } from "react-icons/md";
import SecuritySettings from "./SecuritySettings";
import PrivacySettings from "./PrivacySettings";

type Section = "account" | "personalization" | "security";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const panelVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 30 },
};

// Nav config (centralized array)
const navItems: { key: Section; label: string; icon: React.ReactNode, content: (props: { onClose: () => void }) => React.ReactNode }[] = [
    {
        key: "account",
        label: "My Account",
        icon: <FiUser />,
        content: ({ onClose }) => <Profile onClose={onClose} />,
    },
    {
        key: "personalization",
        label: "Personalization",
        icon: <MdOutlineSettingsSuggest />,
        content: ({ onClose }) => <PrivacySettings onClose={onClose} />,
    },
    {
        key: "security",
        label: "Security",
        icon: <FiShield />,
        content: () => <SecuritySettings />,
    }
];

const AccountSettingsOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
    const [section, setSection] = useState<Section>("account");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const activeSection = navItems.find((item) => item.key === section);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={backdropVariants}
                >
                    <motion.div
                        className="relative bg-white dark:bg-darkSurface text-gray-800 dark:text-darkTextPrimary rounded-2xl shadow-xl w-full max-w-5xl mx-4 flex flex-col"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={panelVariants}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-darkBorderLight">
                            <h2 className="text-xl font-semibold">Account Settings</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 text-xl transition"
                                aria-label="Close"
                            >
                                <IoMdClose />
                            </button>
                        </div>

                        {/* Body (sidebar + content) */}
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden max-h-[80vh]">
                            {/* Sidebar */}
                            <aside className="w-full md:w-64 bg-gray-100 dark:bg-darkSidebar border-b md:border-b-0 md:border-r border-gray-200 dark:border-darkBorderLight p-4 overflow-y-auto max-h-48 md:max-h-none">
                                <ul className="space-y-2">
                                    {navItems.map((item) => (
                                        <li key={item.key}>
                                            <button
                                                onClick={() => setSection(item.key)}
                                                className={`w-full text-left flex items-center gap-2 px-4 py-2 rounded transition ${section === item.key
                                                    ? "bg-primary text-white dark:bg-darkBlurple"
                                                    : "hover:bg-gray-200 dark:hover:bg-darkMuted"
                                                    }`}
                                            >
                                                <span className="text-lg">{item.icon}</span>
                                                <span>{item.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </aside>

                            {/* Main Content */}
                            <main className="flex-1 p-6 overflow-y-auto max-h-[calc(80vh-6rem)] md:max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-darkMuted">
                                {activeSection?.content({ onClose })}
                            </main>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-darkBorderLight flex justify-end">
                            {/* Reserved for space */}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

    );
};

export default AccountSettingsOverlay;
