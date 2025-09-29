// src/hooks/useTheme.ts
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store/authStore";
import { hydrateTheme, setTheme } from "../app/store/themeSlice";


export function useTheme() {
    const dispatch = useDispatch<AppDispatch>();
    const mode = useSelector((state: RootState) => state.theme.mode);
    const isHydrated = useSelector((state: RootState) => state.theme.isHydrated);

    const set = (theme: "light" | "dark") => {
        if (theme === mode) return; // prevent unnecessary updates
        dispatch(setTheme(theme));
        localStorage.setItem("theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
    };

    const hydrate = (theme: "light" | "dark") => {
        dispatch(hydrateTheme(theme));
        localStorage.setItem("theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
    };

    const toggle = () => {
        const newTheme = mode === "light" ? "dark" : "light";
        set(newTheme);
    };

    return { mode, isHydrated, set, hydrate, toggle };
}