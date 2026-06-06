import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { CampaignCertificatesRoute } from '../campaign-certificates';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const listCampaignCertificates = vi.fn();
const getTemplates = vi.fn();
const generateCertificates = vi.fn();
const renderCertificate = vi.fn();
const revokeCertificate = vi.fn();
const reissueCertificate = vi.fn();
const openWindow = vi.fn();

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

vi.mock('@/features/certificates/api/management', () => ({
    listCampaignCertificates: (...args: unknown[]) =>
        listCampaignCertificates(...args),
    generateCertificates: (...args: unknown[]) => generateCertificates(...args),
    renderCertificate: (...args: unknown[]) => renderCertificate(...args),
    revokeCertificate: (...args: unknown[]) => revokeCertificate(...args),
    reissueCertificate: (...args: unknown[]) => reissueCertificate(...args),
}));

vi.mock('@/features/certificates/api/templates', () => ({
    getTemplates: (...args: unknown[]) => getTemplates(...args),
}));

const certificatesFixture = [
    {
        id: 'cert-1',
        certificate_no: 'CERT-001',
        campaign_id: 'campaign-1',
        module_id: 'module-1',
        module_title: 'Ngày hội tuyển quân',
        student_id: 'student-1',
        student_name: 'Nguyễn Văn An',
        student_code: '21110001',
        template_id: 'tpl-1',
        template_name: 'Mẫu hoàn thành chiến dịch',
        status: 'READY',
        snapshot_json: {},
        file_url: null,
        file_hash: null,
        issued_at: '2026-06-01T08:00:00.000Z',
        revoked_at: null,
        revoked_by: null,
        revoke_reason: null,
        replacement_certificate_id: null,
        created_at: '2026-06-01T08:00:00.000Z',
        updated_at: '2026-06-01T08:00:00.000Z',
    },
    {
        id: 'cert-2',
        certificate_no: 'CERT-002',
        campaign_id: 'campaign-1',
        module_id: 'module-2',
        module_title: 'Hỗ trợ hậu cần',
        student_id: 'student-2',
        student_name: 'Lê Thị Bình',
        student_code: '21110002',
        template_id: 'tpl-1',
        template_name: 'Mẫu hoàn thành chiến dịch',
        status: 'SIGNED',
        snapshot_json: {},
        file_url: 'https://example.com/cert-002.pdf',
        file_hash: 'hash-2',
        issued_at: '2026-06-02T08:00:00.000Z',
        revoked_at: null,
        revoked_by: null,
        revoke_reason: null,
        replacement_certificate_id: null,
        created_at: '2026-06-02T08:00:00.000Z',
        updated_at: '2026-06-02T08:00:00.000Z',
    },
    {
        id: 'cert-3',
        certificate_no: 'CERT-003',
        campaign_id: 'campaign-1',
        module_id: 'module-3',
        module_title: 'Truyền thông',
        student_id: 'student-3',
        student_name: 'Phạm Quốc Cường',
        student_code: '21110003',
        template_id: 'tpl-2',
        template_name: 'Mẫu đóng góp',
        status: 'REVOKED',
        snapshot_json: {},
        file_url: 'https://example.com/cert-003.pdf',
        file_hash: 'hash-3',
        issued_at: '2026-06-03T08:00:00.000Z',
        revoked_at: '2026-06-04T08:00:00.000Z',
        revoked_by: 'admin-1',
        revoke_reason: 'Cập nhật sai số giờ',
        replacement_certificate_id: null,
        created_at: '2026-06-03T08:00:00.000Z',
        updated_at: '2026-06-04T08:00:00.000Z',
    },
];

