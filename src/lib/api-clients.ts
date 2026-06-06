import Axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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
    failedQueue.forEach((promiseHandler) => {
        if (error) {
            promiseHandler.reject(error);
        } else {
            promiseHandler.resolve(token);
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
        return `Không thể kết nối tới backend tại ${env.API_URL}. Hãy kiểm tra backend đang chạy và thử mở ${env.API_URL}/api/health.`;
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

    const normalizedMessage = message.toLowerCase();

    return (
        normalizedMessage.includes('tai khoan da bi khoa') ||
        normalizedMessage.includes('tài khoản đã bị khóa') ||
        normalizedMessage.includes('vo hieu hoa') ||
        normalizedMessage.includes('vô hiệu hóa') ||
        normalizedMessage.includes('nguoi dung khong hop le') ||
        normalizedMessage.includes('người dùng không hợp lệ')
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
                    .catch((refreshError) => Promise.reject(refreshError));
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
                    refresh_token?: string;
                    refreshToken?: string;
                };

                const newToken = response.access_token ?? response.accessToken;
                const newRefreshToken =
                    response.refresh_token ?? response.refreshToken;

                if (!newToken) {
                    throw new Error(
                        'Refresh response does not include access token',
                    );
                }

                useAuthStore
                    .getState()
                    .setAuth(
                        useAuthStore.getState().user,
                        newToken,
                        newRefreshToken ?? undefined,
                    );
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
                title: 'Lỗi kết nối API',
                message,
            });
        }

        return Promise.reject(error);
    },
);
