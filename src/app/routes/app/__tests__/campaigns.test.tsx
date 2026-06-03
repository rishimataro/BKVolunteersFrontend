import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { CampaignsRoute } from '../campaigns';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getApprovalQueue = vi.fn();
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
    getApprovalQueue: (...args: unknown[]) => getApprovalQueue(...args),
    approvalTransition: (...args: unknown[]) => approvalTransition(...args),
}));

describe('CampaignsRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: '1',
                role: 'DOANTRUONG',
            },
        });
        getApprovalQueue.mockResolvedValue([
            {
                id: 'campaign-1',
                slug: 'mua-he-xanh-dak-lak',
                title: 'Mùa hè xanh Đắk Lắk',
                summary: 'Hoạt động hỗ trợ cộng đồng tại địa phương.',
                status: 'SUBMITTED',
                organization: {
                    id: 'org-1',
                    code: 'DTN',
                    name: 'Đoàn Thanh niên Trường',
                    type: 'SCHOOL',
                },
                module_types: ['event'],
                submitted_at: '2026-06-01T08:00:00.000Z',
            },
            {
                id: 'campaign-2',
                slug: 'lop-hoc-cau-vong',
                title: 'Lớp học cầu vồng',
                summary: 'Hỗ trợ học tập cho trẻ em vùng ven.',
                status: 'PRE_APPROVED',
                organization: {
                    id: 'org-2',
                    code: 'CLB-SX',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
                module_types: ['fundraising'],
                submitted_at: '2026-05-28T08:00:00.000Z',
            },
        ]);
    });

    it('renders the school approval queue layout for Đoàn trường', async () => {
        render(
            <MemoryRouter>
                <CampaignsRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByText('Hàng đợi phê duyệt chiến dịch'),
            ).toBeTruthy();
        });

        expect(screen.getByText('Bộ lọc xét duyệt')).toBeTruthy();
        expect(screen.getByText('Mùa hè xanh Đắk Lắk')).toBeTruthy();
        expect(screen.getByText('Đoàn Thanh niên Trường')).toBeTruthy();
        expect(screen.getByRole('button', { name: /sơ duyệt/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /phê duyệt/i })).toBeTruthy();
    });
});
