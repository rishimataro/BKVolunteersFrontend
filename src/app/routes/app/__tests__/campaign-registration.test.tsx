import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { CampaignRegistrationRoute } from '../campaign-registration';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getPublicCampaignDetail = vi.fn();
const createEventRegistration = vi.fn();

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

vi.mock('@/features/campaign/api/public', () => ({
    getPublicCampaignDetail: (...args: unknown[]) =>
        getPublicCampaignDetail(...args),
}));

vi.mock('@/features/campaign/api/events', () => ({
    createEventRegistration: (...args: unknown[]) =>
        createEventRegistration(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter
            initialEntries={[
                '/app/campaigns/mua-he-xanh/register/module-event-1',
            ]}
        >
            <Routes>
                <Route
                    path="/app/campaigns/:slug/register/:moduleId"
                    element={<CampaignRegistrationRoute />}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('CampaignRegistrationRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                role: 'SINHVIEN',
                fullName: 'Nguyễn Văn A',
                firstName: 'Văn',
                lastName: 'Nguyễn',
                studentCode: '2021601234',
                phone: '',
            },
        });

        getPublicCampaignDetail.mockResolvedValue({
            id: 'campaign-1',
            slug: 'mua-he-xanh',
            title: 'Chiến dịch Mùa Hè Xanh 2024',
            summary: 'Chung tay hỗ trợ cộng đồng tại địa phương.',
            description: 'Mô tả chi tiết chiến dịch tình nguyện mùa hè.',
            beneficiary: 'Cộng đồng địa phương',
            status: 'ONGOING',
            scope_type: 'PUBLIC',
            start_at: '2026-06-10T00:00:00.000Z',
            end_at: '2026-08-01T00:00:00.000Z',
            cover_image_url: 'https://example.com/campaign-cover.jpg',
            organization: {
                id: 'org-1',
                code: 'DTE',
                name: 'Đoàn trường Bách khoa',
                type: 'SCHOOL',
            },
            module_types: ['event'],
            modules: [
                {
                    id: 'module-event-1',
                    type: 'event',
                    title: 'Ra quân địa phương',
                    description: 'Hỗ trợ triển khai hoạt động tại xã.',
                    status: 'ACTIVE',
                    start_at: '2026-07-15T00:00:00.000Z',
                    end_at: '2026-08-30T00:00:00.000Z',
                    settings: {
                        location: 'Xã Hòa Bắc, TP. Đà Nẵng',
                        quota: 50,
                    },
                    progress: {
                        type: 'event',
                        current: 45,
                        target: 50,
                        percent: 90,
                    },
                    cta: {
                        enabled: true,
                        label: 'Đăng ký tham gia',
                        action: 'register',
                    },
                },
            ],
            progress: {
                percent: 65,
                modules: [
                    {
                        type: 'event',
                        current: 45,
                        target: 50,
                        percent: 90,
                    },
                ],
            },
        });
    });

    it('renders the student registration layout with autofilled profile data', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Đăng ký tham gia' }),
            ).toBeTruthy();
        });

        expect(screen.getByText('Chiến dịch Mùa Hè Xanh 2024')).toBeTruthy();
        expect(screen.getByText('Nguyễn Văn A')).toBeTruthy();
        expect(screen.getByText('2021601234')).toBeTruthy();
        expect(screen.getByText('45/50 tình nguyện viên')).toBeTruthy();
        expect(screen.getByText('Xã Hòa Bắc, TP. Đà Nẵng')).toBeTruthy();
    });

    it('shows validation messages when required fields are missing', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Gửi đăng ký' }),
            ).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Gửi đăng ký' }));

        await waitFor(() => {
            expect(
                screen.getByText('Vui lòng nhập số điện thoại liên lạc.'),
            ).toBeTruthy();
        });

        expect(
            screen.getByText('Bạn cần xác nhận cam kết trước khi gửi đăng ký.'),
        ).toBeTruthy();
        expect(createEventRegistration).not.toHaveBeenCalled();
    });

    it('submits the registration payload after the student confirms the commitment', async () => {
        createEventRegistration.mockResolvedValue({
            id: 'registration-1',
            status: 'PENDING',
        });

        renderRoute();

        await waitFor(() => {
            expect(screen.getByLabelText('Số điện thoại')).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText('Số điện thoại'), {
            target: { value: '0901234567' },
        });
        fireEvent.change(
            screen.getByLabelText(/Kỹ năng đặc biệt \/ ghi chú/i),
            {
                target: { value: 'Quay phim, Sơ cứu' },
            },
        );
        fireEvent.click(
            screen.getByLabelText(
                /Tôi cam kết tham gia đầy đủ các buổi tập huấn/i,
            ),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Gửi đăng ký' }));

        await waitFor(() => {
            expect(createEventRegistration).toHaveBeenCalledWith(
                'module-event-1',
                {
                    answers: {
                        phone: '0901234567',
                        note: 'Quay phim, Sơ cứu',
                        skills: ['Quay phim', 'Sơ cứu'],
                        student_name: 'Nguyễn Văn A',
                        student_code: '2021601234',
                    },
                },
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Gửi đăng ký thành công',
            }),
        );
    });
});
