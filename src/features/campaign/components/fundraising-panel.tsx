import * as React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { toDisplayTitle } from '@/utils/display-text';
import type {
    FundraisingDonationItem,
    FundraisingTransactionItem,
} from '@/features/campaign/types';

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
    transactions: FundraisingTransactionItem[];
    canMutateCampaign: boolean;
    onModuleChange: (moduleId: string) => void;
    onConfigChange: (patch: Record<string, unknown>) => void;
    onSaveConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onVerifyDonation: (donationId: string) => void;
    onRejectDonation: (donationId: string) => void;
    onAttachTransaction: (transactionId: string, donationId: string) => void;
    onUnmatchTransaction: (transactionId: string) => void;
}

export const FundraisingPanel: React.FC<FundraisingPanelProps> = ({
    fundraisingModuleId,
    modules,
    config,
    donations,
    transactions,
    canMutateCampaign,
    onModuleChange,
    onConfigChange,
    onSaveConfig,
    onVerifyDonation,
    onRejectDonation,
    onAttachTransaction,
    onUnmatchTransaction,
}) => {
    const [selectedDonationByTransaction, setSelectedDonationByTransaction] =
        React.useState<Record<string, string>>({});

    const getAttachableDonations = (transactionId: string) =>
        donations.filter(
            (donation) =>
                ['PENDING', 'MATCHED'].includes(donation.status) &&
                (!donation.matched_transaction_id ||
                    donation.matched_transaction_id === transactionId),
        );

    return (
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
                            onConfigChange({
                                receiver_name: event.target.value,
                            })
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
                                onClick={() =>
                                    void onVerifyDonation(donation.id)
                                }
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
                                onClick={() =>
                                    void onRejectDonation(donation.id)
                                }
                            >
                                Từ chối
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <h5 className="text-sm font-semibold text-slate-900">
                    Giao dịch SePay
                </h5>
                {transactions.map((transaction) => {
                    const attachableDonations = getAttachableDonations(
                        transaction.id,
                    );
                    const selectedDonationId =
                        selectedDonationByTransaction[transaction.id] ??
                        attachableDonations[0]?.id ??
                        '';

                    return (
                        <div
                            key={transaction.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {transaction.provider_transaction_id}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {formatCurrency(transaction.amount)}
                                    </p>
                                </div>
                                <StatusBadge
                                    status={transaction.match_status}
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                                {transaction.content ||
                                    'Không có nội dung chuyển khoản'}
                            </p>
                            {transaction.matched_donation ? (
                                <p className="mt-1 text-xs text-slate-500">
                                    Đã gắn donation #
                                    {transaction.matched_donation.id} -{' '}
                                    {transaction.matched_donation.donor_name ||
                                        'Ẩn danh'}
                                </p>
                            ) : null}
                            {transaction.match_status !== 'MATCHED' ? (
                                <div className="mt-3 space-y-2">
                                    <label className="block text-xs font-medium text-slate-600">
                                        Chọn donation để đối soát
                                    </label>
                                    <select
                                        value={selectedDonationId}
                                        onChange={(event) =>
                                            setSelectedDonationByTransaction(
                                                (current) => ({
                                                    ...current,
                                                    [transaction.id]:
                                                        event.target.value,
                                                }),
                                            )
                                        }
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        disabled={
                                            !canMutateCampaign ||
                                            attachableDonations.length === 0
                                        }
                                    >
                                        {attachableDonations.length === 0 ? (
                                            <option value="">
                                                Không có donation chờ đối soát
                                            </option>
                                        ) : null}
                                        {attachableDonations.map((donation) => (
                                            <option
                                                key={donation.id}
                                                value={donation.id}
                                            >
                                                #{donation.id} -{' '}
                                                {donation.donor_name} -{' '}
                                                {formatCurrency(
                                                    donation.amount,
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        !canMutateCampaign ||
                                        transaction.match_status ===
                                            'MATCHED' ||
                                        !selectedDonationId
                                    }
                                    onClick={() =>
                                        void onAttachTransaction(
                                            transaction.id,
                                            selectedDonationId,
                                        )
                                    }
                                >
                                    Gắn donation
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                        !canMutateCampaign ||
                                        transaction.match_status !== 'MATCHED'
                                    }
                                    onClick={() =>
                                        void onUnmatchTransaction(
                                            transaction.id,
                                        )
                                    }
                                >
                                    Gỡ đối soát
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
