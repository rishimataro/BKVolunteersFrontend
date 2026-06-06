import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { CampaignCreateRoute, CampaignsRoute } from '../campaigns';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getApprovalQueue = vi.fn();
const approvalTransition = vi.fn();
const getManagedCampaigns = vi.fn();
const getManagedCampaignDetail = vi.fn();
const createManagedCampaign = vi.fn();
const createCampaignModule = vi.fn();
const deleteManagedCampaign = vi.fn();
const publishCampaign = vi.fn();
const submitCampaignReview = vi.fn();
const getEventModule = vi.fn();
const getEventRegistrations = vi.fn();
const updateEventConfig = vi.fn();
const approveEventRegistration = vi.fn();
const rejectEventRegistration = vi.fn();
const checkInEventRegistration = vi.fn();
const completeEventRegistration = vi.fn();

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

vi.mock('@/features/campaign/api/campaign', () => ({
    getManagedCampaigns: (...args: unknown[]) => getManagedCampaigns(...args),
    getManagedCampaignDetail: (...args: unknown[]) =>
        getManagedCampaignDetail(...args),
    createManagedCampaign: (...args: unknown[]) =>
        createManagedCampaign(...args),
    createCampaignModule: (...args: unknown[]) => createCampaignModule(...args),
    deleteManagedCampaign: (...args: unknown[]) =>
        deleteManagedCampaign(...args),
    publishCampaign: (...args: unknown[]) => publishCampaign(...args),
    submitCampaignReview: (...args: unknown[]) => submitCampaignReview(...args),
}));

vi.mock('@/features/campaign/api/events', () => ({
    getEventModule: (...args: unknown[]) => getEventModule(...args),
    getEventRegistrations: (...args: unknown[]) =>
        getEventRegistrations(...args),
    updateEventConfig: (...args: unknown[]) => updateEventConfig(...args),
    approveEventRegistration: (...args: unknown[]) =>
        approveEventRegistration(...args),
    rejectEventRegistration: (...args: unknown[]) =>
        rejectEventRegistration(...args),
    checkInEventRegistration: (...args: unknown[]) =>
        checkInEventRegistration(...args),
    completeEventRegistration: (...args: unknown[]) =>
        completeEventRegistration(...args),
}));

