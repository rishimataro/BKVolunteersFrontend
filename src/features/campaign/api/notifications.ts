import { api } from '@/lib/api-clients';
import type { NotificationItem } from '../types';
export type { NotificationItem };

export const getNotifications = (params?: {
    read?: 'true' | 'false' | '';
    page?: number;
    limit?: number;
}) => api.get('/notifications', { params }) as Promise<NotificationItem[]>;

export const markNotificationRead = (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`) as Promise<{
        id: string;
        read_at: string;
    }>;

export const markAllNotificationsRead = () =>
    api.patch('/notifications/read-all') as Promise<{
        updated_count: number;
    }>;
