import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';

export const authStore = configureStore({
    reducer: {
        theme: themeReducer,
    },
});

export type RootState = ReturnType<typeof authStore.getState>;
export type AppDispatch = typeof authStore.dispatch;