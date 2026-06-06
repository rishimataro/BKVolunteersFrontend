import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    ArrowLeft,
    ArrowRightLeft,
    Eye,
    ImageOff,
    Link2,
    Search,
    ShieldAlert,
    ShieldCheck,
    Unlink2,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { useNotifications } from '@/components/ui/notifications';
import {
    attachFundraisingTransaction,
    getFundraisingDonations,
    getFundraisingModule,
    getFundraisingTransactions,
    rejectFundraisingDonation,
    unmatchFundraisingTransaction,
    verifyFundraisingDonation,
    type FundraisingDonationItem,
    type FundraisingModuleDetail,
    type FundraisingTransactionItem,
} from '@/features/campaign/api/fundraising';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { DonationStatus } from '@/types/api';

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const surfaceClassName = 'border border-[#C3C6D2] bg-white';
const inputClassName =
    'h-12 border border-[#C3C6D2] bg-white px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const statusConfig: Record<
    DonationStatus,
    {
        label: string;
        className: string;
    }
> = {
    PENDING: {
        label: 'Chờ xác minh',
        className: 'border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]',
    },
    MATCHED: {
        label: 'Đã đối soát',
        className: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
    },
    VERIFIED: {
        label: 'Đã xác minh',
        className: 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]',
    },
    REJECTED: {
        label: 'Yêu cầu kiểm tra lại',
        className: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
    },
    REFUNDED: {
        label: 'Đã hoàn tiền',
        className: 'border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]',
    },
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return dateTimeFormatter.format(date);
};

const getInitials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

const getStatusBadge = (status: DonationStatus) => {
    const config = statusConfig[status];

    return (
        <span
            className={`inline-flex items-center border px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${config.className}`}
        >
            {config.label}
        </span>
    );
};

