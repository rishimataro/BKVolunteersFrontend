import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Banknote, Heart } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUser } from '@/features/auth';
import {
    createMoneyDonation,
    getFundraisingModule,
    type FundraisingModuleDetail,
} from '@/features/campaign/api/fundraising';
import {
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);

const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

export const DonateRoute = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const { addNotification } = useNotifications();

    const [module, setModule] = useState<FundraisingModuleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [amount, setAmount] = useState<number>(0);
    const [customAmount, setCustomAmount] = useState('');
    const [donorName, setDonorName] = useState(
        user.data
            ? `${user.data.firstName ?? ''} ${user.data.lastName ?? ''}`.trim()
            : '',
    );
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!moduleId) return;
        setIsLoading(true);
        let isMounted = true;
        getFundraisingModule(moduleId)
            .then((mod) => {
                if (isMounted) setModule(mod);
            })
            .catch(() => {
                if (isMounted) setError('Không thể tải thông tin gây quỹ.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [moduleId]);

    const handleQuickAmount = (val: number) => {
        setAmount(val);
        setCustomAmount('');
    };

    const handleCustomAmount = (val: string) => {
        setCustomAmount(val);
        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
        setAmount(isNaN(parsed) ? 0 : parsed);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moduleId || amount <= 0) return;
        setSubmitting(true);
        try {
            const res = await createMoneyDonation(moduleId, {
                amount,
                donor_name: donorName.trim() || undefined,
                message: message.trim() || undefined,
            });
            addNotification({
                type: 'success',
                title: 'Đóng góp thành công',
                message: 'Cảm ơn bạn đã đóng góp!',
            });
            if (res && (res as any).id) {
                navigate(paths.app.donationPayment.getHref(String((res as any).id)))
            } else {
                navigate(paths.app.myDonations.getHref())
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể gửi đóng góp.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ContentLayout title="Ủng hộ">
            <div className="mx-auto max-w-lg space-y-6">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Banknote className="h-6 w-6 text-[#2E5077]" />
                    <h2 className="text-xl font-bold text-[#2E5077]">Ủng hộ</h2>
                </div>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {module ? (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
                    >
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-900">
                                {module.campaign?.title ?? 'Chiến dịch'}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                {module.title}
                            </p>
                            {module.total_raised != null ? (
                                <p className="mt-2 text-sm text-slate-600">
                                    Đã quyên góp được{' '}
                                    <span className="font-semibold text-emerald-600">
                                        {formatCurrency(module.total_raised)}
                                    </span>
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Chọn số tiền
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {quickAmounts.map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleQuickAmount(val)}
                                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                                            amount === val
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        {formatCurrency(val)}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3">
                                <label className="mb-1 block text-sm text-slate-500">
                                    Hoặc nhập số tiền khác
                                </label>
                                <Input
                                    type="text"
                                    value={customAmount}
                                    onChange={(e) =>
                                        handleCustomAmount(e.target.value)
                                    }
                                    placeholder="Nhập số tiền"
                                    className="h-10"
                                />
                            </div>
                            {amount > 0 ? (
                                <p className="mt-2 text-center text-lg font-bold text-emerald-600">
                                    {formatCurrency(amount)}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Tên người đóng góp
                            </label>
                            <Input
                                type="text"
                                value={donorName}
                                onChange={(e) => setDonorName(e.target.value)}
                                placeholder="Tên của bạn"
                                className="h-10"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Lời nhắn (không bắt buộc)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                placeholder="Lời nhắn của bạn..."
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting || amount <= 0}
                            className="w-full"
                        >
                            <Heart className="mr-2 size-4" />
                            {submitting
                                ? 'Đang xử lý...'
                                : `Ủng hộ ${amount > 0 ? formatCurrency(amount) : ''}`}
                        </Button>
                    </form>
                ) : null}
            </div>
        </ContentLayout>
    );
};
