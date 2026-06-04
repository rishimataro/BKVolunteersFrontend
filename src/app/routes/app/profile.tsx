import * as React from 'react';
import {
    ArrowRight,
    Award,
    BadgeCheck,
    BookOpenText,
    GraduationCap,
    HandCoins,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { Link } from 'react-router';

import { Head } from '@/components/seo';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import {
    getStudentDashboard,
    type StudentDashboardSummary,
} from '@/features/campaign/api/student';
import type { User } from '@/types/api';

const roleLabels: Record<string, string> = {
    [ROLES.SINHVIEN]: 'Sinh viên',
    [ROLES.CLB]: 'Quản lý CLB',
    [ROLES.LCD]: 'Phản biện',
    [ROLES.DOANTRUONG]: 'Quản trị trường',
};

const impactMilestones = [
    { title: 'Đại sứ Bạch Kim', minPoints: 1000 },
    { title: 'Đại sứ Vàng', minPoints: 800 },
    { title: 'Đại sứ Bạc', minPoints: 500 },
    { title: 'Đại sứ Đồng', minPoints: 250 },
    { title: 'Khởi động', minPoints: 0 },
];

type ProfileDraft = {
    bio: string;
    email: string;
    facultyName: string;
    fullName: string;
    identityCode: string;
    phone: string;
    profileLink: string;
};

const getDisplayName = (user: User) =>
    user.fullName?.trim() ||
    `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() ||
    user.username;

const getIdentityCode = (user: User) =>
    user.studentCode?.trim() || user.mssv?.trim() || user.username;

const getFacultyName = (user: User) =>
    user.organization?.faculty?.name?.trim() ||
    user.organization?.name?.trim() ||
    'Chưa cập nhật khoa';

const getInitials = (value: string) =>
    value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'SV';

const formatCompactMoney = (value: number) => {
    if (value >= 1_000_000) {
        const rounded = Number.isInteger(value / 1_000_000)
            ? String(value / 1_000_000)
            : (value / 1_000_000).toFixed(1).replace('.', ',');

        return `${rounded} triệu`;
    }

    if (value >= 1_000) {
        return `${Math.round(value / 1_000)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} nghìn`;
    }

    return value.toLocaleString('vi-VN');
};

const getLastSyncedText = (user: User) => {
    const value = user.updatedAt ?? user.createdAt;

    if (!value) {
        return 'Chưa có mốc đồng bộ';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
};

const createDraft = (user: User): ProfileDraft => ({
    bio:
        user.role === ROLES.SINHVIEN
            ? 'Sinh viên đang tham gia các hoạt động tình nguyện và được đồng bộ hồ sơ từ tài khoản BK Volunteers.'
            : 'Thông tin tài khoản đang được đồng bộ từ hệ thống BK Volunteers.',
    email: user.email,
    facultyName: getFacultyName(user),
    fullName: getDisplayName(user),
    identityCode: getIdentityCode(user),
    phone: user.phone?.trim() || '',
    profileLink: '',
});

const getImpactMeta = (points: number, eventHours: number) => {
    const currentLevel =
        impactMilestones.find((item) => points >= item.minPoints) ??
        impactMilestones[impactMilestones.length - 1];
    const nextLevel = [...impactMilestones]
        .reverse()
        .find((item) => item.minPoints > points);
    const progressCeiling =
        nextLevel?.minPoints ?? impactMilestones[0].minPoints;
    const progressPercent = Math.min(
        100,
        Math.max(8, Math.round((points / progressCeiling) * 100)),
    );

    return {
        currentLevel,
        eventHours,
        nextLevel,
        points,
        progressPercent,
    };
};

export const ProfileRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();
    const account = user.data;
    const isStudent = account?.role === ROLES.SINHVIEN;
    const [summary, setSummary] =
        React.useState<StudentDashboardSummary | null>(null);
    const [statsError, setStatsError] = React.useState<string | null>(null);
    const [statsLoading, setStatsLoading] = React.useState(isStudent);
    const [draft, setDraft] = React.useState<ProfileDraft | null>(
        account ? createDraft(account) : null,
    );

    React.useEffect(() => {
        if (!account) {
            return;
        }

        setDraft(createDraft(account));
    }, [account]);

    React.useEffect(() => {
        if (!isStudent) {
            setStatsLoading(false);
            setStatsError(null);
            setSummary(null);
            return;
        }

        let mounted = true;
        setStatsLoading(true);
        setStatsError(null);

        getStudentDashboard()
            .then((response) => {
                if (!mounted) {
                    return;
                }

                setSummary(response);
            })
            .catch((error) => {
                if (!mounted) {
                    return;
                }

                const message =
                    error instanceof Error
                        ? error.message
                        : 'Không thể tải thống kê hồ sơ.';
                setStatsError(message);
                addNotification({
                    type: 'error',
                    title: 'Không thể tải hồ sơ sinh viên',
                    message,
                });
            })
            .finally(() => {
                if (mounted) {
                    setStatsLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [addNotification, isStudent]);

    if (!account || !draft) {
        return null;
    }

    const displayName = getDisplayName(account);
    const roleLabel = roleLabels[account.role] ?? account.role;
    const lastSyncedText = getLastSyncedText(account);
    const points = account.totalPoints ?? (summary?.event_hours ?? 0) * 18;
    const impactMeta = getImpactMeta(points, summary?.event_hours ?? 0);
    const initialDraft = createDraft(account);
    const hasLocalChanges =
        draft.bio !== initialDraft.bio ||
        draft.email !== initialDraft.email ||
        draft.facultyName !== initialDraft.facultyName ||
        draft.fullName !== initialDraft.fullName ||
        draft.phone !== initialDraft.phone ||
        draft.profileLink !== initialDraft.profileLink;

    const handleDraftChange =
        (field: keyof ProfileDraft) =>
        (
            event: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) => {
            const value = event.target.value;

            setDraft((currentDraft) =>
                currentDraft
                    ? {
                          ...currentDraft,
                          [field]: value,
                      }
                    : currentDraft,
            );
        };

    const handleSave = () => {
        addNotification({
            type: 'info',
            title: 'Đang chuẩn bị cập nhật hồ sơ',
            message: hasLocalChanges
                ? 'Bạn đã chỉnh sửa dữ liệu cục bộ. Chức năng lưu trực tiếp sẽ được mở khi backend hỗ trợ cập nhật hồ sơ sinh viên.'
                : 'Trang hồ sơ hiện đang hiển thị dữ liệu đồng bộ từ tài khoản. Chức năng cập nhật trực tiếp sẽ được mở sau.',
        });
    };

    return (
        <>
            <Head title="Hồ sơ cá nhân" />
            <div className="bg-white">
                <section className="border-b border-[#E5E7EB] pb-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-4xl">
                            <p className="broadsheet-kicker">
                                Khu vực tài khoản
                            </p>
                            <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-[#0A0A0A] sm:text-[56px]">
                                Hồ sơ cá nhân
                            </h1>
                            <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-[#4B5563]">
                                Kiểm tra thông tin học vụ, liên hệ và dấu mốc
                                tham gia để hồ sơ sinh viên của bạn luôn sẵn
                                sàng cho các chiến dịch và giấy chứng nhận.
                            </p>
                        </div>

                        <div className="border border-[#0A0A0A] bg-white px-5 py-4 xl:max-w-[340px]">
                            <p className="broadsheet-kicker text-[#0A0A0A]">
                                Đồng bộ gần nhất
                            </p>
                            <p className="mt-2 text-[18px] font-semibold leading-7 text-[#0A0A0A]">
                                {lastSyncedText}
                            </p>
                            <p className="mt-2 text-[14px] leading-6 text-[#4B5563]">
                                Hồ sơ đang lấy dữ liệu trực tiếp từ tài khoản và
                                lịch sử tham gia trong hệ thống.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="flex flex-wrap items-center gap-4 border-b border-[#E5E7EB] py-5">
                    <span className="border-b-2 border-[#0A0A0A] pb-2 text-[14px] font-semibold text-[#0A0A0A]">
                        Hồ sơ
                    </span>
                    <Link
                        className="border-b border-transparent pb-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#0A0A0A]"
                        to={paths.app.settings.getHref()}
                    >
                        Bảo mật
                    </Link>
                    <Link
                        className="border-b border-transparent pb-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#0A0A0A]"
                        to={paths.app.changePassword.getHref()}
                    >
                        Đổi mật khẩu
                    </Link>
                </section>

                <section className="grid gap-6 pt-8 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <aside className="space-y-6">
                        <section className="border border-[#D1D5DB] bg-white p-6">
                            <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
                                <div className="flex h-24 w-24 items-center justify-center border border-[#0A0A0A] bg-[#F9FAFB] font-heading text-[34px] font-bold text-[#0A0A0A]">
                                    {getInitials(displayName)}
                                </div>
                                <div className="text-right">
                                    <p className="broadsheet-kicker">
                                        Vai trò tài khoản
                                    </p>
                                    <p className="mt-2 text-[18px] font-semibold leading-7 text-[#0A0A0A]">
                                        {roleLabel}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-5">
                                <h2 className="font-heading text-[34px] leading-[1.1] font-bold text-[#0A0A0A]">
                                    {displayName}
                                </h2>
                                <p className="mt-3 text-[15px] leading-7 text-[#4B5563]">
                                    {draft.identityCode} · {draft.facultyName}
                                </p>
                                <div className="mt-5 grid gap-3 border-t border-[#E5E7EB] pt-5">
                                    <div className="flex items-start gap-3">
                                        <Mail
                                            className="mt-1 size-4 text-[#4B5563]"
                                            strokeWidth={1.75}
                                        />
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Email học vụ
                                            </p>
                                            <p className="mt-1 text-[15px] leading-7 text-[#0A0A0A]">
                                                {draft.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <BookOpenText
                                            className="mt-1 size-4 text-[#4B5563]"
                                            strokeWidth={1.75}
                                        />
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Lớp / đơn vị
                                            </p>
                                            <p className="mt-1 text-[15px] leading-7 text-[#0A0A0A]">
                                                {account.className?.trim() ||
                                                    'Chưa cập nhật lớp'}{' '}
                                                ·{' '}
                                                {account.organization?.name?.trim() ||
                                                    'BK Volunteers'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone
                                            className="mt-1 size-4 text-[#4B5563]"
                                            strokeWidth={1.75}
                                        />
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Liên hệ nhanh
                                            </p>
                                            <p className="mt-1 text-[15px] leading-7 text-[#0A0A0A]">
                                                {draft.phone ||
                                                    'Chưa cập nhật số điện thoại'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="border border-[#0A0A0A] bg-[#0A0A0A] p-6 text-white">
                            <p className="broadsheet-kicker text-white/70">
                                Cấp độ tác động
                            </p>
                            <div className="mt-4 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[34px] font-bold leading-[1.05]">
                                        {impactMeta.currentLevel.title}
                                    </p>
                                    <p className="mt-3 text-[15px] leading-7 text-white/80">
                                        {isStudent
                                            ? `Bạn đã ghi nhận ${impactMeta.eventHours} giờ tình nguyện và ${impactMeta.points.toLocaleString(
                                                  'vi-VN',
                                              )} điểm tác động trong hệ thống.`
                                            : 'Tài khoản đang được đồng bộ để sẵn sàng cho các mốc hoạt động tiếp theo.'}
                                    </p>
                                </div>
                                <Award
                                    className="size-8 text-white"
                                    strokeWidth={1.6}
                                />
                            </div>

                            <div className="mt-8 border border-white/20 p-4">
                                <div className="h-4 border border-white/20 bg-white/10">
                                    <div
                                        className="h-full bg-white"
                                        style={{
                                            width: `${impactMeta.progressPercent}%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80">
                                    <span>
                                        {impactMeta.points.toLocaleString(
                                            'vi-VN',
                                        )}{' '}
                                        điểm
                                    </span>
                                    <span>
                                        {impactMeta.nextLevel
                                            ? `Mốc kế: ${impactMeta.nextLevel.title}`
                                            : 'Đã đạt mốc cao nhất'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="border border-[#D1D5DB] bg-white p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="broadsheet-kicker">
                                        Thống kê hoạt động
                                    </p>
                                    <h2 className="mt-2 text-[30px] font-semibold leading-[1.1] text-[#0A0A0A]">
                                        Hồ sơ tham gia
                                    </h2>
                                </div>
                                <BadgeCheck
                                    className="size-6 text-[#0A0A0A]"
                                    strokeWidth={1.6}
                                />
                            </div>

                            {statsLoading ? (
                                <div className="mt-6 border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-5 text-[15px] leading-7 text-[#4B5563]">
                                    Đang đồng bộ thống kê từ khu vực sinh viên.
                                </div>
                            ) : null}

                            {statsError ? (
                                <div className="mt-6 border border-[#DC2626] bg-[#FEF2F2] px-4 py-5 text-[15px] leading-7 text-[#991B1B]">
                                    {statsError}
                                </div>
                            ) : null}

                            {!statsLoading && !statsError ? (
                                <div className="mt-6 grid gap-4">
                                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                                        <div className="flex items-center gap-3">
                                            <GraduationCap
                                                className="size-5 text-[#0A0A0A]"
                                                strokeWidth={1.6}
                                            />
                                            <span className="text-[16px] leading-7 text-[#0A0A0A]">
                                                Chiến dịch đã tham gia
                                            </span>
                                        </div>
                                        <span className="text-[28px] font-bold text-[#0A0A0A]">
                                            {summary?.campaigns_count ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                                        <div className="flex items-center gap-3">
                                            <UserRound
                                                className="size-5 text-[#0A0A0A]"
                                                strokeWidth={1.6}
                                            />
                                            <span className="text-[16px] leading-7 text-[#0A0A0A]">
                                                Giờ tình nguyện
                                            </span>
                                        </div>
                                        <span className="text-[28px] font-bold text-[#0A0A0A]">
                                            {summary?.event_hours ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck
                                                className="size-5 text-[#0A0A0A]"
                                                strokeWidth={1.6}
                                            />
                                            <span className="text-[16px] leading-7 text-[#0A0A0A]">
                                                Giấy chứng nhận
                                            </span>
                                        </div>
                                        <span className="text-[28px] font-bold text-[#0A0A0A]">
                                            {summary?.certificates_count ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <HandCoins
                                                className="size-5 text-[#0A0A0A]"
                                                strokeWidth={1.6}
                                            />
                                            <span className="text-[16px] leading-7 text-[#0A0A0A]">
                                                Tổng quyên góp
                                            </span>
                                        </div>
                                        <span className="text-[28px] font-bold text-[#0A0A0A]">
                                            {formatCompactMoney(
                                                summary?.money_amount ?? 0,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </section>
                    </aside>

                    <div className="space-y-6">
                        <section className="border border-[#D1D5DB] bg-white p-6 sm:p-8">
                            <div className="flex flex-col gap-5 border-b border-[#E5E7EB] pb-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <p className="broadsheet-kicker">
                                        Thông tin cá nhân
                                    </p>
                                    <h2 className="mt-2 text-[32px] font-semibold leading-[1.1] text-[#0A0A0A]">
                                        Hồ sơ đã đồng bộ
                                    </h2>
                                    <p className="mt-3 text-[16px] leading-7 text-[#4B5563]">
                                        Bạn có thể rà soát dữ liệu liên hệ ngay
                                        trên trang này. Việc lưu trực tiếp sẽ
                                        được mở khi backend hỗ trợ cập nhật hồ
                                        sơ cho từng sinh viên.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="inline-flex h-12 items-center justify-center border border-[#0A0A0A] bg-[#0A0A0A] px-5 text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#1F2937]"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>

                            <form
                                className="mt-6 grid gap-6"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Họ và tên
                                        </span>
                                        <input
                                            aria-label="Họ và tên"
                                            className="broadsheet-input h-12"
                                            onChange={handleDraftChange(
                                                'fullName',
                                            )}
                                            type="text"
                                            value={draft.fullName}
                                        />
                                    </label>

                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            MSSV / mã định danh
                                        </span>
                                        <input
                                            aria-label="MSSV / mã định danh"
                                            className="broadsheet-input h-12 bg-[#F9FAFB] text-[#4B5563]"
                                            readOnly
                                            type="text"
                                            value={draft.identityCode}
                                        />
                                    </label>

                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Khoa / đơn vị đào tạo
                                        </span>
                                        <input
                                            aria-label="Khoa / đơn vị đào tạo"
                                            className="broadsheet-input h-12"
                                            onChange={handleDraftChange(
                                                'facultyName',
                                            )}
                                            type="text"
                                            value={draft.facultyName}
                                        />
                                    </label>

                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Email liên hệ
                                        </span>
                                        <input
                                            aria-label="Email liên hệ"
                                            className="broadsheet-input h-12"
                                            onChange={handleDraftChange(
                                                'email',
                                            )}
                                            type="email"
                                            value={draft.email}
                                        />
                                    </label>
                                </div>

                                <label className="grid gap-2">
                                    <span className="broadsheet-kicker">
                                        Giới thiệu bản thân
                                    </span>
                                    <textarea
                                        aria-label="Giới thiệu bản thân"
                                        className="min-h-[150px] border border-[#D1D5DB] bg-white px-3 py-3 text-[16px] leading-7 text-[#0A0A0A] outline-none transition focus:border-2 focus:border-[#0A0A0A]"
                                        onChange={handleDraftChange('bio')}
                                        value={draft.bio}
                                    />
                                </label>

                                <div className="grid gap-6 border-t border-[#E5E7EB] pt-6 lg:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Số điện thoại
                                        </span>
                                        <input
                                            aria-label="Số điện thoại"
                                            className="broadsheet-input h-12"
                                            onChange={handleDraftChange(
                                                'phone',
                                            )}
                                            placeholder="Ví dụ: 0901 234 567"
                                            type="tel"
                                            value={draft.phone}
                                        />
                                    </label>

                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Facebook / LinkedIn
                                        </span>
                                        <input
                                            aria-label="Facebook / LinkedIn"
                                            className="broadsheet-input h-12"
                                            onChange={handleDraftChange(
                                                'profileLink',
                                            )}
                                            placeholder="Dán liên kết hồ sơ công khai nếu cần"
                                            type="text"
                                            value={draft.profileLink}
                                        />
                                    </label>
                                </div>
                            </form>

                            <div className="mt-6 broadsheet-note">
                                Mọi chỉnh sửa trên trang này hiện chỉ được giữ ở
                                phiên làm việc cục bộ. Dữ liệu gốc vẫn được đồng
                                bộ từ tài khoản và lịch sử hoạt động của bạn.
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2">
                            <Link
                                className="group border border-[#D1D5DB] bg-white p-6 transition hover:border-[#0A0A0A]"
                                to={paths.app.settings.getHref()}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center border border-[#0A0A0A] bg-[#F9FAFB] text-[#0A0A0A]">
                                        <ShieldCheck
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="broadsheet-kicker">
                                            Bảo mật tài khoản
                                        </p>
                                        <h2 className="mt-2 text-[24px] font-semibold leading-[1.15] text-[#0A0A0A]">
                                            Đi tới bảo mật
                                        </h2>
                                        <p className="mt-3 text-[15px] leading-7 text-[#4B5563]">
                                            Kiểm tra mật khẩu, phiên đăng nhập
                                            và quyền riêng tư liên quan đến tài
                                            khoản sinh viên.
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[#0A0A0A] transition group-hover:text-[#DC2626]">
                                            Mở trang bảo mật
                                            <ArrowRight
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            <Link
                                className="group border border-[#D1D5DB] bg-white p-6 transition hover:border-[#0A0A0A]"
                                to={paths.app.changePassword.getHref()}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center border border-[#0A0A0A] bg-[#F9FAFB] text-[#0A0A0A]">
                                        <LockKeyhole
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="broadsheet-kicker">
                                            Truy cập nhanh
                                        </p>
                                        <h2 className="mt-2 text-[24px] font-semibold leading-[1.15] text-[#0A0A0A]">
                                            Đổi mật khẩu
                                        </h2>
                                        <p className="mt-3 text-[15px] leading-7 text-[#4B5563]">
                                            Mở biểu mẫu rút gọn nếu bạn chỉ cần
                                            cập nhật khóa truy cập mà không đi
                                            qua toàn bộ cài đặt bảo mật.
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[#0A0A0A] transition group-hover:text-[#DC2626]">
                                            Mở biểu mẫu
                                            <ArrowRight
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </section>
                    </div>
                </section>
            </div>
        </>
    );
};
