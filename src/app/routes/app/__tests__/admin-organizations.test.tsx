import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { AdminOrganizationsRoute } from '../admin-organizations';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getAdminOrganizations = vi.fn();
const getSchoolOverview = vi.fn();
const getOrganizationBySlug = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/auth', () => ({
    ROLES: {
        DOANTRUONG: 'DOANTRUONG',
    },
    useUser: () => mockUseUser(),
}));

vi.mock('@/features/admin/api/organizations', () => ({
    getAdminOrganizations: (...args: unknown[]) =>
        getAdminOrganizations(...args),
    createAdminOrganization: vi.fn(),
    updateAdminOrganization: vi.fn(),
    deleteAdminOrganization: vi.fn(),
}));

vi.mock('@/features/reports/api/reports', () => ({
    getSchoolOverview: (...args: unknown[]) => getSchoolOverview(...args),
}));

vi.mock('@/features/organizations/api/organizations', () => ({
    getOrganizationBySlug: (...args: unknown[]) =>
        getOrganizationBySlug(...args),
}));

describe('AdminOrganizationsRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: '1',
                role: 'DOANTRUONG',
            },
        });
        getAdminOrganizations.mockResolvedValue([
            {
                id: '1',
                code: 'CLB-XANH',
                name: 'CLB Công nghệ Xanh',
                type: 'CLUB',
                status: 'ACTIVE',
                faculty: { id: 'f1', name: 'Khoa Công nghệ Thông tin' },
                slug: 'clb-cong-nghe-xanh',
                description: 'Thúc đẩy các sáng kiến bền vững trong sinh viên.',
                created_at: '2026-01-10T00:00:00.000Z',
            },
        ]);
        getSchoolOverview.mockResolvedValue({
            total_campaigns: 8,
            total_students: 500,
            total_organizations: 1,
            total_money_donations: 450000000,
            organization_breakdown: [
                {
                    organization_id: 1,
                    organization_name: 'CLB Công nghệ Xanh',
                    organization_code: 'CLB-XANH',
                    campaign_count: 3,
                    verified_money_amount: 450000000,
                    received_item_quantity: 42,
                    completed_event_registrations: 120,
                    completed_event_hours: 680,
                    issued_certificates: 34,
                },
            ],
            module_breakdown: [],
            status_breakdown: [],
            filters_applied: {},
        });
        getOrganizationBySlug.mockResolvedValue({
            id: '1',
            code: 'CLB-XANH',
            name: 'CLB Công nghệ Xanh',
            type: 'CLUB',
            slug: 'clb-cong-nghe-xanh',
            logo_url: null,
            description: 'Thúc đẩy các sáng kiến bền vững trong sinh viên.',
            faculty: { id: 'f1', name: 'Khoa Công nghệ Thông tin' },
            status: 'ACTIVE',
            campaigns: [
                {
                    id: 'c1',
                    slug: 'chien-dich-xanh',
                    title: 'Chiến dịch xanh',
                    summary: 'Thu gom rác thải và truyền thông sống xanh.',
                    status: 'ONGOING',
                    start_at: '2026-05-01T00:00:00.000Z',
                    end_at: '2026-06-30T00:00:00.000Z',
                    cover_image_url: null,
                    module_types: ['event'],
                },
            ],
        });
    });

    it('renders the management list and detail panel', async () => {
        render(
            <MemoryRouter>
                <AdminOrganizationsRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByText('Danh mục đơn vị và báo cáo vận hành'),
            ).toBeTruthy();
        });

        expect(screen.getByText('Danh sách đơn vị và câu lạc bộ')).toBeTruthy();
        expect(screen.getByText('Chi tiết đơn vị')).toBeTruthy();
        expect(
            screen.getAllByText('CLB Công nghệ Xanh').length,
        ).toBeGreaterThan(0);
        expect(
            screen.getByRole('button', { name: /đăng ký đơn vị mới/i }),
        ).toBeTruthy();
    });
});
