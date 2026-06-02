import { useEffect, useState } from 'react';
import { ClipboardList, History, ShieldCheck, TimerReset } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
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
import { ROLES, useUser } from '@/features/auth';
import {
    getAuditLogs,
    type AuditLogItem,
    type AuditLogQuery,
} from '@/features/admin/api/audit-logs';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const actionLabel: Record<string, string> = {
    CAMPAIGN_CREATED: 'Tạo chiến dịch',
    CAMPAIGN_SUBMITTED: 'Gửi duyệt',
    CAMPAIGN_APPROVED: 'Phê duyệt',
    CAMPAIGN_REJECTED: 'Từ chối',
    CAMPAIGN_REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
    CAMPAIGN_PUBLISHED: 'Xuất bản',
    CERTIFICATE_TEMPLATE_CREATED: 'Tạo mẫu chứng nhận',
    CERTIFICATE_TEMPLATE_UPDATED: 'Cập nhật mẫu chứng nhận',
    CERTIFICATE_TEMPLATE_DEACTIVATED: 'Ngừng mẫu chứng nhận',
    CERTIFICATE_REVOKED: 'Thu hồi chứng nhận',
    CERTIFICATE_REISSUED: 'Cấp lại chứng nhận',
};

const defaultLabel = (action: string) =>
    action
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

