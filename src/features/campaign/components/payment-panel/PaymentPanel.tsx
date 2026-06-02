import React from 'react';
import { Clock3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import {
    type FundraisingDonationPaymentDetail,
    getDonationById,
} from '@/features/campaign/api/fundraising';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import { paths } from '@/config/paths';

type Props = { donationId: string };

const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '-';
    return `${new Intl.NumberFormat('vi-VN').format(amount)} VND`;
};

const formatCountdown = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
        return `${hours} giờ ${minutes} phút ${remainingSeconds} giây`;
    }

    return `${minutes} phút ${remainingSeconds} giây`;
};

const getStatusCopy = (donation: FundraisingDonationPaymentDetail) => {
    const isOrderVa = donation.payment_mode === 'ORDER_VA';

    switch (donation.status) {
        case 'MATCHED':
            return {
                title: 'Đã ghi nhận giao dịch',
                description:
                    isOrderVa
                        ? 'Hệ thống đã ghi nhận thanh toán vào order/VA của donation. Đơn vị tổ chức sẽ xác minh trong bước tiếp theo.'
                        : 'Hệ thống đã khớp giao dịch với donation của bạn. Đơn vị tổ chức sẽ xác minh trong bước tiếp theo.',
                tone: 'info',
            };
        case 'VERIFIED':
            return {
                title: 'Đã xác minh thành công',
                description:
                    'Đóng góp của bạn đã được xác minh. Cảm ơn bạn đã đồng hành cùng chiến dịch.',
                tone: 'success',
            };
        case 'REJECTED':
            return {
                title: 'Đóng góp cần xử lý lại',
                description:
                    donation.reject_reason?.trim() ||
                    'Đơn vị tổ chức đã từ chối giao dịch này. Vui lòng xem lý do và tạo donation mới nếu cần.',
                tone: 'danger',
            };
        default:
            return {
                title: isOrderVa ? 'Chờ thanh toán qua Order VA' : 'Chờ chuyển khoản',
                description:
                    isOrderVa
                        ? 'Quét mã QR SePay hoặc chuyển vào tài khoản ảo bên dưới. Hệ thống sẽ tự động cập nhật khi SePay ghi nhận thanh toán cho order này.'
                        : 'Quét mã QR hoặc chuyển khoản đúng nội dung bên dưới. Hệ thống sẽ tự động cập nhật khi SePay ghi nhận giao dịch.',
                tone: 'warning',
            };
    }
};

const statusToneClass: Record<string, string> = {
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
};

