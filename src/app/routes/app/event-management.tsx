import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft,
    CalendarDays,
    CalendarCheck,
    CheckCircle2,
    Clock,
    XCircle,
    UserCheck,
    UserX,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import {
    getEventModule,
    getEventRegistrations,
    approveEventRegistration,
    rejectEventRegistration,
    checkInEventRegistration,
    completeEventRegistration,
    type EventRegistrationItem,
    type EventModuleDetail,
} from '@/features/campaign/api/events';
import type { EventRegistrationStatus } from '@/types/api';
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
        label: 'Chờ duyệt',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Clock,
    },
    APPROVED: {
        label: 'Đã duyệt',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        icon: CheckCircle2,
    },
    REJECTED: {
        label: 'Từ chối',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
    },
    CHECKED_IN: {
        label: 'Đã điểm danh',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: UserCheck,
    },
    COMPLETED: {
        label: 'Hoàn thành',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CalendarCheck,
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

export const EventManagementRoute = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [module, setModule] = useState<EventModuleDetail | null>(null);
    const [registrations, setRegistrations] = useState<EventRegistrationItem[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        EventRegistrationStatus | ''
    >('');
    const [actionId, setActionId] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const loadData = async () => {
        if (!moduleId) return;
        setIsLoading(true);
        setError(null);
        try {
            const [mod, regs] = await Promise.all([
                getEventModule(moduleId),
                getEventRegistrations(
                    moduleId,
                    statusFilter ? { status: statusFilter } : undefined,
                ),
            ]);
            setModule(mod);
            setRegistrations(regs);
        } catch {
            setError('Không thể tải dữ liệu sự kiện.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleId, statusFilter]);

    const handleApprove = async (id: string) => {
        setActionId(id);
        try {
            await approveEventRegistration(id);
            addNotification({
                type: 'success',
                title: 'Đã duyệt',
                message: 'Đơn đăng ký đã được duyệt.',
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể duyệt đơn.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectReason.trim()) return;
        setRejecting(true);
        try {
            await rejectEventRegistration(rejectId, rejectReason.trim());
            addNotification({
                type: 'success',
                title: 'Đã từ chối',
                message: 'Đơn đăng ký đã bị từ chối.',
            });
            setRejectId(null);
            setRejectReason('');
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể từ chối đơn.',
            });
        } finally {
            setRejecting(false);
        }
    };

    const handleCheckIn = async (id: string) => {
        setActionId(id);
        try {
            await checkInEventRegistration(id);
            addNotification({
                type: 'success',
                title: 'Đã điểm danh',
                message: 'Điểm danh thành công.',
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể điểm danh.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleComplete = async (id: string, hours?: number) => {
        setActionId(id);
        try {
            await completeEventRegistration(id, {
                hours: hours ?? 1,
                note: 'Hoàn thành',
            });
            addNotification({
                type: 'success',
                title: 'Hoàn thành',
                message: 'Đã hoàn thành sự kiện.',
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể hoàn thành.',
            });
        } finally {
            setActionId(null);
        }
    };

    const statuses = [
        '',
        'PENDING',
        'APPROVED',
        'CHECKED_IN',
        'COMPLETED',
        'REJECTED',
    ];
    const statusLabels: Record<string, string> = {
        '': 'Tất cả',
        PENDING: 'Chờ duyệt',
        APPROVED: 'Đã duyệt',
        CHECKED_IN: 'Đã điểm danh',
        COMPLETED: 'Hoàn thành',
        REJECTED: 'Từ chối',
    };

    return (
        <ContentLayout title="Quản lý sự kiện">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <CalendarDays className="h-6 w-6 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            {module?.title ?? 'Quản lý sự kiện'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {module?.campaign?.title ?? ''}
                            {module ? ` · ${registrations.length} đăng ký` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {statuses.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() =>
                                setStatusFilter(
                                    s as '' | EventRegistrationStatus,
                                )
                            }
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                statusFilter === s
                                    ? 'bg-[#2E5077] text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {statusLabels[s]}
                        </button>
                    ))}
                </div>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && registrations.length === 0 ? (
                    <EmptyState title="Không có đăng ký nào" />
                ) : null}

                {!isLoading && !error && registrations.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-4 py-3">Sinh viên</th>
                                    <th className="px-4 py-3">MSSV</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Đăng ký lúc</th>
                                    <th className="px-4 py-3">Ghi chú</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {registrations.map((reg) => (
                                    <tr
                                        key={reg.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {reg.student.full_name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {reg.student.student_code}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(reg.status)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(
                                                new Date(reg.registered_at),
                                            )}
                                        </td>
                                        <td className="max-w-[150px] truncate px-4 py-3 text-slate-500">
                                            {reg.review_note ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {reg.status === 'PENDING' ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                actionId ===
                                                                reg.id
                                                            }
                                                            onClick={() =>
                                                                void handleApprove(
                                                                    reg.id,
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50 disabled:opacity-40"
                                                            title="Duyệt"
                                                        >
                                                            <UserCheck className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setRejectId(
                                                                    reg.id,
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                                            title="Từ chối"
                                                        >
                                                            <UserX className="size-4" />
                                                        </button>
                                                    </>
                                                ) : null}
                                                {reg.status === 'APPROVED' ? (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionId === reg.id
                                                        }
                                                        onClick={() =>
                                                            void handleCheckIn(
                                                                reg.id,
                                                            )
                                                        }
                                                        className="rounded p-1.5 text-blue-500 hover:bg-blue-50 disabled:opacity-40"
                                                        title="Điểm danh"
                                                    >
                                                        <CalendarCheck className="size-4" />
                                                    </button>
                                                ) : null}
                                                {reg.status === 'CHECKED_IN' ? (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionId === reg.id
                                                        }
                                                        onClick={() =>
                                                            void handleComplete(
                                                                reg.id,
                                                            )
                                                        }
                                                        className="rounded p-1.5 text-green-500 hover:bg-green-50 disabled:opacity-40"
                                                        title="Hoàn thành"
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {rejectId ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-900">
                                Từ chối đăng ký
                            </h3>
                            <div className="mt-4">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Lý do từ chối
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Nhập lý do từ chối"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    onClick={handleReject}
                                    disabled={rejecting || !rejectReason.trim()}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {rejecting
                                        ? 'Đang xử lý...'
                                        : 'Xác nhận từ chối'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setRejectId(null);
                                        setRejectReason('');
                                    }}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};
