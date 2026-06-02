import * as React from 'react';
import { HandHelping } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    onHandoverPledge: (pledgeId: string, quantity: number) => void;
}

export const ItemDonationPanel: React.FC<ItemDonationPanelProps> = ({
    itemModuleId,
    modules,
    config,
    targetForm,
    targets,
    pledges,
    canMutateCampaign,
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
}) => {
    const [editingTargetId, setEditingTargetId] = React.useState<string | null>(
        null,
    );
    const [editingTargetForm, setEditingTargetForm] =
        React.useState<EditableItemTargetForm | null>(null);

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

    return (
        <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
                <HandHelping className="size-4 text-blue-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                    Vận hành hiện vật
                </h4>
            </div>
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
            {itemModuleId && canMutateCampaign ? (
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
            {itemModuleId && canMutateCampaign ? (
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
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                target.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {target.status === 'ACTIVE'
                                                ? 'Đang mở'
                                                : 'Đã đóng'}
                                        </span>
                                        <span className="text-xs text-slate-600">
                                            Còn lại {target.remaining_quantity}{' '}
                                            {target.unit}
                                        </span>
                                    </div>
                                    {target.description ? (
                                        <p className="text-xs text-slate-600">
                                            {target.description}
                                        </p>
                                    ) : null}
                                </div>
                                {canMutateCampaign ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                isEditing
                                                    ? resetEditingTarget()
                                                    : startEditingTarget(target)
                                            }
                                        >
                                            {isEditing ? 'Đóng' : 'Sửa'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                void removeTarget(target)
                                            }
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                            {isEditing && editingTargetForm ? (
                                <form
                                    onSubmit={(event) =>
                                        void submitEditingTarget(event)
                                    }
                                    className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                >
                                    <Input
                                        placeholder="Tên vật phẩm"
                                        value={editingTargetForm.name}
                                        onChange={(event) =>
                                            setEditingTargetForm((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          name: event.target
                                                              .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            placeholder="Đơn vị"
                                            value={editingTargetForm.unit}
                                            onChange={(event) =>
                                                setEditingTargetForm(
                                                    (current) =>
                                                        current
                                                            ? {
                                                                  ...current,
                                                                  unit: event
                                                                      .target
                                                                      .value,
                                                              }
                                                            : current,
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Số lượng mục tiêu"
                                            value={
                                                editingTargetForm.target_quantity ||
                                                ''
                                            }
                                            onChange={(event) =>
                                                setEditingTargetForm(
                                                    (current) =>
                                                        current
                                                            ? {
                                                                  ...current,
                                                                  target_quantity:
                                                                      Number(
                                                                          event
                                                                              .target
                                                                              .value ||
                                                                              0,
                                                                      ),
                                                              }
                                                            : current,
                                                )
                                            }
                                        />
                                    </div>
                                    <Input
                                        placeholder="Mô tả"
                                        value={editingTargetForm.description}
                                        onChange={(event) =>
                                            setEditingTargetForm((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          description:
                                                              event.target
                                                                  .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                    />
                                    <select
                                        value={editingTargetForm.status}
                                        onChange={(event) =>
                                            setEditingTargetForm((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          status: event.target
                                                              .value as
                                                              | 'ACTIVE'
                                                              | 'CLOSED',
                                                      }
                                                    : current,
                                            )
                                        }
                                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    >
                                        <option value="ACTIVE">Đang mở</option>
                                        <option value="CLOSED">Đã đóng</option>
                                    </select>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="submit">
                                            Lưu thay đổi
                                        </Button>
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
            <div className="space-y-2">
                {pledges.map((pledge) => (
                    <div
                        key={pledge.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {pledge.student.full_name} -{' '}
                                    {pledge.item_target.name}
                                </p>
                                <p className="text-xs text-slate-600">
                                    {pledge.quantity} {pledge.item_target.unit}
                                </p>
                            </div>
                            <StatusBadge status={pledge.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    !canMutateCampaign ||
                                    pledge.status !== 'PLEDGED'
                                }
                                onClick={() => void onConfirmPledge(pledge.id)}
                            >
                                Xác nhận
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    !canMutateCampaign ||
                                    pledge.status !== 'PLEDGED'
                                }
                                onClick={() => void onRejectPledge(pledge.id)}
                            >
                                Từ chối
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    !canMutateCampaign ||
                                    pledge.status !== 'CONFIRMED'
                                }
                                onClick={() =>
                                    void onHandoverPledge(
                                        pledge.id,
                                        pledge.quantity,
                                    )
                                }
                            >
                                Ghi nhận bàn giao
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
