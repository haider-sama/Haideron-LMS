import React from "react";

export function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}

export type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "destructive"
    | "secondary";

const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                variantClasses[variant],
                className
            )}
            {...props}
        />
    );
};
