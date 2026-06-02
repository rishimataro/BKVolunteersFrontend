import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { ChangePasswordRoute } from '../change-password';

const addNotification = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: vi.fn(() => ({
        addNotification,
    })),
}));

vi.mock('@/lib/api-clients', () => ({
    api: {
        patch: vi.fn(),
    },
}));

describe('ChangePasswordRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <ChangePasswordRoute />
            </MemoryRouter>,
        );
    };

    it('renders the change password form', () => {
        renderPage();

        expect(screen.getByText('Đổi mật khẩu')).toBeDefined();
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
            target: { value: 'old12345' },
        });
        fireEvent.change(screen.getByLabelText(/^mật khẩu mới$/i), {
            target: { value: 'new12345' },
        });
        fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
            target: { value: 'different' },
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
            target: { value: 'old12345' },
        });
        fireEvent.change(screen.getByLabelText(/^mật khẩu mới$/i), {
            target: { value: 'ab' },
        });
        fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
            target: { value: 'ab' },
        });

        fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/mật khẩu mới phải có ít nhất 6 ký tự/i),
            ).toBeDefined();
        });
    });
});
