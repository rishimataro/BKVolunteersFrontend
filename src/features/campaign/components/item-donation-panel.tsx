import * as React from 'react';
import { Clock3, HandHelping, PackageSearch, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { toDisplayTitle } from '@/utils/display-text';
import type { ItemTargetItem, ItemPledgeItem } from '@/features/campaign/types';

export interface ItemConfig {
    receiver_address: string;
    receiver_contact: string;
    allow_over_target: boolean;
    handover_note: string;
}

export interface ItemTargetForm {
    name: string;
    unit: string;
    target_quantity: number;
    description: string;
}

interface EditableItemTargetForm extends ItemTargetForm {
    status: 'ACTIVE' | 'CLOSED';
}

interface ItemDonationPanelProps {
    itemModuleId: string;
    modules: Array<{ id: string; title: string }>;
    config: ItemConfig;
    targetForm: ItemTargetForm;
    targets: ItemTargetItem[];
    pledges: ItemPledgeItem[];
    canMutateCampaign: boolean;
    canEditModuleContent?: boolean;
    onModuleChange: (moduleId: string) => void;
    onConfigChange: (patch: Record<string, unknown>) => void;
    onSaveConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onTargetFormChange: (patch: Record<string, unknown>) => void;
    onCreateTarget: (event: React.FormEvent<HTMLFormElement>) => void;
    onUpdateTarget: (
        targetId: string,
        payload: EditableItemTargetForm,
    ) => Promise<void>;
    onDeleteTarget: (targetId: string) => Promise<void>;
    onConfirmPledge: (pledgeId: string) => void;
    onRejectPledge: (pledgeId: string) => void;
    onHandoverPledge: (
        pledgeId: string,
        payload: {
            received_quantity: number;
            received_at?: string;
            note?: string;
        },
    ) => void;
    onExtendDeadline?: (payload: {
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
    moduleEndAt?: string | null;
    moduleStatus?: string | null;
    countdown?: {
        value: string;
        label: string;
        urgent?: boolean;
    } | null;
}

export const ItemDonationPanel: React.FC<ItemDonationPanelProps> = ({
    itemModuleId,
    modules,
    config,
    targetForm,
    targets,
    pledges,
    canMutateCampaign,
    canEditModuleContent = false,
    onModuleChange,
    onConfigChange,
    onSaveConfig,
    onTargetFormChange,
    onCreateTarget,
    onUpdateTarget,
    onDeleteTarget,
    onConfirmPledge,
    onRejectPledge,
    onHandoverPledge,
    onExtendDeadline,
    onEndEarly,
    moduleEndAt,
    moduleStatus,
    countdown,
}) => {
    const [editingTargetId, setEditingTargetId] = React.useState<string | null>(null);
    const [editingTargetForm, setEditingTargetForm] = React.useState<EditableItemTargetForm | null>(null);
    const [pledgeDialog, setPledgeDialog] = React.useState<ItemPledgeItem | null>(null);
    const [handoverDialog, setHandoverDialog] = React.useState<ItemPledgeItem | null>(null);
    const [showExtendForm, setShowExtendForm] = React.useState(false);
    const [showEndEarlyForm, setShowEndEarlyForm] = React.useState(false);
    const [extendForm, setExtendForm] = React.useState({
        end_at: '',
        reason: '',
        notify_participants: true,
    });
    const [endEarlyForm, setEndEarlyForm] = React.useState({
        end_at: '',
        reason: '',
        note: '',
        notify_participants: true,
    });
    const [handoverForm, setHandoverForm] = React.useState({
        received_quantity: '',
        received_at: '',
        actual_item_name: '',
        condition_note: '',
        note: '',
    });

    const canExtendItemCollection =
        canMutateCampaign &&
        Boolean(onExtendDeadline) &&
        moduleStatus !== 'ENDED';
    const canEndItemEarly =
        canMutateCampaign &&
        Boolean(onEndEarly) &&
        moduleStatus !== 'ENDED';

    React.useEffect(() => {
        setExtendForm((current) => ({
            ...current,
            end_at: moduleEndAt ? String(moduleEndAt).slice(0, 16) : '',
        }));
        setEndEarlyForm((current) => ({
            ...current,
            end_at: moduleEndAt ? String(moduleEndAt).slice(0, 16) : '',
        }));
    }, [moduleEndAt]);

    const startEditingTarget = (target: ItemTargetItem) => {
        setEditingTargetId(target.id);
        setEditingTargetForm({
            name: target.name,
            unit: target.unit,
            target_quantity: target.target_quantity,
            description: target.description ?? '',
            status: target.status,
        });
    };

    const resetEditingTarget = () => {
        setEditingTargetId(null);
        setEditingTargetForm(null);
    };

    const submitEditingTarget = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!editingTargetId || !editingTargetForm) return;
        await onUpdateTarget(editingTargetId, editingTargetForm);
        resetEditingTarget();
    };

    const removeTarget = async (target: ItemTargetItem) => {
        const confirmed = window.confirm(
            `Xóa nhu cầu "${target.name}" khỏi chiến dịch?`,
        );
        if (!confirmed) return;
        await onDeleteTarget(target.id);
        if (editingTargetId === target.id) {
            resetEditingTarget();
        }
    };

    const handleExtend = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!onExtendDeadline || !extendForm.end_at) return;
        onExtendDeadline({
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

    const openHandoverDialog = (pledge: ItemPledgeItem) => {
        setHandoverDialog(pledge);
        setHandoverForm({
            received_quantity: String(pledge.quantity),
            received_at: '',
            actual_item_name: pledge.item_target.name,
            condition_note: '',
            note: pledge.note ?? '',
        });
    };

    const submitHandoverDialog = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!handoverDialog) return;
        const parsedQuantity = Number(handoverForm.received_quantity);
        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            return;
        }

        const noteParts = [
            handoverForm.actual_item_name.trim()
                ? `Loại thực nhận: ${handoverForm.actual_item_name.trim()}`
                : '',
            handoverForm.condition_note.trim()
                ? `Tình trạng hiện vật: ${handoverForm.condition_note.trim()}`
                : '',
            handoverForm.note.trim() ? `Ghi chú: ${handoverForm.note.trim()}` : '',
        ].filter(Boolean);

        onHandoverPledge(handoverDialog.id, {
            received_quantity: parsedQuantity,
            received_at: handoverForm.received_at
                ? new Date(handoverForm.received_at).toISOString()
                : undefined,
            note: noteParts.length > 0 ? noteParts.join(' | ') : undefined,
        });
        setHandoverDialog(null);
    };

    return (
        <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <HandHelping className="size-4 text-blue-700" />
                    <h4 className="text-sm font-semibold text-slate-900">
                        Quyên góp hiện vật
                    </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canExtendItemCollection ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowExtendForm((value) => !value)}
                        >
                            Gia hạn tiếp nhận
                        </Button>
                    ) : null}
                    {canEndItemEarly ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEndEarlyForm((value) => !value)}
                        >
                            <StopCircle className="size-4" />
                            Kết thúc sớm hạng mục
                        </Button>
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
                        Đồng hồ tiếp nhận
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{countdown.value}</div>
                    <div className="mt-1 text-sm text-slate-600">{countdown.label}</div>
                    {countdown.urgent ? (
                        <div className="mt-2 text-sm font-medium text-amber-700">Sắp hết hạn</div>
                    ) : null}
                </div>
            ) : null}

            <select
                value={itemModuleId}
                onChange={(event) => onModuleChange(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
                <option value="">Chọn hạng mục hiện vật</option>
                {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                        {toDisplayTitle(module.title)}
                    </option>
                ))}
            </select>
            {itemModuleId && canEditModuleContent ? (
                <form
                    onSubmit={onSaveConfig}
                    className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                    <Input
                        placeholder="Địa chỉ tiếp nhận"
                        value={config.receiver_address}
                        onChange={(event) =>
                            onConfigChange({
                                receiver_address: event.target.value,
                            })
                        }
                    />
                    <Input
                        placeholder="Liên hệ tiếp nhận"
                        value={config.receiver_contact}
                        onChange={(event) =>
                            onConfigChange({
                                receiver_contact: event.target.value,
                            })
                        }
                    />
                    <Input
                        placeholder="Ghi chú bàn giao"
                        value={config.handover_note}
                        onChange={(event) =>
                            onConfigChange({
                                handover_note: event.target.value,
                            })
                        }
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.allow_over_target}
                            onChange={(event) =>
                                onConfigChange({
                                    allow_over_target: event.target.checked,
                                })
                            }
                        />
                        Cho phép vượt mục tiêu
                    </label>
                    <Button type="submit">Lưu cấu hình hiện vật</Button>
                </form>
            ) : null}

            {showExtendForm && onExtendDeadline ? (
                <form
                    onSubmit={handleExtend}
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

            {itemModuleId && canEditModuleContent ? (
                <form
                    onSubmit={onCreateTarget}
                    className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                    <h5 className="text-sm font-semibold text-slate-900">
                        Thêm nhu cầu hiện vật
                    </h5>
                    <Input
                        placeholder="Tên vật phẩm"
                        value={targetForm.name}
                        onChange={(event) =>
                            onTargetFormChange({ name: event.target.value })
                        }
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            placeholder="Đơn vị"
                            value={targetForm.unit}
                            onChange={(event) =>
                                onTargetFormChange({ unit: event.target.value })
                            }
                        />
                        <Input
                            type="number"
                            placeholder="Số lượng mục tiêu"
                            value={targetForm.target_quantity || ''}
                            onChange={(event) =>
                                onTargetFormChange({
                                    target_quantity: Number(
                                        event.target.value || 0,
                                    ),
                                })
                            }
                        />
                    </div>
                    <Input
                        placeholder="Mô tả"
                        value={targetForm.description}
                        onChange={(event) =>
                            onTargetFormChange({
                                description: event.target.value,
                            })
                        }
                    />
                    <Button type="submit">Thêm nhu cầu</Button>
                </form>
            ) : null}
            <div className="space-y-2">
                {targets.map((target) => {
                    const isEditing = editingTargetId === target.id;

                    return (
                        <div
                            key={target.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {target.name}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                            {target.received_quantity}/
                                            {target.target_quantity}{' '}
                                            {target.unit}
                                        </span>
                                        <StatusBadge status={target.status} />
                                        <span className="text-xs text-slate-600">
                                            Còn lại {target.remaining_quantity}{' '}
                                            {target.unit}
                                        </span>
                                    </div>
                                </div>
                                {canEditModuleContent ? (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => startEditingTarget(target)}
                                        >
                                            Sửa
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => void removeTarget(target)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                            {target.description ? (
                                <p className="mt-2 text-sm text-slate-600">
                                    {target.description}
                                </p>
                            ) : null}
                            {isEditing && editingTargetForm && canEditModuleContent ? (
                                <form onSubmit={submitEditingTarget} className="mt-3 grid gap-3">
                                    <Input
                                        value={editingTargetForm.name}
                                        onChange={(event) =>
                                            setEditingTargetForm((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          name: event.target.value,
                                                      }
                                                    : current,
                                            )
                                        }
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            value={editingTargetForm.unit}
                                            onChange={(event) =>
                                                setEditingTargetForm((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              unit: event.target.value,
                                                          }
                                                        : current,
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            value={editingTargetForm.target_quantity || ''}
                                            onChange={(event) =>
                                                setEditingTargetForm((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              target_quantity: Number(
                                                                  event.target.value || 0,
                                                              ),
                                                          }
                                                        : current,
                                                )
                                            }
                                        />
                                    </div>
                                    <Input
                                        value={editingTargetForm.description}
                                        onChange={(event) =>
                                            setEditingTargetForm((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          description: event.target.value,
                                                      }
                                                    : current,
                                            )
                                        }
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit">Lưu</Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetEditingTarget}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </form>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                    <h5 className="text-sm font-semibold text-slate-900">
                        Danh sách sinh viên đăng ký quyên góp
                    </h5>
                </div>
                <div className="hidden grid-cols-[minmax(0,1.2fr)_130px_170px_minmax(0,1fr)_120px_140px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
                    <div>Sinh viên / MSSV</div>
                    <div>Khoa / lớp</div>
                    <div>Ngày đăng ký</div>
                    <div>Hiện vật dự kiến</div>
                    <div>Số lượng</div>
                    <div>Trạng thái</div>
                </div>
                <div className="divide-y divide-slate-200">
                    {pledges.map((pledge) => (
                        <div key={pledge.id} className="p-4">
                            <div className="hidden grid-cols-[minmax(0,1.2fr)_130px_170px_minmax(0,1fr)_120px_140px] gap-3 lg:grid lg:items-start">
                                <button
                                    type="button"
                                    className="text-left"
                                    onClick={() => setPledgeDialog(pledge)}
                                >
                                    <div className="text-sm font-semibold text-slate-900">
                                        {pledge.student.full_name}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">
                                        MSSV: {pledge.student.student_code}
                                    </div>
                                </button>
                                <div className="text-sm text-slate-700">
                                    <div>{pledge.student.faculty_name || 'Chưa cập nhật'}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {pledge.student.class_name || 'Chưa có lớp'}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700">
                                    {new Date(pledge.created_at).toLocaleString('vi-VN')}
                                </div>
                                <div className="text-sm text-slate-700">
                                    <div>{pledge.item_target.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {pledge.note || 'Không có ghi chú'}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-slate-900">
                                    {pledge.quantity} {pledge.item_target.unit}
                                </div>
                                <div>
                                    <StatusBadge status={pledge.status} />
                                </div>
                            </div>
                            <div className="space-y-3 lg:hidden">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <button
                                        type="button"
                                        className="text-left"
                                        onClick={() => setPledgeDialog(pledge)}
                                    >
                                        <div className="text-sm font-semibold text-slate-900">
                                            {pledge.student.full_name}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600">
                                            {pledge.student.student_code}
                                            {pledge.student.faculty_name
                                                ? ` · ${pledge.student.faculty_name}`
                                                : ''}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {pledge.item_target.name} · {pledge.quantity} {pledge.item_target.unit}
                                        </div>
                                    </button>
                                    <StatusBadge status={pledge.status} />
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPledgeDialog(pledge)}
                                >
                                    <PackageSearch className="size-4" />
                                    Xem chi tiết
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || pledge.status !== 'PLEDGED'}
                                    onClick={() => void onConfirmPledge(pledge.id)}
                                >
                                    Xác nhận đăng ký
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || !['PLEDGED', 'CONFIRMED'].includes(pledge.status)}
                                    onClick={() => void onRejectPledge(pledge.id)}
                                >
                                    Từ chối
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canMutateCampaign || pledge.status === 'RECEIVED'}
                                    onClick={() => openHandoverDialog(pledge)}
                                >
                                    Ghi nhận đã nhận
                                </Button>
                            </div>
                        </div>
                    ))}
                    {pledges.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">Chưa có đăng ký quyên góp hiện vật.</div>
                    ) : null}
                </div>
            </div>

            <Dialog open={Boolean(pledgeDialog)} onOpenChange={(open) => !open && setPledgeDialog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle>Chi tiết quyên góp hiện vật</DialogTitle>
                    <DialogDescription>
                        Phân biệt thông tin đăng ký dự kiến và hiện vật thực tế đã tiếp nhận.
                    </DialogDescription>
                    {pledgeDialog ? (
                        <div className="grid gap-3 text-sm text-slate-700">
                            <div className="text-lg font-semibold text-slate-900">
                                {pledgeDialog.student.full_name}
                            </div>
                            <div className="text-slate-600">
                                {pledgeDialog.student.student_code}
                                {pledgeDialog.student.faculty_name
                                    ? ` · ${pledgeDialog.student.faculty_name}`
                                    : ''}
                                {pledgeDialog.student.class_name
                                    ? ` · ${pledgeDialog.student.class_name}`
                                    : ''}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                        Đăng ký dự kiến
                                    </div>
                                    <div className="mt-2 text-slate-900">
                                        {pledgeDialog.item_target.name} · {pledgeDialog.quantity} {pledgeDialog.item_target.unit}
                                    </div>
                                    <div className="mt-1 text-slate-600">
                                        {pledgeDialog.note || 'Không có ghi chú'}
                                    </div>
                                    <div className="mt-1 text-slate-600">
                                        Đăng ký lúc {new Date(pledgeDialog.created_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                        Thực tế đã tiếp nhận
                                    </div>
                                    <div className="mt-2 text-slate-900">
                                        {pledgeDialog.received_quantity != null
                                            ? `${pledgeDialog.received_quantity} ${pledgeDialog.item_target.unit}`
                                            : 'Chưa tiếp nhận'}
                                    </div>
                                    <div className="mt-1 text-slate-600">
                                        {pledgeDialog.received_at
                                            ? `Lúc ${new Date(pledgeDialog.received_at).toLocaleString('vi-VN')}`
                                            : 'Chưa có thời điểm tiếp nhận'}
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    Liên hệ sinh viên
                                </div>
                                <div className="mt-2 text-slate-900">
                                    {pledgeDialog.student.email || 'Chưa có email'}
                                </div>
                                <div className="mt-1 text-slate-600">
                                    {pledgeDialog.student.phone || 'Chưa có số điện thoại'}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(handoverDialog)}
                onOpenChange={(open) => !open && setHandoverDialog(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogTitle>Ghi nhận tiếp nhận hiện vật</DialogTitle>
                    <DialogDescription>
                        Cập nhật số lượng thực nhận và ghi chú nghiệp vụ cho lần tiếp nhận này.
                    </DialogDescription>
                    {handoverDialog ? (
                        <form onSubmit={submitHandoverDialog} className="grid gap-3">
                            <Input
                                value={handoverForm.actual_item_name}
                                onChange={(event) =>
                                    setHandoverForm((current) => ({
                                        ...current,
                                        actual_item_name: event.target.value,
                                    }))
                                }
                                placeholder="Loại hiện vật thực nhận"
                            />
                            <Input
                                type="number"
                                min={1}
                                value={handoverForm.received_quantity}
                                onChange={(event) =>
                                    setHandoverForm((current) => ({
                                        ...current,
                                        received_quantity: event.target.value,
                                    }))
                                }
                                placeholder="Số lượng thực nhận"
                            />
                            <Input
                                type="datetime-local"
                                value={handoverForm.received_at}
                                onChange={(event) =>
                                    setHandoverForm((current) => ({
                                        ...current,
                                        received_at: event.target.value,
                                    }))
                                }
                            />
                            <Input
                                value={handoverForm.condition_note}
                                onChange={(event) =>
                                    setHandoverForm((current) => ({
                                        ...current,
                                        condition_note: event.target.value,
                                    }))
                                }
                                placeholder="Tình trạng hiện vật"
                            />
                            <textarea
                                rows={3}
                                value={handoverForm.note}
                                onChange={(event) =>
                                    setHandoverForm((current) => ({
                                        ...current,
                                        note: event.target.value,
                                    }))
                                }
                                placeholder="Ghi chú tiếp nhận"
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            />
                            <div className="flex gap-2">
                                <Button type="submit">Lưu tiếp nhận</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setHandoverDialog(null)}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </form>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};
