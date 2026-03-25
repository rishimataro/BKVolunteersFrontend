import { renderHook, act } from '@testing-library/react';
import { vi, expect, test } from 'vitest';

import { useNotifications, type Notification } from '../notifications-store';

test('should add and remove notifications', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications.length).toBe(0);

    const notification: Notification = {
        id: '123',
        title: 'Hello World',
        type: 'info',
        message: 'This is a notification',
    };

    act(() => {
        result.current.addNotification(notification);
    });

    // Note: addNotification generates a new ID internally using nanoid()
    // but due to the way {...notification} is applied after the generated ID,
    // it might overwrite it if the notification passed has an ID.
    // In our store implementation: { id, ...notification }
    expect(result.current.notifications).toContainEqual(
        expect.objectContaining({
            title: notification.title,
            type: notification.type,
            message: notification.message,
        }),
    );

    const addedNotification = result.current.notifications[0];

    act(() => {
        result.current.dismissNotification(addedNotification.id);
    });

    expect(result.current.notifications.length).toBe(0);
});

test('should automatically dismiss notifications after duration', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotifications());

    const notification: Omit<Notification, 'id'> = {
        title: 'Auto Dismiss',
        type: 'info',
        duration: 1000,
    };

    act(() => {
        result.current.addNotification(notification);
    });

    expect(result.current.notifications.length).toBe(1);

    act(() => {
        vi.advanceTimersByTime(1000);
    });

    expect(result.current.notifications.length).toBe(0);
    vi.useRealTimers();
});
