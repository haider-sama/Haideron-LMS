import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-datepicker/dist/react-datepicker.css";
import { Provider } from 'react-redux';
import { authStore } from './store/authStore.ts'
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './context/ToastContext.tsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 0,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <HelmetProvider>
                    <Provider store={authStore}>
                        <App />
                    </Provider>
                </HelmetProvider>
            </ToastProvider>
        </QueryClientProvider>
    </React.StrictMode >,
)