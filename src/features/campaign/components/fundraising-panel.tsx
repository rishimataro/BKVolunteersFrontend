import * as React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { toDisplayTitle } from '@/utils/display-text';
import type { FundraisingDonationItem } from '@/features/campaign/types';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

export interface FundraisingConfig {
    target_amount: number;
    receiver_name: string;
    bank_name: string;
    bank_account_no: string;
    currency: string;
    sepay_enabled: boolean;
    sepay_account_id: string;
}

interface FundraisingPanelProps {
    fundraisingModuleId: string;
    modules: Array<{ id: string; title: string }>;
    config: FundraisingConfig;
    donations: FundraisingDonationItem[];
    canMutateCampaign: boolean;
    onModuleChange: (moduleId: string) => void;
    onConfigChange: (patch: Record<string, unknown>) => void;
    onSaveConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onVerifyDonation: (donationId: string) => void;
    onRejectDonation: (donationId: string) => void;
}

export const FundraisingPanel: React.FC<FundraisingPanelProps> = ({
    fundraisingModuleId,
    modules,
    config,
    donations,
    canMutateCampaign,
    onModuleChange,
    onConfigChange,
    onSaveConfig,
    onVerifyDonation,
    onRejectDonation,
}) => (
    <div className="space-y-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-blue-700" />
            <h4 className="text-sm font-semibold text-slate-900">
                Vận hành gây quỹ
            </h4>
        </div>
        <select
            value={fundraisingModuleId}
            onChange={(event) => onModuleChange(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
        >
            <option value="">Chọn hạng mục gây quỹ</option>
            {modules.map((module) => (
                <option key={module.id} value={module.id}>
                    {toDisplayTitle(module.title)}
                </option>
            ))}
        </select>
        {fundraisingModuleId && canMutateCampaign ? (
            <form
                onSubmit={onSaveConfig}
                className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
                <Input
                    type="number"
                    placeholder="Mục tiêu gây quỹ"
                    value={config.target_amount || ''}
                    onChange={(event) =>
                        onConfigChange({
                            target_amount: Number(event.target.value || 0),
                        })
                    }
                />
                <Input
                    placeholder="Tên người nhận"
                    value={config.receiver_name}
                    onChange={(event) =>
                        onConfigChange({ receiver_name: event.target.value })
                    }
                />
                <Input
                    placeholder="Ngân hàng"
                    value={config.bank_name}
                    onChange={(event) =>
                        onConfigChange({ bank_name: event.target.value })
                    }
                />
                <Input
                    placeholder="Số tài khoản"
                    value={config.bank_account_no}
                    onChange={(event) =>
                        onConfigChange({
                            bank_account_no: event.target.value,
                        })
                    }
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={config.sepay_enabled}
                        onChange={(event) =>
                            onConfigChange({
                                sepay_enabled: event.target.checked,
                            })
                        }
                    />
                    Bật SePay
                </label>
                {config.sepay_enabled ? (
                    <Input
                        placeholder="Mã tài khoản SePay"
                        value={config.sepay_account_id}
                        onChange={(event) =>
                            onConfigChange({
                                sepay_account_id: event.target.value,
                            })
                        }
                    />
                ) : null}
                <Button type="submit">Lưu cấu hình</Button>
            </form>
        ) : null}
        <div className="space-y-2">
            {donations.map((donation) => (
                <div
                    key={donation.id}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {donation.donor_name}
                            </p>
                            <p className="text-xs text-slate-600">
                                {formatCurrency(donation.amount)}
                            </p>
                        </div>
                        <StatusBadge status={donation.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !canMutateCampaign ||
                                !['PENDING', 'MATCHED'].includes(
                                    donation.status,
                                )
                            }
                            onClick={() => void onVerifyDonation(donation.id)}
                        >
                            Xác minh
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !canMutateCampaign ||
                                !['PENDING', 'MATCHED'].includes(
                                    donation.status,
                                )
                            }
                            onClick={() => void onRejectDonation(donation.id)}
                        >
                            Từ chối
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
