import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { CertificatesRoute } from '../certificates';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getMyCertificates = vi.fn();
const getStudentDashboard = vi.fn();
const writeText = vi.fn();

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

vi.mock('@/features/certificates/api/certificates', () => ({
    getMyCertificates: (...args: unknown[]) => getMyCertificates(...args),
}));

const renderRoute = (initialEntry = '/app/certificates') =>
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/app" element={<div>Trang tổng quan</div>} />
                <Route
                    path="/app/certificates"
                    element={<CertificatesRoute />}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('CertificatesRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window.navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText,
            },
        });
        writeText.mockResolvedValue(undefined);

        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                role: 'SINHVIEN',
            },
        });

        getMyCertificates.mockResolvedValue([
            {
                id: 'certificate-1',
                certificateNo: 'CERT-2026-001',
                campaignId: 'campaign-1',
                campaignTitle: 'Mùa hè xanh 2026',
                moduleTitle: 'Đội hình hỗ trợ xã Hòa Bắc',
                templateName: 'Chứng nhận hoàn thành chiến dịch',
                status: 'SIGNED',
                previewImageUrl: '/uploads/certificates/certificate-1.png',
                backgroundFileUrl: '/uploads/certificates/template-1.png',
                generatedFileUrl: '/uploads/certificates/generated-1.png',
                signedFileUrl: '/uploads/certificates/signed-1.png',
                fileUrl: 'https://example.com/certificate-1.pdf',
                issuedAt: '2026-05-18T08:00:00.000Z',
                revokedAt: null,
                createdAt: '2026-05-18T08:00:00.000Z',
            },
            {
                id: 'certificate-2',
                certificateNo: 'CERT-2025-014',
                campaignId: 'campaign-2',
                campaignTitle: 'Tiếp sức mùa thi 2025',
                moduleTitle: 'Điểm trực cổng trường',
                templateName: 'Giấy chứng nhận tình nguyện viên',
                status: 'READY',
                previewImageUrl: null,
                backgroundFileUrl: '/uploads/certificates/template-2.png',
                generatedFileUrl: '/uploads/certificates/generated-2.png',
                signedFileUrl: null,
                fileUrl: 'https://example.com/certificate-2.pdf',
                issuedAt: '2025-07-12T08:00:00.000Z',
                revokedAt: null,
                createdAt: '2025-07-12T08:00:00.000Z',
            },
        ]);

        getStudentDashboard.mockResolvedValue({
            campaigns_count: 9,
            money_amount: 1200000,
            money_donations_count: 2,
            item_received_quantity: 4,
            item_received_count: 2,
            event_hours: 96,
            event_completed_count: 3,
            certificates_count: 2,
            recent_activities: [],
        });
    });

    it('renders the student certificate management layout', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Giấy chứng nhận' }),
            ).toBeTruthy();
        });

        expect(screen.getAllByText('Mùa hè xanh 2026').length).toBeGreaterThan(
            0,
        );
        expect(
            screen.getAllByText('Tiếp sức mùa thi 2025').length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('96')).toBeTruthy();
        expect(screen.getByText(/9 chiến dịch đã tham gia\./)).toBeTruthy();
        expect(
            screen.getByText('Hiển thị 2 trên 2 chứng nhận đã ghi nhận.'),
        ).toBeTruthy();
        expect(
            screen.getByRole('img', { name: 'Chứng nhận CERT-2026-001' }),
        ).toBeTruthy();
    });

    it('prefers the actual rendered certificate image on the student card', async () => {
        renderRoute();

        const image = await screen.findByRole('img', {
            name: 'Chứng nhận CERT-2026-001',
        });

        expect(image.getAttribute('src')).toBe(
            '/uploads/certificates/signed-1.png',
        );
    });

    it('filters certificates by year and search query', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getAllByText('Mùa hè xanh 2026').length,
            ).toBeGreaterThan(0);
        });

        fireEvent.change(screen.getByLabelText('Lọc theo năm'), {
            target: { value: '2025' },
        });

        await waitFor(() => {
            expect(
                screen.getAllByText('Tiếp sức mùa thi 2025').length,
            ).toBeGreaterThan(0);
        });

        expect(screen.queryByText('Mùa hè xanh 2026')).toBeNull();

        fireEvent.change(
            screen.getByPlaceholderText('Tìm theo mã hoặc tên chiến dịch'),
            {
                target: { value: 'điểm trực' },
            },
        );

        await waitFor(() => {
            expect(
                screen.getAllByText('Tiếp sức mùa thi 2025').length,
            ).toBeGreaterThan(0);
        });
    });

    it('copies the verification text when sharing a certificate', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Chia sẻ CERT-2026-001',
                }),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Chia sẻ CERT-2026-001',
            }),
        );

        await waitFor(() => {
            expect(writeText).toHaveBeenCalledWith(
                'Tra cứu chứng nhận tại http://localhost:3000/certificates/verify với mã CERT-2026-001',
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã sao chép thông tin',
            }),
        );
    });

    it('redirects non-student roles back to the dashboard', () => {
        mockUseUser.mockReturnValue({
            data: {
                id: 'club-1',
                role: 'CLB',
            },
        });

        renderRoute();

        expect(screen.getByText('Trang tổng quan')).toBeTruthy();
    });
});