export const FundraisingManagementRoute = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [module, setModule] = useState<FundraisingModuleDetail | null>(null);
    const [donations, setDonations] = useState<FundraisingDonationItem[]>([]);
    const [transactions, setTransactions] = useState<
        FundraisingTransactionItem[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDonationId, setSelectedDonationId] = useState<string | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<DonationStatus | 'ALL'>(
        'ALL',
    );
    const [selectedTransactionId, setSelectedTransactionId] = useState('');
    const [actionDonationId, setActionDonationId] = useState<string | null>(
        null,
    );
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const [verifyNote, setVerifyNote] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [submittingReject, setSubmittingReject] = useState(false);
    const [submittingVerify, setSubmittingVerify] = useState(false);

    const loadData = async () => {
        if (!moduleId) {
            setError('Không xác định được hạng mục gây quỹ.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [moduleDetail, donationsPage, transactionsPage] =
                await Promise.all([
                    getFundraisingModule(moduleId),
                    getFundraisingDonations(moduleId, { limit: 100 }),
                    getFundraisingTransactions({
                        module_id: moduleId,
                        limit: 100,
                    }),
                ]);

            setModule(moduleDetail);
            setDonations(donationsPage.items);
            setTransactions(transactionsPage.items);
        } catch {
            setError('Không thể tải dữ liệu xác minh đóng góp.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleId]);

    const filteredDonations = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return donations.filter((donation) => {
            const matchesStatus =
                statusFilter === 'ALL' || donation.status === statusFilter;
            const matchesQuery =
                !normalizedQuery ||
                [
                    donation.donor_name,
                    donation.message ?? '',
                    donation.id,
                    donation.matched_transaction_id ?? '',
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedQuery);

            return matchesStatus && matchesQuery;
        });
    }, [donations, searchQuery, statusFilter]);

    useEffect(() => {
        if (filteredDonations.length === 0) {
            setSelectedDonationId(null);
            return;
        }

        if (
            !selectedDonationId ||
            !filteredDonations.some(
                (donation) => donation.id === selectedDonationId,
            )
        ) {
            setSelectedDonationId(filteredDonations[0].id);
        }
    }, [filteredDonations, selectedDonationId]);

    const selectedDonation =
        donations.find((donation) => donation.id === selectedDonationId) ??
        null;

    const matchedTransaction = selectedDonation?.matched_transaction_id
        ? (transactions.find(
              (transaction) =>
                  transaction.id === selectedDonation.matched_transaction_id,
          ) ?? null)
        : (transactions.find(
              (transaction) =>
                  transaction.matched_donation?.id === selectedDonation?.id,
          ) ?? null);

    const availableTransactions = transactions.filter((transaction) => {
        if (!selectedDonation) {
            return false;
        }

        return (
            transaction.match_status !== 'MATCHED' ||
            transaction.matched_donation?.id === selectedDonation.id
        );
    });

    useEffect(() => {
        if (matchedTransaction) {
            setSelectedTransactionId(matchedTransaction.id);
            return;
        }

        setSelectedTransactionId(availableTransactions[0]?.id ?? '');
    }, [availableTransactions, matchedTransaction]);

    useEffect(() => {
        setShowRejectDialog(false);
        setShowVerifyDialog(false);
        setRejectReason('');
        setVerifyNote('');
    }, [selectedDonationId]);

    const totalAmount = filteredDonations.reduce(
        (sum, donation) => sum + donation.amount,
        0,
    );
    const pendingCount = donations.filter(
        (donation) => donation.status === 'PENDING',
    ).length;
    const verifiedCount = donations.filter(
        (donation) => donation.status === 'VERIFIED',
    ).length;
    const hasVerificationSource = Boolean(
        selectedDonation &&
        (selectedDonation.matched_transaction_id ||
            matchedTransaction ||
            selectedTransactionId ||
            selectedDonation.evidence_url),
    );

    const handleVerify = async () => {
        if (!selectedDonation || !hasVerificationSource) {
            addNotification({
                type: 'error',
                title: 'Thiếu căn cứ xác minh',
                message:
                    'Hãy chọn transaction đối soát hoặc kiểm tra minh chứng trước khi xác nhận.',
            });
            return;
        }

        setSubmittingVerify(true);
        setActionDonationId(selectedDonation.id);

        try {
            await verifyFundraisingDonation(selectedDonation.id, {
                transaction_id:
                    selectedDonation.matched_transaction_id ||
                    selectedTransactionId ||
                    undefined,
                note: verifyNote.trim() || undefined,
            });
            addNotification({
                type: 'success',
                title: 'Đã xác minh đóng góp',
                message: `Khoản đóng góp #${selectedDonation.id} đã được xác nhận.`,
            });
            setShowVerifyDialog(false);
            setVerifyNote('');
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Xác minh thất bại',
                message: 'Không thể xác minh khoản đóng góp này.',
            });
        } finally {
            setSubmittingVerify(false);
            setActionDonationId(null);
        }
    };

    const handleAttachTransaction = async () => {
        if (!selectedDonation || !selectedTransactionId) {
            return;
        }

        setActionDonationId(selectedDonation.id);

        try {
            await attachFundraisingTransaction(
                selectedTransactionId,
                selectedDonation.id,
            );
            addNotification({
                type: 'success',
                title: 'Đã gắn transaction',
                message: `Khoản đóng góp #${selectedDonation.id} đã được đối soát với giao dịch ngân hàng.`,
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Đối soát thất bại',
                message: 'Không thể gắn transaction cho khoản đóng góp này.',
            });
        } finally {
            setActionDonationId(null);
        }
    };

    const handleUnmatchTransaction = async () => {
        if (!matchedTransaction || !selectedDonation) {
            return;
        }

        setActionDonationId(selectedDonation.id);

        try {
            await unmatchFundraisingTransaction(matchedTransaction.id);
            addNotification({
                type: 'success',
                title: 'Đã gỡ đối soát',
                message: `Transaction ${matchedTransaction.provider_transaction_id} đã được đưa về trạng thái chưa ghép.`,
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Gỡ đối soát thất bại',
                message: 'Không thể gỡ transaction khỏi khoản đóng góp này.',
            });
        } finally {
            setActionDonationId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedDonation || !rejectReason.trim()) {
            return;
        }

        setSubmittingReject(true);

        try {
            await rejectFundraisingDonation(
                selectedDonation.id,
                rejectReason.trim(),
            );
            addNotification({
                type: 'success',
                title: 'Đã yêu cầu kiểm tra lại',
                message: `Khoản đóng góp #${selectedDonation.id} đã được chuyển sang trạng thái cần kiểm tra lại.`,
            });
            setRejectReason('');
            setShowRejectDialog(false);
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể từ chối giao dịch',
                message: 'Hệ thống chưa thể cập nhật yêu cầu kiểm tra lại.',
            });
        } finally {
            setSubmittingReject(false);
        }
    };

    return (
        <ContentLayout title="Xác Minh Đóng Góp">
            <div className="space-y-6">
                <section className={`${surfaceClassName} border-b px-5 py-5`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="inline-flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                    aria-label="Quay lại trang trước"
                                >
                                    <ArrowLeft
                                        className="size-5"
                                        strokeWidth={1.75}
                                    />
                                </button>
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                        Xác minh đóng góp online
                                    </p>
                                    <h2 className="mt-1 text-[32px] font-semibold leading-[40px] text-[#002A58]">
                                        {module?.campaign.title ??
                                            module?.title ??
                                            'Gây quỹ trực tuyến'}
                                    </h2>
                                </div>
                            </div>
                            <p className="max-w-3xl text-[15px] leading-6 text-[#424750]">
                                Quản lý và xác nhận các khoản đóng góp tài chính
                                đi qua luồng gây quỹ online của chiến dịch.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 border-t border-[#C3C6D2] pt-4 text-[15px] lg:border-t-0 lg:pt-0">
                            <button
                                type="button"
                                className="border-b-2 border-[#002A58] pb-1 font-semibold text-[#002A58]"
                            >
                                Đóng góp tài chính
                            </button>
                            <button
                                type="button"
                                className="text-[#737781]"
                                disabled
                            >
                                Quyên góp hiện vật
                            </button>
                        </div>
                    </div>
                </section>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error ? (
                    <>
                        <section className="grid gap-4 md:grid-cols-3">
                            <article className={`${surfaceClassName} p-5`}>
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Tổng giao dịch
                                </p>
                                <p className="mt-3 text-[32px] font-bold leading-10 text-[#002A58]">
                                    {donations.length}
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    {formatCurrency(totalAmount)} trong danh
                                    sách đang hiển thị.
                                </p>
                            </article>
                            <article className={`${surfaceClassName} p-5`}>
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Chờ xác minh
                                </p>
                                <p className="mt-3 text-[32px] font-bold leading-10 text-[#C2410C]">
                                    {pendingCount}
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    Các khoản cần đối chiếu chứng từ hoặc nội
                                    dung chuyển khoản.
                                </p>
                            </article>
                            <article className={`${surfaceClassName} p-5`}>
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Đã xác minh
                                </p>
                                <p className="mt-3 text-[32px] font-bold leading-10 text-[#006D37]">
                                    {verifiedCount}
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    Giao dịch đã được xác nhận và chốt vào quỹ.
                                </p>
                            </article>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
                            <div className="space-y-4">
                                <div
                                    className={`${surfaceClassName} flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between`}
                                >
                                    <label className="relative block flex-1">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#737781]" />
                                        <input
                                            value={searchQuery}
                                            onChange={(event) =>
                                                setSearchQuery(
                                                    event.target.value,
                                                )
                                            }
                                            className={`${inputClassName} w-full pl-11`}
                                            placeholder="Tìm kiếm theo người đóng góp hoặc mã giao dịch..."
                                        />
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(
                                                event.target.value as
                                                    | DonationStatus
                                                    | 'ALL',
                                            )
                                        }
                                        className={`${inputClassName} min-w-[220px]`}
                                    >
                                        <option value="ALL">
                                            Trạng thái: Tất cả
                                        </option>
                                        {Object.entries(statusConfig).map(
                                            ([value, config]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {config.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                {filteredDonations.length === 0 ? (
                                    <EmptyState title="Không có khoản đóng góp phù hợp với bộ lọc hiện tại" />
                                ) : (
                                    <section
                                        className={`${surfaceClassName} overflow-hidden`}
                                    >
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse">
                                                <thead>
                                                    <tr className="border-b border-[#C3C6D2] bg-[#F3F4F5]">
                                                        <th className="px-6 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                            Người đóng góp
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                            Số tiền
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                            Thời gian
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                            Minh chứng
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                            Trạng thái
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredDonations.map(
                                                        (donation) => (
                                                            <tr
                                                                key={
                                                                    donation.id
                                                                }
                                                                className={`cursor-pointer border-b border-[#E7E8E9] align-top transition hover:bg-[#F8F9FA] ${
                                                                    selectedDonationId ===
                                                                    donation.id
                                                                        ? 'bg-[#F3F4F5]'
                                                                        : 'bg-white'
                                                                }`}
                                                                onClick={() =>
                                                                    setSelectedDonationId(
                                                                        donation.id,
                                                                    )
                                                                }
                                                            >
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-10 w-10 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[13px] font-bold uppercase text-[#002A58]">
                                                                            {getInitials(
                                                                                donation.donor_name,
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                                {
                                                                                    donation.donor_name
                                                                                }
                                                                            </p>
                                                                            <p className="text-[13px] leading-5 text-[#737781]">
                                                                                Mã
                                                                                đóng
                                                                                góp
                                                                                #
                                                                                {
                                                                                    donation.id
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                    {formatCurrency(
                                                                        donation.amount,
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-5 text-[15px] leading-6 text-[#191C1D]">
                                                                    {formatDateTime(
                                                                        donation.created_at,
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <span className="inline-flex h-10 w-10 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58]">
                                                                        {donation.evidence_url ? (
                                                                            <Eye
                                                                                className="size-4"
                                                                                strokeWidth={
                                                                                    1.75
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <ImageOff
                                                                                className="size-4"
                                                                                strokeWidth={
                                                                                    1.75
                                                                                }
                                                                            />
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    {getStatusBadge(
                                                                        donation.status,
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                )}
                            </div>

                            <aside
                                className={`${surfaceClassName} overflow-hidden`}
                            >
                                {selectedDonation ? (
                                    <>
                                        <div className="border-b border-[#C3C6D2] px-6 py-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Chi tiết minh chứng
                                                    </p>
                                                    <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                                        {
                                                            selectedDonation.donor_name
                                                        }
                                                    </h3>
                                                </div>
                                                {getStatusBadge(
                                                    selectedDonation.status,
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-5 px-6 py-6">
                                            <div>
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Biên lai chuyển khoản
                                                </p>
                                                <div className="mt-3 overflow-hidden border border-[#C3C6D2] bg-[#F3F4F5]">
                                                    {selectedDonation.evidence_url ? (
                                                        <img
                                                            src={
                                                                selectedDonation.evidence_url
                                                            }
                                                            alt={`Minh chứng của ${selectedDonation.donor_name}`}
                                                            className="aspect-[4/3] w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-[14px] leading-6 text-[#737781]">
                                                            Chưa có ảnh minh
                                                            chứng. Hệ thống sẽ
                                                            ưu tiên đối soát
                                                            theo transaction
                                                            ngân hàng nếu có.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                <div className="space-y-3 text-[15px] leading-6 text-[#191C1D]">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <span className="text-[#737781]">
                                                            Người gửi:
                                                        </span>
                                                        <span className="text-right font-semibold">
                                                            {
                                                                selectedDonation.donor_name
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <span className="text-[#737781]">
                                                            Số tiền:
                                                        </span>
                                                        <span className="text-right font-semibold text-[#002A58]">
                                                            {formatCurrency(
                                                                selectedDonation.amount,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <span className="text-[#737781]">
                                                            Nội dung:
                                                        </span>
                                                        <span className="text-right font-semibold">
                                                            {selectedDonation.message ||
                                                                'Không có nội dung chuyển khoản'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <span className="text-[#737781]">
                                                            Tạo lúc:
                                                        </span>
                                                        <span className="text-right font-semibold">
                                                            {formatDateTime(
                                                                selectedDonation.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <ArrowRightLeft
                                                        className="size-4 text-[#002A58]"
                                                        strokeWidth={1.75}
                                                    />
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Đối soát transaction
                                                    </p>
                                                </div>
                                                <select
                                                    value={
                                                        selectedTransactionId
                                                    }
                                                    onChange={(event) =>
                                                        setSelectedTransactionId(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`${inputClassName} w-full`}
                                                    disabled={
                                                        availableTransactions.length ===
                                                        0
                                                    }
                                                >
                                                    {availableTransactions.length ===
                                                    0 ? (
                                                        <option value="">
                                                            Không có transaction
                                                            khả dụng
                                                        </option>
                                                    ) : null}
                                                    {availableTransactions.map(
                                                        (transaction) => (
                                                            <option
                                                                key={
                                                                    transaction.id
                                                                }
                                                                value={
                                                                    transaction.id
                                                                }
                                                            >
                                                                {
                                                                    transaction.provider_transaction_id
                                                                }{' '}
                                                                -{' '}
                                                                {formatCurrency(
                                                                    transaction.amount,
                                                                )}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                {matchedTransaction ? (
                                                    <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4 text-[14px] leading-6 text-[#191C1D]">
                                                        <p className="font-semibold text-[#002A58]">
                                                            Transaction đã ghép:
                                                        </p>
                                                        <p className="mt-2">
                                                            {
                                                                matchedTransaction.provider_transaction_id
                                                            }
                                                        </p>
                                                        <p className="text-[#424750]">
                                                            {matchedTransaction.content ||
                                                                'Không có nội dung chuyển khoản'}
                                                        </p>
                                                    </div>
                                                ) : null}

                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleAttachTransaction()
                                                        }
                                                        disabled={
                                                            !selectedTransactionId ||
                                                            actionDonationId ===
                                                                selectedDonation.id
                                                        }
                                                        className="inline-flex h-11 items-center justify-center gap-2 border border-[#C3C6D2] bg-white px-4 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5] disabled:cursor-not-allowed disabled:border-[#E7E8E9] disabled:text-[#A3A7B0]"
                                                    >
                                                        <Link2
                                                            className="size-4"
                                                            strokeWidth={1.75}
                                                        />
                                                        Gắn transaction
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleUnmatchTransaction()
                                                        }
                                                        disabled={
                                                            !matchedTransaction ||
                                                            actionDonationId ===
                                                                selectedDonation.id
                                                        }
                                                        className="inline-flex h-11 items-center justify-center gap-2 border border-[#C3C6D2] bg-white px-4 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5] disabled:cursor-not-allowed disabled:border-[#E7E8E9] disabled:text-[#A3A7B0]"
                                                    >
                                                        <Unlink2
                                                            className="size-4"
                                                            strokeWidth={1.75}
                                                        />
                                                        Gỡ đối soát
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 border-t border-[#C3C6D2] px-6 py-5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowRejectDialog(true)
                                                }
                                                disabled={
                                                    selectedDonation.status ===
                                                        'VERIFIED' ||
                                                    actionDonationId ===
                                                        selectedDonation.id
                                                }
                                                className="inline-flex flex-1 items-center justify-center gap-2 border border-[#B91C1C] bg-white px-4 py-3 text-[15px] font-semibold text-[#B91C1C] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:border-[#E7E8E9] disabled:text-[#A3A7B0]"
                                            >
                                                <ShieldAlert
                                                    className="size-4"
                                                    strokeWidth={1.75}
                                                />
                                                Yêu cầu kiểm tra lại
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowVerifyDialog(true)
                                                }
                                                disabled={
                                                    [
                                                        'VERIFIED',
                                                        'REFUNDED',
                                                    ].includes(
                                                        selectedDonation.status,
                                                    ) ||
                                                    actionDonationId ===
                                                        selectedDonation.id
                                                }
                                                className="inline-flex flex-1 items-center justify-center gap-2 border border-[#006D37] bg-[#006D37] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#005228] disabled:cursor-not-allowed disabled:border-[#E7E8E9] disabled:bg-[#E7E8E9] disabled:text-[#A3A7B0]"
                                            >
                                                <ShieldCheck
                                                    className="size-4"
                                                    strokeWidth={1.75}
                                                />
                                                Xác nhận
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full items-center justify-center px-6 py-16 text-center text-[15px] leading-6 text-[#737781]">
                                        Chọn một khoản đóng góp để xem chi tiết
                                        minh chứng và thực hiện xác minh.
                                    </div>
                                )}
                            </aside>
                        </section>
                    </>
                ) : null}

                {showVerifyDialog && selectedDonation ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-xl border border-[#C3C6D2] bg-white">
                            <div className="border-b border-[#C3C6D2] px-6 py-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Xác nhận đóng góp
                                </p>
                                <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    {selectedDonation.donor_name}
                                </h3>
                            </div>
                            <div className="space-y-4 px-6 py-6">
                                <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4 text-[14px] leading-6 text-[#191C1D]">
                                    <p>
                                        Số tiền:{' '}
                                        <span className="font-semibold">
                                            {formatCurrency(
                                                selectedDonation.amount,
                                            )}
                                        </span>
                                    </p>
                                    <p className="mt-2">
                                        Transaction áp dụng:{' '}
                                        <span className="font-semibold">
                                            {matchedTransaction?.provider_transaction_id ||
                                                selectedTransactionId ||
                                                'Xác minh theo minh chứng'}
                                        </span>
                                    </p>
                                </div>
                                {!hasVerificationSource ? (
                                    <div className="border border-[#FECACA] bg-[#FEF2F2] p-4 text-[14px] leading-6 text-[#B91C1C]">
                                        Cần có transaction đối soát hoặc minh
                                        chứng chuyển khoản trước khi xác nhận.
                                    </div>
                                ) : null}
                                <label className="block">
                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                        Ghi chú xác minh
                                    </span>
                                    <textarea
                                        value={verifyNote}
                                        onChange={(event) =>
                                            setVerifyNote(event.target.value)
                                        }
                                        rows={4}
                                        className="w-full border border-[#C3C6D2] bg-white px-4 py-3 text-[15px] leading-6 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                        placeholder="Ví dụ: đã đối chiếu transaction và ảnh minh chứng khớp số tiền."
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#C3C6D2] px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowVerifyDialog(false);
                                        setVerifyNote('');
                                    }}
                                    className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        submittingVerify ||
                                        !hasVerificationSource
                                    }
                                    onClick={() => void handleVerify()}
                                    className="inline-flex h-11 items-center justify-center border border-[#006D37] bg-[#006D37] px-5 text-[15px] font-semibold text-white transition hover:bg-[#005228] disabled:cursor-not-allowed disabled:border-[#E7E8E9] disabled:bg-[#E7E8E9] disabled:text-[#A3A7B0]"
                                >
                                    {submittingVerify
                                        ? 'Đang xác nhận...'
                                        : 'Xác nhận đóng góp'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {showRejectDialog && selectedDonation ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-xl border border-[#C3C6D2] bg-white">
                            <div className="border-b border-[#C3C6D2] px-6 py-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#B91C1C]">
                                    Yêu cầu kiểm tra lại
                                </p>
                                <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    {selectedDonation.donor_name}
                                </h3>
                            </div>
                            <div className="space-y-4 px-6 py-6">
                                <div className="border border-[#FECACA] bg-[#FEF2F2] p-4 text-[14px] leading-6 text-[#B91C1C]">
                                    Nêu rõ lý do để người đóng góp có thể bổ
                                    sung minh chứng hoặc kiểm tra lại giao dịch.
                                </div>
                                <label className="block">
                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                        Lý do yêu cầu kiểm tra lại *
                                    </span>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(event) =>
                                            setRejectReason(event.target.value)
                                        }
                                        rows={5}
                                        className="w-full border border-[#FCA5A5] bg-white px-4 py-3 text-[15px] leading-6 text-[#191C1D] outline-none transition focus:border-[#F87171] focus:ring-4 focus:ring-[#FCA5A5]/30"
                                        placeholder="Ví dụ: Minh chứng chưa hiển thị rõ số tiền hoặc nội dung chuyển khoản cần bổ sung."
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#C3C6D2] px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRejectDialog(false);
                                        setRejectReason('');
                                    }}
                                    className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        submittingReject || !rejectReason.trim()
                                    }
                                    onClick={() => void handleReject()}
                                    className="inline-flex h-11 items-center justify-center border border-[#93000A] bg-[#93000A] px-5 text-[15px] font-semibold text-white transition hover:bg-[#7F0008] disabled:cursor-not-allowed disabled:border-[#E7E8E9] disabled:bg-[#E7E8E9] disabled:text-[#A3A7B0]"
                                >
                                    {submittingReject
                                        ? 'Đang gửi yêu cầu...'
                                        : 'Gửi yêu cầu kiểm tra lại'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};
