import * as React from 'react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getPublicCampaigns,
    type PublicCampaignFilters,
} from '@/features/campaign/api/public-campaigns';
import { CampaignCard } from '@/features/campaign/components/campaign-card';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { Meta, ModuleType, PublicCampaignCard } from '@/types/api';

const moduleOptions: Array<{ value: ModuleType | ''; label: string }> = [
    { value: '', label: 'Tất cả hạng mục' },
    { value: 'fundraising', label: 'Gây quỹ' },
    { value: 'item_donation', label: 'Hiện vật' },
    { value: 'event', label: 'Tình nguyện' },
];

const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ONGOING', label: 'Đang diễn ra' },
    { value: 'PUBLISHED', label: 'Đã công khai' },
] as const;

export const PublicCampaignsRoute = () => {
    const [filters, setFilters] = React.useState<PublicCampaignFilters>({
        page: 1,
        limit: 9,
    });
    const [campaigns, setCampaigns] = React.useState<PublicCampaignCard[]>([]);
    const [meta, setMeta] = React.useState<Meta | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        setIsLoading(true);
        setError(null);

        getPublicCampaigns(filters)
            .then((result) => {
                if (!isMounted) return;
                setCampaigns(result.items);
                setMeta(result.meta);
            })
            .catch(() => {
                if (!isMounted) return;
                setError('Không thể tải danh sách chiến dịch.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [filters]);

    const totalPages = meta?.total_pages ?? meta?.totalPages ?? 1;

    return (
        <>
            <Head title="Chiến dịch thiện nguyện" />
            <main className="min-h-screen bg-slate-50">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <p className="text-sm font-semibold uppercase tracking-wide text-bk-blue">
                            BK Volunteers
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                            Chiến dịch thiện nguyện
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                            Tìm kiếm và theo dõi các chiến dịch đang mở trong hệ thống.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
                        <Input
                            value={filters.q ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    q: event.target.value,
                                    page: 1,
                                }))
                            }
                            placeholder="Tìm theo tên chiến dịch hoặc đơn vị"
                        />
                        <select
                            value={filters.module_type ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    module_type: event.target.value as ModuleType | '',
                                    page: 1,
                                }))
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                            {moduleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.status ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: event.target.value as
                                        | 'PUBLISHED'
                                        | 'ONGOING'
                                        | '',
                                    page: 1,
                                }))
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && campaigns.length === 0 ? (
                        <EmptyState
                            title="Chưa có chiến dịch phù hợp"
                            description="Thử thay đổi bộ lọc hoặc quay lại sau."
                        />
                    ) : null}

                    {!isLoading && !error && campaigns.length > 0 ? (
                        <>
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {campaigns.map((campaign) => (
                                    <CampaignCard
                                        key={campaign.id}
                                        campaign={campaign}
                                    />
                                ))}
                            </div>
                            <div className="mt-8 flex items-center justify-between">
                                <p className="text-sm text-slate-600">
                                    Trang {meta?.page ?? 1}/{totalPages || 1} -
                                    tổng {meta?.total ?? campaigns.length} chiến dịch
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={(filters.page ?? 1) <= 1}
                                        onClick={() =>
                                            setFilters((current) => ({
                                                ...current,
                                                page: Math.max(
                                                    1,
                                                    (current.page ?? 1) - 1,
                                                ),
                                            }))
                                        }
                                    >
                                        Trước
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={(filters.page ?? 1) >= totalPages}
                                        onClick={() =>
                                            setFilters((current) => ({
                                                ...current,
                                                page: (current.page ?? 1) + 1,
                                            }))
                                        }
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </section>
            </main>
        </>
    );
};
