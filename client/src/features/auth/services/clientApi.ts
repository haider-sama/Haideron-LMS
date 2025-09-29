import axios from "axios";
import { showGlobalToast } from "../../../shared/lib/toastBridge";
import { API_BASE_URL } from "../../../shared/constants";

const clientApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: {
    resolve: (value?: any) => void;
    reject: (error: any) => void;
    originalRequest: any;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject, originalRequest }) => {
        if (token) {
            resolve(clientApi(originalRequest));
        } else {
            reject(error);
        }
    });
    failedQueue = [];
};

clientApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const skipRetry = [
            "/api/v1/auth/refresh-token", 
            "/api/v1/auth/login", 
            "/api/v1/auth/register", 
            "/api/v1/auth/2fa/login"
        ];
        const shouldSkip = skipRetry.some((url) => originalRequest.url?.includes(url));

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !shouldSkip
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, originalRequest });
                });
            }

            isRefreshing = true;

            try {
                const res = await clientApi.post("/api/v1/auth/refresh-token", {});
                if (res.status === 200) {
                    processQueue(null, "token"); // You don’t need the token string because cookies are handled automatically
                    return clientApi(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                showGlobalToast("error", "Session expired. Please log in again.");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default clientApi;
