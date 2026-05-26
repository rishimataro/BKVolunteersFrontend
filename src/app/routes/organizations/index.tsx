import * as React from 'react';
import { Link } from 'react-router';
import { Building2, Search } from 'lucide-react';

import { Head } from '@/components/seo';
import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';
import {
    listOrganizations,
    type OrganizationCard,
} from '@/features/organizations/api/organizations';
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

export const OrganizationsRoute = () => {
    const [orgs, setOrgs] = React.useState<OrganizationCard[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        let mounted = true;

        listOrganizations()
            .then((data) => {
                if (!mounted) return;
                setOrgs(data);
            })
            .catch(() => {
                if (!mounted) return;
                setError('Không thể tải danh sách tổ chức.');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const filtered = orgs.filter(
        (org) =>
            !search ||
            org.name.toLowerCase().includes(search.toLowerCase()) ||
            org.code.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <>
            <Head title="Tổ chức" />
            <main className="min-h-screen bg-slate-50">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <p className="text-sm font-semibold uppercase tracking-wide text-bk-blue">
                            BK Volunteers
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                            CLB / Đội / Nhóm
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                            Danh sách các tổ chức thiện nguyện trong hệ thống.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6 max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc mã tổ chức"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && filtered.length === 0 ? (
                        <EmptyState
                            title={
                                search
                                    ? 'Không tìm thấy tổ chức phù hợp'
                                    : 'Chưa có tổ chức nào'
                            }
                            description={
                                search
                                    ? 'Thử thay đổi từ khóa tìm kiếm.'
                                    : 'Danh sách sẽ được cập nhật sau.'
                            }
                        />
                    ) : null}

                    {!isLoading && !error && filtered.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((org) => (
                                <Link
                                    key={org.id}
                                    to={paths.organizations.detail.getHref(
                                        org.slug,
                                    )}
                                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg font-bold text-bk-blue">
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
                                            <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-bk-blue">
                                                {org.name}
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                {org.code}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-bk-blue">
                                                    <Building2 className="size-3" />
                                                    {orgTypeLabel[org.type] ??
                                                        org.type}
                                                </span>
                                                {org.faculty ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                                                        {org.faculty.name}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    {org.description ? (
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                                            {org.description}
                                        </p>
                                    ) : null}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </section>
            </main>
        </>
    );
};
