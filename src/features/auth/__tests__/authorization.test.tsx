import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import {
    ProtectedRoleRoute,
    ProtectedRoute,
    Authorization,
} from '../lib/authorization';
import { ROLES } from '../lib/authorization-hooks';
import { useUser } from '../lib/auth-provider';

// Mock useUser
vi.mock('../lib/auth-provider', () => ({
    useUser: vi.fn(),
}));

describe('ProtectedRoute', () => {
    it('redirects to login if user is not authenticated', () => {
        (useUser as Mock).mockReturnValue({ data: null });

        render(
            <MemoryRouter initialEntries={['/app']}>
                <Routes>
                    <Route
                        path="/app"
                        element={
                            <ProtectedRoute>
                                <div data-testid="protected">
                                    Protected Content
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/auth/login"
                        element={<div data-testid="login">Login Page</div>}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.queryByTestId('protected')).toBeNull();
        expect(screen.getByTestId('login')).toBeDefined();
    });

    it('renders children if user is authenticated', () => {
        (useUser as Mock).mockReturnValue({
            data: { id: '1', role: ROLES.SINHVIEN },
        });

        render(
            <MemoryRouter initialEntries={['/app']}>
                <ProtectedRoute>
                    <div data-testid="protected">Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>,
        );

        expect(screen.getByTestId('protected')).toBeDefined();
        expect(screen.getByText('Protected Content')).toBeDefined();
    });
});

describe('Authorization', () => {
    it('renders children if role is allowed', () => {
        (useUser as Mock).mockReturnValue({
            data: { id: '1', role: ROLES.DOANTRUONG },
        });

        render(
            <Authorization allowedRoles={[ROLES.DOANTRUONG]}>
                <div data-testid="authorized">Admin Only Content</div>
            </Authorization>,
        );

        expect(screen.getByTestId('authorized')).toBeDefined();
    });

    it('renders forbiddenFallback if role is not allowed', () => {
        (useUser as Mock).mockReturnValue({
            data: { id: '1', role: ROLES.SINHVIEN },
        });

        render(
            <Authorization
                allowedRoles={[ROLES.DOANTRUONG]}
                forbiddenFallback={<div data-testid="forbidden">Forbidden</div>}
            >
                <div data-testid="authorized">Admin Only Content</div>
            </Authorization>,
        );

        expect(screen.queryByTestId('authorized')).toBeNull();
        expect(screen.getByTestId('forbidden')).toBeDefined();
    });
});

describe('ProtectedRoleRoute', () => {
    it('renders forbidden fallback for authenticated users without role access', () => {
        (useUser as Mock).mockReturnValue({
            data: { id: '1', role: ROLES.SINHVIEN },
        });

        render(
            <MemoryRouter initialEntries={['/app/audit-logs']}>
                <Routes>
                    <Route
                        path="/app/audit-logs"
                        element={
                            <ProtectedRoleRoute
                                allowedRoles={[ROLES.DOANTRUONG]}
                                forbiddenFallback={
                                    <div data-testid="role-forbidden">
                                        Forbidden by role
                                    </div>
                                }
                            >
                                <div data-testid="role-protected">Role Only</div>
                            </ProtectedRoleRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.queryByTestId('role-protected')).toBeNull();
        expect(screen.getByTestId('role-forbidden')).toBeDefined();
    });
});