vi.mock('@/features/locations/components/location-picker-dialog', () => ({
    LocationPickerDialog: () => null,
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
        getManagedCampaigns.mockResolvedValue([
            {
                id: 'campaign-clb-1',
                slug: 'mua-he-xanh-dak-lak',
                title: 'Mùa hè xanh Đắk Lắk',
                summary: 'Chiến dịch hỗ trợ cộng đồng tại Tây Nguyên.',
                status: 'ONGOING',
                organization_id: 'org-1',
                start_at: '2026-06-15T08:00:00.000Z',
                end_at: '2026-07-30T17:00:00.000Z',
                module_types: ['event', 'fundraising'],
            },
            {
                id: 'campaign-clb-2',
                slug: 'lop-hoc-cau-vong',
                title: 'Lớp học cầu vồng',
                summary: 'Chương trình hỗ trợ học sinh vùng ven.',
                status: 'DRAFT',
                organization_id: 'org-1',
                start_at: '2026-08-01T08:00:00.000Z',
                end_at: '2026-09-01T17:00:00.000Z',
                module_types: ['item_donation'],
            },
        ]);
        getManagedCampaignDetail.mockResolvedValue({
            id: 'campaign-clb-1',
            organization_id: 'org-1',
            slug: 'mua-he-xanh-dak-lak',
            title: 'Mùa hè xanh Đắk Lắk',
            summary: 'Chiến dịch hỗ trợ cộng đồng tại Tây Nguyên.',
            description: 'Mô tả chi tiết chiến dịch.',
            cover_image_url: null,
            beneficiary: 'Cộng đồng địa phương',
            scope_type: 'PUBLIC',
            status: 'ONGOING',
            start_at: '2026-06-15T08:00:00.000Z',
            end_at: '2026-07-30T17:00:00.000Z',
            published_at: '2026-06-10T08:00:00.000Z',
            organization: {
                id: 'org-1',
                code: 'CLB-SX',
                name: 'CLB Tình nguyện Sống Xanh',
                type: 'CLUB',
            },
            modules: [],
            reviews: [],
        });
        getEventModule.mockResolvedValue({
            id: 'module-event-1',
            campaign_id: 'campaign-clb-1',
            type: 'event',
            title: 'Tuyển tình nguyện viên',
            description: 'Mô tả hạng mục sự kiện.',
            status: 'ACTIVE',
            start_at: '2026-06-15T08:00:00.000Z',
            end_at: '2026-07-30T17:00:00.000Z',
            settings_json: {},
            registration_count: 0,
            approved_count: 0,
            campaign: {
                id: 'campaign-clb-1',
                title: 'Mùa hè xanh Đắk Lắk',
                slug: 'mua-he-xanh-dak-lak',
                status: 'ONGOING',
            },
            config: {
                location: '',
                quota: 0,
                registration_required: true,
                checkin_required: true,
                benefits: [],
                benefits_text: '',
            },
        });
        getEventRegistrations.mockResolvedValue([]);
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

    it('renders the organizer campaign management workspace for CLB', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '2',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });

        render(
            <MemoryRouter>
                <CampaignsRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Danh sách chiến dịch')).toBeTruthy();
        });

        expect(
            screen.getByRole('button', { name: /tạo chiến dịch mới/i }),
        ).toBeTruthy();
        expect(
            screen.getByPlaceholderText(/tìm kiếm chiến dịch/i),
        ).toBeTruthy();
        expect(screen.getByText('Chiến dịch đang hoạt động')).toBeTruthy();
        expect(screen.getByText('Mùa hè xanh Đắk Lắk')).toBeTruthy();
        expect(screen.getByText('Lớp học cầu vồng')).toBeTruthy();
    });

    it('keeps the create wizard off the management page when there are no campaigns', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '2-empty',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaigns.mockResolvedValue([]);

        render(
            <MemoryRouter>
                <CampaignsRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/danh sách chiến dịch/i)).toBeTruthy();
        });

        expect(
            screen.getByRole('button', { name: /tạo chiến dịch mới/i }),
        ).toBeTruthy();
        expect(screen.queryByText(/bước 1: thông tin cơ bản/i)).toBeNull();
    });

    it('renders the organizer campaign management workspace for Liên chi đoàn', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '2-lcd',
                role: 'LCD',
                organization: {
                    id: 'org-lcd-1',
                    name: 'Liên chi đoàn Khoa Công nghệ',
                    type: 'FACULTY',
                },
            },
        });

        render(
            <MemoryRouter>
                <CampaignsRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/danh sách chiến dịch/i)).toBeTruthy();
        });

        expect(
            screen.getByRole('button', { name: /tạo chiến dịch mới/i }),
        ).toBeTruthy();
        expect(screen.queryByText(/hàng đợi phê duyệt chiến dịch/i)).toBeNull();
    });

    it('renders the saved volunteer module summary in campaign detail', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '2a',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaignDetail.mockResolvedValue({
            id: 'campaign-clb-1',
            organization_id: 'org-1',
            slug: 'mua-he-xanh-dak-lak',
            title: 'Mùa hè xanh Đắk Lắk',
            summary: 'Chiến dịch hỗ trợ cộng đồng tại Tây Nguyên.',
            description: 'Mô tả chi tiết chiến dịch.',
            cover_image_url: null,
            beneficiary: 'Cộng đồng địa phương',
            scope_type: 'PUBLIC',
            status: 'ONGOING',
            start_at: '2026-06-15T08:00:00.000Z',
            end_at: '2026-07-30T17:00:00.000Z',
            published_at: '2026-06-10T08:00:00.000Z',
            organization: {
                id: 'org-1',
                code: 'CLB-SX',
                name: 'CLB Tình nguyện Sống Xanh',
                type: 'CLUB',
            },
            modules: [
                {
                    id: 'module-event-1',
                    type: 'event',
                    title: 'Mùa hè xanh 2026 - Tuyển tình nguyện viên',
                    description: 'Hạng mục event.',
                    status: 'ACTIVE',
                    start_at: '2026-06-15T08:00:00.000Z',
                    end_at: '2026-07-30T17:00:00.000Z',
                    settings: {
                        quota: 50,
                        location:
                            'Tòa A1 | Cơ sở chính - Quận 1 | Số 10, đường ABC',
                        benefits: ['Giấy chứng nhận', 'Đồng phục & thẻ tên'],
                        registration_deadline: '2026-06-25',
                        required_skills: ['Truyền thông', 'Hậu cần'],
                        venue_area: 'Tòa A1',
                        venue_campus: 'Cơ sở chính - Quận 1',
                        venue_address: 'Số 10, đường ABC',
                        plan_document_name: 'ke-hoach.pdf',
                        approval_document_name: 'phe-duyet.pdf',
                        timeline_items: [
                            {
                                id: 'timeline-1',
                                title: 'Ngày hội khởi động',
                                date: '2026-06-20',
                                description: 'Giới thiệu chiến dịch.',
                            },
                        ],
                    },
                },
            ],
            reviews: [],
        });
        getEventModule.mockResolvedValue({
            id: 'module-event-1',
            campaign_id: 'campaign-clb-1',
            type: 'event',
            title: 'Mùa hè xanh 2026 - Tuyển tình nguyện viên',
            description: 'Hạng mục event.',
            status: 'ACTIVE',
            start_at: '2026-06-15T08:00:00.000Z',
            end_at: '2026-07-30T17:00:00.000Z',
            settings_json: {
                quota: 50,
                location: 'Tòa A1 | Cơ sở chính - Quận 1 | Số 10, đường ABC',
                benefits: ['Giấy chứng nhận', 'Đồng phục & thẻ tên'],
            },
            registration_count: 0,
            approved_count: 0,
            campaign: {
                id: 'campaign-clb-1',
                title: 'Mùa hè xanh Đắk Lắk',
                slug: 'mua-he-xanh-dak-lak',
                status: 'ONGOING',
            },
            config: {
                location: 'Tòa A1 | Cơ sở chính - Quận 1 | Số 10, đường ABC',
                quota: 50,
                registration_required: true,
                checkin_required: true,
                benefits: ['Giấy chứng nhận', 'Đồng phục & thẻ tên'],
                benefits_text: 'Giấy chứng nhận\nĐồng phục & thẻ tên',
            },
        });

        render(
            <MemoryRouter>
                <CampaignsRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                screen.getByText(/cấu hình tuyển tình nguyện viên/i),
            ).toBeTruthy();
        });

        expect(
            screen.getByText(/dữ liệu từ wizard tạo chiến dịch/i),
        ).toBeTruthy();
        expect(screen.getAllByText(/Tòa A1/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Truyền thông/i)).toBeTruthy();
        expect(screen.getByText(/ke-hoach.pdf/i)).toBeTruthy();
        expect(screen.getByText(/Ngày hội khởi động/i)).toBeTruthy();
    });

    it('renders the campaign creation step-one wizard on the separate create page', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '3',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaigns.mockResolvedValue([]);

        render(
            <MemoryRouter>
                <CampaignCreateRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/bước 1: thông tin cơ bản/i)).toBeTruthy();
        });

        expect(screen.getByText('Thông tin chung')).toBeTruthy();
        expect(screen.getByLabelText(/tên chiến dịch \*/i)).toBeTruthy();
        expect(screen.getByLabelText(/slogan\/mô tả ngắn \*/i)).toBeTruthy();
        expect(screen.getByLabelText(/mô tả chi tiết \*/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /lưu nháp/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /tiếp theo/i })).toBeTruthy();
    });

    it('moves from step one to schedule step in the creation wizard', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '4',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaigns.mockResolvedValue([]);

        render(
            <MemoryRouter>
                <CampaignCreateRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/bước 1: thông tin cơ bản/i)).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/tên chiến dịch \*/i), {
            target: { value: 'Mùa hè xanh 2026' },
        });
        fireEvent.change(screen.getByLabelText(/slogan\/mô tả ngắn \*/i), {
            target: { value: 'Kết nối sinh viên với cộng đồng' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả chi tiết \*/i), {
            target: {
                value: 'Triển khai chuỗi hoạt động tình nguyện tại địa phương.',
            },
        });
        fireEvent.change(screen.getByLabelText(/bắt đầu dự kiến \*/i), {
            target: { value: '2026-07-01T08:00' },
        });
        fireEvent.change(screen.getByLabelText(/kết thúc dự kiến \*/i), {
            target: { value: '2026-07-15T17:00' },
        });

        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 2: hoạt động & lịch trình/i),
            ).toBeTruthy();
        });

        expect(
            screen.getByText(/^thời gian chiến dịch tổng thể$/i),
        ).toBeTruthy();
        expect(
            screen.getByText(/^các mốc thời gian quan trọng$/i),
        ).toBeTruthy();
        expect(screen.getByText(/^mẹo nhỏ$/i)).toBeTruthy();
    });

    it('moves from schedule step to volunteer recruitment step in the creation wizard', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '5',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaigns.mockResolvedValue([]);

        render(
            <MemoryRouter>
                <CampaignCreateRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/bước 1: thông tin cơ bản/i)).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/tên chiến dịch \*/i), {
            target: { value: 'Mùa hè xanh 2026' },
        });
        fireEvent.change(screen.getByLabelText(/slogan\/mô tả ngắn \*/i), {
            target: { value: 'Kết nối sinh viên với cộng đồng' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả chi tiết \*/i), {
            target: {
                value: 'Triển khai chuỗi hoạt động tình nguyện tại địa phương.',
            },
        });
        fireEvent.change(screen.getByLabelText(/bắt đầu dự kiến \*/i), {
            target: { value: '2026-07-01T08:00' },
        });
        fireEvent.change(screen.getByLabelText(/kết thúc dự kiến \*/i), {
            target: { value: '2026-07-15T17:00' },
        });

        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 2: hoạt động & lịch trình/i),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/mô tả kế hoạch chi tiết/i), {
            target: {
                value: 'Tuần 1 khởi động, tuần 2 truyền thông, tuần 3 tổng kết.',
            },
        });
        fireEvent.change(screen.getByLabelText(/tên hoạt động/i), {
            target: { value: 'Ngày hội khởi động' },
        });
        fireEvent.change(screen.getByLabelText(/ngày thực hiện/i), {
            target: { value: '2026-07-02' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả ngắn gọn/i), {
            target: {
                value: 'Giới thiệu chiến dịch và phân công đầu việc cho nhóm.',
            },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /lưu mốc thời gian/i }),
        );
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 3: tuyển tình nguyện viên/i),
            ).toBeTruthy();
        });

        expect(screen.getByText(/cấu hình tình nguyện viên/i)).toBeTruthy();
        expect(screen.getByText(/chỉ tiêu tuyển dụng \(người\)/i)).toBeTruthy();
        expect(screen.getByText(/yêu cầu kỹ năng chuyên môn/i)).toBeTruthy();
        expect(screen.getByText(/quyền lợi và chế độ đãi ngộ/i)).toBeTruthy();
    });
    it('moves from volunteer recruitment step to completion step in the creation wizard', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '6',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaigns.mockResolvedValue([]);

        render(
            <MemoryRouter>
                <CampaignCreateRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/bước 1: thông tin cơ bản/i)).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/tên chiến dịch \*/i), {
            target: { value: 'Mùa hè xanh 2026' },
        });
        fireEvent.change(screen.getByLabelText(/slogan\/mô tả ngắn \*/i), {
            target: { value: 'Kết nối sinh viên với cộng đồng' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả chi tiết \*/i), {
            target: {
                value: 'Triển khai chuỗi hoạt động tình nguyện tại địa phương.',
            },
        });
        fireEvent.change(screen.getByLabelText(/bắt đầu dự kiến \*/i), {
            target: { value: '2026-07-01T08:00' },
        });
        fireEvent.change(screen.getByLabelText(/kết thúc dự kiến \*/i), {
            target: { value: '2026-07-15T17:00' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 2: hoạt động & lịch trình/i),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/mô tả kế hoạch chi tiết/i), {
            target: {
                value: 'Tuần 1 khởi động, tuần 2 truyền thông, tuần 3 tổng kết.',
            },
        });
        fireEvent.change(screen.getByLabelText(/tên hoạt động/i), {
            target: { value: 'Ngày hội khởi động' },
        });
        fireEvent.change(screen.getByLabelText(/ngày thực hiện/i), {
            target: { value: '2026-07-02' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả ngắn gọn/i), {
            target: {
                value: 'Giới thiệu chiến dịch và phân công đầu việc cho nhóm.',
            },
        });
        fireEvent.click(
            screen.getByRole('button', { name: /lưu mốc thời gian/i }),
        );
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 3: tuyển tình nguyện viên/i),
            ).toBeTruthy();
        });

        fireEvent.change(
            screen.getByLabelText(/chỉ tiêu tuyển dụng \(người\)/i),
            {
                target: { value: '50' },
            },
        );
        fireEvent.change(screen.getByLabelText(/hạn cuối đăng ký/i), {
            target: { value: '2026-06-25' },
        });
        fireEvent.change(screen.getByPlaceholderText(/nhập kỹ năng mới/i), {
            target: { value: 'Truyền thông' },
        });
        fireEvent.keyDown(screen.getByPlaceholderText(/nhập kỹ năng mới/i), {
            key: 'Enter',
            code: 'Enter',
        });
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 4: tài liệu & hoàn tất/i),
            ).toBeTruthy();
        });

        expect(screen.getByText(/^địa điểm tổ chức$/i)).toBeTruthy();
        expect(screen.getByText(/^tài liệu đính kèm$/i)).toBeTruthy();
        expect(screen.getByText(/^tóm tắt chiến dịch$/i)).toBeTruthy();
        expect(
            screen.getByRole('button', {
                name: /hoàn tất tạo chiến dịch/i,
            }),
        ).toBeTruthy();
    });

    it('creates a volunteer module and submits the campaign after completing the wizard', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: '7',
                role: 'CLB',
                organization: {
                    id: 'org-1',
                    name: 'CLB Tình nguyện Sống Xanh',
                    type: 'CLUB',
                },
            },
        });
        getManagedCampaigns.mockResolvedValue([]);
        createManagedCampaign.mockResolvedValue({ id: 'campaign-new' });
        createCampaignModule.mockResolvedValue({ id: 'module-event-1' });
        submitCampaignReview.mockResolvedValue({
            id: 'campaign-new',
            from_status: 'DRAFT',
            to_status: 'SUBMITTED',
        });

        render(
            <MemoryRouter>
                <CampaignCreateRoute />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/bước 1: thông tin cơ bản/i)).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/tên chiến dịch \*/i), {
            target: { value: 'Mùa hè xanh 2026' },
        });
        fireEvent.change(screen.getByLabelText(/slogan\/mô tả ngắn \*/i), {
            target: { value: 'Kết nối sinh viên với cộng đồng' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả chi tiết \*/i), {
            target: {
                value: 'Triển khai chuỗi hoạt động tình nguyện tại địa phương.',
            },
        });
        fireEvent.change(screen.getByLabelText(/bắt đầu dự kiến \*/i), {
            target: { value: '2026-07-01T08:00' },
        });
        fireEvent.change(screen.getByLabelText(/kết thúc dự kiến \*/i), {
            target: { value: '2026-07-15T17:00' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 2: hoạt động & lịch trình/i),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/mô tả kế hoạch chi tiết/i), {
            target: {
                value: 'Tuần 1 khởi động, tuần 2 truyền thông, tuần 3 tổng kết.',
            },
        });
        fireEvent.change(screen.getByLabelText(/tên hoạt động/i), {
            target: { value: 'Ngày hội khởi động' },
        });
        fireEvent.change(screen.getByLabelText(/ngày thực hiện/i), {
            target: { value: '2026-07-02' },
        });
        fireEvent.change(screen.getByLabelText(/mô tả ngắn gọn/i), {
            target: {
                value: 'Giới thiệu chiến dịch và phân công đầu việc cho nhóm.',
            },
        });
        fireEvent.click(
            screen.getByRole('button', { name: /lưu mốc thời gian/i }),
        );
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 3: tuyển tình nguyện viên/i),
            ).toBeTruthy();
        });

        fireEvent.change(
            screen.getByLabelText(/chỉ tiêu tuyển dụng \(người\)/i),
            {
                target: { value: '50' },
            },
        );
        fireEvent.change(screen.getByLabelText(/hạn cuối đăng ký/i), {
            target: { value: '2026-06-25' },
        });
        fireEvent.change(screen.getByPlaceholderText(/nhập kỹ năng mới/i), {
            target: { value: 'Truyền thông' },
        });
        fireEvent.keyDown(screen.getByPlaceholderText(/nhập kỹ năng mới/i), {
            key: 'Enter',
            code: 'Enter',
        });
        fireEvent.click(screen.getByRole('button', { name: /^tiếp theo$/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/bước 4: tài liệu & hoàn tất/i),
            ).toBeTruthy();
        });

        fireEvent.change(screen.getByLabelText(/tòa nhà \/ khu vực \*/i), {
            target: { value: 'Tòa A1' },
        });
        fireEvent.change(screen.getByLabelText(/địa chỉ chi tiết \*/i), {
            target: { value: 'Số 10, đường ABC, phường XYZ' },
        });
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /tôi cam kết các thông tin cung cấp là chính xác/i,
            }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: /hoàn tất tạo chiến dịch/i,
            }),
        );

        await waitFor(() => {
            expect(createManagedCampaign).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Mùa hè xanh 2026',
                    summary: 'Kết nối sinh viên với cộng đồng',
                }),
            );
            expect(createCampaignModule).toHaveBeenCalledWith(
                'campaign-new',
                expect.objectContaining({
                    type: 'event',
                    title: 'Mùa hè xanh 2026 - Tuyển tình nguyện viên',
                    settings: expect.objectContaining({
                        quota: 50,
                        registration_deadline: '2026-06-25',
                        required_skills: ['Truyền thông'],
                    }),
                }),
            );
            expect(submitCampaignReview).toHaveBeenCalledWith('campaign-new');
        });
    });
});
