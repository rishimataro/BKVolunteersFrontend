import * as React from 'react';

import { ContentLayout } from '@/components/layouts';
import { useNotifications } from '@/components/ui/notifications';
import { useUser } from '@/features/auth';
import {
    getStudentActivities,
    getStudentDashboard,
    getStudentDonations,
    type StudentActivityItem,
    type StudentDashboardSummary,
    type StudentDonationItem,
} from '@/features/campaign/api/student';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const roleLabel: Record<string, string> = {
    SINHVIEN: 'Sinh viên',
    CLB: 'Quản trị đơn vị',
    LCD: 'Người duyệt cấp trường',
    DOANTRUONG: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

const activityTypeLabel: Record<string, string> = {
    money_donation: 'Đóng góp tiền',
    item_pledge: 'Quyên góp hiện vật',
    event_registration: 'Tham gia sự kiện',
    certificate: 'Chứng nhận',
};

const statusLabel: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    MATCHED: 'Đã khớp giao dịch',
    VERIFIED: 'Đã xác minh',
    REJECTED: 'Bị từ chối',
    REFUNDED: 'Đã hoàn tiền',
    PLEDGED: 'Đã đăng ký',
    CONFIRMED: 'Đã xác nhận',
    RECEIVED: 'Đã tiếp nhận',
    APPROVED: 'Đã duyệt',
    CHECKED_IN: 'Đã check-in',
    COMPLETED: 'Đã hoàn thành',
    READY: 'Sẵn sàng',
    SIGNED: 'Đã ký',
    REVOKED: 'Đã thu hồi',
};

const toUiStatus = (value: string) =>
    statusLabel[value] ?? toDisplayText(value);
const toUiActivityType = (value: string) =>
    activityTypeLabel[value] ?? toDisplayText(value);

export const DashboardRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();
    const [summary, setSummary] =
        React.useState<StudentDashboardSummary | null>(null);
    const [activities, setActivities] = React.useState<StudentActivityItem[]>(
        [],
    );
    const [donations, setDonations] = React.useState<StudentDonationItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const isStudent = user.data?.role === 'SINHVIEN';

    React.useEffect(() => {
        if (!isStudent) return;
        let mounted = true;
        setLoading(true);

        Promise.all([
            getStudentDashboard(),
            getStudentActivities(),
            getStudentDonations(),
        ])
            .then(([dashboardData, activityData, donationData]) => {
                if (!mounted) return;
                setSummary(dashboardData);
                setActivities(activityData);
                setDonations(donationData);
            })
            .catch((error) => {
                if (!mounted) return;
                addNotification({
                    type: 'error',
                    title: 'Không tải được dữ liệu dashboard',
                    message:
                        error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [addNotification, isStudent]);

    if (!user.data) return null;

    if (isStudent) {
        return (
            <ContentLayout title="Bảng Điều Khiển Sinh Viên">
                <div className="space-y-6">
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Chiến dịch đã tham gia
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary?.campaigns_count ?? 0}
                            </p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Tiền đã xác minh
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {(summary?.money_amount ?? 0).toLocaleString(
                                    'vi-VN',
                                )}
                                đ
                            </p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Hiện vật đã nhận
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary?.item_received_quantity ?? 0}
                            </p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Giờ tình nguyện
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary?.event_hours ?? 0}
                            </p>
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <h3 className="text-base font-semibold text-slate-900">
                                Hoạt động gần đây
                            </h3>
                            {loading ? (
                                <p className="mt-3 text-sm text-slate-600">
                                    Đang tải dữ liệu...
                                </p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {activities.slice(0, 8).map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <p className="text-sm font-semibold text-slate-900">
                                                {toDisplayTitle(
                                                    item.campaign_title,
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {toUiActivityType(
                                                    item.activity_type,
                                                )}{' '}
                                                - {toUiStatus(item.status)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {new Date(
                                                    item.occurred_at,
                                                ).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    ))}
                                    {activities.length === 0 ? (
                                        <p className="text-sm text-slate-600">
                                            Chưa có hoạt động nào được ghi nhận.
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <h3 className="text-base font-semibold text-slate-900">
                                Lịch sử đóng góp
                            </h3>
                            {loading ? (
                                <p className="mt-3 text-sm text-slate-600">
                                    Đang tải dữ liệu...
                                </p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {donations.slice(0, 8).map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {toDisplayTitle(
                                                        item.campaign_title,
                                                    )}
                                                </p>
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-blue-800">
                                                    {item.donation_type ===
                                                    'money'
                                                        ? 'Tiền'
                                                        : 'Hiện vật'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {toUiStatus(item.status)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {new Date(
                                                    item.occurred_at,
                                                ).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    ))}
                                    {donations.length === 0 ? (
                                        <p className="text-sm text-slate-600">
                                            Chưa có dữ liệu đóng góp.
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Tổng Quan">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Xin chào {user.data.firstName} {user.data.lastName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">Vai trò hiện tại</p>
                <p className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                    {roleLabel[user.data.role] ?? user.data.role}
                </p>
            </div>
        </ContentLayout>
    );
};
