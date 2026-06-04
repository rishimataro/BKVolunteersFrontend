import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { CampaignsRoute } from '../campaigns';
import type { PublicCampaignCard } from '@/types/api';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getPublicCampaigns = vi.fn();
const listOrganizations = vi.fn();

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
    getPublicCampaigns: (...args: unknown[]) => getPublicCampaigns(...args),
}));

vi.mock('@/features/organizations/api/organizations', () => ({
    listOrganizations: (...args: unknown[]) => listOrganizations(...args),
}));

const buildCampaign = (
    index: number,
    overrides: Partial<PublicCampaignCard> = {},
): PublicCampaignCard => ({
    id: `campaign-${index}`,
    slug: `chien-dich-${index}`,
    title: `Chiến dịch số ${index}`,
    summary: `Mô tả ngắn cho chiến dịch số ${index}.`,
    cover_image_url: null,
    organization: {
        id: index % 2 === 0 ? 'org-green' : 'org-tech',
        code: index % 2 === 0 ? 'GREEN' : 'TECH',
        name: index % 2 === 0 ? 'CLB Tình nguyện Xanh' : 'LCĐ Khoa CNTT',
        type: 'CLUB',
        logo_url: null,
    },
    module_types: ['event'],
    status: 'ONGOING',
    start_at: '2026-05-10T08:00:00.000Z',
    end_at: '2026-08-20T17:00:00.000Z',
    progress: {
        percent: 40 + index,
        modules: [
            {
                type: 'event',
                current: 10 + index,
                target: 30,
                percent: 40 + index,
            },
        ],
    },
    ...overrides,
});

const ongoingCampaigns = Array.from({ length: 7 }, (_, index) =>
    buildCampaign(index + 1),
);

const upcomingCampaign = buildCampaign(8, {
    slug: 'chien-dich-sap-dien-ra',
    title: 'Chiến dịch sắp diễn ra',
    status: 'PUBLISHED',
    start_at: '2026-07-10T08:00:00.000Z',
    end_at: '2026-08-01T17:00:00.000Z',
    module_types: ['fundraising'],
    progress: {
        percent: 15,
        modules: [
            {
                type: 'fundraising',
                current: 1500000,
                target: 10000000,
                percent: 15,
            },
        ],
    },
});

const organizationFilteredCampaigns = [
    buildCampaign(21, {
        slug: 'chien-dich-clb-xanh',
        title: 'Ngày xanh khu nội trú',
        organization: {
            id: 'org-green',
            code: 'GREEN',
            name: 'CLB Tình nguyện Xanh',
            type: 'CLUB',
            logo_url: null,
        },
    }),
];

const renderRoute = () =>
    render(
        <MemoryRouter>
            <CampaignsRoute />
        </MemoryRouter>,
    );

describe('StudentCampaignDiscovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                role: 'SINHVIEN',
            },
        });

        listOrganizations.mockResolvedValue([
            {
                id: 'org-green',
                code: 'GREEN',
                name: 'CLB Tình nguyện Xanh',
                type: 'CLUB',
                slug: 'clb-tinh-nguyen-xanh',
                logo_url: null,
                description: null,
                faculty: null,
                status: 'ACTIVE',
            },
            {
                id: 'org-tech',
                code: 'TECH',
                name: 'LCĐ Khoa CNTT',
                type: 'FACULTY',
                slug: 'lcd-khoa-cntt',
                logo_url: null,
                description: null,
                faculty: null,
                status: 'ACTIVE',
            },
        ]);

        getPublicCampaigns.mockImplementation(
            ({ organization_id }: { organization_id?: string }) => {
                if (organization_id === 'org-green') {
                    return Promise.resolve({
                        items: organizationFilteredCampaigns,
                        meta: {
                            page: 1,
                            total: 1,
                            totalPages: 1,
                            total_pages: 1,
                        },
                    });
                }

                return Promise.resolve({
                    items: [...ongoingCampaigns, upcomingCampaign],
                    meta: {
                        page: 1,
                        total: 8,
                        totalPages: 1,
                        total_pages: 1,
                    },
                });
            },
        );
    });

    it('renders the student discovery layout and paginates ongoing campaigns', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Khám phá chiến dịch' }),
            ).toBeTruthy();
        });

        expect(screen.getByText('Bộ lọc tìm kiếm')).toBeTruthy();
        expect(screen.getByText('Trở thành đại sứ')).toBeTruthy();
        expect(screen.getByText('Chiến dịch số 1')).toBeTruthy();
        expect(screen.queryByText('Chiến dịch sắp diễn ra')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));

        await waitFor(() => {
            expect(screen.getByText('Chiến dịch số 7')).toBeTruthy();
        });
    });

    it('includes upcoming campaigns when enabling the matching status filter', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Chiến dịch số 1')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('Sắp diễn ra'));
        fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));

        await waitFor(() => {
            expect(screen.getByText('Chiến dịch sắp diễn ra')).toBeTruthy();
        });
    });

    it('refetches campaigns when filtering by organization', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Chiến dịch số 1')).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText('Đơn vị tổ chức'), {
            target: { value: 'org-green' },
        });

        await waitFor(() => {
            expect(getPublicCampaigns).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    organization_id: 'org-green',
                }),
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Ngày xanh khu nội trú')).toBeTruthy();
        });
    });
});
