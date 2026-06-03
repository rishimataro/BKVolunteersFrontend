import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { FundraisingManagementRoute } from '../fundraising-management';

const addNotification = vi.fn();
const getFundraisingModule = vi.fn();
const getFundraisingDonations = vi.fn();
const getFundraisingTransactions = vi.fn();
const verifyFundraisingDonation = vi.fn();
const rejectFundraisingDonation = vi.fn();
const attachFundraisingTransaction = vi.fn();
const unmatchFundraisingTransaction = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/campaign/api/fundraising', () => ({
    getFundraisingModule: (...args: unknown[]) => getFundraisingModule(...args),
    getFundraisingDonations: (...args: unknown[]) =>
        getFundraisingDonations(...args),
    getFundraisingTransactions: (...args: unknown[]) =>
        getFundraisingTransactions(...args),
    verifyFundraisingDonation: (...args: unknown[]) =>
        verifyFundraisingDonation(...args),
    rejectFundraisingDonation: (...args: unknown[]) =>
        rejectFundraisingDonation(...args),
    attachFundraisingTransaction: (...args: unknown[]) =>
        attachFundraisingTransaction(...args),
    unmatchFundraisingTransaction: (...args: unknown[]) =>
        unmatchFundraisingTransaction(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/app/fundraising/module-1']}>
            <Routes>
                <Route
                    path="/app/fundraising/:moduleId"
                    element={<FundraisingManagementRoute />}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('FundraisingManagementRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getFundraisingModule.mockResolvedValue({
            id: 'module-1',
            campaign_id: 'campaign-1',
            type: 'fundraising',
            title: 'Gây quỹ học bổng',
            status: 'ACTIVE',
            settings_json: {
                target_amount: 50000000,
                receiver_name: 'BK Volunteers',
                bank_name: 'Vietcombank',
                bank_account_no: '123456789',
                sepay_enabled: true,
                sepay_account_id: 'sepay-001',
            },
            total_raised: 1700000,
            campaign: {
                id: 'campaign-1',
                title: 'Tiếp sức đến trường 2026',
                slug: 'tiep-suc-den-truong-2026',
                status: 'ONGOING',
            },
            config: {
                target_amount: 50000000,
                receiver_name: 'BK Volunteers',
                bank_name: 'Vietcombank',
                bank_account_no: '123456789',
                sepay_enabled: true,
                sepay_account_id: 'sepay-001',
            },
        });
        getFundraisingDonations.mockResolvedValue({
            items: [
                {
                    id: 'donation-1',
                    module_id: 'module-1',
                    student_id: 'student-1',
                    donor_name: 'Nguyễn Thành Trung',
                    amount: 500000,
                    status: 'PENDING',
                    matched_transaction_id: null,
                    message: 'Ủng hộ học bổng tháng 6',
                    evidence_url: 'https://example.com/evidence-1.jpg',
                    created_at: '2026-06-03T08:15:00.000Z',
                },
                {
                    id: 'donation-2',
                    module_id: 'module-1',
                    student_id: 'student-2',
                    donor_name: 'Lê Thị Hoa',
                    amount: 1200000,
                    status: 'VERIFIED',
                    matched_transaction_id: 'tx-2',
                    message: 'Tiếp sức đến trường',
                    evidence_url: null,
                    created_at: '2026-06-02T08:15:00.000Z',
                    verified_at: '2026-06-02T09:00:00.000Z',
                },
            ],
            pagination: {
                page: 1,
                limit: 100,
                total: 2,
                totalPages: 1,
            },
        });
        getFundraisingTransactions.mockResolvedValue({
            items: [
                {
                    id: 'tx-1',
                    provider: 'SEPAY',
                    provider_transaction_id: 'FT260603001',
                    campaign_id: 'campaign-1',
                    module_id: 'module-1',
                    amount: 500000,
                    content: 'Nguyen Thanh Trung hoc bong',
                    account_no: '123456789',
                    transaction_time: '2026-06-03T08:10:00.000Z',
                    match_status: 'UNMATCHED',
                    matched_donation: null,
                },
                {
                    id: 'tx-2',
                    provider: 'SEPAY',
                    provider_transaction_id: 'FT260602002',
                    campaign_id: 'campaign-1',
                    module_id: 'module-1',
                    amount: 1200000,
                    content: 'Le Thi Hoa tiep suc',
                    account_no: '123456789',
                    transaction_time: '2026-06-02T08:00:00.000Z',
                    match_status: 'MATCHED',
                    matched_donation: {
                        id: 'donation-2',
                        donor_name: 'Lê Thị Hoa',
                        amount: 1200000,
                        status: 'VERIFIED',
                        created_at: '2026-06-02T08:15:00.000Z',
                    },
                },
            ],
            pagination: {
                page: 1,
                limit: 100,
                total: 2,
                totalPages: 1,
            },
        });
        verifyFundraisingDonation.mockResolvedValue({
            id: 'donation-1',
            status: 'VERIFIED',
        });
        rejectFundraisingDonation.mockResolvedValue({
            id: 'donation-1',
            status: 'REJECTED',
        });
        attachFundraisingTransaction.mockResolvedValue({});
        unmatchFundraisingTransaction.mockResolvedValue({});
    });

    it('renders the online donation verification workspace with detail panel', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Tiếp sức đến trường 2026')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByText('Nguyễn Thành Trung')[0]);

        expect(
            screen.getByRole('heading', { name: /xác minh đóng góp/i }),
        ).toBeTruthy();
        expect(
            screen.getByRole('heading', {
                name: 'Nguyễn Thành Trung',
                level: 3,
            }),
        ).toBeTruthy();
        expect(screen.getAllByText(/500\.000/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/chi tiết minh chứng/i)).toBeTruthy();
        expect(screen.getByText(/ủng hộ học bổng tháng 6/i)).toBeTruthy();
        expect(screen.getAllByText(/chờ xác minh/i).length).toBeGreaterThan(0);
    });

    it('verifies a donation with the selected transaction id', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Tiếp sức đến trường 2026')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByText('Nguyễn Thành Trung')[0]);
        fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }));

        await waitFor(() => {
            expect(verifyFundraisingDonation).toHaveBeenCalledWith(
                'donation-1',
                {
                    transaction_id: 'tx-1',
                },
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã xác minh đóng góp',
            }),
        );
    });
});
