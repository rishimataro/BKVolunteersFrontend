import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { ChangePasswordRoute } from '../change-password';

const addNotification = vi.fn();
const changePassword = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/auth/api/auth', () => ({
    changePassword: (...args: unknown[]) => changePassword(...args),
}));

describe('ChangePasswordRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderPage = () =>
        render(
            <MemoryRouter>
                <ChangePasswordRoute />
            </MemoryRouter>,
        );

    it('renders the change password form', () => {
        renderPage();

        expect(
            screen.getByRole('heading', { level: 1, name: 'Đổi mật khẩu' }),
        ).toBeDefined();
        expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeDefined();
        expect(screen.getByLabelText(/^mật khẩu mới$/i)).toBeDefined();
        expect(screen.getByLabelText(/^xác nhận mật khẩu mới$/i)).toBeDefined();
        expect(
            screen.getByRole('button', { name: /lưu thay đổi/i }),
        ).toBeDefined();
    });

    it('shows validation error when passwords do not match', async () => {
        renderPage();

        fireEvent.change(screen.getByLabelText(/mật khẩu hiện tại/i), {
            target: { value: 'OldPass1' },
        });
        fireEvent.change(screen.getByLabelText(/^mật khẩu mới$/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
            target: { value: 'Different1' },
        });

        fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/mật khẩu xác nhận không khớp/i),
            ).toBeDefined();
        });
    });

    it('shows validation error for short password', async () => {
        renderPage();

        fireEvent.change(screen.getByLabelText(/mật khẩu hiện tại/i), {
            target: { value: 'OldPass1' },
        });
        fireEvent.change(screen.getByLabelText(/^mật khẩu mới$/i), {
            target: { value: 'Ab1' },
        });
        fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
            target: { value: 'Ab1' },
        });

        fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/mật khẩu mới phải có ít nhất 8 ký tự/i),
            ).toBeDefined();
        });
    });
});