export const PaymentPanel: React.FC<Props> = ({ donationId }) => {
    const navigate = useNavigate();
    const [donation, setDonation] =
        React.useState<FundraisingDonationPaymentDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [now, setNow] = React.useState(() => Date.now());

    const fetchDonation = React.useCallback(
        async (mode: 'initial' | 'refresh' | 'poll' = 'poll') => {
            if (mode === 'refresh') {
                setRefreshing(true);
            }

            try {
                const data = await getDonationById(donationId);
                setDonation(data);
                setError(null);
            } catch {
                if (mode === 'initial') {
                    setError('Không thể tải thông tin thanh toán.');
                }
            } finally {
                if (mode === 'initial') {
                    setLoading(false);
                }
                if (mode === 'refresh') {
                    setRefreshing(false);
                }
            }
        },
        [donationId],
    );

    React.useEffect(() => {
        void fetchDonation('initial');
    }, [fetchDonation]);

    React.useEffect(() => {
        if (!donation || !['PENDING', 'MATCHED'].includes(donation.status)) {
            return undefined;
        }

        const pollId = window.setInterval(() => {
            void fetchDonation('poll');
        }, 5000);

        return () => window.clearInterval(pollId);
    }, [donation, fetchDonation]);

    React.useEffect(() => {
        const tickerId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => window.clearInterval(tickerId);
    }, []);

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                Đang tải thông tin thanh toán...
            </div>
        );
    }

    if (error || !donation) {
        return (
            <div className="space-y-4 rounded-xl border border-red-200 bg-white p-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                        Không tải được thanh toán
                    </h3>
                    <p className="text-sm text-slate-600">
                        {error ?? 'Không tìm thấy thông tin thanh toán.'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void fetchDonation('refresh')}
                        disabled={refreshing}
                    >
                        {refreshing ? 'Đang tải lại...' : 'Tải lại'}
                    </Button>
                    <Button
                        type="button"
                        onClick={() =>
                            navigate(paths.app.myDonations.getHref())
                        }
                    >
                        Về đóng góp của tôi
                    </Button>
                </div>
            </div>
        );
    }

    const instr = donation.payment_instruction ?? {};
    const isOrderVa = donation.payment_mode === 'ORDER_VA';
    const virtualAccount = instr.virtual_account ?? null;
    const qrUrl = instr.provider_qr_url ?? instr.vietqr_url ?? null;
    const destinationAccountNo =
        virtualAccount?.va_number ?? instr.bank_account_no ?? '-';
    const expiresAt = instr.expires_at ? new Date(instr.expires_at) : null;
    const timeLeft =
        expiresAt && donation.status === 'PENDING'
            ? Math.max(
                  0,
                  Math.floor((expiresAt.getTime() - now) / 1000),
              )
            : null;
    const isExpired = timeLeft === 0 && donation.status === 'PENDING';
    const statusCopy = getStatusCopy(donation);

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                        Thanh toán donation
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Mã donation #{donation.id}
                    </p>
                </div>
                <StatusBadge status={donation.status} />
            </div>

            <div
                className={`rounded-xl border px-4 py-3 ${statusToneClass[statusCopy.tone]}`}
                data-testid="payment-status-banner"
            >
                <p className="text-sm font-semibold">{statusCopy.title}</p>
                <p className="mt-1 text-sm leading-6">{statusCopy.description}</p>
            </div>

            {qrUrl ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col items-center">
                        <img
                            src={qrUrl}
                            alt={isOrderVa ? 'SePay order QR' : 'VietQR'}
                            className="h-52 w-52 rounded-lg bg-white object-contain p-2 shadow-sm"
                        />
                        <p className="mt-3 text-center text-sm text-slate-600">
                            {isOrderVa
                                ? 'Quét mã QR SePay để thanh toán đúng order và tài khoản ảo đã cấp cho donation này.'
                                : 'Quét mã QR bằng ứng dụng ngân hàng để thanh toán đúng số tiền và nội dung chuyển khoản.'}
                        </p>
                    </div>
                </div>
            ) : null}

            {isOrderVa ? (
                <div
                    className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-950"
                    data-testid="payment-order-va-summary"
                >
                    <p className="font-semibold">Chế độ thanh toán: Order VA</p>
                    <p className="mt-1 leading-6">
                        Donation này dùng tài khoản ảo và order SePay riêng.
                        Ưu tiên quét QR hoặc chuyển đúng vào VA để hệ thống khớp
                        tự động theo `order_code`.
                    </p>
                </div>
            ) : null}

            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                {isOrderVa ? (
                    <>
                        <div>
                            <dt className="text-slate-500">Order SePay</dt>
                            <dd className="mt-1 break-all font-semibold text-slate-900">
                                {instr.sepay_order_id ??
                                    donation.provider_references
                                        ?.sepay_order_id ??
                                    '-'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">
                                Tài khoản ảo (VA)
                            </dt>
                            <dd
                                className="mt-1 break-all font-semibold text-slate-900"
                                data-testid="payment-virtual-account"
                            >
                                {virtualAccount?.va_number ?? '-'}
                            </dd>
                        </div>
                    </>
                ) : null}
                <div>
                    <dt className="text-slate-500">Người nhận</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                        {instr.receiver_name ?? '-'}
                    </dd>
                </div>
                <div>
                    <dt className="text-slate-500">Ngân hàng</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                        {instr.bank_name ?? '-'}
                    </dd>
                </div>
                <div>
                    <dt className="text-slate-500">
                        {isOrderVa ? 'Tài khoản nhận hiện hành' : 'Số tài khoản'}
                    </dt>
                    <dd className="mt-1 break-all font-semibold text-slate-900">
                        {destinationAccountNo}
                    </dd>
                </div>
                <div>
                    <dt className="text-slate-500">Số tiền</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(instr.amount)}
                    </dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-slate-500">Nội dung chuyển khoản</dt>
                    <dd className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-950">
                        {instr.transfer_content ??
                            instr.payment_code ??
                            (isOrderVa
                                ? 'Không bắt buộc khi thanh toán đúng VA/order'
                                : '-')}
                    </dd>
                </div>
            </dl>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                    <Clock3 className="size-4" />
                    Thời hạn thanh toán
                </div>
                <p className="mt-2">
                    {timeLeft != null
                        ? formatCountdown(timeLeft)
                        : 'Không xác định'}
                </p>
                {isExpired ? (
                    <p className="mt-2 text-xs text-slate-600">
                        Mã đã quá 60 phút. Nếu bạn chưa chuyển khoản, nên tạo
                        donation mới. Nếu đã chuyển khoản đúng nội dung, hệ thống
                        vẫn có thể ghi nhận giao dịch khi webhook đến muộn.
                    </p>
                ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchDonation('refresh')}
                    disabled={refreshing}
                >
                    <RefreshCw
                        className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    {refreshing ? 'Đang làm mới...' : 'Làm mới trạng thái'}
                </Button>
                <Button
                    type="button"
                    onClick={() => navigate(paths.app.myDonations.getHref())}
                >
                    Về đóng góp của tôi
                </Button>
            </div>
        </div>
    );
};

export default PaymentPanel;
