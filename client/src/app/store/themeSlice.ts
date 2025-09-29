// store/themeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

interface ThemeState {
    mode: Theme;
    isHydrated: boolean;
}

const initialState: ThemeState = {
    mode: "light",       // default
    isHydrated: false,   // not yet read from localStorage
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.mode = state.mode === "light" ? "dark" : "light";
        },
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.mode = action.payload;
            state.isHydrated = true;
        },
        hydrateTheme: (state, action: PayloadAction<Theme>) => {
            state.mode = action.payload;
            state.isHydrated = true;
        },
    },
});

export const { toggleTheme, setTheme, hydrateTheme } = themeSlice.actions;
export default themeSlice.reducer;