import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { ProfileRoute } from '../profile';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getStudentDashboard = vi.fn();

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

vi.mock('@/features/campaign/api/student', () => ({
    getStudentDashboard: (...args: unknown[]) => getStudentDashboard(...args),
}));

const renderRoute = () =>
    render(
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
        </MemoryRouter>,
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
            },
        });

        getStudentDashboard.mockResolvedValue({
            campaigns_count: 12,
            money_amount: 2500000,
            money_donations_count: 3,
            item_received_quantity: 5,
            item_received_count: 2,
            event_hours: 45,
            event_completed_count: 6,
            certificates_count: 4,
            recent_activities: [],
        });
    });

    it('renders the student profile layout with synchronized statistics', async () => {
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
        expect(screen.getByText('Chiến dịch đã tham gia')).toBeTruthy();
        expect(screen.getByText('12')).toBeTruthy();
        expect(screen.getByText('2,5 triệu')).toBeTruthy();
        expect(screen.getByText('Đi tới bảo mật')).toBeTruthy();
    });

    it('shows an information toast when saving local-only profile edits', async () => {
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

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info',
                title: 'Đang chuẩn bị cập nhật hồ sơ',
            }),
        );
    });

    it('still renders account information when dashboard statistics fail', async () => {
        getStudentDashboard.mockRejectedValue(
            new Error('Không thể tải thống kê hồ sơ.'),
        );

        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Hồ sơ cá nhân' }),
            ).toBeTruthy();
        });

        await waitFor(() => {
            expect(
                screen.getByText('Không thể tải thống kê hồ sơ.'),
            ).toBeTruthy();
        });

        expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                title: 'Không thể tải hồ sơ sinh viên',
            }),
        );
    });
});
