// src/lib/toastBridge.ts

type ToastLevel = "success" | "error" | "warning" | "neutral";

type ToastFn = (type: ToastLevel, message: string) => void;

let toastFn: ToastFn | null = null;

export const setToastBridge = (fn: ToastFn) => {
    toastFn = fn;
};

export const showGlobalToast = (type: ToastLevel, message: string) => {
    if (toastFn) {
        toastFn(type, message);
    } else {
        console.warn("Toast bridge not ready");
    }
};
