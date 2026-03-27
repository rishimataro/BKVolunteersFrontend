import { configureAuth } from 'react-query-auth';

import { useAuthStore } from '@/store/auth-store';

import {
    getUser,
    loginWithEmailAndPassword,
    logout as apiLogout,
} from '../api/auth';
import type { LoginInput } from '../types';

const authConfig = {
    userFn: async () => {
        const { user, accessToken } = useAuthStore.getState();
        if (user && accessToken) {
            return user;
        }

        if (accessToken) {
            try {
                const fetchedUser = await getUser();
                useAuthStore.getState().setAuth(fetchedUser, accessToken);
                return fetchedUser;
            } catch {
                useAuthStore.getState().clearAuth();
                return null;
            }
        }

        return null;
    },
    loginFn: async (data: LoginInput) => {
        const response = await loginWithEmailAndPassword(data);
        // Response already unwrapped to .data by axios interceptor
        // response is { accessToken: string, user: User }
        useAuthStore.getState().setAuth(response.user, response.accessToken);
        return response.user;
    },
    logoutFn: async () => {
        try {
            await apiLogout();
        } finally {
            useAuthStore.getState().clearAuth();
        }
    },
};

export const { useUser, useLogin, useLogout, AuthLoader } =
    configureAuth(authConfig);
