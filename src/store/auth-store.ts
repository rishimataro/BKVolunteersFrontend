import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { User } from '@/types/api';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (
        user: User | null,
        accessToken: string | null,
        refreshToken?: string | null,
    ) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, accessToken, refreshToken) =>
                set((state) => ({
                    user,
                    accessToken,
                    refreshToken:
                        refreshToken === undefined
                            ? state.refreshToken
                            : refreshToken,
                })),
            clearAuth: () =>
                set({ user: null, accessToken: null, refreshToken: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
