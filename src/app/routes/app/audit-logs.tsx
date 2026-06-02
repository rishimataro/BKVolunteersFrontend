import { useEffect, useState } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    CERTIFICATE_TEMPLATE_CREATED: 'Tạo template chứng nhận',
    CERTIFICATE_TEMPLATE_UPDATED: 'Cập nhật template chứng nhận',
    CERTIFICATE_TEMPLATE_DEACTIVATED: 'Ngưng hoạt động template chứng nhận',
    CERTIFICATE_REVOKED: 'Thu hồi chứng nhận',
    CERTIFICATE_REISSUED: 'Cấp lại chứng nhận',
};

const defaultLabel = (action: string) =>
    action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const AuditLogsRoute = () => {
    const user = useUser();
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

    if (!user.data) return null;

    if (user.data.role !== ROLES.DOANTRUONG) {
        return (
            <ContentLayout title="Nhật ký hoạt động">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền xem nhật ký hoạt động.
                </div>
            </ContentLayout>
        );
    }

    const loadLogs = async (p: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const query: AuditLogQuery = { page: p, limit };
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
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        void loadLogs(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        void loadLogs(newPage);
    };

    return (
        <ContentLayout title="Nhật ký hoạt động">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            Nhật ký hoạt động
                        </h2>
                        <p className="text-sm text-slate-500">
                            {total > 0
                                ? `${total} bản ghi`
                                : 'Theo dõi thay đổi trong hệ thống'}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Hành động
                        </label>
                        <Input
                            data-testid="audit-filter-action"
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            placeholder="VD: CAMPAIGN_APPROVED"
                            className="h-9 w-48"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Loại đối tượng
                        </label>
                        <Input
                            data-testid="audit-filter-entity"
                            value={filterEntity}
                            onChange={(e) => setFilterEntity(e.target.value)}
                            placeholder="VD: campaign"
                            className="h-9 w-40"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Từ ngày
                        </label>
                        <Input
                            data-testid="audit-filter-from"
                            type="datetime-local"
                            value={filterFrom}
                            onChange={(e) => setFilterFrom(e.target.value)}
                            className="h-9 w-52"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Đến ngày
                        </label>
                        <Input
                            data-testid="audit-filter-to"
                            type="datetime-local"
                            value={filterTo}
                            onChange={(e) => setFilterTo(e.target.value)}
                            className="h-9 w-52"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        data-testid="audit-filter-submit"
                    >
                        Tìm kiếm
                    </Button>
                </form>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && logs.length === 0 ? (
                    <EmptyState title="Không có nhật ký nào" />
                ) : null}

                {!isLoading && !error && logs.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-4 py-3">Hành động</th>
                                    <th className="px-4 py-3">Đối tượng</th>
                                    <th className="px-4 py-3">
                                        Người thực hiện
                                    </th>
                                    <th className="px-4 py-3">IP</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-800">
                                                {actionLabel[log.action] ??
                                                    defaultLabel(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {log.entity_type} #{log.entity_id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-slate-700">
                                                {log.actor_type}
                                            </span>
                                            <span className="text-slate-400">
                                                {' '}
                                                #{log.actor_id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                            {log.ip_address ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(new Date(log.created_at))}
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
