import Axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/auth-store';
import { HttpStatus } from '@/types/http';

let isRefreshing = false;

type PromiseHandler = {
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
};

let failedQueue: PromiseHandler[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
    if (config.headers) {
        config.headers.Accept = 'application/json';
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    config.withCredentials = true;
    return config;
}

const getApiErrorMessage = (
    error: AxiosError,
    originalRequest: InternalAxiosRequestConfig | undefined,
) => {
    const data = error.response?.data as
        | { message?: string; error?: { message?: string } }
        | undefined;

    if (!error.response) {
        return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend hoặc kết nối mạng.';
    }

    if (error.response.status === HttpStatus.NOT_FOUND) {
        const endpoint = originalRequest?.url ?? 'đã yêu cầu';
        return `API ${endpoint} chưa sẵn sàng hoặc không tồn tại trên backend hiện tại.`;
    }

    return data?.error?.message || data?.message || error.message;
};

const shouldClearAuthForForbidden = (
    status: number | undefined,
    message: string,
) => {
    if (status !== HttpStatus.FORBIDDEN) {
        return false;
    }

    const normalized = message.toLowerCase();

    return (
        normalized.includes('tai khoan da bi khoa') ||
        normalized.includes('tai khoản đã bị khóa') ||
        normalized.includes('vo hieu hoa') ||
        normalized.includes('vô hiệu hóa') ||
        normalized.includes('nguoi dung khong hop le') ||
        normalized.includes('người dùng không hợp lệ')
    );
};

export const api = Axios.create({
    baseURL: `${env.API_URL.replace(/\/$/, '')}/api/v1`,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
    (response) => {
        const data = response.data;
        return data?.data ?? data;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };
        const message = getApiErrorMessage(error, originalRequest);

        const isAuthRefreshRoute =
            originalRequest.url === '/auth/refresh' ||
            originalRequest.url === '/auth/login';

        if (
            error.response?.status === HttpStatus.UNAUTHORIZED &&
            !originalRequest._retry &&
            !isAuthRefreshRoute
        ) {
            if (isRefreshing) {
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                const response = (await api.post('/auth/refresh', {
                    refresh_token: refreshToken,
                })) as {
                    access_token?: string;
                    accessToken?: string;
                };
                const newToken = response.access_token ?? response.accessToken;
                if (!newToken) {
                    throw new Error(
                        'Refresh response does not include access token',
                    );
                }
                useAuthStore
                    .getState()
                    .setAuth(useAuthStore.getState().user, newToken);
                processQueue(null, newToken);
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (
            shouldClearAuthForForbidden(error.response?.status, message) &&
            originalRequest.url !== '/auth/login'
        ) {
            useAuthStore.getState().clearAuth();
        }

        if (error.response?.status !== HttpStatus.UNAUTHORIZED) {
            useNotifications.getState().addNotification({
                type: 'error',
                title: 'Lỗi',
                message,
            });
        }

        return Promise.reject(error);
    },
);
