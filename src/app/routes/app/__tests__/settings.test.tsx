import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { SettingsRoute } from '../settings';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const changePassword = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/auth', () => ({
    ROLES: {
        SINHVIEN: 'SINHVIEN',
        CLB: 'CLB',
        LCD: 'LCD',
        DOANTRUONG: 'DOANTRUONG',
    },
    useUser: () => mockUseUser(),
}));

vi.mock('@/features/auth/api/auth', () => ({
    changePassword: (...args: unknown[]) => changePassword(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/app/settings']}>
            <Routes>
                <Route path="/app/settings" element={<SettingsRoute />} />
                <Route path="/app/profile" element={<div>Trang hồ sơ</div>} />
                <Route
                    path="/app/change-password"
                    element={<div>Trang đổi mật khẩu</div>}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('SettingsRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                role: 'SINHVIEN',
                email: 'student1@sv.dut.udn.vn',
                firstName: 'An',
                lastName: 'Nguyễn',
                fullName: 'Nguyễn An',
                studentCode: '2021601001',
            },
        });
    });

    it('renders the security and privacy management layout', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'Bảo mật và quyền riêng tư',
                }),
            ).toBeTruthy();
        });

        expect(screen.getByText('Xác thực hai lớp')).toBeTruthy();
        expect(screen.getByText('Quản lý phiên đăng nhập')).toBeTruthy();
        expect(screen.getByText('Nhận thông báo khi khả dụng')).toBeTruthy();
        expect(screen.getByText(/2021601001/)).toBeTruthy();
    });

    it('shows validation error when the confirmation password does not match', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Cập nhật mật khẩu' }),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/mật khẩu hiện tại/i), {
            target: { value: 'OldPass1' },
        });
        fireEvent.change(screen.getByLabelText(/^mật khẩu mới$/i), {
            target: { value: 'NewPass1' },
        });
        fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
            target: { value: 'OtherPass1' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Cập nhật mật khẩu' }),
        );

        await waitFor(() => {
            expect(
                screen.getByText(/mật khẩu xác nhận không khớp/i),
            ).toBeTruthy();
        });
    });

    it('submits the password change payload successfully', async () => {
        changePassword.mockResolvedValue({
            message: 'ok',
        });

        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Cập nhật mật khẩu' }),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/mật khẩu hiện tại/i), {
            target: { value: 'OldPass1' },
        });
        fireEvent.change(screen.getByLabelText(/^mật khẩu mới$/i), {
            target: { value: 'NewPass2' },
        });
        fireEvent.change(screen.getByLabelText(/xác nhận mật khẩu mới/i), {
            target: { value: 'NewPass2' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Cập nhật mật khẩu' }),
        );

        await waitFor(() => {
            expect(changePassword).toHaveBeenCalledWith({
                oldPassword: 'OldPass1',
                newPassword: 'NewPass2',
                newPasswordConfirm: 'NewPass2',
            });
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã cập nhật mật khẩu',
            }),
        );
    });
});
