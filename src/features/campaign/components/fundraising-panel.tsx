import * as React from 'react';
import { Link } from 'react-router';
import { CircleDollarSign, Clock3, StopCircle } from 'lucide-react';
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
    canEditModuleContent?: boolean;
    onModuleChange: (moduleId: string) => void;
    onConfigChange: (patch: Record<string, unknown>) => void;
    onSaveConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onVerifyDonation: (donationId: string) => void;
    onRejectDonation: (donationId: string) => void;
    onAttachTransaction: (transactionId: string, donationId: string) => void;
    onUnmatchTransaction: (transactionId: string) => void;
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
    managementHref?: string;
}

export const FundraisingPanel: React.FC<FundraisingPanelProps> = ({
    fundraisingModuleId,
    modules,
    config,
    donations,
    transactions,
    canMutateCampaign,
    canEditModuleContent = false,
    onModuleChange,
    onConfigChange,
    onSaveConfig,
    onVerifyDonation,
    onRejectDonation,
    onAttachTransaction,
    onUnmatchTransaction,
    onExtendDeadline,
    onEndEarly,
    moduleEndAt,
    moduleStatus,
    countdown,
    managementHref,
}) => {
    const [selectedDonationByTransaction, setSelectedDonationByTransaction] =
        React.useState<Record<string, string>>({});
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

    const getAttachableDonations = (transactionId: string) =>
        donations.filter(
            (donation) =>
                ['PENDING', 'MATCHED'].includes(donation.status) &&
                (!donation.matched_transaction_id ||
                    donation.matched_transaction_id === transactionId),
        );

    const verifiedTotal = donations
        .filter((donation) => donation.status === 'VERIFIED')
        .reduce((total, donation) => total + donation.amount, 0);
    const pendingTotal = donations
        .filter((donation) => ['PENDING', 'MATCHED'].includes(donation.status))
        .reduce((total, donation) => total + donation.amount, 0);
    const rejectedTotal = donations
        .filter((donation) => donation.status === 'REJECTED')
        .reduce((total, donation) => total + donation.amount, 0);
    const canExtendFundraising =
        canMutateCampaign &&
        Boolean(onExtendDeadline) &&
        moduleStatus !== 'ENDED';
    const canEndFundraisingEarly =
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

    return (
        <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <CircleDollarSign className="size-4 text-blue-700" />
                    <h4 className="text-sm font-semibold text-slate-900">
                        Gây quỹ
                    </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canExtendFundraising ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowExtendForm((value) => !value)}
                        >
                            Gia hạn gây quỹ
                        </Button>
                    ) : null}
                    {canEndFundraisingEarly ? (
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
                            Mở trang xác minh đóng góp
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
                        Đồng hồ gây quỹ
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
                        Đã xác nhận
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(verifiedTotal)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Chờ xác nhận
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(pendingTotal)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Bị từ chối
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(rejectedTotal)}</div>
                </div>
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
            {fundraisingModuleId && canEditModuleContent ? (
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
                        Gửi thông báo cho người tham gia
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
                        Gửi thông báo cho người tham gia
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

            <div className="space-y-2">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_140px_170px_150px_130px] gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
                    <div>Người ủng hộ / nội dung</div>
                    <div>Số tiền</div>
                    <div>Thời gian</div>
                    <div>Trạng thái</div>
                    <div>Nguồn</div>
                </div>
                {donations.map((donation) => (
                    <div
                        key={donation.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                        <div className="hidden grid-cols-[minmax(0,1.2fr)_140px_170px_150px_130px] gap-3 lg:grid lg:items-start">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {donation.donor_name || 'Người ủng hộ ẩn danh'}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    {donation.message || 'Không có nội dung chuyển khoản'}
                                </p>
                                {donation.reject_reason ? (
                                    <p className="mt-1 text-xs text-rose-600">
                                        Lý do từ chối: {donation.reject_reason}
                                    </p>
                                ) : null}
                            </div>
                            <div className="text-sm font-semibold text-slate-900">
                                {formatCurrency(donation.amount)}
                            </div>
                            <div className="text-sm text-slate-700">
                                {new Date(donation.created_at).toLocaleString('vi-VN')}
                            </div>
                            <div>
                                <StatusBadge status={donation.status} />
                            </div>
                            <div className="text-sm text-slate-700">
                                {donation.matched_transaction_id ? 'SePay / đối soát' : 'Thủ công'}
                            </div>
                        </div>
                        <div className="space-y-2 lg:hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {donation.donor_name || 'Người ủng hộ ẩn danh'}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {formatCurrency(donation.amount)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {new Date(donation.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <StatusBadge status={donation.status} />
                            </div>
                            <p className="text-xs text-slate-600">
                                {donation.message || 'Không có nội dung chuyển khoản'}
                            </p>
                            {donation.reject_reason ? (
                                <p className="text-xs text-rose-600">
                                    Lý do từ chối: {donation.reject_reason}
                                </p>
                            ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    !canMutateCampaign ||
                                    !['PENDING', 'MATCHED'].includes(donation.status)
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
                                    !['PENDING', 'MATCHED'].includes(donation.status)
                                }
                                onClick={() => void onRejectDonation(donation.id)}
                            >
                                Từ chối
                            </Button>
                        </div>
                    </div>
                ))}
                {donations.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Chưa có khoản đóng góp nào.
                    </div>
                ) : null}
            </div>
            <div className="space-y-2">
                <h5 className="text-sm font-semibold text-slate-900">
                    Giao dịch SePay
                </h5>
                <div className="hidden grid-cols-[180px_minmax(0,1fr)_140px_170px_140px] gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
                    <div>Mã giao dịch</div>
                    <div>Nội dung / nguồn</div>
                    <div>Số tiền</div>
                    <div>Thời gian</div>
                    <div>Trạng thái</div>
                </div>
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
                            <div className="hidden grid-cols-[180px_minmax(0,1fr)_140px_170px_140px] gap-3 lg:grid lg:items-start">
                                <div className="text-sm font-semibold text-slate-900">
                                    {transaction.provider_transaction_id}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-700">
                                        {transaction.content || 'Không có nội dung chuyển khoản'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Nguồn: {transaction.provider || 'SePay'}
                                    </p>
                                    {transaction.matched_donation ? (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Đã gắn donation #{transaction.matched_donation.id} -{' '}
                                            {transaction.matched_donation.donor_name}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="text-sm font-semibold text-slate-900">
                                    {formatCurrency(transaction.amount)}
                                </div>
                                <div className="text-sm text-slate-700">
                                    {new Date(transaction.transaction_time).toLocaleString('vi-VN')}
                                </div>
                                <div>
                                    <StatusBadge status={transaction.match_status} />
                                </div>
                            </div>
                            <div className="space-y-2 lg:hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {transaction.provider_transaction_id}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {formatCurrency(transaction.amount)}
                                        </p>
                                    </div>
                                    <StatusBadge status={transaction.match_status} />
                                </div>
                                <p className="text-xs text-slate-600">
                                    {transaction.content || 'Không có nội dung chuyển khoản'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Date(transaction.transaction_time).toLocaleString('vi-VN')} · {transaction.provider || 'SePay'}
                                </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {attachableDonations.length > 0 ? (
                                    <>
                                        <select
                                            value={selectedDonationId}
                                            onChange={(event) =>
                                                setSelectedDonationByTransaction(
                                                    (current) => ({
                                                        ...current,
                                                        [transaction.id]: event.target.value,
                                                    }),
                                                )
                                            }
                                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            {attachableDonations.map((donation) => (
                                                <option key={donation.id} value={donation.id}>
                                                    #{donation.id} · {donation.donor_name} · {formatCurrency(donation.amount)}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!selectedDonationId}
                                            onClick={() =>
                                                void onAttachTransaction(
                                                    transaction.id,
                                                    selectedDonationId,
                                                )
                                            }
                                        >
                                            Gắn donation
                                        </Button>
                                    </>
                                ) : null}
                                {transaction.match_status === 'MATCHED' ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void onUnmatchTransaction(transaction.id)}
                                    >
                                        Gỡ đối soát
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
                {transactions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Chưa có giao dịch SePay nào.
                    </div>
                ) : null}
            </div>
        </div>
    );
};
