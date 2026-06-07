import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
    ArrowLeft,
    Banknote,
    Copy,
    Info,
    Landmark,
    ReceiptText,
} from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUser } from '@/features/auth';
import {
    createMoneyDonation,
    getFundraisingDonations,
    getFundraisingModule,
    type FundraisingDonationItem,
    type FundraisingModuleDetail,
} from '@/features/campaign/api/fundraising';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);

const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const textareaClassName =
    'min-h-28 w-full border border-input bg-white px-3 py-3 text-[16px] leading-7 text-primary outline-none transition focus:border-2 focus:border-primary';

const moduleStatusLabel: Record<string, string> = {
    ACTIVE: 'Đang diễn ra',
    ONGOING: 'Đang diễn ra',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
};

const getInitials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

const getRelativeTimeLabel = (value: string) => {
    const date = new Date(value);
    const diffMinutes = Math.max(
        0,
        Math.round((Date.now() - date.getTime()) / 60000),
    );

    if (diffMinutes < 60) {
        return `${diffMinutes || 1} phút trước`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    }

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ngày trước`;
};

const readConfigText = (
    config: FundraisingModuleDetail['config'],
    key: string,
) => String(config[key] ?? '').trim();

const readConfigNumber = (
    config: FundraisingModuleDetail['config'],
    key: string,
) => {
    const value = Number(config[key] ?? 0);
    return Number.isFinite(value) ? value : 0;
};

export const DonateRoute = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const { addNotification } = useNotifications();

    const [module, setModule] = React.useState<FundraisingModuleDetail | null>(
        null,
    );
    const [recentDonations, setRecentDonations] = React.useState<
        FundraisingDonationItem[]
    >([]);
    const [totalDonations, setTotalDonations] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [amount, setAmount] = React.useState<number>(0);
    const [customAmount, setCustomAmount] = React.useState('');
    const [donorName, setDonorName] = React.useState(
        user.data
            ? `${user.data.firstName ?? ''} ${user.data.lastName ?? ''}`.trim()
            : '',
    );
    const [message, setMessage] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!moduleId) {
            setIsLoading(false);
            setError('Không tìm thấy hạng mục gây quỹ.');
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        Promise.all([
            getFundraisingModule(moduleId),
            getFundraisingDonations(moduleId, {
                page: 1,
                limit: 3,
            }),
        ])
            .then(([moduleDetail, donationsPage]) => {
                if (!isMounted) {
                    return;
                }

                setModule(moduleDetail);
                setRecentDonations(donationsPage.items);
                setTotalDonations(donationsPage.pagination.total);
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }

                setError('Không thể tải thông tin đóng góp tài chính.');
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [moduleId]);

    const handleQuickAmount = (value: number) => {
        setAmount(value);
        setCustomAmount(String(value));
    };

    const handleCustomAmount = (value: string) => {
        const normalized = value.replace(/[^0-9]/g, '');
        setCustomAmount(normalized);

        const parsed = Number(normalized);
        setAmount(Number.isFinite(parsed) ? parsed : 0);
    };

    const handleCopy = async (value: string, label: string) => {
        if (!value || !navigator?.clipboard?.writeText) {
            addNotification({
                type: 'error',
                title: 'Không thể sao chép',
                message: `Trình duyệt hiện không hỗ trợ sao chép ${label.toLowerCase()}.`,
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            addNotification({
                type: 'success',
                title: 'Đã sao chép',
                message: `${label} đã được sao chép.`,
            });
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể sao chép',
                message: `Vui lòng sao chép ${label.toLowerCase()} thủ công.`,
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!moduleId || amount <= 0) {
            return;
        }

        setSubmitting(true);

        try {
            const result = await createMoneyDonation(moduleId, {
                amount,
                donor_name: donorName.trim() || undefined,
                message: message.trim() || undefined,
            });

            addNotification({
                type: 'success',
                title: 'Đóng góp thành công',
                message:
                    'Hệ thống đang chuyển bạn sang bước thanh toán để nhận mã chuyển khoản riêng.',
            });

            if (result?.id) {
                navigate(paths.app.donationPayment.getHref(String(result.id)));
                return;
            }

            navigate(paths.app.myDonations.getHref());
        } catch {
            addNotification({
                type: 'error',
                title: 'Đóng góp thất bại',
                message: 'Không thể khởi tạo giao dịch đóng góp.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const targetAmount = module
        ? readConfigNumber(module.config, 'target_amount')
        : 0;
    const bankName = module ? readConfigText(module.config, 'bank_name') : '';
    const bankAccountNo = module
        ? readConfigText(module.config, 'bank_account_no')
        : '';
    const receiverName = module
        ? readConfigText(module.config, 'receiver_name')
        : '';
    const progressPercent =
        targetAmount > 0
            ? Math.min(
                  100,
                  Math.round(
                      ((module?.total_raised ?? 0) / targetAmount) * 100,
                  ),
              )
            : 0;
    const backHref = module
        ? paths.app.campaigns.detail.getHref(module.campaign.slug)
        : paths.app.campaigns.getHref();
    const moduleStatus =
        moduleStatusLabel[module?.status ?? ''] ?? 'Đang nhận đóng góp';

    return (
        <>
            <Head
                title={
                    module?.campaign?.title
                        ? `Đóng góp tài chính | ${module.campaign.title}`
                        : 'Đóng góp tài chính'
                }
            />
            <div className="bg-white">
                <section className="border-b border-border pb-6">
                    <Link
                        to={backHref}
                        className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition hover:text-primary"
                    >
                        <ArrowLeft className="size-4" strokeWidth={1.75} />
                        Quay lại chi tiết chiến dịch
                    </Link>

                    <div className="mt-5 max-w-5xl">
                        <p className="broadsheet-kicker">Khu vực sinh viên</p>
                        <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-primary sm:text-[56px]">
                            Đóng góp tài chính
                        </h1>
                        <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">
                            Theo dõi tiến độ gây quỹ, kiểm tra thông tin tài
                            khoản nhận đóng góp và tạo giao dịch thanh toán với
                            mã chuyển khoản riêng cho từng lượt ủng hộ.
                        </p>
                    </div>
                </section>

                <section className="pt-8">
                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && !module ? (
                        <EmptyState title="Không tìm thấy hạng mục gây quỹ" />
                    ) : null}

                    {!isLoading && !error && module ? (
                        <>
                            <div className="mb-8 border border-input bg-muted p-5">
                                <p className="broadsheet-kicker">
                                    Chiến dịch đang nhận đóng góp
                                </p>
                                <h2 className="mt-3 font-heading text-[34px] leading-[1.15] font-bold text-primary">
                                    {module.campaign.title}
                                </h2>
                                <p className="mt-2 text-[16px] leading-7 text-muted-foreground">
                                    Hạng mục: {module.title}
                                </p>
                            </div>

                            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
                                <div className="space-y-6">
                                    <section className="border border-input bg-white">
                                        <div className="flex flex-col gap-3 border-b border-input px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <Landmark
                                                    className="size-4 text-primary"
                                                    strokeWidth={1.75}
                                                />
                                                <p className="broadsheet-kicker">
                                                    Thông tin thanh toán
                                                </p>
                                            </div>
                                            <p className="text-[12px] leading-5 text-muted-foreground">
                                                QR và nội dung chuyển khoản sẽ
                                                được tạo ở bước thanh toán tiếp
                                                theo.
                                            </p>
                                        </div>

                                        <div className="grid gap-6 p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                                            <div className="border border-input bg-muted p-5">
                                                <div className="flex aspect-square items-center justify-center border border-input bg-white">
                                                    <div className="flex flex-col items-center gap-3 text-center">
                                                        <Banknote
                                                            className="size-10 text-primary"
                                                            strokeWidth={1.5}
                                                        />
                                                        <p className="max-w-[160px] text-[14px] leading-6 text-muted-foreground">
                                                            Xác nhận số tiền để
                                                            hệ thống tạo mã QR
                                                            và hướng dẫn chuyển
                                                            khoản riêng.
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-center text-[14px] leading-6 italic text-muted-foreground">
                                                    Thanh toán được đối soát
                                                    theo từng giao dịch trên
                                                    cổng BK Volunteers.
                                                </p>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <p className="broadsheet-kicker">
                                                        Ngân hàng nhận
                                                    </p>
                                                    <div className="mt-2 border border-input bg-muted px-4 py-3 text-[18px] font-semibold text-primary">
                                                        {bankName ||
                                                            'Ban tổ chức chưa cập nhật'}
                                                    </div>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <p className="broadsheet-kicker">
                                                        Số tài khoản
                                                    </p>
                                                    <div className="mt-2 flex items-center justify-between gap-3 border border-input bg-muted px-4 py-3">
                                                        <span className="text-[22px] font-bold tracking-[0.08em] text-primary">
                                                            {bankAccountNo ||
                                                                'Chưa cập nhật'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleCopy(
                                                                    bankAccountNo,
                                                                    'Số tài khoản',
                                                                )
                                                            }
                                                            className="inline-flex h-10 w-10 items-center justify-center border border-input bg-white text-primary transition hover:bg-[#F3F4F6]"
                                                            aria-label="Sao chép số tài khoản"
                                                        >
                                                            <Copy
                                                                className="size-4"
                                                                strokeWidth={
                                                                    1.75
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <p className="broadsheet-kicker">
                                                        Chủ tài khoản
                                                    </p>
                                                    <div className="mt-2 border border-input bg-muted px-4 py-3 text-[18px] font-semibold uppercase text-primary">
                                                        {receiverName ||
                                                            'Chưa cập nhật'}
                                                    </div>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <p className="broadsheet-kicker">
                                                        Bước chuyển khoản
                                                    </p>
                                                    <div className="mt-2 border border-input bg-muted px-4 py-3 text-[15px] leading-7 text-muted-foreground">
                                                        Sau khi xác nhận số
                                                        tiền, hệ thống sẽ cấp
                                                        nội dung chuyển khoản và
                                                        trang QR riêng để bạn
                                                        hoàn tất thanh toán an
                                                        toàn.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="border border-input bg-muted p-5">
                                        <div className="flex items-start gap-3">
                                            <Info
                                                className="mt-1 size-4 shrink-0 text-primary"
                                                strokeWidth={1.75}
                                            />
                                            <div>
                                                <p className="broadsheet-kicker text-primary">
                                                    Cam kết minh bạch
                                                </p>
                                                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                                                    Mỗi khoản đóng góp sẽ được
                                                    hệ thống ghi nhận theo mã
                                                    giao dịch riêng và điều
                                                    hướng sang bước thanh toán
                                                    để đảm bảo đối soát rõ ràng
                                                    trước khi cập nhật về hồ sơ
                                                    đóng góp của bạn.
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section className="border border-input bg-white p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <span className="inline-flex border border-primary px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary">
                                                    {moduleStatus}
                                                </span>
                                                <p className="mt-3 text-[32px] font-bold text-primary">
                                                    {formatCurrency(
                                                        module.total_raised ??
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right text-[14px] leading-6 text-muted-foreground">
                                                <p>Mục tiêu</p>
                                                <p className="mt-1 font-semibold text-primary">
                                                    {targetAmount > 0
                                                        ? formatCurrency(
                                                              targetAmount,
                                                          )
                                                        : 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 h-3 border border-input bg-muted">
                                            <div
                                                className="h-full bg-primary"
                                                style={{
                                                    width: `${progressPercent}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-4 text-[14px] leading-6">
                                            <span className="font-semibold text-primary">
                                                {progressPercent}% hoàn thành
                                            </span>
                                            <span className="text-muted-foreground">
                                                {totalDonations.toLocaleString(
                                                    'vi-VN',
                                                )}{' '}
                                                lượt đóng góp
                                            </span>
                                        </div>
                                    </section>

                                    <section className="border border-input bg-white p-5">
                                        <div className="border-b border-border pb-5">
                                            <p className="broadsheet-kicker">
                                                Tạo giao dịch
                                            </p>
                                            <h2 className="mt-3 font-heading text-[32px] leading-[1.1] font-bold text-primary">
                                                Xác nhận đóng góp
                                            </h2>
                                            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                                                Nhập số tiền bạn muốn đóng góp.
                                                Sau khi xác nhận, hệ thống sẽ
                                                chuyển sang bước thanh toán có
                                                mã chuyển khoản riêng.
                                            </p>
                                        </div>

                                        <form
                                            onSubmit={(event) =>
                                                void handleSubmit(event)
                                            }
                                            className="space-y-5 pt-5"
                                        >
                                            <div>
                                                <label
                                                    htmlFor="donation-amount"
                                                    className="broadsheet-kicker"
                                                >
                                                    Số tiền đóng góp (VND)
                                                </label>
                                                <Input
                                                    id="donation-amount"
                                                    type="text"
                                                    value={customAmount}
                                                    onChange={(event) =>
                                                        handleCustomAmount(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-2"
                                                    placeholder="Nhập số tiền muốn đóng góp"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {quickAmounts.map((value) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuickAmount(
                                                                value,
                                                            )
                                                        }
                                                        className={`border px-3 py-3 text-[14px] font-semibold transition ${
                                                            amount === value
                                                                ? 'border-primary bg-primary text-white'
                                                                : 'border-input bg-white text-primary hover:bg-muted'
                                                        }`}
                                                    >
                                                        {formatCurrency(value)}
                                                    </button>
                                                ))}
                                            </div>

                                            {amount > 0 ? (
                                                <div className="border border-input bg-muted px-4 py-3 text-[16px] leading-7 text-primary">
                                                    Tổng số tiền xác nhận:{' '}
                                                    <span className="font-semibold">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                </div>
                                            ) : null}

                                            <div>
                                                <label
                                                    htmlFor="donor-name"
                                                    className="broadsheet-kicker"
                                                >
                                                    Tên nhà hảo tâm
                                                </label>
                                                <Input
                                                    id="donor-name"
                                                    type="text"
                                                    value={donorName}
                                                    onChange={(event) =>
                                                        setDonorName(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-2"
                                                    placeholder="Nhập tên hiển thị cho khoản đóng góp"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="donation-message"
                                                    className="broadsheet-kicker"
                                                >
                                                    Lời nhắn
                                                </label>
                                                <textarea
                                                    id="donation-message"
                                                    value={message}
                                                    onChange={(event) =>
                                                        setMessage(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`mt-2 ${textareaClassName}`}
                                                    placeholder="Chia sẻ lời nhắn đồng hành cùng chiến dịch."
                                                />
                                            </div>

                                            <div className="border-t border-border pt-5">
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full"
                                                    disabled={
                                                        submitting ||
                                                        amount <= 0
                                                    }
                                                >
                                                    <ReceiptText
                                                        className="size-4"
                                                        strokeWidth={1.75}
                                                    />
                                                    {submitting
                                                        ? 'Đang tạo giao dịch'
                                                        : 'Xác nhận đóng góp'}
                                                </Button>
                                                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                                                    Bằng cách xác nhận, bạn đồng
                                                    ý chuyển sang bước thanh
                                                    toán và nhận hướng dẫn
                                                    chuyển khoản dành riêng cho
                                                    giao dịch này.
                                                </p>
                                            </div>
                                        </form>
                                    </section>
                                </div>
                            </div>

                            <section className="mt-10 border-t border-border pt-8">
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <p className="broadsheet-kicker">
                                            Cộng đồng đồng hành
                                        </p>
                                        <h2 className="mt-3 font-heading text-[32px] leading-[1.1] font-bold text-primary">
                                            Đóng góp gần đây
                                        </h2>
                                    </div>
                                    <p className="text-[14px] leading-6 text-muted-foreground">
                                        Cập nhật từ các giao dịch gây quỹ mới
                                        nhất.
                                    </p>
                                </div>

                                {recentDonations.length > 0 ? (
                                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                                        {recentDonations.map((donation) => (
                                            <article
                                                key={donation.id}
                                                className="border border-input bg-white p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-input bg-muted text-[20px] font-semibold text-primary">
                                                        {getInitials(
                                                            donation.donor_name,
                                                        ) || 'AN'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[18px] font-semibold text-primary">
                                                            {
                                                                donation.donor_name
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-[18px] font-bold text-primary">
                                                            {formatCurrency(
                                                                donation.amount,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                                                            {getRelativeTimeLabel(
                                                                donation.created_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-6">
                                        <EmptyState
                                            title="Chưa có đóng góp gần đây"
                                            description="Hãy trở thành một trong những nhà hảo tâm đầu tiên cho hạng mục này."
                                        />
                                    </div>
                                )}
                            </section>
                        </>
                    ) : null}
                </section>
            </div>
        </>
    );
};
