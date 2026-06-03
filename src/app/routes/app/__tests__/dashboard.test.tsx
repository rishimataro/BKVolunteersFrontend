import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { DashboardRoute } from '../dashboard';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getSchoolOverview = vi.fn();
const getApprovalQueue = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/auth', () => ({
    ROLES: {
        SINHVIEN: 'SINHVIEN',
        DOANTRUONG: 'DOANTRUONG',
    },
    useUser: () => mockUseUser(),
}));

vi.mock('@/features/reports/api/reports', () => ({
    getSchoolOverview: (...args: unknown[]) => getSchoolOverview(...args),
}));

vi.mock('@/features/campaign/api/approval', () => ({
    getApprovalQueue: (...args: unknown[]) => getApprovalQueue(...args),
}));

vi.mock('@/features/campaign/api/student', () => ({
    getStudentActivities: vi.fn(),
    getStudentDashboard: vi.fn(),
    getStudentDonations: vi.fn(),
}));

describe('DashboardRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: '1',
                firstName: 'Đoàn',
                lastName: 'Trường',
                role: 'DOANTRUONG',
            },
        });
        getSchoolOverview.mockResolvedValue({
            total_campaigns: 12,
            total_students: 1250,
            total_organizations: 8,
            total_money_donations: 920000000,
            organization_breakdown: [
                {
                    organization_id: 1,
                    organization_name: 'Khoa Công nghệ Thông tin',
                    organization_code: 'CNTT',
                    campaign_count: 4,
                    verified_money_amount: 500000000,
                    received_item_quantity: 120,
                    completed_event_registrations: 320,
                    completed_event_hours: 8500,
                    issued_certificates: 200,
                },
            ],
            module_breakdown: [],
            status_breakdown: [
                { status: 'ONGOING', campaign_count: 5 },
                { status: 'SUBMITTED', campaign_count: 2 },
            ],
            filters_applied: {},
        });
        getApprovalQueue.mockResolvedValue([
            {
                id: 'c-1',
                slug: 'chien-dich-mua-he-xanh',
                title: 'Chiến dịch mùa hè xanh',
                summary: 'Hoạt động hỗ trợ cộng đồng tại địa phương.',
                status: 'SUBMITTED',
                organization: {
                    id: 'org-1',
                    code: 'CNTT',
                    name: 'Khoa Công nghệ Thông tin',
                    type: 'FACULTY',
                },
                module_types: ['event'],
                submitted_at: '2026-06-01T08:00:00.000Z',
            },
        ]);
    });

    it('renders the school board dashboard layout', async () => {
        render(
            <MemoryRouter>
                <DashboardRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByText('Báo cáo tổng quan Đoàn trường'),
            ).toBeTruthy();
        });

        expect(screen.getByText('Xếp hạng đơn vị hoạt động')).toBeTruthy();
        expect(screen.getByText('Chiến dịch chờ phê duyệt')).toBeTruthy();
        expect(screen.getByText('Khoa Công nghệ Thông tin')).toBeTruthy();
        expect(
            screen.getByRole('link', { name: /mở hồ sơ kiểm duyệt/i }),
        ).toBeTruthy();
    });
});
