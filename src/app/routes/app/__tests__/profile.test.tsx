import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProfileRoute } from '../profile';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const updateCurrentUserProfile = vi.fn();

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
    updateCurrentUserProfile: (...args: unknown[]) =>
        updateCurrentUserProfile(...args),
}));

vi.mock('@/store/auth-store', () => ({
    useAuthStore: {
        getState: () => ({
            accessToken: 'token',
            refreshToken: 'refresh',
            setAuth: vi.fn(),
        }),
    },
}));

const renderRoute = () =>
    render(
        <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={['/app/profile']}>
                <Routes>
                    <Route path="/app/profile" element={<ProfileRoute />} />
                    <Route
                        path="/app/settings"
                        element={<div>Trang bảo mật</div>}
                    />
                    <Route
                        path="/app/change-password"
                        element={<div>Trang đổi mật khẩu</div>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );

describe('ProfileRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                role: 'SINHVIEN',
                username: 'nguyenvanan',
                email: 'an.nguyen@sv.dut.udn.vn',
                firstName: 'An',
                lastName: 'Nguyễn Văn',
                fullName: 'Nguyễn Văn An',
                studentCode: '20216042',
                className: '22TCLC_DT1',
                phone: '0987654321',
                totalPoints: 840,
                organization: {
                    id: 'org-1',
                    name: 'Liên chi đoàn Khoa Công nghệ thông tin',
                    type: 'FACULTY',
                    faculty: {
                        name: 'Khoa Công nghệ thông tin',
                    },
                },
                status: 'ACTIVE',
                lastLoginAt: '2026-06-05T08:30:00.000Z',
                facultyName: 'Khoa Công nghệ thông tin',
            },
        });
        updateCurrentUserProfile.mockResolvedValue({
            id: 'student-1',
            role: 'SINHVIEN',
            username: 'nguyenvanan',
            email: 'an.nguyen@sv.dut.udn.vn',
            firstName: 'An',
            lastName: 'Nguyễn Văn',
            fullName: 'Nguyễn Văn An',
            studentCode: '20216042',
            className: '22TCLC_DT1',
            phone: '0901234567',
            totalPoints: 840,
            facultyName: 'Khoa Công nghệ thông tin',
            status: 'ACTIVE',
            lastLoginAt: '2026-06-05T08:30:00.000Z',
        });
    });

    it('renders the student profile layout with backend-backed account data', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
            ).toBeTruthy();
        });

        expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
        expect(screen.getByText(/20216042/)).toBeTruthy();
        expect(screen.getByDisplayValue('Nguyễn Văn An')).toBeTruthy();
        expect(
            screen.getByDisplayValue('Khoa Công nghệ thông tin'),
        ).toBeTruthy();
        expect(screen.getByText('Đại sứ Vàng')).toBeTruthy();
        expect(screen.getByText('Đăng nhập gần nhất')).toBeTruthy();
        expect(screen.getByText('Đi tới bảo mật')).toBeTruthy();
    });

    it('calls profile update API and shows success feedback when saving', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Lưu thay đổi' }),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText('Số điện thoại'), {
            target: { value: '0901234567' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

        await waitFor(() => {
            expect(updateCurrentUserProfile).toHaveBeenCalledWith(
                {
                    email: 'an.nguyen@sv.dut.udn.vn',
                    fullName: 'Nguyễn Văn An',
                    phone: '0901234567',
                },
                expect.anything(),
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã cập nhật hồ sơ',
            }),
        );
    });

    it('shows inline error feedback when profile update fails', async () => {
        updateCurrentUserProfile.mockRejectedValue(
            new Error('Không thể kết nối tới máy chủ.'),
        );

        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText('Số điện thoại'), {
            target: { value: '0901234567' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

        await waitFor(() => {
            expect(
                screen.getByText('Không thể kết nối tới máy chủ.'),
            ).toBeTruthy();
        });
    });
});
