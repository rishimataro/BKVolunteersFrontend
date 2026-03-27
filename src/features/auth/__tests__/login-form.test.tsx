import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import { LoginForm } from '../components/login-form';

const addNotification = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: vi.fn(() => ({
        addNotification,
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

    it('renders the redesigned login form', () => {
        renderForm();

        expect(
            screen.getByRole('heading', { name: /đăng nhập/i }),
        ).toBeDefined();
        expect(screen.getByLabelText(/tên đăng nhập/i)).toBeDefined();
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
        expect(screen.getByAltText(/linh vật bk volunteers/i)).toBeDefined();
    });

    it('shows local validation errors when fields are empty', () => {
        renderForm();

        fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

        expect(
            screen.getByText(/vui lòng nhập tên đăng nhập\./i),
        ).toBeDefined();
        expect(screen.getByText(/vui lòng nhập mật khẩu\./i)).toBeDefined();
        expect(addNotification).not.toHaveBeenCalled();
    });

    it('shows a placeholder notification instead of calling backend login', () => {
        renderForm();

        fireEvent.change(screen.getByLabelText(/tên đăng nhập/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(
            screen.getByLabelText(/mật khẩu/i, { selector: 'input' }),
            {
                target: { value: 'password123' },
            },
        );

        fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info',
                title: 'Giao diện đăng nhập',
            }),
        );
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

    it('shows placeholder feedback for Microsoft login', () => {
        renderForm();

        fireEvent.click(
            screen.getByRole('button', {
                name: /đăng nhập bằng microsoft/i,
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
