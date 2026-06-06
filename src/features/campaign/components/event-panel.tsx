import * as React from 'react';
import { Link } from 'react-router';
import { MapPin, TicketCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { formatLocationValue } from '@/features/locations/api/locations';
import { LocationPickerDialog } from '@/features/locations/components/location-picker-dialog';
import type { EventRegistrationItem } from '@/features/campaign/types';
import { toDisplayTitle } from '@/utils/display-text';

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
    managementHref?: string;
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
    managementHref,
}) => {
    const [isLocationDialogOpen, setIsLocationDialogOpen] =
        React.useState(false);

    return (
        <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <TicketCheck className="size-4 text-blue-700" />
                    <h4 className="text-sm font-semibold text-slate-900">
                        Vận hành tuyển TNV
                    </h4>
                </div>
                {managementHref ? (
                    <Link
                        to={managementHref}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Mở trang quản lý tình nguyện viên
                    </Link>
                ) : null}
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
                                Ưu tiên chọn từ danh mục địa điểm có sẵn để đồng
                                bộ giao diện public và quản trị.
                            </span>
                        </div>
                    </div>

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
                            onConfigChange({
                                benefits_text: event.target.value,
                            })
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
        </div>
    );
};
