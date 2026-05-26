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
        if (!response.account || !response.access_token) {
            useAuthStore.getState().clearAuth();
            throw new Error(
                'Login response is missing account or access token',
            );
        }

        useAuthStore
            .getState()
            .setAuth(
                response.account,
                response.access_token,
                response.refresh_token ?? null,
            );
        return response.account;
    },
    registerFn: async () => {
        throw new Error('Register is outside the current contract scope');
    },
    logoutFn: async () => {
        try {
            const refreshToken = useAuthStore.getState().refreshToken;
            await apiLogout(refreshToken);
        } finally {
            useAuthStore.getState().clearAuth();
        }
    },
};

export const { useUser, useLogin, useLogout, AuthLoader } =
    configureAuth(authConfig);
