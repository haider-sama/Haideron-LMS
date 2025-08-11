import React from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "tiny" | "light" | "gray" | "green" | "yellow" | "red" | "blue";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    extra?: string;
    // Override classes if needed
    bg?: string;
    hoverBg?: string;
    text?: string;
    hoverText?: string;
    focusRing?: string;
    padding?: string;
    children: React.ReactNode;
}

const variantStyles: Record<Variant, { base: string; smPadding: string; mdPadding: string; lgPadding: string }> = {
    primary: {
        base: `
      bg-primary text-white hover:text-primary
      hover:bg-white hover:text-primary dark:border-darkBorderLight dark:hover:text-white
      dark:bg-darkBlurple dark:hover:bg-darkPrimary
      disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-primary/50 dark:focus:ring-darkBlurple/50
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    secondary: {
        base: `
      bg-transparent text-gray-500 border-transparent
      hover:bg-gray-100 dark:hover:bg-darkMuted dark:border-darkBorderLight
      disabled:text-gray-300 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    tiny: {
        base: `
      font-medium rounded border dark:border-darkBorderLight
      disabled:cursor-not-allowed
    `,
        smPadding: "px-2 py-1.5 text-xs",
        mdPadding: "px-3 py-2 text-sm",
        lgPadding: "px-4 py-3 text-base",
    },
    light: {
        base: `
      bg-transparent text-gray-500 border-gray-200
      hover:bg-gray-100 dark:hover:bg-darkPrimary dark:border-darkBorderLight dark:text-white 
      disabled:text-gray-300 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    gray: {
        base: `
      bg-gray-200 text-gray-700 border-gray-300 
      hover:bg-gray-300 dark:bg-darkMuted dark:text-darkTextMuted dark:border-darkBorderLight dark:hover:bg-darkBlurpleHover
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-gray-200 dark:focus:ring-darkTextSecondary/30
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    green: {
        base: `
      bg-green-500 text-white border-green-500
      hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800
      disabled:bg-green-300 disabled:text-green-100 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    yellow: {
        base: `
      bg-yellow-500 text-white border-gray-200 hover:text-gray-800
      hover:bg-white dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:border-darkBorderLight
      disabled:bg-yellow-300 disabled:text-yellow-100 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-400
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    red: {
        base: `
      bg-red-600 text-white border-red-600
      hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800
      disabled:bg-red-300 disabled:text-red-100 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
    blue: {
        base: `
      bg-blue-400 text-white border-blue-400
      hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600
      disabled:bg-blue-200 disabled:text-blue-100 disabled:cursor-not-allowed
      focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400
      border
    `,
        smPadding: "px-3 py-1.5 text-xs rounded",
        mdPadding: "px-4 py-2 text-sm rounded",
        lgPadding: "px-4 py-2 text-base rounded",
    },
};

export const Button: React.FC<ButtonProps> = ({
    isLoading = false,
    loadingText,
    disabled,
    variant = "primary",
    size = "md",
    fullWidth = true,
    extra = "",
    bg,
    hoverBg,
    text,
    hoverText,
    focusRing,
    padding,
    children,
    ...rest
}) => {
    const variantStyle = variantStyles[variant] || variantStyles.primary;

    const paddingClass = padding
        ? padding
        : size === "sm"
            ? variantStyle.smPadding
            : size === "lg"
                ? variantStyle.lgPadding
                : variantStyle.mdPadding;

    const className = clsx(
        "font-medium focus:outline-none transition-all duration-200 border",
        disabled || isLoading
            ? "cursor-not-allowed opacity-60"
            : [bg ?? variantStyle.base, hoverBg, text, hoverText, focusRing],
        paddingClass,
        fullWidth ? "w-full" : "w-fit",
        extra
    );

    return (
        <button disabled={isLoading || disabled} className={className} {...rest}>
            {isLoading ? loadingText ?? "Loading..." : children}
        </button>
    );
};
