import * as React from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Building2, CalendarDays, MapPin } from 'lucide-react';

import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { getOrganizationBySlug } from '@/features/organizations/api/organizations';
import type { OrganizationDetail } from '@/features/organizations/api/organizations';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const orgTypeLabel: Record<string, string> = {
    CLUB: 'CLB',
    TEAM: 'Đội',
    GROUP: 'Nhóm',
    CENTER: 'Trung tâm',
};

export const OrganizationDetailRoute = () => {
    const { slug } = useParams();
    const [org, setOrg] = React.useState<OrganizationDetail | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!slug) {
            setIsLoading(false);
            setError('Đường dẫn không hợp lệ.');
            return;
        }

        let mounted = true;
        setIsLoading(true);
        setError(null);

        getOrganizationBySlug(slug)
            .then((data) => {
                if (!mounted) return;
                setOrg(data);
            })
            .catch(() => {
                if (!mounted) return;
                setError('Không thể tải thông tin tổ chức.');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [slug]);

    return (
        <>
            <Head title={org?.name ?? 'Tổ chức'} />
            <main className="min-h-screen bg-slate-50">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <Link
                            to={paths.organizations.getHref()}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-bk-blue hover:text-blue-900"
                        >
                            <ArrowLeft className="size-4" />
                            Danh sách tổ chức
                        </Link>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && !org ? (
                        <EmptyState title="Không tìm thấy tổ chức" />
                    ) : null}

                    {!isLoading && !error && org ? (
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="space-y-6">
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-start gap-5 p-6">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-2xl font-bold text-bk-blue">
                                            {org.logo_url ? (
                                                <img
                                                    src={org.logo_url}
                                                    alt={org.name}
                                                    className="h-full w-full rounded-lg object-cover"
                                                />
                                            ) : (
                                                org.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h1 className="text-2xl font-bold text-slate-950">
                                                {org.name}
                                            </h1>
                                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-bk-blue">
                                                    <Building2 className="size-3.5" />
                                                    {orgTypeLabel[org.type] ??
                                                        org.type}
                                                </span>
                                                {org.faculty ? (
                                                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                                                        <MapPin className="size-3.5" />
                                                        {org.faculty.name}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    {org.description ? (
                                        <div className="border-t border-slate-100 px-6 py-4">
                                            <p className="text-sm leading-6 text-slate-600">
                                                {org.description}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <h2 className="mb-4 text-lg font-bold text-slate-900">
                                        Chiến dịch ({org.campaigns.length})
                                    </h2>
                                    {org.campaigns.length === 0 ? (
                                        <EmptyState title="Chưa có chiến dịch nào" />
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {org.campaigns.map((campaign) => (
                                                <Link
                                                    key={campaign.id}
                                                    to={paths.campaigns.detail.getHref(
                                                        campaign.slug,
                                                    )}
                                                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                                >
                                                    <div className="aspect-[16/7] bg-slate-100">
                                                        {campaign.cover_image_url ? (
                                                            <img
                                                                src={
                                                                    campaign.cover_image_url
                                                                }
                                                                alt={
                                                                    campaign.title
                                                                }
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-sm font-semibold text-slate-500">
                                                                BK Volunteers
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-bk-blue">
                                                            {campaign.title}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                                            {campaign.summary}
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                                            <CalendarDays className="size-3.5" />
                                                            {new Intl.DateTimeFormat(
                                                                'vi-VN',
                                                                {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                },
                                                            ).format(
                                                                new Date(
                                                                    campaign.start_at,
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <aside className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Thông tin tổ chức
                                    </h3>
                                    <div className="mt-4 space-y-3 text-sm">
                                        <div>
                                            <p className="text-slate-400">
                                                Mã tổ chức
                                            </p>
                                            <p className="font-medium text-slate-700">
                                                {org.code}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">
                                                Loại
                                            </p>
                                            <p className="font-medium text-slate-700">
                                                {orgTypeLabel[org.type] ??
                                                    org.type}
                                            </p>
                                        </div>
                                        {org.faculty ? (
                                            <div>
                                                <p className="text-slate-400">
                                                    Khoa
                                                </p>
                                                <p className="font-medium text-slate-700">
                                                    {org.faculty.name}
                                                </p>
                                            </div>
                                        ) : null}
                                        <div>
                                            <p className="text-slate-400">
                                                Trạng thái
                                            </p>
                                            <p className="font-medium text-slate-700">
                                                {org.status === 'ACTIVE'
                                                    ? 'Hoạt động'
                                                    : org.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : null}
                </section>
            </main>
        </>
    );
};
