import type { UserRole } from '@/types/api';

export const ROLES = {
    SINHVIEN: 'SINHVIEN',
    CLB: 'CLB',
    LCD: 'LCD',
    DOANTRUONG: 'DOANTRUONG',
} as const satisfies Record<UserRole, UserRole>;
