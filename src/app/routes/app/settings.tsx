import {
    BellRing,
    Globe,
    Laptop2,
    Link2,
    ShieldCheck,
    Smartphone,
    UserRoundCheck,
} from 'lucide-react';
import { Link } from 'react-router';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import { ChangePasswordPanel } from '@/features/auth/components/change-password-panel';

const roleLabels: Record<string, string> = {
    [ROLES.SINHVIEN]: 'Sinh viên',
    [ROLES.CLB]: 'Quản lý CLB',
    [ROLES.LCD]: 'Phản biện',
    [ROLES.DOANTRUONG]: 'Quản trị trường',
};

const getMaskedEmail = (email: string) => {
    const [localPart = '', domain = ''] = email.split('@');

    if (localPart.length <= 2) {
        return email;
    }

    return `${localPart.slice(0, 1)}${'•'.repeat(Math.max(localPart.length - 2, 1))}${localPart.slice(-1)}@${domain}`;
};

const getBrowserLabel = (userAgent: string) => {
    if (/Edg\//.test(userAgent)) {
        return 'Microsoft Edge';
    }

    if (/Chrome\//.test(userAgent)) {
        return 'Google Chrome';
    }

    if (/Firefox\//.test(userAgent)) {
        return 'Mozilla Firefox';
    }

    if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
        return 'Safari';
    }

    return 'Trình duyệt hiện tại';
};

const getDeviceLabel = (userAgent: string) => {
    if (/iPhone|Android|Mobile/i.test(userAgent)) {
        return 'Thiết bị di động';
    }

    if (/Mac OS X/i.test(userAgent)) {
        return 'MacBook';
    }

    if (/Windows/i.test(userAgent)) {
        return 'Windows';
    }

    return 'Máy tính cá nhân';
};

const getCurrentSession = () => {
    if (typeof window === 'undefined') {
        return {
            browser: 'Trình duyệt hiện tại',
            device: 'Máy tính cá nhân',
            location: 'Phiên đang hoạt động',
            isMobile: false,
        };
    }

    const userAgent = window.navigator.userAgent;

    return {
        browser: getBrowserLabel(userAgent),
        device: getDeviceLabel(userAgent),
        location: window.location.hostname || 'Phiên đang hoạt động',
        isMobile: /iPhone|Android|Mobile/i.test(userAgent),
    };
};

