// shared/context/BreadcrumbContext.tsx
import React, { createContext, useContext, useState } from "react";
import { FaHome, FaLock } from "react-icons/fa";

export interface Crumb {
    label: string;
    icon?: React.ElementType;
    href?: string;
}

interface BreadcrumbContextValue {
    crumbs: Crumb[];
    setCrumbs: (crumbs: Crumb[]) => void;
    setDefaultCrumbs: (path: string) => void;
}

// Create context
const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined);

// Route-based defaults including icons
const defaultRoutes: Record<string, Crumb> = {
    "/": { label: "Home", icon: FaHome },
    "/forgot-password": { label: "Forgot Password", icon: FaLock },
};

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [crumbs, setCrumbs] = useState<Crumb[]>([]);

    const setDefaultCrumbs = (path: string) => {
        const segments = path.split("/").filter(Boolean);

        const newCrumbs: Crumb[] = segments.map((_, idx) => {
            const fullPath = "/" + segments.slice(0, idx + 1).join("/");

            // If exact match exists in defaultRoutes, use it
            if (defaultRoutes[fullPath]) return { ...defaultRoutes[fullPath], href: fullPath };

            // If not, fallback to dynamic label without icon
            return { label: segments[idx].replace(/-/g, " "), href: fullPath };
        });

        // setCrumbs(newCrumbs);
    };

    return (
        <BreadcrumbContext.Provider value={{ crumbs, setCrumbs, setDefaultCrumbs }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

export const useBreadcrumbs = (): BreadcrumbContextValue => {
    const context = useContext(BreadcrumbContext);
    if (!context) throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
    return context;
};
