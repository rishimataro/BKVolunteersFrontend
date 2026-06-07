import { useEffect, useState } from 'react';
import { Bot, Cpu, RefreshCcw, ServerCog, Siren } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    FilterField,
    FilterToolbar,
    ManagementGrid,
    ManagementHeader,
    ManagementPanel,
    ManagementStatCard,
} from '@/components/ui/management-shell';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    getBackgroundJobs,
    retryBackgroundJob,
    runBackgroundJobs,
    type BackgroundJobItem,
    type BackgroundJobQuery,
} from '@/features/admin/api/background-jobs';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const statusLabelMap: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    PENDING: { label: 'Đang chờ', variant: 'secondary' },
    RUNNING: { label: 'Đang chạy', variant: 'default' },
    COMPLETED: { label: 'Hoàn tất', variant: 'outline' },
    FAILED: { label: 'Thất bại', variant: 'destructive' },
    CANCELLED: { label: 'Đã hủy', variant: 'secondary' },
};

const typeLabel: Record<string, string> = {
    RENDER_CERTIFICATE: 'Tạo chứng nhận',
};

const defaultStatusLabel = (value: string) =>
    value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

export const BackgroundJobsRoute = () => {
    const user = useUser();
    const canManageJobs = user.data?.role === ROLES.DOANTRUONG;
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

    const loadJobs = async (nextPage: number) => {
        if (!canManageJobs) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const query: BackgroundJobQuery = { page: nextPage, limit };
            if (filterType.trim()) query.type = filterType.trim();
            if (filterStatus.trim()) query.status = filterStatus.trim();

            const result = await getBackgroundJobs(query);
            setJobs(result.items);
            setPage(result.pagination.page);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
        } catch {
            setError('Không thể tải danh sách tác vụ nền.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadJobs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManageJobs]);

    const handleRunDueJobs = async () => {
        setIsRunningJobs(true);
        try {
            const result = await runBackgroundJobs({
                type: filterType.trim() || undefined,
                limit: 10,
            });
            addNotification({
                type: result.failed_count > 0 ? 'warning' : 'success',
                title: 'Đã xử lý hàng đợi',
                message: `Đã xử lý ${result.processed_count} tác vụ, thất bại ${result.failed_count}.`,
            });
            await loadJobs(page);
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể chạy tác vụ nền',
                message: 'Vui lòng thử lại sau hoặc kiểm tra cấu hình backend.',
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
                title: 'Đã gửi tác vụ chạy lại',
                message: `Tác vụ #${jobId} đã được đưa lại vào hàng đợi.`,
            });
            await loadJobs(page);
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể chạy lại tác vụ',
                message: `Không thể đưa tác vụ #${jobId} chạy lại.`,
            });
        } finally {
            setRetryingJobId(null);
        }
    };

    const statFailed = jobs.filter((job) => job.status === 'FAILED').length;
    const statPending = jobs.filter((job) => job.status === 'PENDING').length;
    const statRunning = jobs.filter((job) => job.status === 'RUNNING').length;

    const columns: Column<BackgroundJobItem>[] = [
        {
            key: 'type',
            header: 'Loại tác vụ',
            className: 'min-w-[220px]',
            render: (job) => (
                <div className="space-y-1">
                    <p className="font-semibold text-primary">
                        {typeLabel[job.type] ?? job.type}
                    </p>
                    <p className="text-xs text-muted-foreground">ID #{job.id}</p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            className: 'min-w-[150px]',
            render: (job) => {
                const mapped = statusLabelMap[job.status];
                return (
                    <Badge variant={mapped?.variant ?? 'secondary'}>
                        {mapped?.label ?? defaultStatusLabel(job.status)}
                    </Badge>
                );
            },
        },
        {
            key: 'attempts',
            header: 'Số lần thử',
            className: 'min-w-[120px]',
            render: (job) => job.attempts.toLocaleString('vi-VN'),
        },
        {
            key: 'lastError',
            header: 'Lỗi gần nhất',
            className: 'min-w-[260px]',
            render: (job) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {job.last_error ?? 'Không có'}
                </span>
            ),
        },
        {
            key: 'runAt',
            header: 'Thời điểm chạy',
            className: 'min-w-[170px]',
            render: (job) => formatDateTime(job.run_at),
        },
        {
            key: 'createdAt',
            header: 'Thời điểm tạo',
            className: 'min-w-[170px]',
            render: (job) => formatDateTime(job.created_at),
        },
        {
            key: 'actions',
            header: 'Thao tác',
            className: 'min-w-[160px]',
            render: (job) =>
                job.status === 'FAILED' ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`background-job-retry-${job.id}`}
                        disabled={retryingJobId === job.id}
                        onClick={() => void handleRetryJob(job.id)}
                    >
                        <RefreshCcw className="size-4" />
                        {retryingJobId === job.id
                            ? 'Đang chạy lại...'
                            : 'Chạy lại'}
                    </Button>
                ) : (
                    <span className="text-sm text-muted-foreground">Không có</span>
                ),
        },
    ];

    if (!user.data) {
        return null;
    }

    if (!canManageJobs) {
        return (
            <ContentLayout title="Tác vụ nền">
                <ManagementPanel>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Vai trò hiện tại không có quyền xem hoặc chạy tác vụ
                        nền.
                    </p>
                </ManagementPanel>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Tác vụ nền">
            <div className="space-y-6">
                <ManagementHeader
                    badge="Điều phối nền"
                    icon={Cpu}
                    title="Giám sát và điều khiển tác vụ nền"
                    description="Theo dõi trạng thái queue, số lần retry và lỗi xử lý của các job backend. Giao diện này ưu tiên thao tác nhanh, rõ trạng thái và dễ truy vết."
                    actions={
                        <Button
                            type="button"
                            size="lg"
                            disabled={isRunningJobs}
                            data-testid="background-jobs-run-due"
                            onClick={() => void handleRunDueJobs()}
                        >
                            <ServerCog className="size-4" />
                            {isRunningJobs
                                ? 'Đang xử lý...'
                                : 'Chạy tác vụ đến hạn'}
                        </Button>
                    }
                />

                <ManagementGrid>
                    <ManagementStatCard
                        icon={Bot}
                        label="Tổng tác vụ"
                        value={total.toLocaleString('vi-VN')}
                        note="Theo bộ lọc hiện tại"
                    />
                    <ManagementStatCard
                        icon={RefreshCcw}
                        label="Đang chờ"
                        value={statPending.toLocaleString('vi-VN')}
                        note="Tác vụ chờ xử lý trong trang hiện tại"
                    />
                    <ManagementStatCard
                        icon={Cpu}
                        label="Đang chạy"
                        value={statRunning.toLocaleString('vi-VN')}
                        note="Tác vụ đang được worker thực thi"
                        tone="success"
                    />
                    <ManagementStatCard
                        icon={Siren}
                        label="Thất bại"
                        value={statFailed.toLocaleString('vi-VN')}
                        note="Cần kiểm tra log hoặc chạy lại"
                        tone="danger"
                    />
                </ManagementGrid>

                <FilterToolbar>
                    <div>
                        <h3 className="text-base font-semibold text-primary">
                            Bộ lọc queue
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Lọc theo loại tác vụ hoặc trạng thái để xử lý hàng
                            đợi chính xác hơn.
                        </p>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void loadJobs(1);
                        }}
                        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
                    >
                        <FilterField label="Loại tác vụ">
                            <Input
                                data-testid="background-jobs-filter-type"
                                value={filterType}
                                onChange={(event) =>
                                    setFilterType(event.target.value)
                                }
                                placeholder="Ví dụ: RENDER_CERTIFICATE"
                                className="h-10"
                            />
                        </FilterField>
                        <FilterField label="Trạng thái">
                            <Input
                                data-testid="background-jobs-filter-status"
                                value={filterStatus}
                                onChange={(event) =>
                                    setFilterStatus(event.target.value)
                                }
                                placeholder="Ví dụ: PENDING"
                                className="h-10"
                            />
                        </FilterField>
                        <div className="flex items-end gap-2">
                            <Button
                                type="submit"
                                data-testid="background-jobs-filter-submit"
                            >
                                Áp dụng
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFilterType('');
                                    setFilterStatus('');
                                    void loadJobs(1);
                                }}
                            >
                                Đặt lại
                            </Button>
                        </div>
                    </form>
                </FilterToolbar>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && jobs.length === 0 ? (
                    <EmptyState
                        title="Không có tác vụ nền nào"
                        description="Hệ thống chưa tạo tác vụ phù hợp với bộ lọc hiện tại."
                    />
                ) : null}

                {!isLoading && !error && jobs.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={jobs}
                        keyExtractor={(item) => item.id}
                        pagination={{
                            page,
                            totalPages,
                            total,
                            onPageChange: (nextPage) => {
                                void loadJobs(nextPage);
                            },
                        }}
                    />
                ) : null}
            </div>
        </ContentLayout>
    );
};
