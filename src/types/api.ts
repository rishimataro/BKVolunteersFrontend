export type BaseEntity = {
    id: string;
    createdAt: number | string | Date;
};

export type Entity<T> = {
    [K in keyof T]: T[K];
} & BaseEntity;

export type Meta = {
    page: number;
    total: number;
    totalPages: number;
};

export type UserRole =
    | 'SINHVIEN'
    | 'LCD'
    | 'CLB'
    | 'DOANTRUONG';

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';

export type User = Entity<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status?: UserStatus;
    facultyId?: number | null;
    mssv?: string;
    fullName?: string;
    className?: string | null;
    phone?: string | null;
    totalPoints?: number;
    updatedAt?: number | string | Date;
}>;

export type AuthResponse = {
    accessToken: string;
    user: User;
};

export type ApiError = {
    message: string;
    statusCode: number;
    error?: string;
};

export type GeneralResponse = {
    message: string;
};
