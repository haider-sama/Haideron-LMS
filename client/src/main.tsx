import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-datepicker/dist/react-datepicker.css";
import { Provider } from 'react-redux';
import { authStore } from './app/store/authStore.ts'
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './shared/context/ToastContext.tsx';
import { BreadcrumbProvider } from './shared/context/BreadcrumbContext.tsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // or 0 during offline testing
            staleTime: 1000 * 60 * 5,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <BreadcrumbProvider>
                    <HelmetProvider>
                        <Provider store={authStore}>
                            <App />
                        </Provider>
                    </HelmetProvider>
                </BreadcrumbProvider>
            </ToastProvider>
        </QueryClientProvider>
    </React.StrictMode >,
)