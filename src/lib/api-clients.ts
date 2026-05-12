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
        const data = error.response?.data as
            | { message?: string; error?: { message?: string } }
            | undefined;
        const message = data?.error?.message || data?.message || error.message;

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
