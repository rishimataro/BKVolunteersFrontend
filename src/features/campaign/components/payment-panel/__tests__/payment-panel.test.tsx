import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { PaymentPanel } from '../PaymentPanel';

const { navigateMock, getDonationByIdMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    getDonationByIdMock: vi.fn(),
}));

vi.mock('@/features/campaign/api/fundraising', () => ({
    getDonationById: getDonationByIdMock,
}));

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>(
        'react-router',
    );

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

const baseDonation = {
    id: '501',
    status: 'PENDING',
    payment_mode: 'TRANSFER_CODE',
    matched_transaction_id: null,
    matched_at: null,
    verified_at: null,
    reject_reason: null,
    payment_instruction: {
        receiver_name: 'CLB Tinh nguyện CNTT',
        bank_name: 'BIDV',
        bank_account_no: '0000000001',
        payment_code: 'BKV-501',
        transfer_content: 'BKV-501',
        expires_at: '2026-05-26T18:00:00.000Z',
        vietqr_url: 'https://img.vietqr.io/image.png',
        amount: 100000,
        currency: 'VND',
    },
};

describe('PaymentPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-26T17:30:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderPanel = () =>
        render(
            <MemoryRouter>
                <PaymentPanel donationId="501" />
            </MemoryRouter>,
        );

    const flushAsyncState = async () => {
        await act(async () => {
            await Promise.resolve();
        });
    };

    it('renders QR, transfer content, and payment details after load', async () => {
        getDonationByIdMock.mockResolvedValue(baseDonation);

        renderPanel();
        await flushAsyncState();

        expect(getDonationByIdMock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Thanh toán donation')).toBeDefined();
        expect(screen.getByText('CLB Tinh nguyện CNTT')).toBeDefined();
        expect(screen.getByText('BIDV')).toBeDefined();
        expect(screen.getByText('0000000001')).toBeDefined();
        expect(screen.getAllByText('BKV-501').length).toBeGreaterThan(0);
        expect(
            screen.getByAltText('VietQR'),
        ).toBeDefined();
        expect(
            screen.getByText(/Chờ chuyển khoản/i),
        ).toBeDefined();
    });

    it('renders order VA details and provider QR when donation uses ORDER_VA', async () => {
        getDonationByIdMock.mockResolvedValue({
            ...baseDonation,
            payment_mode: 'ORDER_VA',
            provider_references: {
                sepay_order_id: 'order_501',
                sepay_bank_account_id: 'acc_demo_bidv',
                sepay_virtual_account_id: 'va_501',
            },
            payment_instruction: {
                ...baseDonation.payment_instruction,
                bank_account_no: '0000000001',
                sepay_order_id: 'order_501',
                provider_qr_url: 'https://img.vietqr.io/order-qr.png',
                virtual_account: {
                    id: 'va_501',
                    va_number: '9704000000501',
                    holder_name: 'Student Order Va',
                    amount: 100000,
                    expires_at: '2026-05-26T18:00:00.000Z',
                    status: 'ACTIVE',
                },
            },
        });

        renderPanel();
        await flushAsyncState();

        expect(screen.getByTestId('payment-order-va-summary')).toBeDefined();
        expect(screen.getByText('order_501')).toBeDefined();
        expect(
            screen.getByTestId('payment-virtual-account').textContent,
        ).toContain('9704000000501');
        expect(screen.getByAltText('SePay order QR')).toBeDefined();
    });

    it('polls donation status and keeps user on the panel when it becomes matched', async () => {
        getDonationByIdMock
            .mockResolvedValueOnce(baseDonation)
            .mockResolvedValueOnce({
                ...baseDonation,
                status: 'MATCHED',
                matched_transaction_id: '8801',
                matched_at: '2026-05-26T17:31:00.000Z',
            });

        renderPanel();
        await flushAsyncState();

        await act(async () => {
            vi.advanceTimersByTime(5000);
            await Promise.resolve();
        });

        expect(getDonationByIdMock).toHaveBeenCalledTimes(2);
        expect(
            screen.getByText(/Đã ghi nhận giao dịch/i),
        ).toBeDefined();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('stops polling after donation reaches a terminal state', async () => {
        getDonationByIdMock
            .mockResolvedValueOnce(baseDonation)
            .mockResolvedValueOnce({
                ...baseDonation,
                status: 'VERIFIED',
                verified_at: '2026-05-26T17:32:00.000Z',
            });

        renderPanel();
        await flushAsyncState();

        await act(async () => {
            vi.advanceTimersByTime(5000);
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(10000);
            await Promise.resolve();
        });

        expect(getDonationByIdMock).toHaveBeenCalledTimes(2);
        expect(
            screen.getByText(/Đã xác minh thành công/i),
        ).toBeDefined();
    });
});
