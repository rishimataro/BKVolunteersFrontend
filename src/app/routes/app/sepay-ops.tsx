import { useEffect, useMemo, useState } from 'react';
import { Landmark, RefreshCcw, Search, ShieldCheck } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { DateTimeField } from '@/components/ui/datetime-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import {
    approveSepayOperationRequest,
    createSepayOperationRequest,
    createSepayOrderVa,
    getSepayAccounts,
    listSepayOperationRequests,
    getSepaySyncStatus,
    getSepayUnmatchedTransactions,
    rejectSepayOperationRequest,
    syncSepayAccounts,
    syncSepayTransactions,
    syncSepayVirtualAccounts,
    type SepayBankAccount,
    type SepayOperationRequest,
    type SepaySyncResult,
    type SepaySyncStatus,
    type SepayUnmatchedTransaction,
} from '@/features/admin/api/sepay';
import { ROLES, useUser } from '@/features/auth';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import { toIsoFromDateTimeLocal } from '@/utils/datetime-local';

const formatDateTime = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          }).format(new Date(value))
        : '—';

export const SepayOpsRoute = () => {
    const user = useUser();
    const role = user.data?.role;
    const isSchoolAdmin = role === ROLES.DOANTRUONG;
    const { addNotification } = useNotifications();
    const [accounts, setAccounts] = useState<SepayBankAccount[]>([]);
    const [status, setStatus] = useState<SepaySyncStatus | null>(null);
    const [unmatched, setUnmatched] = useState<SepayUnmatchedTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<SepaySyncResult | null>(null);
    const [requests, setRequests] = useState<SepayOperationRequest[]>([]);

    const [accountQuery, setAccountQuery] = useState('');
    const [transactionForm, setTransactionForm] = useState({
        sepay_bank_account_id: '',
        transaction_date_from: '',
        transaction_date_to: '',
        since_id: '',
        q: '',
    });
    const [virtualAccountForm, setVirtualAccountForm] = useState({
        sepay_bank_account_id: '',
        active: '',
        official: '',
        static: '',
    });
    const [orderVaDonationId, setOrderVaDonationId] = useState('');

    const loadPage = async () => {
        setLoading(true);
        setError(null);
        try {
            const [accountData, syncStatus, unmatchedData] = await Promise.all([
                getSepayAccounts(accountQuery.trim() ? { q: accountQuery.trim() } : undefined),
                getSepaySyncStatus(),
                getSepayUnmatchedTransactions(),
            ]);
            setAccounts(accountData);
            setStatus(syncStatus);
            setUnmatched(unmatchedData);
            const requestData = await listSepayOperationRequests({
                status: 'PENDING',
            });
            setRequests(requestData);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Không thể tải dữ liệu vận hành SePay.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeAccountCount = useMemo(
        () => accounts.filter((account) => account.active).length,
        [accounts],
    );

    const runAction = async (
        actionKey: string,
        action: () => Promise<SepaySyncResult | void>,
        successMessage: string,
    ) => {
        setSubmitting(actionKey);
        try {
            const result = await action();
            if (result) {
                setLastSync(result);
            }
            addNotification({
                type: 'success',
                title: 'Đã hoàn tất',
                message: successMessage,
            });
            await loadPage();
        } catch (actionError) {
            addNotification({
                type: 'error',
                title: 'Thao tác thất bại',
                message:
                    actionError instanceof Error
                        ? actionError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <ContentLayout title="Vận hành SePay">
            <div className="space-y-6">
                <section className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <Landmark className="size-6 text-[#2E5077]" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                SePay API v2 Operations
                            </h2>
                            <p className="text-sm text-slate-500">
                                Đồng bộ tài khoản, transaction pull fallback, VA và order-based VA.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void loadPage()}
                        disabled={loading}
                        data-testid="sepay-ops-refresh"
                    >
                        <RefreshCcw className="mr-1 size-4" />
                        Làm mới
                    </Button>
                </section>

                {loading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!loading && !error ? (
                    <>
                        <section className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    API mode
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {status?.api_mode ?? '—'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tài khoản SePay
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {status?.account_count ?? accounts.length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Virtual accounts
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {status?.virtual_account_count ?? 0}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Order payments
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {status?.order_payment_count ?? 0}
                                </p>
                            </div>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                            <div className="space-y-6">
                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <div className="mb-4 flex flex-wrap items-end gap-3">
                                        <div className="min-w-[240px] flex-1">
                                            <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                                Tìm tài khoản SePay
                                            </Label>
                                            <Input
                                                data-testid="sepay-ops-account-query"
                                                value={accountQuery}
                                                onChange={(event) =>
                                                    setAccountQuery(event.target.value)
                                                }
                                                placeholder="Tên chủ tài khoản, số tài khoản, label"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => void loadPage()}
                                            data-testid="sepay-ops-account-filter"
                                        >
                                            <Search className="mr-1 size-4" />
                                            Lọc
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                void runAction(
                                                    'sync-accounts',
                                                    () =>
                                                        syncSepayAccounts(
                                                            accountQuery.trim()
                                                                ? { q: accountQuery.trim() }
                                                                : undefined,
                                                        ),
                                                    'Đã đồng bộ danh sách tài khoản SePay.',
                                                )
                                            }
                                            disabled={submitting === 'sync-accounts' || !isSchoolAdmin}
                                            data-testid="sepay-ops-sync-accounts"
                                        >
                                            Đồng bộ accounts
                                        </Button>
                                    </div>

                                    {accounts.length === 0 ? (
                                        <div className="space-y-3">
                                            <EmptyState title="Chưa có tài khoản SePay nào trong phạm vi hiện tại" />
                                            {!isSchoolAdmin ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        void runAction(
                                                            'request-map-account',
                                                            async () => {
                                                                await createSepayOperationRequest({
                                                                    request_type: 'MAP_ACCOUNT',
                                                                    note: 'Yêu cầu cấp/mapping SePay account cho đơn vị',
                                                                });
                                                            },
                                                            'Đã gửi yêu cầu cấp SePay account.',
                                                        )
                                                    }
                                                >
                                                    Gửi yêu cầu duyệt
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-lg border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                                        <th className="px-4 py-3">bank_account_id</th>
                                                        <th className="px-4 py-3">Số tài khoản</th>
                                                        <th className="px-4 py-3">Ngân hàng</th>
                                                        <th className="px-4 py-3">Trạng thái</th>
                                                        <th className="px-4 py-3">Giao dịch cuối</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {accounts.map((account) => (
                                                        <tr key={account.id}>
                                                            <td className="px-4 py-3 font-mono text-xs text-slate-700">
                                                                {account.sepay_account_id}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-slate-900">
                                                                    {account.account_number}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {account.account_holder_name}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                {account.bank_short_name ??
                                                                    account.bank_full_name ??
                                                                    '—'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                        account.active
                                                                            ? 'bg-emerald-50 text-emerald-700'
                                                                            : 'bg-slate-100 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {account.active
                                                                        ? 'ACTIVE'
                                                                        : 'INACTIVE'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500">
                                                                {formatDateTime(
                                                                    account.last_transaction,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Giao dịch API_PULL chưa match
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Theo dõi transaction đã kéo từ SePay API nhưng chưa match được donation.
                                    </p>
                                    <div className="mt-4">
                                        {unmatched.length === 0 ? (
                                            <EmptyState title="Không có transaction unmatched từ API pull" />
                                        ) : (
                                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                                            <th className="px-4 py-3">Provider TX</th>
                                                            <th className="px-4 py-3">Amount</th>
                                                            <th className="px-4 py-3">Content</th>
                                                            <th className="px-4 py-3">Order/VA</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {unmatched.map((transaction) => (
                                                            <tr key={transaction.id}>
                                                                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                                                                    {transaction.provider_transaction_id}
                                                                </td>
                                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                                    {transaction.amount.toLocaleString('vi-VN')} đ
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600">
                                                                    {transaction.content ?? '—'}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-slate-500">
                                                                    <div>
                                                                        order:{' '}
                                                                        {transaction.sepay_order_code ?? '—'}
                                                                    </div>
                                                                    <div>
                                                                        va:{' '}
                                                                        {transaction.sepay_va_id ?? '—'}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-slate-500" />
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Sync status
                                        </h3>
                                    </div>
                                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                                        <p>API enabled: {status?.enabled ? 'Yes' : 'No'}</p>
                                        <p>VA enabled: {status?.va_enabled ? 'Yes' : 'No'}</p>
                                        <p>
                                            ORDER_VA enabled:{' '}
                                            {status?.order_va_enabled ? 'Yes' : 'No'}
                                        </p>
                                        <p>Active accounts: {activeAccountCount}</p>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {status?.cursors.map((cursor) => (
                                            <div
                                                key={`${cursor.type}-${cursor.sepay_bank_account_id ?? 'global'}`}
                                                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"
                                            >
                                                <div className="font-semibold text-slate-900">
                                                    {cursor.type}
                                                </div>
                                                <div>
                                                    account:{' '}
                                                    {cursor.sepay_bank_account_id ?? 'global'}
                                                </div>
                                                <div>
                                                    last synced:{' '}
                                                    {formatDateTime(cursor.last_synced_at)}
                                                </div>
                                                <div>cursor: {cursor.cursor_value ?? '—'}</div>
                                                <div>error: {cursor.last_error ?? '—'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Sync transactions
                                    </h3>
                                    <div className="mt-4 space-y-3">
                                        <Input
                                            data-testid="sepay-ops-sync-bank-account-id"
                                            value={transactionForm.sepay_bank_account_id}
                                            onChange={(event) =>
                                                setTransactionForm((current) => ({
                                                    ...current,
                                                    sepay_bank_account_id: event.target.value,
                                                }))
                                            }
                                            placeholder="SePay bank_account_id"
                                        />
                                        <DateTimeField
                                            value={transactionForm.transaction_date_from}
                                            onChange={(value) =>
                                                setTransactionForm((current) => ({
                                                    ...current,
                                                    transaction_date_from: value,
                                                }))
                                            }
                                            dateTestId="sepay-ops-sync-from-date"
                                            timeTestId="sepay-ops-sync-from-time"
                                        />
                                        <DateTimeField
                                            value={transactionForm.transaction_date_to}
                                            onChange={(value) =>
                                                setTransactionForm((current) => ({
                                                    ...current,
                                                    transaction_date_to: value,
                                                }))
                                            }
                                            dateTestId="sepay-ops-sync-to-date"
                                            timeTestId="sepay-ops-sync-to-time"
                                        />
                                        <Input
                                            data-testid="sepay-ops-sync-since-id"
                                            value={transactionForm.since_id}
                                            onChange={(event) =>
                                                setTransactionForm((current) => ({
                                                    ...current,
                                                    since_id: event.target.value,
                                                }))
                                            }
                                            placeholder="since_id"
                                        />
                                        <Input
                                            data-testid="sepay-ops-sync-query"
                                            value={transactionForm.q}
                                            onChange={(event) =>
                                                setTransactionForm((current) => ({
                                                    ...current,
                                                    q: event.target.value,
                                                }))
                                            }
                                            placeholder="Nội dung giao dịch"
                                        />
                                        <Button
                                            type="button"
                                            className="w-full"
                                            disabled={submitting === 'sync-transactions'}
                                            data-testid="sepay-ops-sync-transactions"
                                            onClick={() =>
                                                void runAction(
                                                    'sync-transactions',
                                                    () =>
                                                        syncSepayTransactions({
                                                            ...transactionForm,
                                                            transaction_date_from:
                                                                toIsoFromDateTimeLocal(
                                                                    transactionForm.transaction_date_from,
                                                                ),
                                                            transaction_date_to:
                                                                toIsoFromDateTimeLocal(
                                                                    transactionForm.transaction_date_to,
                                                                ),
                                                            since_id:
                                                                transactionForm.since_id || undefined,
                                                            q: transactionForm.q || undefined,
                                                            sepay_bank_account_id:
                                                                transactionForm.sepay_bank_account_id ||
                                                                undefined,
                                                        }),
                                                    'Đã kéo transaction từ SePay API.',
                                                )
                                            }
                                        >
                                            Sync transactions
                                        </Button>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Sync virtual accounts
                                    </h3>
                                    <div className="mt-4 space-y-3">
                                        <Input
                                            data-testid="sepay-ops-va-bank-account-id"
                                            value={virtualAccountForm.sepay_bank_account_id}
                                            onChange={(event) =>
                                                setVirtualAccountForm((current) => ({
                                                    ...current,
                                                    sepay_bank_account_id: event.target.value,
                                                }))
                                            }
                                            placeholder="SePay bank_account_id"
                                        />
                                        <Input
                                            data-testid="sepay-ops-va-active"
                                            value={virtualAccountForm.active}
                                            onChange={(event) =>
                                                setVirtualAccountForm((current) => ({
                                                    ...current,
                                                    active: event.target.value,
                                                }))
                                            }
                                            placeholder="active: 1 | 0"
                                        />
                                        <Input
                                            data-testid="sepay-ops-va-official"
                                            value={virtualAccountForm.official}
                                            onChange={(event) =>
                                                setVirtualAccountForm((current) => ({
                                                    ...current,
                                                    official: event.target.value,
                                                }))
                                            }
                                            placeholder="official: 1 | 0"
                                        />
                                        <Input
                                            data-testid="sepay-ops-va-static"
                                            value={virtualAccountForm.static}
                                            onChange={(event) =>
                                                setVirtualAccountForm((current) => ({
                                                    ...current,
                                                    static: event.target.value,
                                                }))
                                            }
                                            placeholder="static: 1 | 0"
                                        />
                                        <Button
                                            type="button"
                                            className="w-full"
                                            variant="outline"
                                            disabled={submitting === 'sync-virtual-accounts'}
                                            data-testid="sepay-ops-sync-virtual-accounts"
                                            onClick={() =>
                                                void runAction(
                                                    'sync-virtual-accounts',
                                                    () =>
                                                        syncSepayVirtualAccounts({
                                                            sepay_bank_account_id:
                                                                virtualAccountForm.sepay_bank_account_id ||
                                                                undefined,
                                                            active:
                                                                (virtualAccountForm.active as
                                                                    | '1'
                                                                    | '0'
                                                                    | '') || undefined,
                                                            official:
                                                                (virtualAccountForm.official as
                                                                    | '1'
                                                                    | '0'
                                                                    | '') || undefined,
                                                            static:
                                                                (virtualAccountForm.static as
                                                                    | '1'
                                                                    | '0'
                                                                    | '') || undefined,
                                                        }),
                                                    'Đã đồng bộ virtual accounts từ SePay API.',
                                                )
                                            }
                                        >
                                            Sync virtual accounts
                                        </Button>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Create ORDER_VA cho donation
                                    </h3>
                                    <div className="mt-4 flex gap-3">
                                        <Input
                                            data-testid="sepay-ops-order-va-donation-id"
                                            value={orderVaDonationId}
                                            onChange={(event) =>
                                                setOrderVaDonationId(event.target.value)
                                            }
                                            placeholder="Donation ID"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                submitting === 'create-order-va' ||
                                                !orderVaDonationId.trim()
                                            }
                                            data-testid="sepay-ops-create-order-va"
                                            onClick={() =>
                                                void runAction(
                                                    'create-order-va',
                                                    async () => {
                                                        await createSepayOrderVa(
                                                            orderVaDonationId.trim(),
                                                        );
                                                    },
                                                    'Đã gửi yêu cầu tạo ORDER_VA cho donation.',
                                                )
                                            }
                                        >
                                            Tạo ORDER_VA
                                        </Button>
                                    </div>
                                </section>
                                <section className="rounded-xl border border-slate-200 bg-white p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Queue SePay requests
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {requests.length === 0 ? (
                                            <p className="text-sm text-slate-500">
                                                Không có request chờ duyệt.
                                            </p>
                                        ) : (
                                            requests.map((request) => (
                                                <div
                                                    key={request.id}
                                                    className="rounded-lg border border-slate-200 p-3 text-sm"
                                                >
                                                    <p className="font-medium text-slate-900">
                                                        #{request.id} - {request.request_type}
                                                    </p>
                                                    <p className="text-slate-600">
                                                        role: {request.requester_role} | org: {request.organization_id}
                                                    </p>
                                                    <p className="text-slate-600">
                                                        account: {request.sepay_bank_account_id ?? '—'}
                                                    </p>
                                                    {request.note ? (
                                                        <p className="text-slate-600">{request.note}</p>
                                                    ) : null}
                                                    {isSchoolAdmin ? (
                                                        <div className="mt-2 flex gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    void runAction(
                                                                        `approve-${request.id}`,
                                                                        async () => {
                                                                            await approveSepayOperationRequest(
                                                                                String(request.id),
                                                                            );
                                                                        },
                                                                        `Đã phê duyệt request #${request.id}.`,
                                                                    )
                                                                }
                                                            >
                                                                Duyệt
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    void runAction(
                                                                        `reject-${request.id}`,
                                                                        async () => {
                                                                            await rejectSepayOperationRequest(
                                                                                String(request.id),
                                                                            );
                                                                        },
                                                                        `Đã từ chối request #${request.id}.`,
                                                                    )
                                                                }
                                                            >
                                                                Từ chối
                                                            </Button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </section>

                        {lastSync ? (
                            <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                                <p className="font-semibold">
                                    Kết quả sync gần nhất
                                </p>
                                <p className="mt-1">
                                    synced: {lastSync.synced_count}, matched:{' '}
                                    {lastSync.matched_count}, unmatched:{' '}
                                    {lastSync.unmatched_count}, failed:{' '}
                                    {lastSync.failed_count}
                                </p>
                            </section>
                        ) : null}
                    </>
                ) : null}
            </div>
        </ContentLayout>
    );
};
