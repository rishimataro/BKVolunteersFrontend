import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import { LoginForm } from '../components/login-form';
import { useLogin } from '../lib/auth-provider';

// Mock dependencies
vi.mock('../lib/auth-provider', () => ({
    useLogin: vi.fn(),
}));

vi.mock('../api/auth', () => ({
    sendVerificationEmail: vi.fn(),
}));

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: vi.fn(() => ({
        addNotification: vi.fn(),
    })),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('LoginForm', () => {
    const onSuccess = vi.fn();
    const mutateAsync = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useLogin as vi.Mock).mockReturnValue({
            mutateAsync,
            isPending: false,
        });
    });

    const renderForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <LoginForm onSuccess={onSuccess} />
                </MemoryRouter>
            </QueryClientProvider>,
        );
    };

    it('renders correctly', () => {
        renderForm();

        expect(screen.getByLabelText(/tên đăng nhập \(email\)/i)).toBeDefined();
        expect(screen.getByLabelText(/mật khẩu/i)).toBeDefined();
        expect(
            screen.getByRole('button', { name: /^đăng nhập$/i }),
        ).toBeDefined();
    });

    it('shows validation errors for empty fields', async () => {
        renderForm();

        fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

        await waitFor(() => {
            expect(screen.getByText(/email is required/i)).toBeDefined();
            expect(
                screen.getByText(/password must be at least 6 characters/i),
            ).toBeDefined();
        });
    });

    it('calls login.mutateAsync with correct data', async () => {
        renderForm();

        fireEvent.change(screen.getByLabelText(/tên đăng nhập \(email\)/i), {
            target: { value: 'test@dut.udn.vn' },
        });
        fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                email: 'test@dut.udn.vn',
                password: 'password123',
            });
        });
    });
});
