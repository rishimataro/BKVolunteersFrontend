import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { EventManagementRoute } from '../event-management';

const addNotification = vi.fn();
const getEventModule = vi.fn();
const getEventRegistrations = vi.fn();
const approveEventRegistration = vi.fn();
const rejectEventRegistration = vi.fn();
const checkInEventRegistration = vi.fn();
const completeEventRegistration = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/campaign/api/events', () => ({
    getEventModule: (...args: unknown[]) => getEventModule(...args),
    getEventRegistrations: (...args: unknown[]) =>
        getEventRegistrations(...args),
    approveEventRegistration: (...args: unknown[]) =>
        approveEventRegistration(...args),
    rejectEventRegistration: (...args: unknown[]) =>
        rejectEventRegistration(...args),
    checkInEventRegistration: (...args: unknown[]) =>
        checkInEventRegistration(...args),
    completeEventRegistration: (...args: unknown[]) =>
        completeEventRegistration(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/app/events/module-1']}>
            <Routes>
                <Route
                    path="/app/events/:moduleId"
                    element={<EventManagementRoute />}
                />
            </Routes>
        </MemoryRouter>,
    );

describe('EventManagementRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getEventModule.mockResolvedValue({
            id: 'module-1',
            campaign_id: 'campaign-1',
            type: 'event',
            title: 'Tuyển tình nguyện viên',
            description: 'Điều phối lực lượng hỗ trợ chiến dịch.',
            status: 'ACTIVE',
            start_at: '2026-07-01T08:00:00.000Z',
            end_at: '2026-07-15T17:00:00.000Z',
            settings_json: {},
            registration_count: 3,
            approved_count: 1,
            campaign: {
                id: 'campaign-1',
                title: 'Mùa hè xanh 2024',
                slug: 'mua-he-xanh-2024',
                status: 'ONGOING',
            },
            config: {
                location: 'Tòa A1',
                quota: 50,
                registration_required: true,
                checkin_required: true,
                benefits: ['Giấy chứng nhận'],
                benefits_text: 'Giấy chứng nhận',
            },
        });
        getEventRegistrations.mockResolvedValue([
            {
                id: 'registration-1',
                campaign_id: 'campaign-1',
                module_id: 'module-1',
                student: {
                    id: 'student-1',
                    full_name: 'Trần Minh Quân',
                    student_code: '2012456',
                    email: '2012456@student.dut.udn.vn',
                },
                status: 'PENDING',
                answers: {
                    faculty: 'Khoa KHMT',
                    skills: ['Lập trình', 'IELTS 7.5'],
                    note: 'Có thể hỗ trợ truyền thông và điều phối nhóm.',
                },
                registered_at: '2026-06-03T08:15:00.000Z',
                review_note: null,
                checked_in_at: null,
                checked_out_at: null,
                hours: null,
            },
            {
                id: 'registration-2',
                campaign_id: 'campaign-1',
                module_id: 'module-1',
                student: {
                    id: 'student-2',
                    full_name: 'Lê Thị Mai Anh',
                    student_code: '2012789',
                    email: '2012789@student.dut.udn.vn',
                },
                status: 'APPROVED',
                answers: {
                    faculty: 'Khoa KT Xây dựng',
                    skills: ['Thiết kế', 'Làm việc nhóm'],
                    note: 'Sẵn sàng tham gia cả cuối tuần.',
                },
                registered_at: '2026-06-02T08:15:00.000Z',
                review_note: 'Phù hợp với nhóm hậu cần.',
                checked_in_at: null,
                checked_out_at: null,
                hours: null,
            },
            {
                id: 'registration-3',
                campaign_id: 'campaign-1',
                module_id: 'module-1',
                student: {
                    id: 'student-3',
                    full_name: 'Phạm Thanh Thảo',
                    student_code: '2012999',
                    email: '2012999@student.dut.udn.vn',
                },
                status: 'REJECTED',
                answers: {
                    faculty: 'Khoa KHMT',
                    skills: ['Hậu cần', 'Truyền thông'],
                    note: 'Lịch học trùng một phần nhưng có thể linh hoạt.',
                },
                registered_at: '2026-06-01T08:15:00.000Z',
                review_note: 'Chưa khớp lịch chiến dịch.',
                checked_in_at: null,
                checked_out_at: null,
                hours: null,
            },
        ]);
        approveEventRegistration.mockResolvedValue({
            id: 'registration-1',
            status: 'APPROVED',
        });
        rejectEventRegistration.mockResolvedValue({
            id: 'registration-1',
            status: 'REJECTED',
        });
        checkInEventRegistration.mockResolvedValue({
            id: 'registration-2',
            status: 'CHECKED_IN',
        });
        completeEventRegistration.mockResolvedValue({
            id: 'registration-2',
            status: 'COMPLETED',
        });
    });

    it('renders the volunteer management workspace with summary cards and table', async () => {
        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Mùa hè xanh 2024')).toBeTruthy();
        });

        expect(
            screen.getByRole('heading', {
                name: /quản lý tình nguyện viên/i,
            }),
        ).toBeTruthy();
        expect(screen.getAllByText(/tổng đăng ký/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/đã duyệt/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/chờ duyệt/i).length).toBeGreaterThan(0);
        expect(
            screen.getByPlaceholderText(/tìm kiếm theo tên hoặc mssv/i),
        ).toBeTruthy();
        expect(screen.getByText(/tòa a1/i)).toBeTruthy();
        expect(screen.getByText(/50 tình nguyện viên/i)).toBeTruthy();
        expect(screen.getByText('Trần Minh Quân')).toBeTruthy();
        expect(screen.getAllByText('Khoa KHMT').length).toBeGreaterThan(0);
        expect(screen.getByText(/Lập trình, IELTS 7.5/i)).toBeTruthy();
        expect(screen.getByText('Lê Thị Mai Anh')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /hướng dẫn/i }));

        expect(
            screen.getByText(/quy trình quản lý tình nguyện viên/i),
        ).toBeTruthy();
        expect(screen.getByText(/1. sàng lọc hồ sơ/i)).toBeTruthy();
    });

    it('approves selected pending registrations in bulk', async () => {
        getEventRegistrations.mockResolvedValue([
            {
                id: 'registration-1',
                campaign_id: 'campaign-1',
                module_id: 'module-1',
                student: {
                    id: 'student-1',
                    full_name: 'Trần Minh Quân',
                    student_code: '2012456',
                    email: '2012456@student.dut.udn.vn',
                },
                status: 'PENDING',
                answers: {
                    faculty: 'Khoa KHMT',
                    skills: ['Lập trình'],
                },
                registered_at: '2026-06-03T08:15:00.000Z',
                review_note: null,
                checked_in_at: null,
                checked_out_at: null,
                hours: null,
            },
            {
                id: 'registration-2',
                campaign_id: 'campaign-1',
                module_id: 'module-1',
                student: {
                    id: 'student-2',
                    full_name: 'Lê Thị Mai Anh',
                    student_code: '2012789',
                    email: '2012789@student.dut.udn.vn',
                },
                status: 'PENDING',
                answers: {
                    faculty: 'Khoa KT Xây dựng',
                    skills: ['Thiết kế'],
                },
                registered_at: '2026-06-02T08:15:00.000Z',
                review_note: null,
                checked_in_at: null,
                checked_out_at: null,
                hours: null,
            },
        ]);

        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Mùa hè xanh 2024')).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /chọn hồ sơ trần minh quân/i,
            }),
        );
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /chọn hồ sơ lê thị mai anh/i,
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /duyệt hàng loạt/i }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /xác nhận duyệt/i }),
        );

        await waitFor(() => {
            expect(approveEventRegistration).toHaveBeenCalledWith(
                'registration-1',
            );
            expect(approveEventRegistration).toHaveBeenCalledWith(
                'registration-2',
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã duyệt hàng loạt',
            }),
        );
    });

    it('captures hours and note before completing a checked-in volunteer', async () => {
        getEventRegistrations.mockResolvedValue([
            {
                id: 'registration-2',
                campaign_id: 'campaign-1',
                module_id: 'module-1',
                student: {
                    id: 'student-2',
                    full_name: 'Lê Thị Mai Anh',
                    student_code: '2012789',
                    email: '2012789@student.dut.udn.vn',
                },
                status: 'CHECKED_IN',
                answers: {
                    faculty: 'Khoa KT Xây dựng',
                    skills: ['Thiết kế'],
                },
                registered_at: '2026-06-02T08:15:00.000Z',
                review_note: null,
                checked_in_at: '2026-06-03T08:15:00.000Z',
                checked_out_at: null,
                hours: null,
            },
        ]);

        renderRoute();

        await waitFor(() => {
            expect(screen.getByText('Mùa hè xanh 2024')).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /hoàn tất lê thị mai anh/i }),
        );
        fireEvent.change(screen.getByPlaceholderText(/ví dụ: 4/i), {
            target: { value: '3.5' },
        });
        fireEvent.change(
            screen.getByPlaceholderText(
                /ví dụ: tham gia đầy đủ, hỗ trợ điều phối nhóm./i,
            ),
            {
                target: { value: 'Phu trach dieu phoi dau moi sinh vien.' },
            },
        );
        fireEvent.click(
            screen.getByRole('button', { name: /lưu hoàn thành/i }),
        );

        await waitFor(() => {
            expect(completeEventRegistration).toHaveBeenCalledWith(
                'registration-2',
                {
                    hours: 3.5,
                    note: 'Phu trach dieu phoi dau moi sinh vien.',
                },
            );
        });
    });

    it('captures a rejection reason before rejecting a pending volunteer', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByRole('heading', {
                    name: /quản lý tình nguyện viên/i,
                }),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /từ chối trần minh quân/i }),
        );
        fireEvent.change(
            screen.getByPlaceholderText(
                /ví dụ: hồ sơ còn thiếu thông tin kỹ năng phù hợp hoặc thời gian tham gia chưa khớp với lịch trình chiến dịch./i,
            ),
            {
                target: {
                    value: 'Can bo sung ro hon lich tham gia va ky nang phu hop.',
                },
            },
        );
        fireEvent.click(
            screen.getByRole('button', { name: /xác nhận từ chối/i }),
        );

        await waitFor(() => {
            expect(rejectEventRegistration).toHaveBeenCalledWith(
                'registration-1',
                'Can bo sung ro hon lich tham gia va ky nang phu hop.',
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã từ chối đơn đăng ký',
            }),
        );
    });
});
