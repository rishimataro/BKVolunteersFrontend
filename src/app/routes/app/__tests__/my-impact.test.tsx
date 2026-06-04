import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { MyImpactRoute } from '../my-impact';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getStudentDashboard = vi.fn();
const getStudentActivities = vi.fn();
const getPublicCampaigns = vi.fn();

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
    getStudentActivities: (...args: unknown[]) => getStudentActivities(...args),
}));

vi.mock('@/features/campaign/api/public', () => ({
    getPublicCampaigns: (...args: unknown[]) => getPublicCampaigns(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/app/my-impact']}>
            <Routes>
                <Route path="/app/my-impact" element={<MyImpactRoute />} />
            </Routes>
        </MemoryRouter>,
    );

describe('MyImpactRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            data: {
                id: 'student-1',
                role: 'SINHVIEN',
            },
        });

        getStudentDashboard.mockResolvedValue({
            campaigns_count: 12,
            money_amount: 5200000,
            money_donations_count: 4,
            item_received_quantity: 8,
            item_received_count: 3,
            event_hours: 84,
            event_completed_count: 6,
            certificates_count: 8,
            recent_activities: [],
        });

        getStudentActivities.mockResolvedValue([
            {
                id: 'activity-1',
                activity_type: 'item_pledge',
                reference_id: 'ITM-2025-04',
                campaign_id: 'campaign-1',
                campaign_title: 'Ngày hội Trồng cây Học kỳ 2',
                campaign_slug: 'ngay-hoi-trong-cay-hoc-ky-2',
                module_id: 'module-1',
                module_title: 'Pledge',
                module_type: 'item_donation',
                status: 'CONFIRMED',
                occurred_at: '2025-04-10T08:00:00.000Z',
                meta: {},
            },
            {
                id: 'activity-2',
                activity_type: 'event_registration',
                reference_id: 'TSMT-2025',
                campaign_id: 'campaign-2',
                campaign_title: 'Tiếp sức Mùa thi 2025',
                campaign_slug: 'tiep-suc-mua-thi-2025',
                module_id: 'module-2',
                module_title: 'Event',
                module_type: 'event',
                status: 'COMPLETED',
                occurred_at: '2025-03-02T08:00:00.000Z',
                meta: {},
            },
            {
                id: 'activity-3',
                activity_type: 'certificate',
                reference_id: 'CERT-2025-01',
                campaign_id: 'campaign-3',
                campaign_title: 'Giấy chứng nhận Tiếp sức',
                campaign_slug: 'giay-chung-nhan-tiep-suc',
                module_id: 'module-3',
                module_title: 'Certificate',
                module_type: null,
                status: 'READY',
                occurred_at: '2025-01-15T08:00:00.000Z',
                meta: {},
            },
            {
                id: 'activity-4',
                activity_type: 'money_donation',
                reference_id: 'DON-2024-11',
                campaign_id: 'campaign-4',
                campaign_title: 'Hiến máu Nhân đạo Đợt 2',
                campaign_slug: 'hien-mau-nhan-dao-dot-2',
                module_id: 'module-4',
                module_title: 'Donation',
                module_type: 'fundraising',
                status: 'VERIFIED',
                occurred_at: '2024-11-12T08:00:00.000Z',
                meta: {},
            },
            {
                id: 'activity-5',
                activity_type: 'event_registration',
                reference_id: 'MHX-2024-DL',
                campaign_id: 'campaign-5',
                campaign_title: 'Mùa hè Xanh 2024 - Đắk Lắk',
                campaign_slug: 'mua-he-xanh-2024-dak-lak',
                module_id: 'module-5',
                module_title: 'Volunteer',
                module_type: 'event',
                status: 'APPROVED',
                occurred_at: '2024-10-05T08:00:00.000Z',
                meta: {},
            },
        ]);

        getPublicCampaigns.mockResolvedValue({
            items: [
                {
                    id: 'recommend-1',
                    slug: 'day-code-cho-tre-em-vung-cao',
                    title: 'Dạy Code cho trẻ em vùng cao',
                    summary: 'Chiến dịch công nghệ cộng đồng',
                    cover_image_url: null,
                    organization: {
                        id: 'org-1',
                        code: 'CNTT',
                        name: 'LCĐ Khoa CNTT',
                        type: 'FACULTY',
                        logo_url: null,
                    },
                    module_types: ['event'],
                    status: 'PUBLISHED',
                    start_at: '2025-05-20T08:00:00.000Z',
                    end_at: '2025-06-20T17:00:00.000Z',
                    progress: {
                        percent: 10,
                        modules: [],
                    },
                },
            ],
            meta: {
                page: 1,
                total: 1,
                totalPages: 1,
                total_pages: 1,
            },
        });
    });

    it('renders the student impact history overview and recommendation panel', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Lịch sử hoạt động' }),
            ).toBeTruthy();
        });

        expect(screen.getByText('Chiến dịch tham gia')).toBeTruthy();
        expect(screen.getByText('12')).toBeTruthy();
        expect(screen.getByText('84')).toBeTruthy();
        expect(screen.getByText('8')).toBeTruthy();
        expect(screen.getByText('5,2tr')).toBeTruthy();
        expect(screen.getByText('Danh sách hoạt động')).toBeTruthy();
        expect(screen.getByText('Dạy Code cho trẻ em vùng cao')).toBeTruthy();
    });

    it('filters rows by semester within the selected academic year', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByText('Ngày hội Trồng cây Học kỳ 2'),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText('Học kỳ'), {
            target: { value: 'HK1' },
        });

        await waitFor(() => {
            expect(screen.getByText('Mùa hè Xanh 2024 - Đắk Lắk')).toBeTruthy();
        });

        expect(screen.queryByText('Ngày hội Trồng cây Học kỳ 2')).toBeNull();
        expect(screen.getByText('Hiến máu Nhân đạo Đợt 2')).toBeTruthy();
    });

    it('paginates the activity table', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByText('Ngày hội Trồng cây Học kỳ 2'),
            ).toBeTruthy();
        });

        expect(screen.queryByText('Mùa hè Xanh 2024 - Đắk Lắk')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));

        await waitFor(() => {
            expect(screen.getByText('Mùa hè Xanh 2024 - Đắk Lắk')).toBeTruthy();
        });
    });
});
