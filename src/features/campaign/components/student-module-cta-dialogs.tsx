import * as React from 'react';
import { CalendarDays, HandCoins, Info, MapPin, Phone, ReceiptText, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { createEventRegistration } from '@/features/campaign/api/events';
import { createMoneyDonation } from '@/features/campaign/api/fundraising';
import {
    createItemPledge,
    getItemTargets,
    type ItemTargetItem,
} from '@/features/campaign/api/item-donations';
import type { PublicCampaignDetail } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

type CampaignModule = PublicCampaignDetail['modules'][number];

type StudentIdentity = {
    fullName: string;
    studentCode: string;
    phone: string;
};

type BaseDialogProps = {
    campaign: PublicCampaignDetail;
    module: CampaignModule | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: StudentIdentity;
};

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const textareaClassName =
    'min-h-28 w-full border border-input bg-white px-3 py-3 text-[16px] leading-7 text-primary outline-none transition focus:border-2 focus:border-primary';

const surfaceClassName =
    'rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600';

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return dateFormatter.format(date);
};

const readSettingText = (settings: Record<string, unknown>, key: string) => {
    const value = settings[key];
    return typeof value === 'string' ? value.trim() : '';
};

const readSettingNumber = (settings: Record<string, unknown>, key: string) => {
    const value = Number(settings[key] ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
};

const parseSkills = (value: string) =>
    value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);

