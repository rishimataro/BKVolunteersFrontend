import Axios from 'axios';

import { api } from '@/lib/api-clients';
import type { AuthResponse, User, GeneralResponse } from '@/types/api';

import type {
    LoginInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    ChangePasswordInput,
} from '../types';
import { HttpStatus } from '@/types/http';

type VerifyCodeInput = {
    email: string;
    code: string;
};

type ResetPasswordPayload = {
    resetToken: string;
    newPassword: string;
    newPasswordConfirm: string;
};

export const getUser = async (): Promise<User | null> => {
    try {
        return await api.get('/auth/me');
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
    void refreshToken;
    return api.post('/auth/logout');
};

export const loginWithEmailAndPassword = (
    data: LoginInput,
): Promise<AuthResponse> => {
    return api.post('/auth/login', data);
};

export const forgotPassword = (
    data: ForgotPasswordInput,
): Promise<GeneralResponse> => {
    return api.post('/password/forgot-password', data);
};

export const resetPassword = (
    tokenOrPayload: string | ResetPasswordPayload,
    data?: ResetPasswordInput,
): Promise<GeneralResponse> => {
    if (typeof tokenOrPayload === 'string') {
        return api.post(`/password/reset-password/${tokenOrPayload}`, data);
    }

    return api.post('/password/reset-password', tokenOrPayload);
};

export const changePassword = (
    data: ChangePasswordInput,
): Promise<GeneralResponse> => {
    return api.patch('/auth/change-password', data);
};

export const sendVerificationEmail = (
    email: string,
): Promise<GeneralResponse> => {
    return api.post('/verify-email/send-verification-email', { email });
};

export const verifyEmail = (token: string): Promise<GeneralResponse> => {
    return api.get(`/verify-email/${token}`);
};

export const verifyCode = (
    data: VerifyCodeInput,
): Promise<{ resetToken: string }> => {
    return api.post('/password/verify-code', data);
};
