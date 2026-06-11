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

        if (user && !accessToken) {
            useAuthStore.getState().clearAuth();
            return null;
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
        const user = response.user ?? response.account ?? null;
        const accessToken =
            response.accessToken ?? response.access_token ?? null;
        const refreshToken =
            response.refreshToken ?? response.refresh_token ?? null;

        if (!user || !accessToken) {
            useAuthStore.getState().clearAuth();
            throw new Error('Login response is missing user or access token');
        }

        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
        return user;
    },
    registerFn: async () => {
        throw new Error('Register is not implemented');
    },
    logoutFn: async () => {
        try {
            const refreshToken = useAuthStore.getState().refreshToken;
            await apiLogout(refreshToken);
        } catch {
            // Clear the local session even if the backend refresh cookie is missing.
        } finally {
            useAuthStore.getState().clearAuth();
        }
    },
};

export const { useUser, useLogin, useLogout, AuthLoader } =
    configureAuth(authConfig);
