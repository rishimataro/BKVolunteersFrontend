import React from 'react';
import { Navigate } from 'react-router';

import { paths } from '@/config/paths';

import { useUser } from './auth-provider';
import { useAuthorization, type RoleTypes } from './authorization-hooks';

type AuthorizationProps = {
    forbiddenFallback?: React.ReactNode;
    children: React.ReactNode;
} & (
    | {
          allowedRoles: RoleTypes[];
          policyCheck?: never;
      }
    | {
          allowedRoles?: RoleTypes[];
          policyCheck: boolean;
      }
);

export const Authorization = ({
    policyCheck,
    allowedRoles,
    forbiddenFallback = null,
    children,
}: AuthorizationProps) => {
    const { checkAccess } = useAuthorization();
    let canAccess = false;

    if (allowedRoles) {
        canAccess = checkAccess({ allowedRoles });
    }

    if (typeof policyCheck !== 'undefined') {
        canAccess = policyCheck;
    }

    return <>{canAccess ? children : forbiddenFallback}</>;
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useUser();

    if (!user.data) {
        return (
            <Navigate
                to={paths.auth.login.getHref()}
                replace
            />
        );
    }

    return children;
};
