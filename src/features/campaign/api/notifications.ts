import { api } from '@/lib/api-clients';
import type { NotificationItem } from '../types';
export type { NotificationItem };

export const getNotifications = async (params?: {
    read?: 'true' | 'false' | '';
    page?: number;
    limit?: number;
}): Promise<NotificationItem[]> => {
    const data = (await api.get('/notifications', { params })) as {
        items: NotificationItem[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };

    return data.items;
};

export const markNotificationRead = (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`) as Promise<{
        id: string;
        read_at: string;
    }>;

export const markAllNotificationsRead = () =>
    api.patch('/notifications/read-all') as Promise<{
        count: number;
    }>;
