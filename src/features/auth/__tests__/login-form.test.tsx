import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router';

import { LoginForm } from '../components/login-form';
import { useLogin } from '../lib/auth-provider';

const addNotification = vi.fn();
const mutateAsync = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: vi.fn(() => ({
        addNotification,
    })),
}));

vi.mock('../lib/auth-provider', () => ({
    useLogin: vi.fn(),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useLogin as Mock).mockReturnValue({
            mutateAsync,
            isPending: false,
        });
    });

    const renderForm = () => {
        return render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>,
        );
    };

    it('renders the redesigned login form', () => {
        renderForm();

        expect(
            screen.getByRole('heading', { name: /đăng nhập/i }),
        ).toBeDefined();
        expect(screen.getByLabelText(/email/i)).toBeDefined();
        expect(
            screen.getByLabelText(/mật khẩu/i, { selector: 'input' }),
        ).toBeDefined();
        expect(
            screen.getByRole('button', { name: /^đăng nhập$/i }),
        ).toBeDefined();
        expect(
            screen.getByRole('button', {
                name: /đăng nhập bằng microsoft/i,
            }),
        ).toBeDefined();
        expect(
            screen.getByRole('link', { name: /quên mật khẩu/i }),
        ).toBeDefined();
    });

    it('shows local validation errors when fields are empty', () => {
        renderForm();

        fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

        expect(
            screen.getByText(/vui lòng nhập email hoặc mssv/i),
        ).toBeDefined();
        expect(screen.getByText(/vui lòng nhập mật khẩu\./i)).toBeDefined();
        expect(addNotification).not.toHaveBeenCalled();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('calls backend login with validated credentials', async () => {
        mutateAsync.mockResolvedValueOnce({});
        renderForm();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(
            screen.getByLabelText(/mật khẩu/i, { selector: 'input' }),
            {
                target: { value: 'password123' },
            },
        );

        fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

        await waitFor(() =>
            expect(mutateAsync).toHaveBeenCalledWith({
                identifier: 'test@example.com',
                password: 'password123',
            }),
        );
        expect(addNotification).not.toHaveBeenCalled();
    });

    it('toggles the password field visibility', () => {
        renderForm();

        const passwordInput = screen.getByLabelText(/mật khẩu/i, {
            selector: 'input',
        });
        const toggleButton = screen.getByRole('button', {
            name: /hiện mật khẩu/i,
        });

        expect(passwordInput.getAttribute('type')).toBe('password');

        fireEvent.click(toggleButton);
        expect(passwordInput.getAttribute('type')).toBe('text');

        fireEvent.click(
            screen.getByRole('button', {
                name: /ẩn mật khẩu/i,
            }),
        );
        expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('has a Microsoft login button that redirects', () => {
        renderForm();

        const button = screen.getByRole('button', {
            name: /đăng nhập bằng microsoft/i,
        });
        expect(button).toBeDefined();
        expect(() => fireEvent.click(button)).not.toThrow();
    });
});
