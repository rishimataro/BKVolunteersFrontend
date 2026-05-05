import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ProtectedRoute, Authorization } from '../lib/authorization';
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
            data: { id: '1', role: ROLES.STUDENT },
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
            data: { id: '1', role: ROLES.SCHOOL_ADMIN },
        });

        render(
            <Authorization allowedRoles={[ROLES.SCHOOL_ADMIN]}>
                <div data-testid="authorized">Admin Only Content</div>
            </Authorization>,
        );

        expect(screen.getByTestId('authorized')).toBeDefined();
    });

    it('renders forbiddenFallback if role is not allowed', () => {
        (useUser as Mock).mockReturnValue({
            data: { id: '1', role: ROLES.STUDENT },
        });

        render(
            <Authorization
                allowedRoles={[ROLES.SCHOOL_ADMIN]}
                forbiddenFallback={<div data-testid="forbidden">Forbidden</div>}
            >
                <div data-testid="authorized">Admin Only Content</div>
            </Authorization>,
        );

        expect(screen.queryByTestId('authorized')).toBeNull();
        expect(screen.getByTestId('forbidden')).toBeDefined();
    });
});
