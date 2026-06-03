import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppCampaignDetailRoute } from '../campaign-detail';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getApprovalCampaignDetail = vi.fn();
const addApprovalComment = vi.fn();
const approvalTransition = vi.fn();

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

vi.mock('@/features/campaign/api/approval', () => ({
    getApprovalCampaignDetail: (...args: unknown[]) =>
        getApprovalCampaignDetail(...args),
    addApprovalComment: (...args: unknown[]) => addApprovalComment(...args),
    approvalTransition: (...args: unknown[]) => approvalTransition(...args),
}));

vi.mock('@/features/campaign/api/public', () => ({
    getPublicCampaignDetail: vi.fn(),
}));

vi.mock('@/features/campaign/api/events', () => ({
    createEventRegistration: vi.fn(),
}));

vi.mock('@/features/campaign/api/item-donations', () => ({
    createItemPledge: vi.fn(),
    getItemTargets: vi.fn(),
}));

describe('AppCampaignDetailRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: '1',
                role: 'DOANTRUONG',
            },
        });
        getApprovalCampaignDetail.mockResolvedValue({
            id: 'cmp-1',
            organization_id: 'org-1',
            slug: 'mua-he-xanh-dak-lak',
            title: 'Chiến dịch Mùa hè xanh 2024 - Đắk Lắk',
            summary: 'Hỗ trợ cộng đồng tại địa phương.',
            description:
                'Triển khai hỗ trợ cộng đồng, tập huấn kỹ năng và nâng cấp hạ tầng cơ bản.',
            scope_type: 'PUBLIC',
            status: 'PRE_APPROVED',
            start_at: '2026-06-01T00:00:00.000Z',
            end_at: '2026-07-15T00:00:00.000Z',
            organization: {
                id: 'org-1',
                code: 'DTE',
                name: 'Đoàn Thanh niên - Khoa Kinh tế Đối ngoại',
                type: 'FACULTY',
            },
            modules: [
                {
                    id: 'm-1',
                    type: 'event',
                    title: 'Ra quân địa phương',
                    description: 'Tập trung triển khai hoạt động tại địa bàn.',
                    status: 'READY_FOR_REVIEW',
                    start_at: '2026-06-01T00:00:00.000Z',
                    end_at: '2026-06-20T00:00:00.000Z',
                    settings: { quota: 120 },
                },
                {
                    id: 'm-2',
                    type: 'fundraising',
                    title: 'Gây quỹ hỗ trợ',
                    description: 'Huy động nguồn lực cho địa phương.',
                    status: 'READY_FOR_REVIEW',
                    start_at: '2026-06-01T00:00:00.000Z',
                    end_at: '2026-07-15T00:00:00.000Z',
                    settings: { target_amount: 450000000 },
                },
            ],
            reviews: [
                {
                    id: 'r-1',
                    body: 'Cần kiểm tra kỹ lại phần nguồn tài trợ cam kết.',
                    visibility: 'INTERNAL',
                    created_at: '2026-05-20T09:30:00.000Z',
                    attachment_url: 'https://example.com/review-note.pdf',
                },
            ],
            cover_image_url: 'https://example.com/cover.jpg',
        });
    });

    it('renders the audit detail view for school board reviewers', async () => {
        render(
            <MemoryRouter
                initialEntries={[
                    '/app/campaigns/mua-he-xanh-dak-lak?approvalId=cmp-1',
                ]}
            >
                <Routes>
                    <Route
                        path="/app/campaigns/:slug"
                        element={<AppCampaignDetailRoute />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Kế hoạch chi tiết')).toBeTruthy();
        });

        expect(screen.getByText('Lịch sử thẩm định')).toBeTruthy();
        expect(
            screen.getByText('Chiến dịch Mùa hè xanh 2024 - Đắk Lắk'),
        ).toBeTruthy();
        expect(
            screen.getByRole('button', { name: /phê duyệt chiến dịch/i }),
        ).toBeTruthy();
        expect(screen.getByText('Hồ sơ đính kèm')).toBeTruthy();
    });
});
