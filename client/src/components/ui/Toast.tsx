import { useEffect } from 'react';
import {
    FiCheckCircle,
    FiXCircle,
    FiAlertTriangle,
    FiX,
    FiInfo,
} from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'warning' | 'neutral';

interface ToastProps {
    type: ToastType;
    message: string;
    onClose?: () => void;
    duration?: number; // in ms
    show: boolean;
}

const typeStyles: Record<ToastType, {
    icon: JSX.Element;
    iconBg: string;
    textColor: string;
}> = {
    success: {
        icon: <FiCheckCircle className="w-5 h-5" />,
        iconBg: 'bg-green-200 text-green-600 dark:bg-green-900 dark:text-green-300',
        textColor: 'text-green-600 dark:text-green-300',
    },
    error: {
        icon: <FiXCircle className="w-5 h-5" />,
        iconBg: 'bg-red-200 text-red-600 dark:bg-red-900 dark:text-red-300',
        textColor: 'text-red-600 dark:text-red-300',
    },
    warning: {
        icon: <FiAlertTriangle className="w-5 h-5" />,
        iconBg: 'bg-orange-200 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
        textColor: 'text-orange-600 dark:text-orange-300',
    },
    neutral: {
        icon: <FiInfo className="w-5 h-5" />,
        iconBg: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        textColor: 'text-gray-700 dark:text-gray-300',
    },
};

const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 4000, show }) => {
    const { icon, iconBg } = typeStyles[type];

    useEffect(() => {
        if (show && duration) {
            const timer = setTimeout(() => {
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    return (
        <div
            className="flex items-center w-full max-w-lg p-4 text-sm text-gray-600 dark:text-darkTextSecondary bg-white dark:bg-darkSurface rounded-lg shadow-sm border border-gray-200 dark:border-darkBorderLight"
            role="alert"
        >
            <div className={`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg ${iconBg}`}>
                {icon}
                <span className="sr-only">{type} icon</span>
            </div>
            <div className="ms-3 font-medium flex-1">{message}</div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-6 text-gray-400 dark:text-darkTextMuted rounded-lg focus:ring-2 focus:ring-gray-400 dark:focus:ring-darkBorderLight p-1.5 hover:bg-gray-200 dark:hover:bg-darkMuted inline-flex items-center justify-center h-8 w-8"
                >
                    <span className="sr-only">Close</span>
                    <FiX className="w-3 h-3" />
                </button>
            )}
        </div>

    );
};

export default Toast;
