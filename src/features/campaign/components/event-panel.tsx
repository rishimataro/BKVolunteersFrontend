import * as React from 'react';
import { TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { toDisplayTitle } from '@/utils/display-text';
import type { EventRegistrationItem } from '@/features/campaign/types';

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
    onModuleChange: (moduleId: string) => void;
    onConfigChange: (patch: Record<string, unknown>) => void;
    onSaveConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onApproveRegistration: (registrationId: string) => void;
    onRejectRegistration: (registrationId: string) => void;
    onCheckInRegistration: (registrationId: string) => void;
    onCompleteRegistration: (registrationId: string) => void;
}

export const EventPanel: React.FC<EventPanelProps> = ({
    eventModuleId,
    modules,
    config,
    registrations,
    canMutateCampaign,
    onModuleChange,
    onConfigChange,
    onSaveConfig,
    onApproveRegistration,
    onRejectRegistration,
    onCheckInRegistration,
    onCompleteRegistration,
}) => (
    <div className="space-y-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2">
            <TicketCheck className="size-4 text-blue-700" />
            <h4 className="text-sm font-semibold text-slate-900">
                Vận hành tuyển TNV
            </h4>
        </div>
        <select
            value={eventModuleId}
            onChange={(event) => onModuleChange(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
        >
            <option value="">Chọn hạng mục sự kiện</option>
            {modules.map((module) => (
                <option key={module.id} value={module.id}>
                    {toDisplayTitle(module.title)}
                </option>
            ))}
        </select>
        {eventModuleId && canMutateCampaign ? (
            <form
                onSubmit={onSaveConfig}
                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
                <Input
                    placeholder="Địa điểm"
                    value={config.location}
                    onChange={(event) =>
                        onConfigChange({ location: event.target.value })
                    }
                />
                <Input
                    type="number"
                    placeholder="Số lượng tối đa"
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
                        onConfigChange({ benefits_text: event.target.value })
                    }
                    placeholder="Mỗi quyền lợi một dòng"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
                <Button type="submit">Lưu cấu hình sự kiện</Button>
            </form>
        ) : null}
        <div className="space-y-2">
            {registrations.map((registration) => (
                <div
                    key={registration.id}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {registration.student.full_name}
                            </p>
                            <p className="text-xs text-slate-600">
                                {registration.student.student_code} -{' '}
                                {registration.student.email}
                            </p>
                        </div>
                        <StatusBadge status={registration.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !canMutateCampaign ||
                                registration.status !== 'PENDING'
                            }
                            onClick={() =>
                                void onApproveRegistration(registration.id)
                            }
                        >
                            Duyệt
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !canMutateCampaign ||
                                !['PENDING', 'APPROVED'].includes(
                                    registration.status,
                                )
                            }
                            onClick={() =>
                                void onRejectRegistration(registration.id)
                            }
                        >
                            Từ chối
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !canMutateCampaign ||
                                registration.status !== 'APPROVED'
                            }
                            onClick={() =>
                                void onCheckInRegistration(registration.id)
                            }
                        >
                            Check-in
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !canMutateCampaign ||
                                !['APPROVED', 'CHECKED_IN'].includes(
                                    registration.status,
                                )
                            }
                            onClick={() =>
                                void onCompleteRegistration(registration.id)
                            }
                        >
                            Hoàn thành
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
