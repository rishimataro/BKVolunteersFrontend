import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { NotificationsRoute } from '../notifications';

const addNotification = vi.fn();
const getNotificationsPage = vi.fn();
const markNotificationRead = vi.fn();
const markAllNotificationsRead = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/campaign/api/notifications', () => ({
    getNotificationsPage: (...args: unknown[]) => getNotificationsPage(...args),
    markNotificationRead: (...args: unknown[]) => markNotificationRead(...args),
    markAllNotificationsRead: (...args: unknown[]) =>
        markAllNotificationsRead(...args),
}));

const renderRoute = () =>
    render(
        <MemoryRouter>
            <NotificationsRoute />
        </MemoryRouter>,
    );

describe('NotificationsRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getNotificationsPage.mockImplementation(
            ({ page }: { page: number }) => {
                if (page === 2) {
                    return Promise.resolve({
                        items: [
                            {
                                id: 'notification-3',
                                type: 'system_warning',
                                title: 'Bảo trì máy chủ tối nay',
                                body: 'Hệ thống sẽ tạm dừng trong 30 phút.',
                                read_at: null,
                                created_at: '2026-06-03T09:00:00.000Z',
                            },
                        ],
                        meta: {
                            total: 3,
                            page: 2,
                            limit: 8,
                            totalPages: 2,
                        },
                    });
                }

                return Promise.resolve({
                    items: [
                        {
                            id: 'notification-1',
                            type: 'campaign_update',
                            title: 'Chiến dịch mùa hè xanh đã được duyệt',
                            body: 'Bạn có thể bắt đầu mở tuyển tình nguyện viên.',
                            read_at: null,
                            created_at: '2026-06-03T10:00:00.000Z',
                        },
                        {
                            id: 'notification-2',
                            type: 'approval_notice',
                            title: 'Yêu cầu rút vốn đã hoàn tất',
                            body: 'Bộ phận tài chính đã xử lý giao dịch gần nhất.',
                            read_at: '2026-06-03T08:00:00.000Z',
                            created_at: '2026-06-03T08:00:00.000Z',
                        },
                    ],
                    meta: {
                        total: 3,
                        page: 1,
                        limit: 8,
                        totalPages: 2,
                    },
                });
            },
        );
        markNotificationRead.mockResolvedValue({
            id: 'notification-1',
            read_at: '2026-06-03T10:05:00.000Z',
        });
        markAllNotificationsRead.mockResolvedValue({ count: 2 });
    });

    it('renders the notification center, filters items, and loads more results', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByText('Chiến dịch mùa hè xanh đã được duyệt'),
            ).toBeTruthy();
        });

        expect(
            screen.getByRole('heading', { name: 'Trung tâm thông báo' }),
        ).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Hệ thống' }));

        expect(
            screen.queryByText('Chiến dịch mùa hè xanh đã được duyệt'),
        ).toBeNull();
        expect(screen.getByText('Chưa có thông báo phù hợp')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
        fireEvent.click(
            screen.getByRole('button', { name: /Tải thêm thông báo/i }),
        );

        await waitFor(() => {
            expect(screen.getByText('Bảo trì máy chủ tối nay')).toBeTruthy();
        });
    });

    it('marks one notification as read', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByText('Chiến dịch mùa hè xanh đã được duyệt'),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', { name: 'Đánh dấu đã đọc' }),
        );

        await waitFor(() => {
            expect(markNotificationRead).toHaveBeenCalledWith('notification-1');
        });
    });

    it('marks all notifications as read', async () => {
        renderRoute();

        await waitFor(() => {
            expect(
                screen.getByText('Chiến dịch mùa hè xanh đã được duyệt'),
            ).toBeTruthy();
        });

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Đánh dấu tất cả đã đọc',
            }),
        );

        await waitFor(() => {
            expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã cập nhật thông báo',
            }),
        );
    });
});
