import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { DonateRoute } from '../donate';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getFundraisingModule = vi.fn();
const getFundraisingDonations = vi.fn();
const createMoneyDonation = vi.fn();

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/auth', () => ({
    useUser: () => mockUseUser(),
}));

vi.mock('@/features/campaign/api/fundraising', () => ({
    getFundraisingModule: (...args: unknown[]) => getFundraisingModule(...args),
    getFundraisingDonations: (...args: unknown[]) =>
        getFundraisingDonations(...args),
    createMoneyDonation: (...args: unknown[]) => createMoneyDonation(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/app/donate/module-1']}>
            <Routes>
                <Route path="/app/donate/:moduleId" element={<DonateRoute />} />
            </Routes>
        </MemoryRouter>,
    );

describe('DonateRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as Mock).mockReturnValue(vi.fn());

        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                firstName: 'Nguyễn',
                lastName: 'Văn An',
            },
        });

        getFundraisingModule.mockResolvedValue({
            id: 'module-1',
            campaign_id: 'campaign-1',
            type: 'fundraising',
            title: 'Hỗ trợ sinh viên vùng lũ lụt 2024',
            status: 'ACTIVE',
            settings_json: {
                target_amount: 500000000,
                receiver_name: 'Quỹ Khuyến học Đại học Bách khoa',
                bank_name: 'VietinBank',
                bank_account_no: '102877559999',
                sepay_enabled: true,
                sepay_account_id: 'sepay-001',
            },
            total_raised: 425000000,
            campaign: {
                id: 'campaign-1',
                title: 'Hỗ trợ sinh viên vùng lũ lụt 2024',
                slug: 'ho-tro-sinh-vien-vung-lu-lut-2024',
                status: 'ONGOING',
            },
            config: {
                target_amount: 500000000,
                receiver_name: 'Quỹ Khuyến học Đại học Bách khoa',
                bank_name: 'VietinBank',
                bank_account_no: '102877559999',
                sepay_enabled: true,
                sepay_account_id: 'sepay-001',
            },
        });

        getFundraisingDonations.mockResolvedValue({
            items: [
                {
                    id: 'donation-1',
                    module_id: 'module-1',
                    student_id: 'student-11',
                    donor_name: 'Nguyễn Văn An',
                    amount: 200000,
                    status: 'VERIFIED',
                    matched_transaction_id: 'tx-1',
                    message: 'Chung tay tiếp sức',
                    evidence_url: null,
                    created_at: '2026-06-04T02:00:00.000Z',
                },
                {
                    id: 'donation-2',
                    module_id: 'module-1',
                    student_id: 'student-12',
                    donor_name: 'Mạnh Thắng',
                    amount: 1000000,
                    status: 'PENDING',
                    matched_transaction_id: null,
                    message: null,
                    evidence_url: null,
                    created_at: '2026-06-04T01:40:00.000Z',
                },
            ],
            pagination: {
                page: 1,
                limit: 3,
                total: 1240,
                totalPages: 414,
            },
        });
    });

    it('renders the student donation layout with bank info, progress, and recent supporters', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Đóng góp tài chính' }),
            ).toBeTruthy();
        });

        expect(
            screen.getByRole('heading', {
                name: 'Hỗ trợ sinh viên vùng lũ lụt 2024',
            }),
        ).toBeTruthy();
        expect(screen.getByText('VietinBank')).toBeTruthy();
        expect(screen.getByText('102877559999')).toBeTruthy();
        expect(screen.getByText('Đóng góp gần đây')).toBeTruthy();
        expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
        expect(screen.getByText('1.240 lượt đóng góp')).toBeTruthy();
    });

    it('submits a donation and navigates to the payment step', async () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);
        createMoneyDonation.mockResolvedValue({
            id: 'donation-created-1',
            status: 'PENDING',
        });

        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByLabelText('Số tiền đóng góp (VND)'),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText('Số tiền đóng góp (VND)'), {
            target: { value: '500000' },
        });
        fireEvent.change(screen.getByLabelText('Tên nhà hảo tâm'), {
            target: { value: 'Nguyễn Văn An' },
        });
        fireEvent.change(screen.getByLabelText('Lời nhắn'), {
            target: { value: 'Chúc chiến dịch lan tỏa mạnh mẽ.' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Xác nhận đóng góp' }),
        );

        await waitFor(() => {
            expect(createMoneyDonation).toHaveBeenCalledWith('module-1', {
                amount: 500000,
                donor_name: 'Nguyễn Văn An',
                message: 'Chúc chiến dịch lan tỏa mạnh mẽ.',
            });
        });

        expect(navigate).toHaveBeenCalledWith(
            paths.app.donationPayment.getHref('donation-created-1'),
        );
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đóng góp thành công',
            }),
        );
    });

    it('keeps the confirm button disabled until the amount is valid', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Xác nhận đóng góp' }),
            ).toBeTruthy();
        });

        expect(
            screen.getByRole('button', { name: 'Xác nhận đóng góp' }),
        ).toHaveProperty('disabled', true);

        fireEvent.change(screen.getByLabelText('Số tiền đóng góp (VND)'), {
            target: { value: '200000' },
        });

        expect(
            screen.getByRole('button', { name: 'Xác nhận đóng góp' }),
        ).toHaveProperty('disabled', false);
    });
});
