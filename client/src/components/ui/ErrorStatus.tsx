import { FaExclamationCircle } from "react-icons/fa";
import React from "react";

interface ErrorStatusProps {
    message: string | undefined;
}

const ErrorStatus: React.FC<ErrorStatusProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div className="flex items-center gap-2 mt-1 px-4 py-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm dark:bg-red-200/10 dark:border-red-500 dark:text-red-400">
            <FaExclamationCircle className="w-4 h-4" />
            <span>{message}</span>
        </div>
    );
};

export default ErrorStatus;
