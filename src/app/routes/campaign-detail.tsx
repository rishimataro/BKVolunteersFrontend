import * as React from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, Layers3 } from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { getPublicCampaignDetail } from '@/features/campaign/api/public-campaigns';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { ModuleType, PublicCampaignDetail } from '@/types/api';

const moduleLabel: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ',
    item_donation: 'Hiện vật',
    event: 'Tình nguyện',
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

const formatProgressNumber = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(value);

export const PublicCampaignDetailRoute = () => {
    const { slug } = useParams();
    const [campaign, setCampaign] =
        React.useState<PublicCampaignDetail | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!slug) {
            setIsLoading(false);
            setError('Đường dẫn chiến dịch không hợp lệ.');
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        getPublicCampaignDetail(slug)
            .then((result) => {
                if (!isMounted) return;
                setCampaign(result);
            })
            .catch(() => {
                if (!isMounted) return;
                setError('Không thể tải chi tiết chiến dịch.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [slug]);

    return (
        <>
            <Head title={campaign?.title ?? 'Chi tiết chiến dịch'} />
            <main className="min-h-screen bg-slate-50">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <Link
                            to={paths.campaigns.getHref()}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-bk-blue hover:text-blue-900"
                        >
                            <ArrowLeft className="size-4" />
                            Danh sách chiến dịch
                        </Link>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && !campaign ? (
                        <EmptyState title="Không tìm thấy chiến dịch" />
                    ) : null}

                    {!isLoading && !error && campaign ? (
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="aspect-[16/7] bg-slate-100">
                                    {campaign.cover_image_url ? (
                                        <img
                                            src={campaign.cover_image_url}
                                            alt={campaign.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-base font-semibold text-slate-600">
                                            BK Volunteers
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6 p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-bk-blue">
                                                {campaign.organization.name}
                                            </p>
                                            <h1 className="mt-2 text-3xl font-bold text-slate-950">
                                                {campaign.title}
                                            </h1>
                                        </div>
                                        <StatusBadge status={campaign.status} />
                                    </div>

                                    <p className="text-base leading-7 text-slate-600">
                                        {campaign.description ?? campaign.summary}
                                    </p>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                                            <span>Tiến độ tổng</span>
                                            <span>{campaign.progress.percent}%</span>
                                        </div>
                                        <div className="h-3 rounded-full bg-slate-100">
                                            <div
                                                className="h-3 rounded-full bg-bk-blue"
                                                style={{
                                                    width: `${campaign.progress.percent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {formatDate(campaign.start_at)} -{' '}
                                            {formatDate(campaign.end_at)}
                                        </span>
                                        <span>
                                            Đối tượng: {campaign.beneficiary ?? 'Cộng đồng'}
                                        </span>
                                    </div>
                                </div>
                            </article>

                            <aside className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-white p-5">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Đơn vị tổ chức
                                    </h2>
                                    <p className="mt-2 text-sm font-medium text-slate-700">
                                        {campaign.organization.name}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {campaign.organization.code}
                                    </p>
                                </div>

                                {campaign.modules.map((module) => (
                                    <div
                                        key={module.id}
                                        className="rounded-lg border border-slate-200 bg-white p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="inline-flex items-center gap-2 text-sm font-semibold text-bk-blue">
                                                    <Layers3 className="size-4" />
                                                    {moduleLabel[module.type]}
                                                </p>
                                                <h3 className="mt-2 text-base font-semibold text-slate-900">
                                                    {module.title}
                                                </h3>
                                            </div>
                                            <StatusBadge status={module.status} />
                                        </div>
                                        {module.description ? (
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {module.description}
                                            </p>
                                        ) : null}
                                        {module.progress ? (
                                            <div className="mt-4">
                                                <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                                                    <span>
                                                        {formatProgressNumber(
                                                            module.progress.current,
                                                        )}
                                                        /
                                                        {formatProgressNumber(
                                                            module.progress.target,
                                                        )}
                                                    </span>
                                                    <span>
                                                        {module.progress.percent}%
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-100">
                                                    <div
                                                        className="h-2 rounded-full bg-bk-blue"
                                                        style={{
                                                            width: `${module.progress.percent}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                        <Button
                                            type="button"
                                            className="mt-4 w-full"
                                            disabled={!module.cta.enabled}
                                        >
                                            {module.cta.label}
                                        </Button>
                                    </div>
                                ))}
                            </aside>
                        </div>
                    ) : null}
                </section>
            </main>
        </>
    );
};