const renderRoute = () =>
    render(
        <MemoryRouter
            initialEntries={['/app/certificates/campaigns/campaign-1']}
        >
            <Routes>
                <Route
                    path="/app/campaigns"
                    element={<div>Danh sách chiến dịch</div>}
                />
                <Route
                    path="/app/certificates/campaigns/:campaignId"
                    element={<CampaignCertificatesRoute />}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('CampaignCertificatesRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(window, 'open', {
            configurable: true,
            value: openWindow,
        });

        mockUseUser.mockReturnValue({
            data: {
                id: 'admin-1',
                role: 'DOANTRUONG',
            },
        });

        listCampaignCertificates.mockResolvedValue(certificatesFixture);
        getTemplates.mockResolvedValue([
            {
                id: 'tpl-1',
                name: 'Mẫu hoàn thành chiến dịch',
                status: 'ACTIVE',
            },
            {
                id: 'tpl-2',
                name: 'Mẫu cũ',
                status: 'INACTIVE',
            },
        ]);
        generateCertificates.mockResolvedValue({
            dry_run: true,
            candidate_count: 2,
            created_count: 0,
            items: [
                {
                    ...certificatesFixture[0],
                    id: 'preview-1',
                    status: 'READY',
                },
                {
                    ...certificatesFixture[1],
                    id: 'preview-2',
                    status: 'SIGNED',
                },
            ],
        });
        renderCertificate.mockResolvedValue({
            queued: true,
            certificate_id: 'cert-1',
        });
        revokeCertificate.mockResolvedValue({
            ...certificatesFixture[1],
            status: 'REVOKED',
        });
        reissueCertificate.mockResolvedValue({
            ...certificatesFixture[2],
            status: 'READY',
        });
    });

    it('renders the certificate list and filters by keyword and status', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Quản lý chứng nhận')).toBeTruthy();
        });

        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
        expect(screen.getByText('Lê Thị Bình')).toBeTruthy();

        fireEvent.change(
            screen.getByPlaceholderText('Số hiệu, MSSV, sinh viên, mẫu'),
            {
                target: { value: 'Bình' },
            },
        );

        await waitFor(() => {
            expect(screen.getByText('Lê Thị Bình')).toBeTruthy();
        });

        expect(screen.queryByText('Nguyễn Văn An')).toBeNull();

        fireEvent.change(
            screen.getByPlaceholderText('Số hiệu, MSSV, sinh viên, mẫu'),
            {
                target: { value: '' },
            },
        );

        fireEvent.change(screen.getByDisplayValue('Tất cả trạng thái'), {
            target: { value: 'REVOKED' },
        });

        await waitFor(() => {
            expect(screen.getByText('Phạm Quốc Cường')).toBeTruthy();
        });
    });

    it('opens the generate dialog, loads active templates, and shows dry-run preview', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /tạo chứng nhận/i }),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /tạo chứng nhận/i }),
        );

        await waitFor(() => {
            expect(getTemplates).toHaveBeenCalled();
        });

        fireEvent.click(
            screen.getByLabelText(
                /chỉ kiểm tra danh sách đủ điều kiện, chưa tạo chứng nhận thật/i,
            ),
        );

        fireEvent.click(screen.getByTestId('certificate-generate-submit'));

        await waitFor(() => {
            expect(generateCertificates).toHaveBeenCalledWith('campaign-1', {
                template_id: 'tpl-1',
                module_id: undefined,
                dry_run: true,
            });
        });

        expect(screen.getByText('Kết quả kiểm tra trước')).toBeTruthy();
        expect(
            screen.getByText(/Có 2 ứng viên đủ điều kiện cấp chứng nhận/i),
        ).toBeTruthy();
    });

    it('creates certificates from the dialog and reloads the list', async () => {
        listCampaignCertificates
            .mockResolvedValueOnce(certificatesFixture)
            .mockResolvedValueOnce([
                ...certificatesFixture,
                {
                    ...certificatesFixture[0],
                    id: 'cert-4',
                    certificate_no: 'CERT-004',
                    student_name: 'Võ Hải Đăng',
                    student_code: '21110004',
                    status: 'PENDING',
                },
            ]);
        generateCertificates.mockResolvedValueOnce({
            dry_run: false,
            candidate_count: 1,
            created_count: 1,
            items: [
                {
                    ...certificatesFixture[0],
                    id: 'cert-4',
                    certificate_no: 'CERT-004',
                },
            ],
        });

        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /tạo chứng nhận/i }),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /tạo chứng nhận/i }),
        );

        await waitFor(() => {
            expect(getTemplates).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByTestId('certificate-generate-submit'));

        await waitFor(() => {
            expect(generateCertificates).toHaveBeenCalledWith('campaign-1', {
                template_id: 'tpl-1',
                module_id: undefined,
                dry_run: false,
            });
        });

        await waitFor(() => {
            expect(listCampaignCertificates).toHaveBeenCalledTimes(2);
        });

        expect(screen.queryByText('Tạo chứng nhận cho chiến dịch')).toBeNull();
    });

    it('downloads a certificate file when the file is available', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Tải xuống CERT-002',
                }),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Tải xuống CERT-002',
            }),
        );

        expect(openWindow).toHaveBeenCalledWith(
            'https://example.com/cert-002.pdf',
            '_blank',
            'noopener,noreferrer',
        );
    });

    it('submits a revoke reason from the confirm dialog', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: 'Thu hồi CERT-002',
                }),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Thu hồi CERT-002',
            }),
        );

        fireEvent.change(
            screen.getByPlaceholderText('Nhập lý do thu hồi để tiện tra soát'),
            {
                target: { value: 'Sai dữ liệu xác nhận giờ công' },
            },
        );

        fireEvent.click(
            screen.getByRole('button', { name: /xác nhận thu hồi/i }),
        );

        await waitFor(() => {
            expect(revokeCertificate).toHaveBeenCalledWith('cert-2', {
                revoke_reason: 'Sai dữ liệu xác nhận giờ công',
            });
        });
    });
});
