import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Cpu } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROLES, useUser } from '@/features/auth';
import {
    getBackgroundJobs,
    retryBackgroundJob,
    runBackgroundJobs,
    type BackgroundJobItem,
    type BackgroundJobQuery,
} from '@/features/admin/api/background-jobs';
import { useNotifications } from '@/components/ui/notifications';
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
    const user = useUser();
    const { addNotification } = useNotifications();
    const [jobs, setJobs] = useState<BackgroundJobItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isRunningJobs, setIsRunningJobs] = useState(false);
    const [retryingJobId, setRetryingJobId] = useState<number | null>(null);

    const limit = 20;

    if (!user.data) return null;

    if (user.data.role !== ROLES.DOANTRUONG) {
        return (
            <ContentLayout title="Tác vụ nền">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền xem hoặc chạy tác vụ nền.
                </div>
            </ContentLayout>
        );
    }

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

    const handleRunDueJobs = async () => {
        setIsRunningJobs(true);
        try {
            const result = await runBackgroundJobs({
                type: filterType.trim() || undefined,
                limit: 10,
            });
            addNotification({
                type: result.failed_count > 0 ? 'warning' : 'success',
                title: 'Đã xử lý queue',
                message: `Processed ${result.processed_count}, failed ${result.failed_count}.`,
            });
            await loadJobs(page);
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể chạy tác vụ nền đến hạn.',
            });
        } finally {
            setIsRunningJobs(false);
        }
    };

    const handleRetryJob = async (jobId: number) => {
        setRetryingJobId(jobId);
        try {
            await retryBackgroundJob(jobId);
            addNotification({
                type: 'success',
                title: 'Đã retry job',
                message: `Job #${jobId} đã được xử lý lại.`,
            });
            await loadJobs(page);
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: `Không thể retry job #${jobId}.`,
            });
        } finally {
            setRetryingJobId(null);
        }
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
                            data-testid="background-jobs-filter-type"
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
                            data-testid="background-jobs-filter-status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            placeholder="VD: PENDING"
                            className="h-9 w-40"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        data-testid="background-jobs-filter-submit"
                    >
                        Tìm kiếm
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="background-jobs-run-due"
                        disabled={isRunningJobs}
                        onClick={() => void handleRunDueJobs()}
                    >
                        {isRunningJobs ? 'Đang chạy...' : 'Chạy job đến hạn'}
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
                                    <th className="px-4 py-3" />
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
                                        <td className="px-4 py-3 text-right">
                                            {job.status === 'FAILED' ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    data-testid={`background-job-retry-${job.id}`}
                                                    disabled={
                                                        retryingJobId === job.id
                                                    }
                                                    onClick={() =>
                                                        void handleRetryJob(
                                                            job.id,
                                                        )
                                                    }
                                                >
                                                    {retryingJobId === job.id
                                                        ? 'Đang retry...'
                                                        : 'Retry'}
                                                </Button>
                                            ) : null}
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
