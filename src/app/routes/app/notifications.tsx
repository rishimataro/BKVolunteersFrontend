import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bell,
    BellRing,
    CheckCheck,
    ChevronRight,
    Megaphone,
    RefreshCw,
    ShieldCheck,
    TriangleAlert,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { useNotifications } from '@/components/ui/notifications';
import {
    getNotificationsPage,
    markAllNotificationsRead,
    markNotificationRead,
    type NotificationItem,
    type NotificationsPage,
} from '@/features/campaign/api/notifications';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

type NotificationFilter = 'ALL' | 'CAMPAIGNS' | 'APPROVALS' | 'SYSTEM';

type NotificationCardItem = NotificationItem & {
    category: Exclude<NotificationFilter, 'ALL'>;
};

const PAGE_SIZE = 8;
const surfaceClassName = 'border border-[#D1D5DB] bg-white';

const relativeTimeFormatter = new Intl.RelativeTimeFormat('vi-VN', {
    numeric: 'auto',
});

const filterOptions: Array<{
    value: NotificationFilter;
    label: string;
}> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'CAMPAIGNS', label: 'Chiến dịch' },
    { value: 'APPROVALS', label: 'Phê duyệt' },
    { value: 'SYSTEM', label: 'Hệ thống' },
];

const inferNotificationCategory = (
    item: NotificationItem,
): Exclude<NotificationFilter, 'ALL'> => {
    const source = `${item.type} ${item.title} ${item.body}`.toLowerCase();

    if (
        /approve|approval|review|duyệt|phê duyệt|xác minh|đối soát|rút vốn/.test(
            source,
        )
    ) {
        return 'APPROVALS';
    }

    if (
        /system|maintenance|warning|alert|password|login|security|hệ thống|bảo trì|cảnh báo|đăng nhập|mật khẩu/.test(
            source,
        )
    ) {
        return 'SYSTEM';
    }

    return 'CAMPAIGNS';
};

const getRelativeTimeLabel = (value: string) => {
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
        return 'Không rõ thời gian';
    }

    const diffMs = timestamp - Date.now();
    const absMinutes = Math.round(Math.abs(diffMs) / (1000 * 60));

    if (absMinutes < 60) {
        const minutes = Math.max(1, absMinutes);
        return relativeTimeFormatter.format(
            diffMs <= 0 ? -minutes : minutes,
            'minute',
        );
    }

    const absHours = Math.round(absMinutes / 60);
    if (absHours < 24) {
        return relativeTimeFormatter.format(
            diffMs <= 0 ? -absHours : absHours,
            'hour',
        );
    }

    const absDays = Math.round(absHours / 24);
    return relativeTimeFormatter.format(
        diffMs <= 0 ? -absDays : absDays,
        'day',
    );
};

const getCategoryConfig = (
    category: Exclude<NotificationFilter, 'ALL'>,
): {
    label: string;
    icon: typeof Megaphone;
    accentClassName: string;
    badgeClassName: string;
    iconClassName: string;
} => {
    switch (category) {
        case 'APPROVALS':
            return {
                label: 'Phê duyệt',
                icon: ShieldCheck,
                accentClassName: 'bg-[#0A0A0A]',
                badgeClassName:
                    'border border-[#D1D5DB] bg-[#F3F4F6] text-[#0A0A0A]',
                iconClassName:
                    'border border-[#D1D5DB] bg-[#F9FAFB] text-[#0A0A0A]',
            };
        case 'SYSTEM':
            return {
                label: 'Hệ thống',
                icon: TriangleAlert,
                accentClassName: 'bg-[#DC2626]',
                badgeClassName:
                    'border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
                iconClassName:
                    'border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
            };
        case 'CAMPAIGNS':
        default:
            return {
                label: 'Chiến dịch',
                icon: Megaphone,
                accentClassName: 'bg-[#4B5563]',
                badgeClassName:
                    'border border-[#D1D5DB] bg-[#F9FAFB] text-[#374151]',
                iconClassName:
                    'border border-[#D1D5DB] bg-[#F9FAFB] text-[#374151]',
            };
    }
};

const mapNotificationItem = (item: NotificationItem): NotificationCardItem => ({
    ...item,
    category: inferNotificationCategory(item),
});

