import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { LoginForm } from '../components/login-form';

const addNotification = vi.fn();
const mutateAsync = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: vi.fn(() => ({
        addNotification,
    })),
}));

vi.mock('../lib/auth-provider', () => ({
    useLogin: vi.fn(() => ({
        mutateAsync,
        isPending: false,
    })),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderForm = () => {
        return render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>,
        );
    };

    it('renders login inputs and action buttons', () => {
        const { container, getByText } = renderForm();

        expect(container.querySelector('#username')).toBeTruthy();
        expect(container.querySelector('#password')).toBeTruthy();
        expect(container.querySelector('button[type="submit"]')).toBeTruthy();
        expect(getByText(/email, tên đăng nhập hoặc mssv/i)).toBeTruthy();
        expect(getByText(/microsoft/i)).toBeTruthy();
    });

    it('shows validation errors when fields are empty', () => {
        const { container } = renderForm();

        const submitButton = container.querySelector(
            'button[type="submit"]',
        ) as HTMLButtonElement;
        fireEvent.click(submitButton);

        expect(container.textContent).toContain('Vui');
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('calls login mutation with username + password', async () => {
        mutateAsync.mockResolvedValueOnce({});
        const { container } = renderForm();

        const usernameInput = container.querySelector(
            '#username',
        ) as HTMLInputElement;
        const passwordInput = container.querySelector(
            '#password',
        ) as HTMLInputElement;
        const submitButton = container.querySelector(
            'button[type="submit"]',
        ) as HTMLButtonElement;

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'password123',
            });
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
            }),
        );
    });

    it('shows error notification when login fails', async () => {
        mutateAsync.mockRejectedValueOnce(new Error('Boom'));
        const { container } = renderForm();

        const usernameInput = container.querySelector(
            '#username',
        ) as HTMLInputElement;
        const passwordInput = container.querySelector(
            '#password',
        ) as HTMLInputElement;
        const submitButton = container.querySelector(
            'button[type="submit"]',
        ) as HTMLButtonElement;

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                }),
            );
        });
    });

    it('maps locked account API errors to a clear Vietnamese message', async () => {
        mutateAsync.mockRejectedValueOnce({
            isAxiosError: true,
            message: 'Request failed',
            response: {
                data: {
                    message: 'Tai khoan da bi khoa hoac vo hieu hoa',
                },
            },
        });
        const { container } = renderForm();

        const usernameInput = container.querySelector(
            '#username',
        ) as HTMLInputElement;
        const passwordInput = container.querySelector(
            '#password',
        ) as HTMLInputElement;
        const submitButton = container.querySelector(
            'button[type="submit"]',
        ) as HTMLButtonElement;

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    title: 'Đăng nhập thất bại',
                    message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa.',
                }),
            );
        });
    });

    it('toggles password field visibility', () => {
        const { container } = renderForm();

        const passwordInput = container.querySelector(
            '#password',
        ) as HTMLInputElement;
        const toggleButton = container.querySelector(
            'button[aria-pressed]',
        ) as HTMLButtonElement;

        expect(passwordInput.getAttribute('type')).toBe('password');

        fireEvent.click(toggleButton);
        expect(passwordInput.getAttribute('type')).toBe('text');

        fireEvent.click(toggleButton);
        expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('shows Microsoft placeholder notification', () => {
        const { getByRole } = renderForm();

        fireEvent.click(
            getByRole('button', {
                name: /microsoft/i,
            }),
        );

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info',
                title: 'Microsoft SSO',
            }),
        );
    });
});
