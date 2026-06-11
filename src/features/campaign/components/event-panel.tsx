import * as React from 'react';
import { Link } from 'react-router';
import { Clock3, MapPin, StopCircle, TicketCheck, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { formatLocationValue } from '@/features/locations/api/locations';
import { LocationPickerDialog } from '@/features/locations/components/location-picker-dialog';
import type { EventRegistrationItem } from '@/features/campaign/types';
import { toDisplayTitle } from '@/utils/display-text';

const formatRegistrationStatus = (status: string) => {
    switch (status) {
        case 'PENDING':
            return 'Chờ duyệt';
        case 'APPROVED':
            return 'Đã duyệt';
        case 'REJECTED':
            return 'Từ chối';
        case 'CHECKED_IN':
            return 'Đã check-in';
        case 'COMPLETED':
            return 'Hoàn thành';
        default:
            return status;
    }
};

const formatDialogDateTime = (value?: string | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return date.toLocaleString('vi-VN');
};

const getInitials = (value?: string | null) =>
    String(value ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'SV';

export interface EventConfig {
    location: string;
    quota: number;
    registration_required: boolean;
    checkin_required: boolean;
    benefits_text: string;
}

interface EventPanelProps {
    eventModuleId: string;
    modules: Array<{ id: string; title: string }>;
    config: EventConfig;
    registrations: EventRegistrationItem[];
    canMutateCampaign: boolean;
    canEditModuleContent?: boolean;
    onModuleChange: (moduleId: string) => void;
    onConfigChange: (patch: Record<string, unknown>) => void;
    onSaveConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onApproveRegistration: (registrationId: string) => void;
    onRejectRegistration: (registrationId: string) => void;
    onCheckInRegistration: (registrationId: string) => void;
    onCompleteRegistration: (registrationId: string) => void;
    onBulkApproveRegistrations?: (registrationIds: string[]) => void;
    onExtendRegistrationDeadline?: (payload: {
        end_at: string;
        reason?: string;
        notify_participants?: boolean;
    }) => void;
    onEndEarly?: (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => void;
    registrationDeadline?: string | null;
    moduleStatus?: string | null;
    countdown?: {
        value: string;
        label: string;
        urgent?: boolean;
    } | null;
    approvedCount?: number;
    managementHref?: string;
}

export const EventPanel: React.FC<EventPanelProps> = ({
    eventModuleId,
    modules,
    config,
    registrations,
    canMutateCampaign,
    canEditModuleContent = false,
    onModuleChange,
    onConfigChange,
    onSaveConfig,
    onApproveRegistration,
    onRejectRegistration,
    onCheckInRegistration,
    onCompleteRegistration,
    onBulkApproveRegistrations,
    onExtendRegistrationDeadline,
    onEndEarly,
    registrationDeadline,
    moduleStatus,
    countdown,
    approvedCount,
    managementHref,
}) => {
    const [isLocationDialogOpen, setIsLocationDialogOpen] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [studentDialog, setStudentDialog] = React.useState<EventRegistrationItem | null>(null);
    const [showExtendForm, setShowExtendForm] = React.useState(false);
    const [showEndEarlyForm, setShowEndEarlyForm] = React.useState(false);
    const [extendForm, setExtendForm] = React.useState({
        end_at: registrationDeadline ? String(registrationDeadline).slice(0, 16) : '',
        reason: '',
        notify_participants: true,
    });
    const [endEarlyForm, setEndEarlyForm] = React.useState({
        end_at: registrationDeadline ? String(registrationDeadline).slice(0, 16) : '',
        reason: '',
        note: '',
        notify_participants: true,
    });

    React.useEffect(() => {
        setSelectedIds([]);
    }, [eventModuleId]);

    React.useEffect(() => {
        setExtendForm((current) => ({
            ...current,
            end_at: registrationDeadline ? String(registrationDeadline).slice(0, 16) : '',
        }));
        setEndEarlyForm((current) => ({
            ...current,
            end_at: registrationDeadline ? String(registrationDeadline).slice(0, 16) : '',
        }));
    }, [registrationDeadline]);

    const pendingRegistrations = registrations.filter(
        (registration) => registration.status === 'PENDING',
    );
    const checkedInCount = registrations.filter(
        (registration) => registration.status === 'CHECKED_IN',
    ).length;
    const completedCount = registrations.filter(
        (registration) => registration.status === 'COMPLETED',
    ).length;
    const totalApprovedCount = approvedCount ?? 0;
    const canExtendRegistration =
        canMutateCampaign &&
        Boolean(onExtendRegistrationDeadline) &&
        moduleStatus !== 'ENDED';
    const canEndVolunteerEarly =
        canMutateCampaign &&
        Boolean(onEndEarly) &&
        moduleStatus !== 'ENDED';

    const toggleSelection = (registrationId: string) => {
        setSelectedIds((current) =>
            current.includes(registrationId)
                ? current.filter((id) => id !== registrationId)
                : [...current, registrationId],
        );
    };

    const toggleSelectAllPending = () => {
        setSelectedIds((current) =>
            current.length === pendingRegistrations.length
                ? []
                : pendingRegistrations.map((registration) => registration.id),
        );
    };

    const handleBulkApprove = () => {
        if (!onBulkApproveRegistrations || selectedIds.length === 0) return;
        const confirmed = window.confirm(
            `Duyệt ${selectedIds.length} đăng ký tình nguyện viên đã chọn?`,
        );
        if (!confirmed) return;
        onBulkApproveRegistrations(selectedIds);
        setSelectedIds([]);
    };

    const handleExtendDeadline = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!onExtendRegistrationDeadline || !extendForm.end_at) return;
        onExtendRegistrationDeadline({
            end_at: new Date(extendForm.end_at).toISOString(),
            reason: extendForm.reason.trim() || undefined,
            notify_participants: extendForm.notify_participants,
        });
        setShowExtendForm(false);
    };

    const handleEndEarly = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!onEndEarly) return;
        onEndEarly({
            end_at: endEarlyForm.end_at
                ? new Date(endEarlyForm.end_at).toISOString()
                : undefined,
            reason: endEarlyForm.reason.trim() || undefined,
            note: endEarlyForm.note.trim() || undefined,
            notify_participants: endEarlyForm.notify_participants,
        });
        setShowEndEarlyForm(false);
    };

    return (
        <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <TicketCheck className="size-4 text-blue-700" />
                    <h4 className="text-sm font-semibold text-slate-900">
                        Tuyển tình nguyện viên
                    </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canExtendRegistration ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowExtendForm((value) => !value)}
                        >
                            Gia hạn đăng ký
                        </Button>
                    ) : null}
                    {canEndVolunteerEarly ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEndEarlyForm((value) => !value)}
                        >
                            <StopCircle className="size-4" />
                            Kết thúc sớm hạng mục
                        </Button>
                    ) : null}
                    {managementHref ? (
                        <Link
                            to={managementHref}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            Mở trang quản lý tình nguyện viên
                        </Link>
                    ) : null}
                </div>
            </div>

            {countdown ? (
                <div
                    className={`rounded-lg border px-4 py-3 ${
                        countdown.urgent
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-slate-200 bg-slate-50'
                    }`}
                >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <Clock3 className="size-4" />
                        Đồng hồ đăng ký
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{countdown.value}</div>
                    <div className="mt-1 text-sm text-slate-600">{countdown.label}</div>
                    {countdown.urgent ? (
                        <div className="mt-2 text-sm font-medium text-amber-700">Sắp hết hạn</div>
                    ) : null}
                </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Đã duyệt / đủ điều kiện
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                        {totalApprovedCount}
                    </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Chờ duyệt
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{pendingRegistrations.length}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Check-in / hoàn thành
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                        {checkedInCount} / {completedCount}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        Chỉ tiêu: {config.quota || 0} sinh viên
                    </div>
                </div>
            </div>

            <select
                value={eventModuleId}
                onChange={(event) => onModuleChange(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
                <option value="">Chọn hạng mục tuyển tình nguyện viên</option>
                {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                        {toDisplayTitle(module.title)}
                    </option>
                ))}
            </select>

            {eventModuleId && canEditModuleContent ? (
                <form
                    onSubmit={onSaveConfig}
                    className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                    <div className="grid gap-2">
                        <Input
                            placeholder="Địa điểm"
                            value={config.location}
                            onChange={(event) =>
                                onConfigChange({ location: event.target.value })
                            }
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsLocationDialogOpen(true)}
                            >
                                <MapPin className="size-4" strokeWidth={1.75} />
                                Chọn trên bản đồ
                            </Button>
                            <span className="text-xs leading-5 text-slate-500">
                                Đồng bộ địa điểm hoạt động với bản đồ và trang công khai.
                            </span>
                        </div>
                    </div>

                    <Input
                        type="number"
                        placeholder="Số lượng cần tuyển"
                        value={config.quota || ''}
                        onChange={(event) =>
                            onConfigChange({
                                quota: Number(event.target.value || 0),
                            })
                        }
                    />

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.registration_required}
                            onChange={(event) =>
                                onConfigChange({
                                    registration_required: event.target.checked,
                                })
                            }
                        />
                        Cần duyệt đăng ký
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.checkin_required}
                            onChange={(event) =>
                                onConfigChange({
                                    checkin_required: event.target.checked,
                                })
                            }
                        />
                        Bắt buộc check-in
                    </label>

                    <textarea
                        rows={3}
                        value={config.benefits_text}
                        onChange={(event) =>
                            onConfigChange({
                                benefits_text: event.target.value,
                            })
                        }
                        placeholder="Mỗi quyền lợi một dòng"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />

                    <Button type="submit">Lưu cấu hình tuyển tình nguyện viên</Button>
                </form>
            ) : null}

            {showExtendForm && onExtendRegistrationDeadline ? (
                <form
                    onSubmit={handleExtendDeadline}
                    className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                    <Input
                        type="datetime-local"
                        value={extendForm.end_at}
                        onChange={(event) =>
                            setExtendForm((current) => ({
                                ...current,
                                end_at: event.target.value,
                            }))
                        }
                    />
                    <textarea
                        rows={3}
                        value={extendForm.reason}
                        onChange={(event) =>
                            setExtendForm((current) => ({
                                ...current,
                                reason: event.target.value,
                            }))
                        }
                        placeholder="Lý do gia hạn"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={extendForm.notify_participants}
                            onChange={(event) =>
                                setExtendForm((current) => ({
                                    ...current,
                                    notify_participants: event.target.checked,
                                }))
                            }
                        />
                        Gửi thông báo cho sinh viên liên quan
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit">Lưu gia hạn</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowExtendForm(false)}
                        >
                            Đóng
                        </Button>
                    </div>
                </form>
            ) : null}

            {showEndEarlyForm && onEndEarly ? (
                <form
                    onSubmit={handleEndEarly}
                    className="grid gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3"
                >
                    <Input
                        type="datetime-local"
                        value={endEarlyForm.end_at}
                        onChange={(event) =>
                            setEndEarlyForm((current) => ({
                                ...current,
                                end_at: event.target.value,
                            }))
                        }
                    />
                    <textarea
                        rows={3}
                        value={endEarlyForm.reason}
                        onChange={(event) =>
                            setEndEarlyForm((current) => ({
                                ...current,
                                reason: event.target.value,
                            }))
                        }
                        placeholder="Lý do kết thúc sớm"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <textarea
                        rows={2}
                        value={endEarlyForm.note}
                        onChange={(event) =>
                            setEndEarlyForm((current) => ({
                                ...current,
                                note: event.target.value,
                            }))
                        }
                        placeholder="Ghi chú vận hành"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={endEarlyForm.notify_participants}
                            onChange={(event) =>
                                setEndEarlyForm((current) => ({
                                    ...current,
                                    notify_participants: event.target.checked,
                                }))
                            }
                        />
                        Gửi thông báo cho sinh viên liên quan
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit">Xác nhận kết thúc sớm</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEndEarlyForm(false)}
                        >
                            Đóng
                        </Button>
                    </div>
                </form>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div>
                        <h5 className="text-sm font-semibold text-slate-900">
                            Danh sách sinh viên đăng ký
                        </h5>
                        <p className="text-xs text-slate-500">
                            Chọn từng sinh viên để mở hộp thoại chi tiết.
                        </p>
                    </div>
                    {onBulkApproveRegistrations ? (
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={pendingRegistrations.length === 0}
                                onClick={toggleSelectAllPending}
                            >
                                {selectedIds.length === pendingRegistrations.length
                                    ? 'Bỏ chọn tất cả'
                                    : 'Chọn toàn bộ chờ duyệt'}
                            </Button>
                            <Button
                                type="button"
                                disabled={selectedIds.length === 0}
                                onClick={handleBulkApprove}
                            >
                                Duyệt hàng loạt
                            </Button>
                        </div>
                    ) : null}
                </div>
                <div className="hidden grid-cols-[40px_minmax(0,1.6fr)_minmax(0,1fr)_160px_170px_190px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
                    <div />
                    <div>Sinh viên</div>
                    <div>Khoa / lớp</div>
                    <div>Trạng thái</div>
                    <div>Thời gian đăng ký</div>
                    <div>Duyệt / check-in</div>
                </div>
                <div className="divide-y divide-slate-200">
                    {registrations.map((registration) => (
                        <div key={registration.id} className="p-4">
                            <div className="hidden grid-cols-[40px_minmax(0,1.6fr)_minmax(0,1fr)_160px_170px_190px] gap-3 lg:grid lg:items-start">
                                <div className="pt-1">
                                    {registration.status === 'PENDING' && onBulkApproveRegistrations ? (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(registration.id)}
                                            onChange={() => toggleSelection(registration.id)}
                                            className="mt-1"
                                        />
                                    ) : <span />}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStudentDialog(registration)}
                                    className="text-left"
                                >
                                    <div className="text-sm font-semibold text-slate-900">
                                        {registration.student.full_name}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">
                                        MSSV: {registration.student.student_code}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {registration.student.email}
                                    </div>
                                </button>
                                <div className="text-sm text-slate-700">
                                    <div>{registration.student.faculty_name || 'Chưa cập nhật'}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {registration.student.class_name || 'Chưa có lớp'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <StatusBadge status={registration.status} />
                                    <div className="text-xs text-slate-500">
                                        {formatRegistrationStatus(registration.status)}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700">
                                    {new Date(registration.registered_at).toLocaleString('vi-VN')}
                                </div>
                                <div className="space-y-1 text-xs text-slate-600">
                                    <div>
                                        {registration.reviewed_at
                                            ? `Duyệt lúc ${new Date(registration.reviewed_at).toLocaleString('vi-VN')}`
                                            : 'Chưa duyệt'}
                                    </div>
                                    <div>
                                        {registration.checked_in_at
                                            ? `Check-in ${new Date(registration.checked_in_at).toLocaleString('vi-VN')}`
                                            : 'Chưa check-in'}
                                    </div>
                                    <div>
                                        {registration.checked_out_at
                                            ? `Hoàn thành ${new Date(registration.checked_out_at).toLocaleString('vi-VN')}`
                                            : 'Chưa hoàn thành'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 lg:hidden">
                                <div className="flex gap-3">
                                    {registration.status === 'PENDING' && onBulkApproveRegistrations ? (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(registration.id)}
                                            onChange={() => toggleSelection(registration.id)}
                                            className="mt-1"
                                        />
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => setStudentDialog(registration)}
                                        className="text-left"
                                    >
                                        <div className="text-sm font-semibold text-slate-900">
                                            {registration.student.full_name}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600">
                                            {registration.student.student_code} · {registration.student.email}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {registration.student.faculty_name || 'Chưa có khoa'}
                                            {registration.student.class_name
                                                ? ` · ${registration.student.class_name}`
                                                : ''}
                                        </div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <StatusBadge status={registration.status} />
                                    <div className="text-xs text-slate-500">
                                        {new Date(registration.registered_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStudentDialog(registration)}
                                >
                                    <UserRound className="size-4" />
                                    Xem hồ sơ
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || registration.status !== 'PENDING'}
                                    onClick={() => void onApproveRegistration(registration.id)}
                                >
                                    Duyệt
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || !['PENDING', 'APPROVED'].includes(registration.status)}
                                    onClick={() => void onRejectRegistration(registration.id)}
                                >
                                    Từ chối
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || registration.status !== 'APPROVED'}
                                    onClick={() => void onCheckInRegistration(registration.id)}
                                >
                                    Check-in
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || !['APPROVED', 'CHECKED_IN'].includes(registration.status)}
                                    onClick={() => void onCompleteRegistration(registration.id)}
                                >
                                    Hoàn thành
                                </Button>
                            </div>
                        </div>
                    ))}
                    {registrations.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">Chưa có sinh viên đăng ký.</div>
                    ) : null}
                </div>
            </div>

            <LocationPickerDialog
                open={isLocationDialogOpen}
                onOpenChange={setIsLocationDialogOpen}
                currentValue={config.location}
                onSelectLocation={(location) =>
                    onConfigChange({
                        location: formatLocationValue(location),
                    })
                }
            />

            <Dialog open={Boolean(studentDialog)} onOpenChange={(open) => !open && setStudentDialog(null)}>
                <DialogContent className="max-w-5xl border-slate-200 p-0">
                    <DialogTitle className="sr-only">Hồ sơ sinh viên</DialogTitle>
                    {studentDialog ? (
                        <div className="overflow-hidden rounded-[28px] bg-white">
                            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_52%,#ffffff_100%)] px-7 py-6">
                                <div className="pr-12">
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Hồ sơ sinh viên
                                    </div>
                                    <div className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-950">
                                        {studentDialog.student.full_name}
                                    </div>
                                    <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                        Theo dõi thông tin đăng ký, trạng thái tham gia và dữ liệu vận hành của sinh viên trong module này.
                                    </DialogDescription>
                                </div>
                                <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-18 w-18 items-center justify-center rounded-[22px] bg-slate-950 text-xl font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)]">
                                            {getInitials(studentDialog.student.full_name)}
                                        </div>
                                        <div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                                                    {studentDialog.student.student_code}
                                                </span>
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                                    {studentDialog.student.email || 'Chưa có email'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={studentDialog.status} />
                                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                            {formatRegistrationStatus(studentDialog.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-5 p-7 text-sm text-slate-700">
                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Khoa / lớp
                                        </div>
                                        <div className="mt-4 text-lg font-semibold text-slate-900">
                                            {studentDialog.student.faculty_name || 'Chưa cập nhật'}
                                        </div>
                                        <div className="mt-2 text-sm text-slate-600">
                                            {studentDialog.student.class_name || 'Chưa cập nhật lớp'}
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Điểm và danh hiệu
                                        </div>
                                        <div className="mt-4 text-lg font-semibold text-slate-900">
                                            {studentDialog.student.total_points ?? 0} điểm
                                        </div>
                                        <div className="mt-2 text-sm text-slate-600">
                                            {(studentDialog.student.titles ?? []).join(', ') ||
                                                'Chưa có danh hiệu'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Trạng thái hiện tại
                                        </div>
                                        <span className="text-xs text-slate-500">
                                            Đăng ký lúc {formatDialogDateTime(studentDialog.registered_at)}
                                        </span>
                                    </div>
                                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="text-xs font-medium text-slate-500">
                                                Trạng thái duyệt
                                            </div>
                                            <div className="mt-2 font-semibold text-slate-900">
                                                {formatRegistrationStatus(studentDialog.status)}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="text-xs font-medium text-slate-500">
                                                Check-in
                                            </div>
                                            <div className="mt-2 font-semibold text-slate-900">
                                                {formatDialogDateTime(studentDialog.checked_in_at)}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="text-xs font-medium text-slate-500">
                                                Hoàn thành
                                            </div>
                                            <div className="mt-2 font-semibold text-slate-900">
                                                {formatDialogDateTime(studentDialog.checked_out_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="text-xs font-medium text-slate-500">
                                                Số giờ tham gia
                                            </div>
                                            <div className="mt-2 font-semibold text-slate-900">
                                                {studentDialog.hours != null
                                                    ? `${studentDialog.hours} giờ`
                                                    : 'Chưa cập nhật'}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="text-xs font-medium text-slate-500">
                                                Ghi chú duyệt
                                            </div>
                                            <div className="mt-2 text-slate-700">
                                                {studentDialog.review_note || 'Chưa có ghi chú duyệt'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {studentDialog.answers &&
                                Object.keys(studentDialog.answers).length > 0 ? (
                                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Thông tin đăng ký bổ sung
                                        </div>
                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            {Object.entries(studentDialog.answers).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                                >
                                                    <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                                                        {key}
                                                    </div>
                                                    <div className="mt-2 text-sm text-slate-800">
                                                        {typeof value === 'string'
                                                            ? value
                                                            : JSON.stringify(value)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex justify-end border-t border-slate-200 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-w-32"
                                        onClick={() => setStudentDialog(null)}
                                    >
                                        Đóng hồ sơ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};
