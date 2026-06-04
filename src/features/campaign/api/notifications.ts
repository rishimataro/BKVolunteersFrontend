import { api } from '@/lib/api-clients';
import type { NotificationItem } from '../types';
export type { NotificationItem };

export type NotificationsPage = {
    items: NotificationItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

type NotificationQueryParams = {
    read?: 'true' | 'false' | '';
    page?: number;
    limit?: number;
};

export const getNotificationsPage = async (
    params?: NotificationQueryParams,
): Promise<NotificationsPage> =>
    (await api.get('/notifications', { params })) as NotificationsPage;

export const getNotifications = async (params?: NotificationQueryParams) =>
    (await getNotificationsPage(params)).items;

export const markNotificationRead = (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`) as Promise<{
        id: string;
        read_at: string;
    }>;

export const markAllNotificationsRead = () =>
    api.patch('/notifications/read-all') as Promise<{
        count: number;
    }>;
