import * as React from 'react';
import { Bell, CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/components/ui/notifications';
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    type NotificationItem,
} from '@/features/campaign/api/sprint3';
import { useUser } from '@/features/auth';
import { toDisplayText } from '@/utils/display-text';

export const NotificationMenu = () => {
    const user = useUser();
    const { addNotification } = useNotifications();
    const [open, setOpen] = React.useState(false);
    const [items, setItems] = React.useState<NotificationItem[]>([]);
    const [loading, setLoading] = React.useState(false);

    const unreadCount = items.filter((item) => !item.read_at).length;

    const loadNotifications = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNotifications({ page: 1, limit: 20 });
            setItems(data);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không tải được thông báo',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    React.useEffect(() => {
        if (!user.data || !open) return;
        void loadNotifications();
    }, [loadNotifications, open, user.data]);

    if (!user.data) return null;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full text-slate-700 hover:text-bk-blue"
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="z-[90] w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">
                        Thông báo
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => {
                            void markAllNotificationsRead()
                                .then(() => loadNotifications())
                                .catch((error) => {
                                    addNotification({
                                        type: 'error',
                                        title: 'Không thể đọc tất cả',
                                        message:
                                            error instanceof Error
                                                ? error.message
                                                : 'Lỗi hệ thống',
                                    });
                                });
                        }}
                    >
                        <CheckCheck className="mr-1 size-3.5" />
                        Đánh dấu đã đọc
                    </Button>
                </div>

                <div className="max-h-96 overflow-auto p-2">
                    {loading ? (
                        <p className="p-3 text-sm text-slate-600">
                            Đang tải thông báo...
                        </p>
                    ) : items.length === 0 ? (
                        <p className="p-3 text-sm text-slate-600">
                            Chưa có thông báo nào.
                        </p>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    if (item.read_at) return;
                                    void markNotificationRead(item.id)
                                        .then(() => loadNotifications())
                                        .catch((error) => {
                                            addNotification({
                                                type: 'error',
                                                title: 'Không đánh dấu đã đọc được',
                                                message:
                                                    error instanceof Error
                                                        ? error.message
                                                        : 'Lỗi hệ thống',
                                            });
                                        });
                                }}
                                className={`mb-2 w-full rounded-lg border p-3 text-left transition ${
                                    item.read_at
                                        ? 'border-slate-200 bg-white'
                                        : 'border-blue-200 bg-blue-50'
                                }`}
                            >
                                <p className="text-sm font-semibold text-slate-900">
                                    {toDisplayText(item.title)}
                                </p>
                                <p className="mt-1 text-xs text-slate-700">
                                    {toDisplayText(item.body)}
                                </p>
                                <p className="mt-2 text-[11px] text-slate-500">
                                    {new Date(item.created_at).toLocaleString(
                                        'vi-VN',
                                    )}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
