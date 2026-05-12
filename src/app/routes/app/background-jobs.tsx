import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Cpu } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getBackgroundJobs,
    type BackgroundJobItem,
    type BackgroundJobQuery,
} from '@/features/admin/api/background-jobs';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const statusColor: Record<string, string> = {
    PENDING: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    RUNNING: 'text-blue-700 bg-blue-50 border-blue-200',
    COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    FAILED: 'text-red-700 bg-red-50 border-red-200',
    CANCELLED: 'text-slate-700 bg-slate-50 border-slate-200',
};

const typeLabel: Record<string, string> = {
    RENDER_CERTIFICATE: 'Tạo chứng nhận',
};

const defaultStatusLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const BackgroundJobsRoute = () => {
    const [jobs, setJobs] = useState<BackgroundJobItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const limit = 20;

    const loadJobs = async (p: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const query: BackgroundJobQuery = { page: p, limit };
            if (filterType.trim()) query.type = filterType.trim();
            if (filterStatus.trim()) query.status = filterStatus.trim();
            const result = await getBackgroundJobs(query);
            setJobs(result.items);
            setPage(result.pagination.page);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
        } catch {
            setError('Không thể tải tác vụ nền.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadJobs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        void loadJobs(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        void loadJobs(newPage);
    };

    return (
        <ContentLayout title="Tác vụ nền">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Cpu className="h-6 w-6 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            Tác vụ nền
                        </h2>
                        <p className="text-sm text-slate-500">
                            {total > 0
                                ? `${total} tác vụ`
                                : 'Tác vụ xử lý ngầm trong hệ thống'}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Loại
                        </label>
                        <Input
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            placeholder="VD: RENDER_CERTIFICATE"
                            className="h-9 w-48"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Trạng thái
                        </label>
                        <Input
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            placeholder="VD: PENDING"
                            className="h-9 w-40"
                        />
                    </div>
                    <Button type="submit" size="sm">
                        Tìm kiếm
                    </Button>
                </form>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && jobs.length === 0 ? (
                    <EmptyState title="Không có tác vụ nền nào" />
                ) : null}

                {!isLoading && !error && jobs.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-4 py-3">Loại</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Số lần thử</th>
                                    <th className="px-4 py-3">Lỗi</th>
                                    <th className="px-4 py-3">Chạy lúc</th>
                                    <th className="px-4 py-3">Tạo lúc</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {jobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {typeLabel[job.type] ?? job.type}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                    statusColor[job.status] ??
                                                    statusColor.PENDING
                                                }`}
                                            >
                                                {defaultStatusLabel(job.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {job.attempts}
                                        </td>
                                        <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-red-500">
                                            {job.last_error ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(new Date(job.run_at))}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(new Date(job.created_at))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                            <p className="text-sm text-slate-500">
                                Trang {page} / {totalPages}
                            </p>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => handlePageChange(page - 1)}
                                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                                >
                                    <ChevronRight className="size-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};
