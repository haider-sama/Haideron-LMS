import React, { createContext, useCallback, useContext, useState, useRef } from 'react';
import Toast, { ToastType } from '../../components/ui/Toast';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: ToastMessage[];
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    neutral: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const shownErrors = useRef<Set<string>>(new Set()); // track already shown messages

    const removeToast = (id: string, message?: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        if (message) shownErrors.current.delete(message); // remove from shown set when toast disappears
    };

    const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        // Prevent duplicate messages
        if (shownErrors.current.has(message)) return;

        const id = uuidv4();
        shownErrors.current.add(message);

        setToasts((prev) => [...prev, { id, type, message, duration }]);

        setTimeout(() => removeToast(id, message), duration);
    }, []);

    const contextValue: ToastContextValue = {
        toasts,
        showToast,
        success: (msg, duration) => showToast('success', msg, duration),
        error: (msg, duration) => showToast('error', msg, duration),
        warning: (msg, duration) => showToast('warning', msg, duration),
        neutral: (msg, duration) => showToast('neutral', msg, duration),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Toast
                                type={toast.type}
                                message={toast.message}
                                show
                                duration={toast.duration}
                                onClose={() => removeToast(toast.id, toast.message)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