export const AuditLogsRoute = () => {
    const user = useUser();
    const canViewAuditLogs = user.data?.role === ROLES.DOANTRUONG;
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    const limit = 20;

    const loadLogs = async (nextPage: number) => {
        if (!canViewAuditLogs) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const query: AuditLogQuery = { page: nextPage, limit };
            if (filterAction.trim()) query.action = filterAction.trim();
            if (filterEntity.trim()) query.entity_type = filterEntity.trim();
            if (filterFrom) query.from = new Date(filterFrom).toISOString();
            if (filterTo) query.to = new Date(filterTo).toISOString();

            const result = await getAuditLogs(query);
            setLogs(result.items);
            setPage(result.pagination.page);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
        } catch {
            setError('Không thể tải nhật ký hoạt động.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewAuditLogs]);

    const columns: Column<AuditLogItem>[] = [
        {
            key: 'action',
            header: 'Hành động',
            className: 'min-w-[220px]',
            render: (log) => (
                <div className="space-y-1">
                    <p className="font-semibold text-[#0A0A0A]">
                        {actionLabel[log.action] ?? defaultLabel(log.action)}
                    </p>
                    <p className="text-xs text-[#4B5563]">{log.action}</p>
                </div>
            ),
        },
        {
            key: 'entity',
            header: 'Đối tượng',
            className: 'min-w-[180px]',
            render: (log) => (
                <span className="text-[#4B5563]">
                    {log.entity_type} #{log.entity_id}
                </span>
            ),
        },
        {
            key: 'actor',
            header: 'Người thực hiện',
            className: 'min-w-[180px]',
            render: (log) => (
                <div className="space-y-1">
                    <p className="font-medium text-[#0A0A0A]">
                        {log.actor_type}
                    </p>
                    <p className="text-sm text-[#4B5563]">Mã #{log.actor_id}</p>
                </div>
            ),
        },
        {
            key: 'ip',
            header: 'Địa chỉ IP',
            className: 'min-w-[160px]',
            render: (log) => (
                <span className="font-mono text-xs text-[#4B5563]">
                    {log.ip_address ?? 'Không có'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Thời gian',
            className: 'min-w-[180px]',
            render: (log) => formatDateTime(log.created_at),
        },
    ];

    if (!user.data) {
        return null;
    }

    if (!canViewAuditLogs) {
        return (
            <ContentLayout title="Nhật ký hoạt động">
                <ManagementPanel>
                    <p className="text-sm leading-6 text-[#4B5563]">
                        Vai trò hiện tại không có quyền xem nhật ký hoạt động.
                    </p>
                </ManagementPanel>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Nhật ký hoạt động">
            <div className="space-y-6">
                <ManagementHeader
                    badge="Dấu vết hệ thống"
                    icon={ClipboardList}
                    title="Theo dõi lịch sử thao tác quản trị"
                    description="Tập trung nhật ký hoạt động quan trọng của hệ thống để phục vụ kiểm tra, đối soát và truy vết khi có thay đổi nghiệp vụ."
                />

                <ManagementGrid>
                    <ManagementStatCard
                        icon={History}
                        label="Tổng bản ghi"
                        value={total.toLocaleString('vi-VN')}
                        note="Theo truy vấn hiện tại"
                    />
                    <ManagementStatCard
                        icon={ShieldCheck}
                        label="Bản ghi trong trang"
                        value={logs.length.toLocaleString('vi-VN')}
                        note="Số lượng đang hiển thị"
                        tone="success"
                    />
                    <ManagementStatCard
                        icon={TimerReset}
                        label="Trang hiện tại"
                        value={`${page}/${totalPages}`}
                        note="Điều hướng qua các bản ghi lịch sử"
                    />
                    <ManagementStatCard
                        icon={ClipboardList}
                        label="Giới hạn tải"
                        value={limit.toLocaleString('vi-VN')}
                        note="Số bản ghi mỗi lần tải"
                    />
                </ManagementGrid>

                <FilterToolbar>
                    <div>
                        <h3 className="text-base font-semibold text-[#0A0A0A]">
                            Bộ lọc nhật ký
                        </h3>
                        <p className="text-sm text-[#4B5563]">
                            Lọc theo hành động, loại đối tượng và mốc thời gian.
                        </p>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void loadLogs(1);
                        }}
                        className="grid gap-4 lg:grid-cols-[220px_220px_220px_220px_auto]"
                    >
                        <FilterField label="Hành động">
                            <Input
                                data-testid="audit-filter-action"
                                value={filterAction}
                                onChange={(event) =>
                                    setFilterAction(event.target.value)
                                }
                                placeholder="Ví dụ: CAMPAIGN_APPROVED"
                                className="h-10"
                            />
                        </FilterField>
                        <FilterField label="Loại đối tượng">
                            <Input
                                data-testid="audit-filter-entity"
                                value={filterEntity}
                                onChange={(event) =>
                                    setFilterEntity(event.target.value)
                                }
                                placeholder="Ví dụ: campaign"
                                className="h-10"
                            />
                        </FilterField>
                        <FilterField label="Từ thời điểm">
                            <Input
                                data-testid="audit-filter-from"
                                type="datetime-local"
                                value={filterFrom}
                                onChange={(event) =>
                                    setFilterFrom(event.target.value)
                                }
                                className="h-10"
                            />
                        </FilterField>
                        <FilterField label="Đến thời điểm">
                            <Input
                                data-testid="audit-filter-to"
                                type="datetime-local"
                                value={filterTo}
                                onChange={(event) =>
                                    setFilterTo(event.target.value)
                                }
                                className="h-10"
                            />
                        </FilterField>
                        <div className="flex items-end gap-2">
                            <Button
                                type="submit"
                                data-testid="audit-filter-submit"
                            >
                                Áp dụng
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFilterAction('');
                                    setFilterEntity('');
                                    setFilterFrom('');
                                    setFilterTo('');
                                    void loadLogs(1);
                                }}
                            >
                                Đặt lại
                            </Button>
                        </div>
                    </form>
                </FilterToolbar>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && logs.length === 0 ? (
                    <EmptyState
                        title="Không có bản ghi phù hợp"
                        description="Thử nới bộ lọc hoặc thay đổi khoảng thời gian để xem thêm dữ liệu."
                    />
                ) : null}

                {!isLoading && !error && logs.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={logs}
                        keyExtractor={(item) => item.id}
                        pagination={{
                            page,
                            totalPages,
                            total,
                            onPageChange: (nextPage) => {
                                void loadLogs(nextPage);
                            },
                        }}
                    />
                ) : null}
            </div>
        </ContentLayout>
    );
};
