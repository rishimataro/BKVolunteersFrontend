import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { SettingsRoute } from '../settings';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const changePassword = vi.fn();
const logoutMutate = vi.fn();
const mockUseLogout = vi.fn();

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
    useLogout: (...args: unknown[]) => mockUseLogout(...args),
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
                <Route path="/auth/login" element={<div>Đăng nhập</div>} />
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
                status: 'ACTIVE',
                email: 'student1@sv.dut.udn.vn',
                firstName: 'An',
                lastName: 'Nguyễn',
                fullName: 'Nguyễn An',
                studentCode: '2021601001',
                lastLoginAt: '2026-06-05T09:15:00.000Z',
            },
        });
        mockUseLogout.mockReturnValue({
            isPending: false,
            mutate: logoutMutate,
        });
    });

    it('renders the backend-backed security overview and session management layout', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: 'Bảo mật và quyền riêng tư',
                }),
            ).toBeTruthy();
        });

        expect(screen.getByText('Tình trạng bảo vệ hiện tại')).toBeTruthy();
        expect(screen.getByText('Quản lý phiên đăng nhập')).toBeTruthy();
        expect(screen.getAllByText(/Đăng nhập gần nhất:/)).toHaveLength(2);
        expect(screen.getByText(/2021601001/)).toBeTruthy();
        expect(
            screen.getByRole('button', {
                name: 'Đăng xuất phiên hiện tại',
            }),
        ).toBeTruthy();
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

    it('uses the normalized backend error message when password update fails', async () => {
        changePassword.mockRejectedValue(
            new Error('Không thể kết nối tới máy chủ.'),
        );

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
            expect(
                screen.getByText('Không thể kết nối tới máy chủ.'),
            ).toBeTruthy();
        });
    });

    it('triggers logout for the current session', async () => {
        renderRoute();

        fireEvent.click(
            screen.getByRole('button', { name: 'Đăng xuất phiên hiện tại' }),
        );

        expect(logoutMutate).toHaveBeenCalledWith({});
    });

    it('shows an informational notice for unavailable security features', async () => {
        renderRoute();

        fireEvent.click(
            screen.getByRole('button', { name: 'Nhận thông báo khi khả dụng' }),
        );

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info',
                title: 'Xác thực hai lớp chưa sẵn sàng',
            }),
        );
    });
});
