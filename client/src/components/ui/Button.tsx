import React from "react";
import clsx from "clsx";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    fullWidth?: boolean;
    bg?: string;
    hoverBg?: string;
    text?: string;
    hoverText?: string;
    focusRing?: string;
    extra?: string;
}

export const getButtonClass = ({
    bg = "bg-blue-400",
    hoverBg = "hover:bg-white",
    text = "text-white",
    hoverText = "hover:text-gray-900",
    focusRing = "focus:ring-4 focus:ring-gray-200",
    disabled = false,
    extra = "",
}: {
    bg?: string;
    hoverBg?: string;
    text?: string;
    hoverText?: string;
    focusRing?: string;
    disabled?: boolean;
    extra?: string;
}) =>
    clsx(
        "border border-gray-300 font-medium rounded text-sm px-4 py-2 focus:outline-none",
        disabled
            ? "bg-gray-400 text-white cursor-not-allowed"
            : [bg, hoverBg, text, hoverText, focusRing],
        extra
    );


export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    isLoading = false,
    loadingText,
    disabled,
    fullWidth = true,
    bg,
    hoverBg,
    text,
    hoverText,
    focusRing,
    extra = "",
    children,
    ...rest
}) => {
    const className = getButtonClass({
        disabled: isLoading || disabled,
        bg: bg ?? (isLoading ? "bg-gray-300 dark:bg-darkMuted" : "bg-primary dark:bg-darkBlurple"),
        hoverBg: hoverBg ?? (isLoading ? "" : "hover:bg-white dark:hover:bg-darkBlurpleHover"),
        text: text ?? (isLoading ? "text-gray-600 dark:text-darkTextMuted" : "text-white dark:text-white"),
        hoverText: hoverText ?? (isLoading ? "" : "hover:text-gray-900 dark:hover:text-white"),
        focusRing: focusRing ?? "focus:ring-4 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30",
        extra: `
            border border-gray-200 dark:border-darkBorderLight font-medium rounded-lg text-sm px-4 py-2 sm:px-5 sm:py-3 
            focus:outline-none ${fullWidth ? "w-full" : ""} ${isLoading ? "cursor-wait" : ""} ${extra}
        `
    });

    return (
        <button
            disabled={isLoading || disabled}
            className={className}
            {...rest}
        >
            {isLoading ? loadingText ?? "Loading..." : children}
        </button>
    );
};

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    text?: string;
    bg?: string;
    hoverBg?: string;
    hoverText?: string;
    focusRing?: string;
    extra?: string;
    children?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
    isLoading = false,
    loadingText,
    disabled,
    bg,
    hoverBg,
    text,
    hoverText,
    focusRing,
    extra = "",
    children,
    ...rest
}) => {
    const className = getButtonClass({
        disabled: isLoading || disabled,
        bg: bg ?? (isLoading ? "bg-gray-300 dark:bg-darkMuted" : "bg-primary dark:bg-darkBlurple"),
        hoverBg: hoverBg ?? (isLoading ? "" : "hover:bg-white dark:hover:bg-darkBlurpleHover"),
        text: text ?? (isLoading ? "text-gray-600 dark:text-darkTextMuted" : "text-white dark:text-white"),
        hoverText: hoverText ?? (isLoading ? "" : "hover:text-gray-900 dark:hover:text-white"),
        focusRing: focusRing ?? "focus:ring-2 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30",
        extra: `
            border border-gray-200 dark:border-darkBorderLight font-medium rounded-md text-xs px-3 py-1.5 
            focus:outline-none transition-all duration-200 ${isLoading ? "cursor-wait" : ""} ${extra}
        `
    });

    return (
        <button
            disabled={isLoading || disabled}
            className={className}
            {...rest}
        >
            {isLoading ? loadingText ?? "Loading..." : children}
        </button>
    );
};
