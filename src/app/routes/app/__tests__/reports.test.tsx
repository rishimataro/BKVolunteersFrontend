import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { ReportsRoute } from '../reports';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getManagedCampaigns = vi.fn();
const getSchoolOverview = vi.fn();
const getCampaignReport = vi.fn();
const getCampaignReconciliationReport = vi.fn();
const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();
const anchorClick = vi.fn();

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

vi.mock('@/features/campaign/api/campaign', () => ({
    getManagedCampaigns: (...args: unknown[]) => getManagedCampaigns(...args),
}));

vi.mock('@/features/reports/api/reports', () => ({
    getSchoolOverview: (...args: unknown[]) => getSchoolOverview(...args),
    getCampaignReport: (...args: unknown[]) => getCampaignReport(...args),
    getCampaignReconciliationReport: (...args: unknown[]) =>
        getCampaignReconciliationReport(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter>
            <ReportsRoute />
        </MemoryRouter>,
    );

describe('ReportsRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: createObjectURL,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: revokeObjectURL,
        });
        createObjectURL.mockReturnValue('blob:report-export');
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
            anchorClick,
        );

        mockUseUser.mockReturnValue({
            data: {
                id: 'admin-1',
                role: 'DOANTRUONG',
            },
        });

        getManagedCampaigns.mockResolvedValue([
            {
                id: 'campaign-1',
                slug: 'mua-he-xanh-2026',
                title: 'Mùa hè xanh 2026',
                summary: 'Chiến dịch hỗ trợ cộng đồng.',
                status: 'ONGOING',
                organization_id: 'org-1',
                start_at: '2026-06-01T08:00:00.000Z',
                end_at: '2026-07-01T08:00:00.000Z',
                module_types: ['event', 'fundraising'],
            },
        ]);

        getSchoolOverview.mockResolvedValue({
            total_campaigns: 12,
            total_students: 1250,
            total_organizations: 8,
            total_money_donations: 920000000,
            organization_breakdown: [
                {
                    organization_id: 1,
                    organization_name: 'LCĐ Khoa CNTT',
                    organization_code: 'CNTT',
                    campaign_count: 4,
                    verified_money_amount: 500000000,
                    received_item_quantity: 120,
                    completed_event_registrations: 320,
                    completed_event_hours: 8500,
                    issued_certificates: 200,
                },
            ],
            module_breakdown: [
                {
                    module_type: 'event',
                    campaign_count: 5,
                },
            ],
            status_breakdown: [
                {
                    status: 'ONGOING',
                    campaign_count: 5,
                },
            ],
            filters_applied: {},
        });

        getCampaignReport.mockResolvedValue({
            campaign: {
                id: 1,
                title: 'Mùa hè xanh 2026',
                slug: 'mua-he-xanh-2026',
                status: 'ONGOING',
            },
            modules: [
                {
                    id: 1,
                    type: 'event',
                    status: 'ACTIVE',
                },
            ],
            fundraising: {
                total_verified_amount: 350000000,
                total_donations: 120,
                verified_donations: 100,
            },
            item_donations: {
                received_quantity: 75,
            },
            events: {
                registrations: 250,
                completed_registrations: 180,
                completed_hours: 920,
            },
            certificates: {
                issued_total: 160,
            },
        });

        getCampaignReconciliationReport.mockResolvedValue({
            campaign: {
                id: 1,
                title: 'Mùa hè xanh 2026',
                slug: 'mua-he-xanh-2026',
                status: 'ONGOING',
                organization_id: 1,
            },
            reconciliation: {
                matched_transactions: 90,
                unmatched_transactions: 12,
                total_transaction_amount: 360000000,
                matched_transaction_amount: 350000000,
                unmatched_transaction_amount: 10000000,
                pending_donations: 8,
                matched_donations: 100,
                verified_donations: 95,
                rejected_donations: 5,
                verified_amount: 340000000,
                amount_gap_vs_verified: 10000000,
            },
        });
    });

    it('renders school overview and campaign report blocks for the school role', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Dashboard toàn trường')).toBeTruthy();
        });

        expect(
            screen.getByTestId('school-overview-stat-total_campaigns'),
        ).toBeTruthy();
        expect(
            screen.getByTestId('school-overview-organization-table'),
        ).toBeTruthy();
        expect(screen.getByText('Campaign summary')).toBeTruthy();
        expect(screen.getByText('Đối soát verified')).toBeTruthy();
        expect(screen.getAllByText('Mùa hè xanh 2026').length).toBeGreaterThan(
            0,
        );
    });

    it('blocks applying an invalid date range', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Dashboard toàn trường')).toBeTruthy();
        });

        fireEvent.change(screen.getByTestId('school-overview-filter-from'), {
            target: { value: '2026-06-10T10:00' },
        });
        fireEvent.change(screen.getByTestId('school-overview-filter-to'), {
            target: { value: '2026-06-01T10:00' },
        });

        fireEvent.click(screen.getByTestId('reports-apply-filters'));

        expect(screen.getByTestId('reports-filter-error')).toBeTruthy();
        expect(getSchoolOverview).toHaveBeenCalledTimes(1);
    });

    it('exports the school overview as csv from the dialog', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByTestId('reports-export-school-trigger'),
            ).toBeTruthy();
        });

        fireEvent.click(screen.getByTestId('reports-export-school-trigger'));
        fireEvent.click(screen.getByTestId('reports-export-submit'));

        await waitFor(() => {
            expect(createObjectURL).toHaveBeenCalledTimes(1);
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã xuất dashboard toàn trường',
            }),
        );
    });

    it('exports the campaign report as csv from the dialog', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByTestId('reports-export-campaign-trigger'),
            ).toBeTruthy();
        });

        fireEvent.click(screen.getByTestId('reports-export-campaign-trigger'));
        fireEvent.click(screen.getByTestId('reports-export-submit'));

        await waitFor(() => {
            expect(createObjectURL).toHaveBeenCalledTimes(1);
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã xuất báo cáo campaign',
            }),
        );
    });
});
