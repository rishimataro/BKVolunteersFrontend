import { api } from '@/lib/api-clients';
import type { UserRole, UserStatus } from '@/types/api';

export type UserManagementItem = {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    facultyId: number | null;
    facultyName: string | null;
    managedClubId: string | null;
    managedClubName: string | null;
    mssv: string | null;
    fullName: string | null;
    className: string | null;
    phone: string | null;
};

export type UserListResponse = {
    data: UserManagementItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export type FacultyOption = {
    id: number;
    code: string;
    name: string;
};

export type ClubOption = {
    id: string;
    name: string;
    facultyId: number | null;
    isSchoolLevel: boolean;
};

export type UserOptionsResponse = {
    faculties: FacultyOption[];
    clubs: ClubOption[];
};

export type ListUsersParams = {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole | '';
    status?: Extract<UserStatus, 'ACTIVE' | 'LOCKED' | 'DISABLED'> | '';
};

export type CreateUserPayload =
    | {
          role: 'SINHVIEN';
          email: string;
          password: string;
          mssv: string;
          fullName: string;
          facultyId: number;
          className?: string;
          phone?: string;
      }
    | {
          role: 'LCD';
          username: string;
          email: string;
          password: string;
          facultyId: number;
      }
    | {
          role: 'CLB';
          username: string;
          email: string;
          password: string;
          facultyId?: number;
          managedClubId?: string;
      }
    | {
          role: 'DOANTRUONG';
          username: string;
          email: string;
          password: string;
      };

export type UpdateUserPayload =
    | {
          role: 'SINHVIEN';
          email: string;
          password?: string;
          mssv: string;
          fullName: string;
          facultyId: number;
          className?: string;
          phone?: string;
      }
    | {
          role: 'LCD';
          username: string;
          email: string;
          password?: string;
          facultyId: number;
      }
    | {
          role: 'CLB';
          username: string;
          email: string;
          password?: string;
          facultyId?: number;
          managedClubId?: string;
      }
    | {
          role: 'DOANTRUONG';
          username: string;
          email: string;
          password?: string;
      };

const buildQuery = (params: ListUsersParams) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

export const getUsers = (params: ListUsersParams): Promise<UserListResponse> => {
    return api.get(`/users${buildQuery(params)}`);
};

export const getUserOptions = (): Promise<UserOptionsResponse> => {
    return api.get('/users/options');
};

export const createUser = (payload: CreateUserPayload) => {
    return api.post('/users', payload);
};

export const updateUser = (userId: string, payload: UpdateUserPayload) => {
    return api.patch(`/users/${userId}`, payload);
};

export const updateUserStatus = (
    userId: string,
    status: 'ACTIVE' | 'LOCKED',
) => {
    return api.patch(`/users/${userId}/status`, { status });
};

export const deleteUser = (userId: string) => {
    return api.delete(`/users/${userId}`);
};
