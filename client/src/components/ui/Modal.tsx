import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 30 },
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    // Remove Escape listener completely
    useEffect(() => {
        // Optionally, you can keep this empty if you want other key handling
        return () => { };
    }, []);

    if (!isOpen) return null;
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <motion.div
                        className="relative bg-white dark:bg-darkSurface text-gray-800 dark:text-darkTextPrimary rounded-2xl shadow-xl max-w-5xl w-full mx-4 border border-gray-200 dark:border-darkBorderLight"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-end border-b border-gray-200 dark:border-darkBorderLight">
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-red-600 transition text-xl"
                                aria-label="Close modal"
                            >
                                <IoMdClose />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-darkMuted">
                            {children}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-darkBorderLight flex justify-end">
                            {/* Reserved Footer */}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
