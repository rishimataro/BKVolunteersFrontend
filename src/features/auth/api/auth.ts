import Axios from 'axios';

import { api } from '@/lib/api-clients';
import type {
    AccountType,
    AuthResponse,
    GeneralResponse,
    Role,
    User,
} from '@/types/api';

import type {
    LoginInput,
    ForgotPasswordInput,
    ResetPasswordInput,
} from '../types';
import { HttpStatus } from '@/types/http';

type ContractAccount = {
    id?: string | number | null;
    account_type?: AccountType | null;
    accountType?: AccountType | null;
    role?: Role | null;
    email?: string | null;
    full_name?: string | null;
    fullName?: string | null;
    organization_id?: string | number | null;
    organizationId?: string | number | null;
    faculty_id?: string | number | null;
    facultyId?: string | number | null;
    student_code?: string | null;
    studentCode?: string | null;
    created_at?: string | number | null;
    createdAt?: string | number | null;
};

const splitName = (fullName: string) => {
    const [firstName = fullName, ...rest] = fullName.trim().split(/\s+/);
    return {
        firstName,
        lastName: rest.join(' '),
    };
};

export const normalizeAccount = (
    account: ContractAccount | null,
): User | null => {
    if (!account?.id || !account.role) return null;

    const fullName = account.full_name ?? account.fullName ?? '';
    const { firstName, lastName } = splitName(fullName || account.email || '');

    return {
        id: String(account.id),
        accountType: account.account_type ?? account.accountType ?? 'STUDENT',
        email: account.email ?? '',
        fullName,
        firstName,
        lastName,
        role: account.role,
        organizationId:
            account.organization_id != null
                ? String(account.organization_id)
                : account.organizationId != null
                  ? String(account.organizationId)
                  : null,
        facultyId:
            account.faculty_id != null
                ? String(account.faculty_id)
                : account.facultyId != null
                  ? String(account.facultyId)
                  : null,
        studentCode: account.student_code ?? account.studentCode ?? null,
        createdAt: Number(account.created_at ?? account.createdAt ?? Date.now()),
    };
};

export const getUser = async (): Promise<User | null> => {
    try {
        const account = (await api.get('/auth/me')) as unknown as ContractAccount;
        return normalizeAccount(account);
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

export const loginWithEmailAndPassword = (
    data: LoginInput,
): Promise<AuthResponse> => {
    return api.post('/auth/login', data).then((rawResponse) => {
        const response = rawResponse as unknown as {
            access_token?: string | null;
            accessToken?: string | null;
            refresh_token?: string | null;
            refreshToken?: string | null;
            account?: ContractAccount | null;
            user?: ContractAccount | null;
        };

        return {
            access_token: response.access_token ?? response.accessToken ?? null,
            refresh_token: response.refresh_token ?? response.refreshToken ?? null,
            account: normalizeAccount(response.account ?? response.user ?? null),
        };
    });
};

export const forgotPassword = (
    data: ForgotPasswordInput,
): Promise<GeneralResponse> => {
    return api.post('/password/forgot-password', data);
};

export const resetPassword = (
    token: string,
    data: ResetPasswordInput,
): Promise<GeneralResponse> => {
    return api.post(`/password/reset-password/${token}`, data);
};

export const sendVerificationEmail = (
    email: string,
): Promise<GeneralResponse> => {
    return api.post('/verify-email/send-verification-email', { email });
};

export const verifyEmail = (token: string): Promise<GeneralResponse> => {
    return api.get(`/verify-email/${token}`);
};
