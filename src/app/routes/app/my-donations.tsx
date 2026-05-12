import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
    Banknote,
    Package,
    CheckCircle2,
    Clock,
    XCircle,
    ExternalLink,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { paths } from '@/config/paths';
import { getStudentDonations } from '@/features/campaign/api/student';
import type { StudentDonationItem } from '@/features/campaign/types';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const statusConfig: Record<
    string,
    { label: string; color: string; icon: typeof Clock }
> = {
    PENDING: {
        label: 'Chờ xác nhận',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Clock,
    },
    VERIFIED: {
        label: 'Đã xác nhận',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        icon: CheckCircle2,
    },
    REJECTED: {
        label: 'Từ chối',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
    },
    PLEDGED: {
        label: 'Đã cam kết',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: Clock,
    },
    CONFIRMED: {
        label: 'Đã xác nhận',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        icon: CheckCircle2,
    },
    HANDOVER: {
        label: 'Đã bàn giao',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: 'Đã hủy',
        color: 'text-slate-600 bg-slate-50 border-slate-200',
        icon: XCircle,
    },
};

const getStatusBadge = (status: string) => {
    const config = statusConfig[status] ?? {
        label: status,
        color: 'text-slate-600 bg-slate-50 border-slate-200',
        icon: Clock,
    };
    const Icon = config.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
        >
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);

const getMeta = <T,>(
    meta: Record<string, unknown>,
    key: string,
): T | undefined => meta[key] as T | undefined;

export const MyDonationsRoute = () => {
    const [donations, setDonations] = useState<StudentDonationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'money' | 'item'>('all');

    const loadDonations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getStudentDonations();
            setDonations(data);
        } catch {
            setError('Không thể tải lịch sử đóng góp.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadDonations();
    }, []);

    const filtered =
        filter === 'all'
            ? donations
            : donations.filter((d) => d.donation_type === filter);

    const moneyTotal = donations
        .filter(
            (d) =>
                d.donation_type === 'money' &&
                (d.status === 'VERIFIED' || d.status === 'PENDING'),
        )
        .reduce((sum, d) => sum + (getMeta<number>(d.meta, 'amount') ?? 0), 0);

    return (
        <ContentLayout title="Đóng góp của tôi">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Banknote className="h-6 w-6 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            Đóng góp của tôi
                        </h2>
                        <p className="text-sm text-slate-500">
                            {donations.length} đóng góp
                            {moneyTotal > 0
                                ? ` · Tổng ~${formatCurrency(moneyTotal)}`
                                : ''}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(['all', 'money', 'item'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                filter === f
                                    ? 'bg-[#2E5077] text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {f === 'all'
                                ? 'Tất cả'
                                : f === 'money'
                                  ? 'Tiền mặt'
                                  : 'Hiện vật'}
                        </button>
                    ))}
                </div>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && filtered.length === 0 ? (
                    <EmptyState title="Chưa có đóng góp nào" />
                ) : null}

                {!isLoading && !error && filtered.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filtered.map((d) => (
                            <div
                                key={d.id}
                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            {d.donation_type === 'money' ? (
                                                <Banknote className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <Package className="h-4 w-4 text-blue-500" />
                                            )}
                                            <span className="text-xs font-semibold uppercase text-slate-400">
                                                {d.donation_type === 'money'
                                                    ? 'Tiền mặt'
                                                    : 'Hiện vật'}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-base font-semibold text-slate-800">
                                            {d.campaign_title}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {d.module_title}
                                        </p>
                                        {d.donation_type === 'money' ? (
                                            <p className="mt-2 text-lg font-bold text-emerald-600">
                                                {formatCurrency(
                                                    getMeta<number>(
                                                        d.meta,
                                                        'amount',
                                                    ) ?? 0,
                                                )}
                                            </p>
                                        ) : (
                                            <p className="mt-2 text-sm text-slate-700">
                                                {getMeta<number>(
                                                    d.meta,
                                                    'quantity',
                                                ) ?? 0}{' '}
                                                {getMeta<string>(
                                                    d.meta,
                                                    'unit',
                                                ) ?? ''}{' '}
                                                {getMeta<string>(
                                                    d.meta,
                                                    'item_name',
                                                ) ?? ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {getStatusBadge(d.status)}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                    <span>
                                        {new Intl.DateTimeFormat('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        }).format(new Date(d.occurred_at))}
                                    </span>
                                    <Link
                                        to={paths.campaigns.detail.getHref(
                                            d.campaign_slug,
                                        )}
                                        className="inline-flex items-center gap-1 font-medium text-[#4DA1A9] hover:text-[#2E5077]"
                                    >
                                        Chiến dịch
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};
