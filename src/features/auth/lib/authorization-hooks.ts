import React from 'react';
import { useUser } from './auth-provider';
import { ROLES } from '@/constants/roles';
import type { UserRole } from '@/types/api';

export type RoleTypes = UserRole;
export { ROLES };

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
