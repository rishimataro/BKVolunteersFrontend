import React from 'react';
import { Navigate, useLocation } from 'react-router';

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
    const location = useLocation();

    if (!user.data) {
        return (
            <Navigate
                to={paths.auth.login.getHref(location.pathname)}
                replace
            />
        );
    }

    return children;
};

export const ProtectedRoleRoute = ({
    allowedRoles,
    children,
    forbiddenFallback,
}: {
    allowedRoles: RoleTypes[];
    children: React.ReactNode;
    forbiddenFallback?: React.ReactNode;
}) => {
    return (
        <ProtectedRoute>
            <Authorization
                allowedRoles={allowedRoles}
                forbiddenFallback={
                    forbiddenFallback ?? (
                        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                            Vai trò hiện tại không có quyền truy cập màn hình này.
                        </div>
                    )
                }
            >
                {children}
            </Authorization>
        </ProtectedRoute>
    );
};
