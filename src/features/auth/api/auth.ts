import Axios from 'axios';

import { api } from '@/lib/api-clients';
import type { AccountType, AuthResponse, Role, User } from '@/types/api';
import { useAuthStore } from '@/store/auth-store';

import type { LoginInput, ForgotPasswordInput } from '../types';
import { HttpStatus } from '@/types/http';

type MeResponse = {
    account_type: AccountType;
    role: Role;
    organization: {
        id: number;
        name: string;
        type: string;
    } | null;
    faculty: {
        id: number;
        code: string;
        name: string;
    } | null;
    student?: {
        id: number;
        student_code: string;
        full_name: string;
        email: string;
        class_code: string | null;
    };
    operator?: {
        id: number;
        full_name: string;
        email: string;
    };
    created_at?: number;
};

const splitName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    const lastName = parts.slice(0, -1).join(' ');
    const firstName = parts[parts.length - 1] ?? fullName;
    return { firstName, lastName };
};

const normalizeMeResponse = (me: MeResponse): User | null => {
    const profile = me.student ?? me.operator;
    if (!me.role || !profile) return null;

    const fullName = profile.full_name || '';
    const { firstName, lastName } = splitName(fullName || profile.email || '');

    return {
        id: String(profile.id),
        accountType: me.account_type,
        email: profile.email ?? '',
        fullName,
        firstName,
        lastName,
        role: me.role,
        organizationId:
            me.organization != null ? String(me.organization.id) : null,
        organization:
            me.organization != null
                ? {
                      id: String(me.organization.id),
                      name: me.organization.name,
                      type: me.organization.type,
                      faculty: me.faculty ? { name: me.faculty.name } : null,
                  }
                : null,
        facultyId: me.faculty != null ? String(me.faculty.id) : null,
        studentCode: me.student?.student_code ?? null,
        createdAt: me.created_at ?? Date.now(),
    };
};

export const getUser = async (): Promise<User | null> => {
    try {
        const me = (await api.get('/auth/me')) as unknown as MeResponse;
        return normalizeMeResponse(me);
    } catch (error) {
        if (
            Axios.isAxiosError(error) &&
            (error.response?.status === HttpStatus.UNAUTHORIZED ||
                error.response?.status === HttpStatus.NOT_FOUND)
        ) {
            return null;
        }
        throw error;
    }
};

export const logout = (refreshToken?: string | null): Promise<void> => {
    return api.post('/auth/logout', {
        refresh_token: refreshToken ?? null,
    });
};

export const loginWithEmailAndPassword = async (
    data: LoginInput,
): Promise<AuthResponse> => {
    const raw = (await api.post('/auth/login', data)) as unknown as {
        accessToken?: string;
    };

    const accessToken = raw.accessToken ?? null;
    if (!accessToken) {
        throw new Error('Login response does not include access token');
    }

    useAuthStore.getState().setAuth(null, accessToken);

    const account = await getUser();

    if (!account) {
        useAuthStore.getState().clearAuth();
        throw new Error('Could not fetch user profile after login');
    }

    useAuthStore.getState().setAuth(account, accessToken);

    return {
        access_token: accessToken,
        refresh_token: null,
        account,
    };
};

export const forgotPassword = async (
    data: ForgotPasswordInput,
): Promise<void> => {
    await api.post('/password/forgot-password', data);
};

export const verifyCode = async (data: {
    email: string;
    code: string;
}): Promise<{ resetToken: string }> => {
    return api.post('/password/verify-code', data) as Promise<{
        resetToken: string;
    }>;
};

export const resetPassword = async (data: {
    resetToken: string;
    newPassword: string;
    newPasswordConfirm: string;
}): Promise<void> => {
    await api.post('/password/reset-password', data);
};
