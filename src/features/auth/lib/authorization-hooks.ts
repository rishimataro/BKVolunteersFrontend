import React from 'react';
import type { Role } from '@/types/api';
import { useUser } from './auth-provider';

export const ROLES = {
    STUDENT: 'STUDENT',
    ORG_ADMIN: 'ORG_ADMIN',
    ORG_MEMBER: 'ORG_MEMBER',
    SCHOOL_REVIEWER: 'SCHOOL_REVIEWER',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
} as const;

export type RoleTypes = Role;

export const POLICIES = () => {
    return true;
};

export const useAuthorization = () => {
    const user = useUser();

    const checkAccess = React.useCallback(
        ({ allowedRoles }: { allowedRoles: RoleTypes[] }) => {
            if (allowedRoles && allowedRoles.length > 0 && user.data) {
                return allowedRoles?.includes(user.data.role);
            }
            return true;
        },
        [user.data],
    );
    return { checkAccess, role: user.data?.role };
};
