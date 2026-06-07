import * as React from 'react';
import {
    ArrowRight,
    Award,
    BadgeCheck,
    BookOpenText,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Head } from '@/components/seo';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import { updateCurrentUserProfile } from '@/features/auth/api/auth';
import { useAuthStore } from '@/store/auth-store';
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
    email: string;
    fullName: string;
    phone: string;
};

const getDisplayName = (user: User) =>
    user.fullName?.trim() ||
    `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() ||
    user.username;

const getIdentityCode = (user: User) =>
    user.studentCode?.trim() || user.mssv?.trim() || user.username;

const getFacultyName = (user: User) =>
    user.facultyName?.trim() ||
    user.managedClubName?.trim() ||
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

const getFormattedDateTime = (value?: string | number | Date | null) => {
    if (!value) {
        return 'Chưa ghi nhận';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const createDraft = (user: User): ProfileDraft => ({
    email: user.email,
    fullName: getDisplayName(user),
    phone: user.phone?.trim() || '',
});

const getImpactMeta = (points: number) => {
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
        nextLevel,
        points,
        progressPercent,
    };
};

const getAccountStatusLabel = (status?: User['status']) => {
    if (status === 'ACTIVE') {
        return 'Đang hoạt động';
    }

    if (status === 'LOCKED') {
        return 'Tạm khóa';
    }

    if (status === 'DISABLED') {
        return 'Đã vô hiệu hóa';
    }

    return 'Chưa xác định';
};

const getProfileSummary = (user: User) => {
    if (user.role === ROLES.SINHVIEN) {
        return 'Backend hiện tại cho phép cập nhật họ tên, email và số điện thoại. Các trường mô tả, liên kết công khai và thống kê chiến dịch sẽ được mở khi backend bổ sung endpoint tương ứng.';
    }

    return 'Backend hiện tại cho phép cập nhật email tài khoản. Các trường hồ sơ còn lại đang hiển thị theo dữ liệu xác thực và phân quyền hiện có.';
};

const getReadOnlyBio = (user: User) => {
    if (user.role === ROLES.SINHVIEN) {
        return 'Thông tin giới thiệu cá nhân chưa có trường dữ liệu riêng trên backend hiện tại. Hồ sơ đang ưu tiên đồng bộ các dữ liệu xác thực và liên hệ cốt lõi.';
    }

    return 'Tài khoản quản lý hiện đang đồng bộ từ backend auth/users. Trường giới thiệu sẽ được mở khi backend hỗ trợ hồ sơ mở rộng cho tài khoản vận hành.';
};

export const ProfileRoute = () => {
    const user = useUser();
    const queryClient = useQueryClient();
    const { addNotification } = useNotifications();
    const account = user.data;
    const isStudent = account?.role === ROLES.SINHVIEN;
    const [draft, setDraft] = React.useState<ProfileDraft | null>(
        account ? createDraft(account) : null,
    );

    React.useEffect(() => {
        if (!account) {
            return;
        }

        setDraft(createDraft(account));
    }, [account]);

    const updateProfileMutation = useMutation({
        mutationFn: updateCurrentUserProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['authenticated-user'], updatedUser);
            useAuthStore
                .getState()
                .setAuth(
                    updatedUser,
                    useAuthStore.getState().accessToken,
                    useAuthStore.getState().refreshToken,
                );
            setDraft(createDraft(updatedUser));
            addNotification({
                type: 'success',
                title: 'Đã cập nhật hồ sơ',
                message: 'Thông tin tài khoản đã được đồng bộ với backend.',
            });
        },
    });

    if (!account || !draft) {
        return null;
    }

    const displayName = getDisplayName(account);
    const identityCode = getIdentityCode(account);
    const facultyName = getFacultyName(account);
    const roleLabel = roleLabels[account.role] ?? account.role;
    const lastSyncedText = getLastSyncedText(account);
    const lastLoginText = getFormattedDateTime(account.lastLoginAt);
    const points = account.totalPoints ?? 0;
    const impactMeta = getImpactMeta(points);
    const readOnlyBio = getReadOnlyBio(account);
    const canEditStudentFields = isStudent;
    const saveErrorMessage =
        updateProfileMutation.error instanceof Error
            ? updateProfileMutation.error.message
            : null;
    const initialDraft = createDraft(account);
    const hasLocalChanges =
        draft.email !== initialDraft.email ||
        draft.fullName !== initialDraft.fullName ||
        draft.phone !== initialDraft.phone;

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

    const handleSave = async () => {
        if (!hasLocalChanges) {
            addNotification({
                type: 'info',
                title: 'Không có thay đổi mới',
                message: 'Hồ sơ hiện đã khớp với dữ liệu backend gần nhất.',
            });
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({
                email: draft.email.trim(),
                ...(canEditStudentFields
                    ? {
                          fullName: draft.fullName.trim(),
                          phone: draft.phone.trim() || undefined,
                      }
                    : {}),
            });
        } catch {
            return;
        }
    };

    return (
        <>
            <Head title="Hồ sơ cá nhân" />
            <div className="bg-white">
                <section className="border-b border-border pb-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-4xl">
                            <p className="broadsheet-kicker">
                                Khu vực tài khoản
                            </p>
                            <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-primary sm:text-[56px]">
                                Hồ sơ cá nhân
                            </h1>
                            <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">
                                Kiểm tra thông tin học vụ, liên hệ và dấu mốc
                                tham gia để hồ sơ sinh viên của bạn luôn sẵn
                                sàng cho các chiến dịch và giấy chứng nhận.
                            </p>
                        </div>

                        <div className="border border-primary bg-white px-5 py-4 xl:max-w-[340px]">
                            <p className="broadsheet-kicker text-primary">
                                Đồng bộ gần nhất
                            </p>
                            <p className="mt-2 text-[18px] font-semibold leading-7 text-primary">
                                {lastSyncedText}
                            </p>
                            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                                Hồ sơ đang lấy dữ liệu trực tiếp từ tài khoản và
                                lịch sử tham gia trong hệ thống.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="flex flex-wrap items-center gap-4 border-b border-border py-5">
                    <span className="border-b-2 border-primary pb-2 text-[14px] font-semibold text-primary">
                        Hồ sơ
                    </span>
                    <Link
                        className="border-b border-transparent pb-2 text-[14px] font-semibold text-muted-foreground transition hover:text-primary"
                        to={paths.app.settings.getHref()}
                    >
                        Bảo mật
                    </Link>
                    <Link
                        className="border-b border-transparent pb-2 text-[14px] font-semibold text-muted-foreground transition hover:text-primary"
                        to={paths.app.changePassword.getHref()}
                    >
                        Đổi mật khẩu
                    </Link>
                </section>

                <section className="grid gap-6 pt-8 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <aside className="space-y-6">
                        <section className="border border-input bg-white p-6">
                            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                                <div className="flex h-24 w-24 items-center justify-center border border-primary bg-muted font-heading text-[34px] font-bold text-primary">
                                    {getInitials(displayName)}
                                </div>
                                <div className="text-right">
                                    <p className="broadsheet-kicker">
                                        Vai trò tài khoản
                                    </p>
                                    <p className="mt-2 text-[18px] font-semibold leading-7 text-primary">
                                        {roleLabel}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-5">
                                <h2 className="font-heading text-[34px] leading-[1.1] font-bold text-primary">
                                    {displayName}
                                </h2>
                                <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                                    {identityCode} · {facultyName}
                                </p>
                                <div className="mt-5 grid gap-3 border-t border-border pt-5">
                                    <div className="flex items-start gap-3">
                                        <Mail
                                            className="mt-1 size-4 text-muted-foreground"
                                            strokeWidth={1.75}
                                        />
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Email học vụ
                                            </p>
                                            <p className="mt-1 text-[15px] leading-7 text-primary">
                                                {draft.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <BookOpenText
                                            className="mt-1 size-4 text-muted-foreground"
                                            strokeWidth={1.75}
                                        />
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Lớp / đơn vị
                                            </p>
                                            <p className="mt-1 text-[15px] leading-7 text-primary">
                                                {account.className?.trim() ||
                                                    'Chưa cập nhật lớp'}{' '}
                                                ·{' '}
                                                {account.managedClubName?.trim() ||
                                                    account.organization?.name?.trim() ||
                                                    'BK Volunteers'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone
                                            className="mt-1 size-4 text-muted-foreground"
                                            strokeWidth={1.75}
                                        />
                                        <div>
                                            <p className="broadsheet-kicker">
                                                Liên hệ nhanh
                                            </p>
                                            <p className="mt-1 text-[15px] leading-7 text-primary">
                                                {draft.phone ||
                                                    'Chưa cập nhật số điện thoại'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="border border-primary bg-primary p-6 text-white">
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
                                            ? `Hệ thống hiện đang đồng bộ ${impactMeta.points.toLocaleString(
                                                  'vi-VN',
                                              )} điểm tác động từ hồ sơ người dùng. Các thống kê chiến dịch chi tiết sẽ xuất hiện khi backend bổ sung module sinh viên.`
                                            : 'Tài khoản đang được đồng bộ từ backend xác thực và sẵn sàng cho các mốc vận hành tiếp theo.'}
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

                        <section className="border border-input bg-white p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="broadsheet-kicker">
                                        Thống kê hoạt động
                                    </p>
                                    <h2 className="mt-2 text-[30px] font-semibold leading-[1.1] text-primary">
                                        Hồ sơ tài khoản
                                    </h2>
                                </div>
                                <BadgeCheck
                                    className="size-6 text-primary"
                                    strokeWidth={1.6}
                                />
                            </div>
                            <div className="mt-6 grid gap-4">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <BadgeCheck
                                            className="size-5 text-primary"
                                            strokeWidth={1.6}
                                        />
                                        <span className="text-[16px] leading-7 text-primary">
                                            Điểm tác động
                                        </span>
                                    </div>
                                    <span className="text-[28px] font-bold text-primary">
                                        {formatCompactMoney(points)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck
                                            className="size-5 text-primary"
                                            strokeWidth={1.6}
                                        />
                                        <span className="text-[16px] leading-7 text-primary">
                                            Trạng thái tài khoản
                                        </span>
                                    </div>
                                    <span className="text-[18px] font-semibold text-primary">
                                        {getAccountStatusLabel(account.status)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <UserRound
                                            className="size-5 text-primary"
                                            strokeWidth={1.6}
                                        />
                                        <span className="text-[16px] leading-7 text-primary">
                                            Đăng nhập gần nhất
                                        </span>
                                    </div>
                                    <span className="text-[18px] font-semibold text-primary">
                                        {lastLoginText}
                                    </span>
                                </div>
                                <div className="border border-border bg-muted px-4 py-5 text-[15px] leading-7 text-muted-foreground">
                                    Backend hiện tại chưa expose thống kê chiến
                                    dịch, chứng nhận và gây quỹ cho hồ sơ sinh
                                    viên. Trang này đang ưu tiên dữ liệu thật từ
                                    `auth/me`.
                                </div>
                            </div>
                        </section>
                    </aside>

                    <div className="space-y-6">
                        <section className="border border-input bg-white p-6 sm:p-8">
                            <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <p className="broadsheet-kicker">
                                        Thông tin cá nhân
                                    </p>
                                    <h2 className="mt-2 text-[32px] font-semibold leading-[1.1] text-primary">
                                        Hồ sơ đã đồng bộ
                                    </h2>
                                    <p className="mt-3 text-[16px] leading-7 text-muted-foreground">
                                        {getProfileSummary(account)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={
                                        updateProfileMutation.isPending ||
                                        !hasLocalChanges
                                    }
                                    className="inline-flex h-12 items-center justify-center border border-primary bg-primary px-5 text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#1F2937]"
                                >
                                    {updateProfileMutation.isPending
                                        ? 'Đang lưu...'
                                        : 'Lưu thay đổi'}
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
                                            className={`broadsheet-input h-12 ${canEditStudentFields ? '' : 'bg-muted text-muted-foreground'}`}
                                            onChange={handleDraftChange(
                                                'fullName',
                                            )}
                                            readOnly={!canEditStudentFields}
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
                                            className="broadsheet-input h-12 bg-muted text-muted-foreground"
                                            readOnly
                                            type="text"
                                            value={identityCode}
                                        />
                                    </label>

                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Khoa / đơn vị đào tạo
                                        </span>
                                        <input
                                            aria-label="Khoa / đơn vị đào tạo"
                                            className="broadsheet-input h-12 bg-muted text-muted-foreground"
                                            readOnly
                                            type="text"
                                            value={facultyName}
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
                                        className="min-h-[150px] border border-input bg-muted px-3 py-3 text-[16px] leading-7 text-muted-foreground outline-none"
                                        readOnly
                                        value={readOnlyBio}
                                    />
                                </label>

                                <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="broadsheet-kicker">
                                            Số điện thoại
                                        </span>
                                        <input
                                            aria-label="Số điện thoại"
                                            className={`broadsheet-input h-12 ${canEditStudentFields ? '' : 'bg-muted text-muted-foreground'}`}
                                            onChange={handleDraftChange(
                                                'phone',
                                            )}
                                            placeholder="Ví dụ: 0901 234 567"
                                            readOnly={!canEditStudentFields}
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
                                            className="broadsheet-input h-12 bg-muted text-muted-foreground"
                                            placeholder="Backend chưa hỗ trợ lưu liên kết hồ sơ công khai"
                                            readOnly
                                            type="text"
                                            value=""
                                        />
                                    </label>
                                </div>
                            </form>

                            {saveErrorMessage ? (
                                <div className="mt-6 border border-destructive bg-[#FEF2F2] px-4 py-5 text-[15px] leading-7 text-[#991B1B]">
                                    {saveErrorMessage}
                                </div>
                            ) : null}

                            <div className="mt-6 broadsheet-note">
                                Dữ liệu hiển thị trên trang này hiện được đồng
                                bộ trực tiếp từ backend `auth/me`. Các trường
                                chưa có endpoint cập nhật riêng được giữ ở chế
                                độ chỉ đọc để tránh ghi giả lập trên frontend.
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2">
                            <Link
                                className="group border border-input bg-white p-6 transition hover:border-primary"
                                to={paths.app.settings.getHref()}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center border border-primary bg-muted text-primary">
                                        <ShieldCheck
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="broadsheet-kicker">
                                            Bảo mật tài khoản
                                        </p>
                                        <h2 className="mt-2 text-[24px] font-semibold leading-[1.15] text-primary">
                                            Đi tới bảo mật
                                        </h2>
                                        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                                            Kiểm tra mật khẩu, phiên đăng nhập
                                            và quyền riêng tư liên quan đến tài
                                            khoản sinh viên.
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition group-hover:text-destructive">
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
                                className="group border border-input bg-white p-6 transition hover:border-primary"
                                to={paths.app.changePassword.getHref()}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center border border-primary bg-muted text-primary">
                                        <LockKeyhole
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="broadsheet-kicker">
                                            Truy cập nhanh
                                        </p>
                                        <h2 className="mt-2 text-[24px] font-semibold leading-[1.15] text-primary">
                                            Đổi mật khẩu
                                        </h2>
                                        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                                            Mở biểu mẫu rút gọn nếu bạn chỉ cần
                                            cập nhật khóa truy cập mà không đi
                                            qua toàn bộ cài đặt bảo mật.
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition group-hover:text-destructive">
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