export const SettingsRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();

    if (!user.data) {
        return null;
    }

    const currentSession = getCurrentSession();
    const roleLabel = roleLabels[user.data.role] ?? user.data.role;
    const maskedEmail = getMaskedEmail(user.data.email);

    const handleUnavailableFeature = (featureName: string) => {
        addNotification({
            type: 'info',
            title: `${featureName} đang được chuẩn bị`,
            message:
                'Chức năng này sẽ được bật khi hệ thống đồng bộ đầy đủ nhật ký đăng nhập và lớp xác thực phụ.',
        });
    };

    return (
        <>
            <Head title="Bảo mật và quyền riêng tư" />
            <div className="bg-white">
                <section className="border-b border-[#E5E7EB] pb-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-4xl">
                            <p className="broadsheet-kicker">
                                Cài đặt tài khoản
                            </p>
                            <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-[#0A0A0A] sm:text-[56px]">
                                Bảo mật và quyền riêng tư
                            </h1>
                            <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-[#4B5563]">
                                Quản lý mật khẩu, theo dõi phiên đăng nhập hiện
                                tại và rà soát các lớp bảo vệ đang áp dụng cho
                                tài khoản sinh viên của bạn.
                            </p>
                        </div>

                        <div className="border border-[#166534] bg-[#F0FDF4] px-5 py-4 text-[#166534] xl:max-w-[320px]">
                            <div className="flex items-start gap-3">
                                <ShieldCheck
                                    className="mt-0.5 size-5"
                                    strokeWidth={1.75}
                                />
                                <div>
                                    <p className="broadsheet-kicker text-[#166534]">
                                        Trạng thái tài khoản
                                    </p>
                                    <p className="mt-2 text-[18px] font-semibold leading-7">
                                        Tài khoản đang được bảo vệ ổn định
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="flex flex-wrap items-center gap-4 border-b border-[#E5E7EB] py-5">
                    <Link
                        className="border-b border-transparent pb-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#0A0A0A]"
                        to={paths.app.profile.getHref()}
                    >
                        Hồ sơ
                    </Link>
                    <span className="border-b-2 border-[#0A0A0A] pb-2 text-[14px] font-semibold text-[#0A0A0A]">
                        Bảo mật
                    </span>
                    <Link
                        className="border-b border-transparent pb-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#0A0A0A]"
                        to={paths.app.changePassword.getHref()}
                    >
                        Mở trang đổi mật khẩu rút gọn
                    </Link>
                </section>

                <section className="grid gap-6 pt-8 lg:grid-cols-12">
                    <section className="border border-[#D1D5DB] bg-white p-6 lg:col-span-7">
                        <ChangePasswordPanel
                            description="Cập nhật mật khẩu truy cập, kiểm tra các điều kiện bắt buộc và thay đổi trực tiếp ngay trên trang cài đặt bảo mật."
                            submitLabel="Cập nhật mật khẩu"
                            title="Thay đổi mật khẩu"
                        />
                    </section>

                    <section className="border border-[#D1D5DB] bg-white p-6 lg:col-span-5">
                        <div className="flex items-start gap-4 border-b border-[#E5E7EB] pb-5">
                            <div className="flex h-12 w-12 items-center justify-center border border-[#0A0A0A] bg-[#F9FAFB] text-[#0A0A0A]">
                                <UserRoundCheck
                                    className="size-5"
                                    strokeWidth={1.75}
                                />
                            </div>
                            <div>
                                <p className="broadsheet-kicker">
                                    Xác thực bổ sung
                                </p>
                                <h2 className="mt-2 text-[30px] font-semibold leading-[1.15] text-[#0A0A0A]">
                                    Xác thực hai lớp
                                </h2>
                                <p className="mt-3 text-[16px] leading-7 text-[#4B5563]">
                                    Hệ thống hiện ưu tiên mật khẩu và Email Đại
                                    học để bảo vệ tài khoản. Lớp xác thực bổ
                                    sung sẽ được bật khi backend hoàn tất đồng
                                    bộ thiết bị.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6">
                            <div className="border border-[#D1D5DB] bg-[#F9FAFB] p-4">
                                <p className="broadsheet-kicker">
                                    Email xác thực
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[18px] font-semibold text-[#0A0A0A]">
                                            {maskedEmail}
                                        </p>
                                        <p className="mt-1 text-[14px] leading-6 text-[#4B5563]">
                                            Dùng để nhận cảnh báo đăng nhập và
                                            hướng dẫn khôi phục tài khoản.
                                        </p>
                                    </div>
                                    <span className="border border-[#166534] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#166534]">
                                        Đang hoạt động
                                    </span>
                                </div>
                            </div>

                            <div className="border border-[#D1D5DB] p-4">
                                <p className="broadsheet-kicker">
                                    Trạng thái 2FA
                                </p>
                                <p className="mt-3 text-[24px] font-semibold text-[#0A0A0A]">
                                    Chưa có điều khiển riêng cho sinh viên
                                </p>
                                <p className="mt-2 text-[15px] leading-7 text-[#4B5563]">
                                    Khi tính năng hoàn tất, bạn sẽ có thể xác
                                    nhận đăng nhập từ thiết bị lạ qua Email Đại
                                    học hoặc lớp xác thực phụ.
                                </p>
                                <Button
                                    className="mt-5 h-11 border border-[#0A0A0A] bg-white px-5 text-[15px] font-semibold text-[#0A0A0A] hover:bg-[#F9FAFB]"
                                    onClick={() =>
                                        handleUnavailableFeature(
                                            'Xác thực hai lớp',
                                        )
                                    }
                                    type="button"
                                    variant="ghost"
                                >
                                    <BellRing className="mr-2 size-4" />
                                    Nhận thông báo khi khả dụng
                                </Button>
                            </div>

                            <div className="broadsheet-note">
                                Vai trò hiện tại: <strong>{roleLabel}</strong>.
                                Tài khoản sinh viên được bảo vệ bằng mật khẩu,
                                phiên đăng nhập hiện tại và xác minh qua Email
                                Đại học.
                            </div>
                        </div>
                    </section>
                </section>

                <section className="mt-10 border border-[#D1D5DB] bg-white">
                    <div className="flex flex-col gap-4 border-b border-[#E5E7EB] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="broadsheet-kicker">
                                Thiết bị đang truy cập
                            </p>
                            <h2 className="mt-2 text-[32px] font-semibold leading-[1.15] text-[#0A0A0A]">
                                Quản lý phiên đăng nhập
                            </h2>
                            <p className="mt-3 max-w-3xl text-[16px] leading-7 text-[#4B5563]">
                                Dữ liệu hiện tại chỉ xác nhận phiên đang mở trên
                                thiết bị này. Nhật ký nhiều thiết bị và thao tác
                                đăng xuất hàng loạt sẽ được bổ sung sau.
                            </p>
                        </div>

                        <Button
                            className="h-11 border border-[#DC2626] bg-white px-5 text-[15px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2]"
                            onClick={() =>
                                handleUnavailableFeature(
                                    'Đăng xuất tất cả phiên',
                                )
                            }
                            type="button"
                            variant="ghost"
                        >
                            Đăng xuất khỏi thiết bị khác
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4B5563]">
                                        Thiết bị / Trình duyệt
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4B5563]">
                                        Định danh
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4B5563]">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4B5563]">
                                        Ghi chú
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-[#E5E7EB]">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-11 w-11 items-center justify-center border border-[#D1D5DB] bg-[#F9FAFB] text-[#0A0A0A]">
                                                {currentSession.isMobile ? (
                                                    <Smartphone
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                ) : (
                                                    <Laptop2
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[16px] font-semibold text-[#0A0A0A]">
                                                    {currentSession.device} •{' '}
                                                    {currentSession.browser}
                                                </p>
                                                <p className="mt-1 text-[14px] leading-6 text-[#4B5563]">
                                                    Phiên trình duyệt hiện tại
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-[15px] leading-7 text-[#4B5563]">
                                        {currentSession.location}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="border border-[#166534] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#166534]">
                                            Phiên hiện tại
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[15px] leading-7 text-[#4B5563]">
                                        Được ghi nhận sau khi bạn đăng nhập
                                        thành công vào hệ thống.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-10 border border-[#0A0A0A] bg-[#0A0A0A] p-6 text-white">
                    <div className="grid gap-6 lg:grid-cols-[72px_minmax(0,1fr)_240px] lg:items-center">
                        <div className="flex h-[72px] w-[72px] items-center justify-center border border-white/20 bg-white/5">
                            <Globe className="size-9" strokeWidth={1.6} />
                        </div>
                        <div>
                            <p className="broadsheet-kicker text-white/70">
                                Quyền riêng tư
                            </p>
                            <h2 className="mt-2 text-[32px] font-semibold leading-[1.15] text-white">
                                Dữ liệu hoạt động của bạn chỉ được dùng cho hồ
                                sơ sinh viên, chiến dịch và chứng nhận liên
                                quan.
                            </h2>
                            <p className="mt-4 text-[16px] leading-7 text-white/80">
                                Hệ thống không công khai thông tin ngoài phạm vi
                                chương trình tình nguyện nếu không có ngữ cảnh
                                học vụ hoặc xác minh tham gia tương ứng.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                className="h-12 border border-white bg-white px-5 text-[15px] font-semibold text-[#0A0A0A] hover:bg-transparent hover:text-white"
                                onClick={() =>
                                    handleUnavailableFeature(
                                        'Chính sách quyền riêng tư',
                                    )
                                }
                                type="button"
                            >
                                <Link2 className="mr-2 size-4" />
                                Xem cam kết bảo mật
                            </Button>
                            <div className="border border-white/20 px-4 py-3 text-[14px] leading-6 text-white/80">
                                Mã số sinh viên:{' '}
                                {user.data.studentCode || 'Chưa cập nhật'}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};