export const StudentEventRegistrationDialog = ({
    campaign,
    module,
    open,
    onOpenChange,
    student,
}: BaseDialogProps) => {
    const { addNotification } = useNotifications();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [form, setForm] = React.useState({
        phone: student.phone,
        skillsNote: '',
        committed: false,
    });
    const [errors, setErrors] = React.useState({
        phone: '',
        committed: '',
    });

    React.useEffect(() => {
        if (!open) {
            return;
        }

        setForm({
            phone: student.phone,
            skillsNote: '',
            committed: false,
        });
        setErrors({
            phone: '',
            committed: '',
        });
    }, [open, student.phone, module?.id]);

    if (!module) {
        return null;
    }

    const location = readSettingText(module.settings, 'location');
    const quota = readSettingNumber(module.settings, 'quota');
    const currentRegistrations = module.progress?.current ?? 0;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedPhone = form.phone.trim();
        const trimmedSkillsNote = form.skillsNote.trim();
        const nextErrors = {
            phone: trimmedPhone
                ? ''
                : 'Vui lòng nhập số điện thoại liên lạc.',
            committed: form.committed
                ? ''
                : 'Bạn cần xác nhận cam kết trước khi gửi đăng ký.',
        };

        setErrors(nextErrors);

        if (nextErrors.phone || nextErrors.committed) {
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await createEventRegistration(module.id, {
                answers: {
                    phone: trimmedPhone,
                    note: trimmedSkillsNote,
                    skills: parseSkills(trimmedSkillsNote),
                    student_name: student.fullName,
                    student_code: student.studentCode,
                },
            });

            addNotification({
                type: 'success',
                title: 'Gửi đăng ký thành công',
                message:
                    result.status === 'APPROVED'
                        ? 'Bạn đã được duyệt tham gia ngay.'
                        : 'Hồ sơ tham gia đã được ghi nhận và đang chờ xét duyệt.',
            });

            onOpenChange(false);
        } catch (submitError) {
            addNotification({
                type: 'error',
                title: 'Gửi đăng ký thất bại',
                message:
                    submitError instanceof Error
                        ? submitError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl overflow-y-auto p-0">
                <div className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle>Phiếu đăng ký tình nguyện</DialogTitle>
                    <DialogDescription>
                        {toDisplayTitle(module.title)} ·{' '}
                        {toDisplayTitle(campaign.title)}
                    </DialogDescription>
                </div>

                <div className="grid gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <div className={surfaceClassName}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Thông tin hoạt động
                            </p>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-1 size-4 text-primary" strokeWidth={1.75} />
                                    <div>
                                        <p className="font-semibold text-slate-900">Thời gian</p>
                                        <p>
                                            {formatDate(module.start_at)} -{' '}
                                            {formatDate(module.end_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-1 size-4 text-primary" strokeWidth={1.75} />
                                    <div>
                                        <p className="font-semibold text-slate-900">Địa điểm</p>
                                        <p>
                                            {location ||
                                                'Theo thông báo từ ban tổ chức'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="mt-1 size-4 text-primary" strokeWidth={1.75} />
                                    <div>
                                        <p className="font-semibold text-slate-900">Chỉ tiêu</p>
                                        <p>
                                            {quota > 0
                                                ? `${currentRegistrations.toLocaleString('vi-VN')}/${quota.toLocaleString('vi-VN')} tình nguyện viên`
                                                : `${currentRegistrations.toLocaleString('vi-VN')} hồ sơ đã ghi nhận`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={surfaceClassName}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Lưu ý
                            </p>
                            <p className="mt-3">
                                Ban tổ chức sẽ dùng thông tin trong phiếu này để
                                liên hệ, sắp xếp nhiệm vụ và phản hồi kết quả
                                xét duyệt.
                            </p>
                        </div>
                    </aside>

                    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Họ và tên</p>
                                <div className="mt-2 rounded-2xl border border-input bg-muted px-4 py-3 text-[16px] leading-7 text-primary">
                                    {student.fullName || 'Chưa cập nhật'}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Mã số sinh viên</p>
                                <div className="mt-2 rounded-2xl border border-input bg-muted px-4 py-3 text-[16px] leading-7 text-primary">
                                    {student.studentCode || 'Chưa cập nhật'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="event-registration-phone" className="text-sm font-semibold text-slate-900">
                                Số điện thoại
                            </label>
                            <div className="relative mt-2">
                                <Phone
                                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                    strokeWidth={1.75}
                                />
                                <Input
                                    id="event-registration-phone"
                                    type="tel"
                                    value={form.phone}
                                    error={errors.phone}
                                    onChange={(inputEvent) => {
                                        setForm((current) => ({
                                            ...current,
                                            phone: inputEvent.target.value,
                                        }));
                                        setErrors((current) => ({
                                            ...current,
                                            phone: '',
                                        }));
                                    }}
                                    className="pl-10"
                                    placeholder="Nhập số điện thoại liên lạc"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="event-registration-note" className="text-sm font-semibold text-slate-900">
                                Kỹ năng đặc biệt hoặc ghi chú
                            </label>
                            <textarea
                                id="event-registration-note"
                                value={form.skillsNote}
                                onChange={(inputEvent) =>
                                    setForm((current) => ({
                                        ...current,
                                        skillsNote: inputEvent.target.value,
                                    }))
                                }
                                className={`mt-2 ${textareaClassName}`}
                                placeholder="Ví dụ: quay phim, chụp ảnh, sơ cứu hoặc các lưu ý sức khỏe cần ban tổ chức biết."
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="event-registration-commitment"
                                className="flex items-start gap-3 rounded-3xl border border-input bg-muted p-4"
                            >
                                <input
                                    id="event-registration-commitment"
                                    type="checkbox"
                                    checked={form.committed}
                                    onChange={(inputEvent) => {
                                        setForm((current) => ({
                                            ...current,
                                            committed: inputEvent.target.checked,
                                        }));
                                        setErrors((current) => ({
                                            ...current,
                                            committed: '',
                                        }));
                                    }}
                                    className="mt-1 h-4 w-4 border border-input text-primary focus:ring-0"
                                />
                                <span className="text-[14px] leading-7 text-muted-foreground">
                                    Tôi cam kết tham gia đầy đủ các buổi tập huấn
                                    và hoạt động chính thức của chiến dịch. Tôi
                                    sẽ chấp hành các quy định, lịch điều phối và
                                    hướng dẫn từ ban tổ chức.
                                </span>
                            </label>
                            {errors.committed ? (
                                <p className="mt-2 text-[12px] leading-5 text-destructive">
                                    {errors.committed}
                                </p>
                            ) : null}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                                <Info className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                                <p>
                                    Kết quả xét duyệt sẽ được gửi qua email sinh
                                    viên và thông báo trong ứng dụng sau khi ban
                                    tổ chức hoàn tất rà soát hồ sơ.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Đóng
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="sm:min-w-52">
                                <Send className="size-4" strokeWidth={1.75} />
                                {isSubmitting ? 'Đang gửi đăng ký' : 'Gửi đăng ký'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const StudentFundraisingDialog = ({
    campaign,
    module,
    open,
    onOpenChange,
    student,
}: BaseDialogProps) => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [amount, setAmount] = React.useState(0);
    const [customAmount, setCustomAmount] = React.useState('');
    const [donorName, setDonorName] = React.useState(student.fullName);
    const [message, setMessage] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        setAmount(0);
        setCustomAmount('');
        setDonorName(student.fullName);
        setMessage('');
    }, [open, student.fullName, module?.id]);

    if (!module) {
        return null;
    }

    const targetAmount = readSettingNumber(module.settings, 'target_amount');
    const progressCurrent = module.progress?.current ?? 0;
    const progressPercent =
        targetAmount > 0
            ? Math.min(100, Math.round((progressCurrent / targetAmount) * 100))
            : module.progress?.percent ?? 0;

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

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (amount <= 0) {
            addNotification({
                type: 'error',
                title: 'Thiếu số tiền đóng góp',
                message: 'Vui lòng nhập số tiền hợp lệ trước khi xác nhận.',
            });
            return;
        }

        try {
            setSubmitting(true);
            const result = await createMoneyDonation(module.id, {
                amount,
                donor_name: donorName.trim() || undefined,
                message: message.trim() || undefined,
            });

            addNotification({
                type: 'success',
                title: 'Khởi tạo giao dịch thành công',
                message:
                    'Hệ thống đang chuyển bạn sang bước thanh toán để nhận mã chuyển khoản riêng.',
            });

            onOpenChange(false);

            if (result?.id) {
                navigate(paths.app.donationPayment.getHref(String(result.id)));
                return;
            }

            navigate(paths.app.myDonations.getHref());
        } catch (submitError) {
            addNotification({
                type: 'error',
                title: 'Khởi tạo giao dịch thất bại',
                message:
                    submitError instanceof Error
                        ? submitError.message
                        : 'Không thể tạo giao dịch đóng góp.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl overflow-y-auto p-0">
                <div className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle>Ủng hộ tài chính</DialogTitle>
                    <DialogDescription>
                        {toDisplayTitle(module.title)} ·{' '}
                        {toDisplayTitle(campaign.title)}
                    </DialogDescription>
                </div>

                <form className="space-y-5 px-6 py-6" onSubmit={(event) => void handleSubmit(event)}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className={surfaceClassName}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Tiến độ hiện tại
                            </p>
                            <p className="mt-3 text-2xl font-bold text-slate-950">
                                {targetAmount > 0
                                    ? formatCurrency(progressCurrent)
                                    : `${progressCurrent.toLocaleString('vi-VN')} lượt ghi nhận`}
                            </p>
                            <div className="mt-4 h-3 rounded-full bg-white">
                                <div
                                    className="h-3 rounded-full bg-primary"
                                    style={{
                                        width: `${Math.max(0, Math.min(progressPercent, 100))}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-3 text-sm text-slate-600">
                                {targetAmount > 0
                                    ? `${progressPercent}% mục tiêu · ${formatCurrency(targetAmount)}`
                                    : 'Chiến dịch đang ghi nhận các khoản ủng hộ mới'}
                            </p>
                        </div>

                        <div className={surfaceClassName}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Lưu ý thanh toán
                            </p>
                            <p className="mt-3">
                                Sau khi xác nhận số tiền, hệ thống sẽ tạo giao
                                dịch riêng và chuyển bạn sang bước thanh toán để
                                lấy mã chuyển khoản dành cho khoản ủng hộ này.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fundraising-amount" className="text-sm font-semibold text-slate-900">
                            Số tiền đóng góp (VND)
                        </label>
                        <Input
                            id="fundraising-amount"
                            type="text"
                            value={customAmount}
                            onChange={(inputEvent) =>
                                handleCustomAmount(inputEvent.target.value)
                            }
                            className="mt-2"
                            placeholder="Nhập số tiền muốn ủng hộ"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {quickAmounts.map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => handleQuickAmount(value)}
                                className={`rounded-2xl border px-3 py-3 text-[14px] font-semibold transition ${
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
                        <div className={surfaceClassName}>
                            Tổng số tiền xác nhận:{' '}
                            <span className="font-semibold text-slate-950">
                                {formatCurrency(amount)}
                            </span>
                        </div>
                    ) : null}

                    <div>
                        <label htmlFor="fundraising-donor-name" className="text-sm font-semibold text-slate-900">
                            Tên người ủng hộ
                        </label>
                        <Input
                            id="fundraising-donor-name"
                            type="text"
                            value={donorName}
                            onChange={(inputEvent) =>
                                setDonorName(inputEvent.target.value)
                            }
                            className="mt-2"
                            placeholder="Nhập tên hiển thị cho khoản đóng góp"
                        />
                    </div>

                    <div>
                        <label htmlFor="fundraising-message" className="text-sm font-semibold text-slate-900">
                            Lời nhắn
                        </label>
                        <textarea
                            id="fundraising-message"
                            value={message}
                            onChange={(inputEvent) =>
                                setMessage(inputEvent.target.value)
                            }
                            className={`mt-2 ${textareaClassName}`}
                            placeholder="Chia sẻ lời nhắn đồng hành cùng chiến dịch."
                        />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                        <Button type="submit" disabled={submitting || amount <= 0} className="sm:min-w-52">
                            <ReceiptText className="size-4" strokeWidth={1.75} />
                            {submitting ? 'Đang tạo giao dịch' : 'Tiếp tục thanh toán'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const StudentItemDonationDialog = ({
    campaign,
    module,
    open,
    onOpenChange,
    student,
}: BaseDialogProps) => {
    const { addNotification } = useNotifications();
    const [targets, setTargets] = React.useState<ItemTargetItem[]>([]);
    const [isLoadingTargets, setIsLoadingTargets] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [form, setForm] = React.useState({
        item_target_id: '',
        quantity: 1,
        donor_name: student.fullName,
        expected_handover_at: '',
        note: '',
    });

    React.useEffect(() => {
        if (!open || !module) {
            return;
        }

        let isMounted = true;
        setIsLoadingTargets(true);

        getItemTargets(module.id, 'ACTIVE')
            .then((result) => {
                if (!isMounted) {
                    return;
                }

                setTargets(result);
                setForm({
                    item_target_id: result[0]?.id ?? '',
                    quantity: 1,
                    donor_name: student.fullName,
                    expected_handover_at: '',
                    note: '',
                });
            })
            .catch((loadError) => {
                if (!isMounted) {
                    return;
                }

                addNotification({
                    type: 'error',
                    title: 'Không tải được danh sách nhu cầu hiện vật',
                    message:
                        loadError instanceof Error
                            ? loadError.message
                            : 'Lỗi hệ thống',
                });
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingTargets(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [addNotification, module, open, student.fullName]);

    if (!module) {
        return null;
    }

    const selectedTarget =
        targets.find((target) => target.id === form.item_target_id) ?? null;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.item_target_id) {
            addNotification({
                type: 'error',
                title: 'Chưa chọn nhu cầu hiện vật',
                message: 'Vui lòng chọn hiện vật bạn muốn đăng ký ủng hộ.',
            });
            return;
        }

        if (form.quantity <= 0) {
            addNotification({
                type: 'error',
                title: 'Số lượng chưa hợp lệ',
                message: 'Vui lòng nhập số lượng lớn hơn 0.',
            });
            return;
        }

        try {
            setIsSubmitting(true);
            await createItemPledge(module.id, {
                item_target_id: form.item_target_id,
                quantity: form.quantity,
                donor_name: form.donor_name.trim() || student.fullName,
                expected_handover_at: form.expected_handover_at
                    ? new Date(form.expected_handover_at).toISOString()
                    : undefined,
                note: form.note.trim() || undefined,
            });

            addNotification({
                type: 'success',
                title: 'Đăng ký hiện vật thành công',
                message: 'Yêu cầu của bạn đã được ghi nhận.',
            });

            onOpenChange(false);
        } catch (submitError) {
            addNotification({
                type: 'error',
                title: 'Đăng ký hiện vật thất bại',
                message:
                    submitError instanceof Error
                        ? submitError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl overflow-y-auto p-0">
                <div className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle>Đăng ký quyên góp hiện vật</DialogTitle>
                    <DialogDescription>
                        {toDisplayTitle(module.title)} ·{' '}
                        {toDisplayTitle(campaign.title)}
                    </DialogDescription>
                </div>

                <form className="space-y-5 px-6 py-6" onSubmit={(event) => void handleSubmit(event)}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className={surfaceClassName}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Mô tả hạng mục
                            </p>
                            <p className="mt-3 text-slate-700">
                                {toDisplayText(module.description) ||
                                    'Chiến dịch đang tiếp nhận đăng ký quyên góp hiện vật cho hạng mục này.'}
                            </p>
                        </div>

                        <div className={surfaceClassName}>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Thông tin người đăng ký
                            </p>
                            <p className="mt-3 font-semibold text-slate-950">
                                {student.fullName || 'Sinh viên BK Volunteers'}
                            </p>
                            <p className="text-slate-600">
                                {student.studentCode || 'Chưa cập nhật mã số sinh viên'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="item-target-id" className="text-sm font-semibold text-slate-900">
                            Nhu cầu hiện vật
                        </label>
                        <select
                            id="item-target-id"
                            value={form.item_target_id}
                            onChange={(inputEvent) =>
                                setForm((current) => ({
                                    ...current,
                                    item_target_id: inputEvent.target.value,
                                }))
                            }
                            className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-[15px] text-primary outline-none transition focus:border-2 focus:border-primary"
                            disabled={isLoadingTargets || targets.length === 0}
                        >
                            {targets.length === 0 ? (
                                <option value="">
                                    {isLoadingTargets
                                        ? 'Đang tải nhu cầu hiện vật'
                                        : 'Chưa có nhu cầu hiện vật đang mở'}
                                </option>
                            ) : null}
                            {targets.map((target) => (
                                <option key={target.id} value={target.id}>
                                    {target.name} · còn {Math.max(0, target.target_quantity - target.received_quantity)} {target.unit}
                                </option>
                            ))}
                        </select>
                        {selectedTarget?.description ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {selectedTarget.description}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label htmlFor="item-quantity" className="text-sm font-semibold text-slate-900">
                                Số lượng
                            </label>
                            <Input
                                id="item-quantity"
                                type="number"
                                min={1}
                                value={String(form.quantity)}
                                onChange={(inputEvent) =>
                                    setForm((current) => ({
                                        ...current,
                                        quantity: Math.max(
                                            1,
                                            Number(inputEvent.target.value || 1),
                                        ),
                                    }))
                                }
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="item-donor-name" className="text-sm font-semibold text-slate-900">
                                Tên người quyên góp
                            </label>
                            <Input
                                id="item-donor-name"
                                value={form.donor_name}
                                onChange={(inputEvent) =>
                                    setForm((current) => ({
                                        ...current,
                                        donor_name: inputEvent.target.value,
                                    }))
                                }
                                className="mt-2"
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="item-expected-handover" className="text-sm font-semibold text-slate-900">
                            Thời gian dự kiến bàn giao
                        </label>
                        <Input
                            id="item-expected-handover"
                            type="datetime-local"
                            value={form.expected_handover_at}
                            onChange={(inputEvent) =>
                                setForm((current) => ({
                                    ...current,
                                    expected_handover_at: inputEvent.target.value,
                                }))
                            }
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <label htmlFor="item-note" className="text-sm font-semibold text-slate-900">
                            Ghi chú
                        </label>
                        <textarea
                            id="item-note"
                            value={form.note}
                            onChange={(inputEvent) =>
                                setForm((current) => ({
                                    ...current,
                                    note: inputEvent.target.value,
                                }))
                            }
                            className={`mt-2 ${textareaClassName}`}
                            placeholder="Ví dụ: thời điểm giao nhận phù hợp hoặc lưu ý về hiện vật."
                        />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                            <HandCoins className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                            <p>
                                Sau khi gửi đăng ký, ban tổ chức sẽ liên hệ để
                                xác nhận nhu cầu tiếp nhận và hướng dẫn bàn giao
                                hiện vật.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isLoadingTargets || targets.length === 0}
                            className="sm:min-w-52"
                        >
                            <Send className="size-4" strokeWidth={1.75} />
                            {isSubmitting ? 'Đang gửi đăng ký' : 'Gửi đăng ký hiện vật'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