export const NotificationsRoute = () => {
    const { addNotification } = useNotifications();
    const [items, setItems] = useState<NotificationCardItem[]>([]);
    const [meta, setMeta] = useState<NotificationsPage['meta'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
    const [actionId, setActionId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    const loadNotifications = useCallback(
        async (page: number, mode: 'replace' | 'append') => {
            if (mode === 'replace') {
                setIsLoading(true);
                setError(null);
            } else {
                setIsLoadingMore(true);
            }

            try {
                const data = await getNotificationsPage({
                    page,
                    limit: PAGE_SIZE,
                });
                const nextItems = data.items.map(mapNotificationItem);

                setItems((current) =>
                    mode === 'append' ? [...current, ...nextItems] : nextItems,
                );
                setMeta(data.meta);
            } catch (loadError) {
                const message =
                    loadError instanceof Error
                        ? loadError.message
                        : 'Không thể tải trung tâm thông báo.';
                setError(message);
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [],
    );

    useEffect(() => {
        void loadNotifications(1, 'replace');
    }, [loadNotifications]);

    const filteredItems = useMemo(() => {
        if (activeFilter === 'ALL') {
            return items;
        }

        return items.filter((item) => item.category === activeFilter);
    }, [activeFilter, items]);

    const unreadCount = items.filter((item) => !item.read_at).length;
    const hasMore = meta ? meta.page < meta.totalPages : false;

    const handleMarkRead = async (item: NotificationCardItem) => {
        if (item.read_at) {
            return;
        }

        setActionId(item.id);
        try {
            const data = await markNotificationRead(item.id);
            setItems((current) =>
                current.map((currentItem) =>
                    currentItem.id === item.id
                        ? { ...currentItem, read_at: data.read_at }
                        : currentItem,
                ),
            );
        } catch (markError) {
            addNotification({
                type: 'error',
                title: 'Không thể đánh dấu đã đọc',
                message:
                    markError instanceof Error
                        ? markError.message
                        : 'Hệ thống chưa cập nhật được thông báo này.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) {
            return;
        }

        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            const readAt = new Date().toISOString();
            setItems((current) =>
                current.map((item) => ({
                    ...item,
                    read_at: item.read_at ?? readAt,
                })),
            );
            addNotification({
                type: 'success',
                title: 'Đã cập nhật thông báo',
                message: 'Tất cả thông báo đã được đánh dấu là đã đọc.',
            });
        } catch (markError) {
            addNotification({
                type: 'error',
                title: 'Không thể đánh dấu tất cả',
                message:
                    markError instanceof Error
                        ? markError.message
                        : 'Hệ thống chưa thể xử lý yêu cầu này.',
            });
        } finally {
            setMarkingAll(false);
        }
    };

    if (isLoading) {
        return (
            <ContentLayout title="Trung tâm thông báo">
                <LoadingState label="Đang tải thông báo mới nhất" />
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Trung tâm thông báo">
            <div className="space-y-8">
                <section
                    className={`${surfaceClassName} grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start`}
                >
                    <div className="space-y-3">
                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                            Luồng cập nhật
                        </p>
                        <p className="max-w-3xl text-[16px] leading-7 text-[#4B5563]">
                            Theo dõi mọi thay đổi từ chiến dịch, các bước phê
                            duyệt và cảnh báo hệ thống trong một nơi tập trung.
                        </p>
                        <div className="flex flex-wrap gap-6 border-t border-[#E5E7EB] pt-4">
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                                    Chưa đọc
                                </p>
                                <p className="mt-2 text-[30px] font-bold leading-none text-[#0A0A0A]">
                                    {unreadCount}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                                    Đã tải
                                </p>
                                <p className="mt-2 text-[30px] font-bold leading-none text-[#0A0A0A]">
                                    {items.length}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                                    Tổng số
                                </p>
                                <p className="mt-2 text-[30px] font-bold leading-none text-[#0A0A0A]">
                                    {meta?.total ?? items.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => void loadNotifications(1, 'replace')}
                            className="inline-flex h-11 items-center justify-center gap-2 border border-[#D1D5DB] bg-white px-4 text-[14px] font-semibold text-[#0A0A0A] transition hover:bg-[#F9FAFB]"
                        >
                            <RefreshCw className="size-4" strokeWidth={1.75} />
                            Tải lại
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleMarkAllRead()}
                            disabled={markingAll || unreadCount === 0}
                            className="inline-flex h-11 items-center justify-center gap-2 border border-[#0A0A0A] bg-[#0A0A0A] px-4 text-[14px] font-semibold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:border-[#D1D5DB] disabled:bg-[#E5E7EB] disabled:text-[#6B7280]"
                        >
                            <CheckCheck className="size-4" strokeWidth={1.75} />
                            Đánh dấu tất cả đã đọc
                        </button>
                    </div>
                </section>

                <section className="border-b border-[#D1D5DB] pb-4">
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setActiveFilter(filter.value)}
                                className={`inline-flex items-center justify-center border px-4 py-2 text-[14px] font-semibold transition ${
                                    activeFilter === filter.value
                                        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                                        : 'border-[#D1D5DB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </section>

                {error ? (
                    <div className="space-y-4">
                        <ErrorState message={error} />
                        <button
                            type="button"
                            onClick={() => void loadNotifications(1, 'replace')}
                            className="inline-flex h-11 items-center justify-center border border-[#D1D5DB] bg-white px-4 text-[14px] font-semibold text-[#0A0A0A] transition hover:bg-[#F9FAFB]"
                        >
                            Thử tải lại
                        </button>
                    </div>
                ) : null}

                {!error && filteredItems.length === 0 ? (
                    <EmptyState
                        title="Chưa có thông báo phù hợp"
                        description="Khi hệ thống ghi nhận cập nhật mới, các mục liên quan đến chiến dịch, phê duyệt và vận hành sẽ xuất hiện tại đây."
                    />
                ) : null}

                {!error && filteredItems.length > 0 ? (
                    <section className="space-y-4">
                        {filteredItems.map((item) => {
                            const categoryConfig = getCategoryConfig(
                                item.category,
                            );
                            const Icon = categoryConfig.icon;

                            return (
                                <article
                                    key={item.id}
                                    className={`${surfaceClassName} relative overflow-hidden`}
                                >
                                    <div
                                        className={`absolute inset-y-0 left-0 w-1 ${
                                            item.read_at
                                                ? 'bg-transparent'
                                                : categoryConfig.accentClassName
                                        }`}
                                    />
                                    <div className="grid gap-5 px-6 py-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center ${categoryConfig.iconClassName}`}
                                        >
                                            <Icon
                                                className="size-5"
                                                strokeWidth={1.75}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <h2 className="font-heading text-[24px] leading-[1.3] font-bold text-[#0A0A0A]">
                                                        {toDisplayTitle(
                                                            item.title,
                                                        )}
                                                    </h2>
                                                    <p className="text-[16px] leading-7 text-[#4B5563]">
                                                        {toDisplayText(
                                                            item.body,
                                                        ) ||
                                                            'Không có nội dung chi tiết.'}
                                                    </p>
                                                </div>
                                                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                                                    {getRelativeTimeLabel(
                                                        item.created_at,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${categoryConfig.badgeClassName}`}
                                                >
                                                    {categoryConfig.label}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] border border-[#D1D5DB] bg-white text-[#4B5563]">
                                                    {item.read_at
                                                        ? 'Đã đọc'
                                                        : 'Chưa đọc'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 md:justify-end">
                                            {!item.read_at ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleMarkRead(
                                                            item,
                                                        )
                                                    }
                                                    disabled={
                                                        actionId === item.id
                                                    }
                                                    className="inline-flex h-11 items-center justify-center gap-2 border border-[#D1D5DB] bg-white px-4 text-[14px] font-semibold text-[#0A0A0A] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#6B7280]"
                                                >
                                                    <BellRing
                                                        className="size-4"
                                                        strokeWidth={1.75}
                                                    />
                                                    Đánh dấu đã đọc
                                                </button>
                                            ) : null}
                                            <div className="inline-flex h-11 items-center justify-center gap-2 border border-[#D1D5DB] bg-[#F9FAFB] px-4 text-[14px] font-semibold text-[#4B5563]">
                                                <Bell
                                                    className="size-4"
                                                    strokeWidth={1.75}
                                                />
                                                {toDisplayText(item.type) ||
                                                    'Thông báo hệ thống'}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {hasMore ? (
                            <div className="flex justify-center pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void loadNotifications(
                                            (meta?.page ?? 1) + 1,
                                            'append',
                                        )
                                    }
                                    disabled={isLoadingMore}
                                    className="inline-flex h-11 items-center justify-center gap-2 border border-[#D1D5DB] bg-white px-5 text-[14px] font-semibold text-[#0A0A0A] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#6B7280]"
                                >
                                    {isLoadingMore
                                        ? 'Đang tải thêm...'
                                        : 'Tải thêm thông báo'}
                                    <ChevronRight
                                        className="size-4"
                                        strokeWidth={1.75}
                                    />
                                </button>
                            </div>
                        ) : null}
                    </section>
                ) : null}
            </div>
        </ContentLayout>
    );
};
