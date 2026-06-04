import * as React from 'react';
import { Link, Navigate } from 'react-router';
import {
    ArrowRight,
    Award,
    CalendarDays,
    Download,
    HandCoins,
    History,
    TimerReset,
} from 'lucide-react';

import { Head } from '@/components/seo';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import {
    getStudentActivities,
    getStudentDashboard,
    type StudentActivityItem,
    type StudentDashboardSummary,
} from '@/features/campaign/api/student';
import { getPublicCampaigns } from '@/features/campaign/api/public';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { PublicCampaignCard } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const PAGE_SIZE = 4;
const VOLUNTEER_TARGET_HOURS = 100;

type SemesterFilter = 'ALL' | 'HK1' | 'HK2' | 'HE';

type HistoryRow = {
    id: string;
    activityType: StudentActivityItem['activity_type'];
    actionHref: string;
    actionLabel: string;
    campaignTitle: string;
    occurredAt: string;
    referenceCode: string;
    roleLabel: string;
    semester: SemesterFilter;
    status: string;
};

const activityRoleLabel: Record<string, string> = {
    money_donation: 'Nhà hảo tâm',
    item_pledge: 'Người đóng góp',
    event_registration: 'Tình nguyện viên',
    certificate: 'Giấy chứng nhận',
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
    COMPLETED: 'Đã tham gia',
    READY: 'Sẵn sàng',
    SIGNED: 'Đã ký',
    REVOKED: 'Đã thu hồi',
    SUBMITTED: 'Chờ phê duyệt',
    PRE_APPROVED: 'Chờ duyệt cuối',
    REVISION_REQUIRED: 'Cần chỉnh sửa',
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
    DRAFT: 'Nháp',
    ARCHIVED: 'Lưu trữ',
};

const semesterOptions: Array<{ label: string; value: SemesterFilter }> = [
    { label: 'Tất cả học kỳ', value: 'ALL' },
    { label: 'Học kỳ 1', value: 'HK1' },
    { label: 'Học kỳ 2', value: 'HK2' },
    { label: 'Học kỳ hè', value: 'HE' },
];

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

const formatCompactMoney = (value: number) => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
    }

    if (value >= 1_000) {
        return `${Math.round(value / 1_000)}k`;
    }

    return value.toLocaleString('vi-VN');
};

const getAcademicYear = (value: string) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return month >= 9 ? `${year} - ${year + 1}` : `${year - 1} - ${year}`;
};

const getSemester = (value: string): SemesterFilter => {
    const month = new Date(value).getMonth() + 1;

    if (month >= 9 && month <= 12) {
        return 'HK1';
    }

    if (month >= 1 && month <= 5) {
        return 'HK2';
    }

    return 'HE';
};

const getStatusClasses = (status: string) => {
    if (['COMPLETED', 'APPROVED', 'VERIFIED', 'SIGNED'].includes(status)) {
        return 'border-[#166534] text-[#166534]';
    }

    if (['PENDING', 'SUBMITTED', 'PRE_APPROVED'].includes(status)) {
        return 'border-[#C2410C] text-[#C2410C]';
    }

    if (['REJECTED', 'REVOKED', 'REFUNDED'].includes(status)) {
        return 'border-[#DC2626] text-[#DC2626]';
    }

    return 'border-[#0A0A0A] text-[#0A0A0A]';
};

const getActionMeta = (item: StudentActivityItem) => {
    if (item.activity_type === 'certificate') {
        return {
            actionHref: paths.app.certificates.getHref(),
            actionLabel: 'Giấy chứng nhận',
        };
    }

    if (
        item.activity_type === 'money_donation' ||
        item.activity_type === 'item_pledge'
    ) {
        return {
            actionHref: paths.app.myDonations.getHref(),
            actionLabel: 'Hồ sơ đóng góp',
        };
    }

    return {
        actionHref: paths.app.campaigns.detail.getHref(item.campaign_slug),
        actionLabel: 'Xem chiến dịch',
    };
};

const buildHistoryRows = (items: StudentActivityItem[]): HistoryRow[] =>
    [...items]
        .sort(
            (left, right) =>
                new Date(right.occurred_at).getTime() -
                new Date(left.occurred_at).getTime(),
        )
        .map((item) => ({
            id: item.id,
            activityType: item.activity_type,
            campaignTitle: toDisplayTitle(item.campaign_title),
            occurredAt: item.occurred_at,
            referenceCode: `Mã: ${item.reference_id}`,
            roleLabel:
                activityRoleLabel[item.activity_type] ??
                toDisplayText(item.activity_type),
            semester: getSemester(item.occurred_at),
            status: item.status,
            ...getActionMeta(item),
        }));

const buildAcademicYearOptions = (items: StudentActivityItem[]) => {
    const values = Array.from(
        new Set(
            items
                .map((item) => getAcademicYear(item.occurred_at))
                .filter(Boolean),
        ),
    );

    return values.sort((left, right) => right.localeCompare(left));
};

const getPageItems = (currentPage: number, totalPages: number) => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, 'ellipsis', totalPages] as const;
    }

    if (currentPage >= totalPages - 2) {
        return [
            1,
            'ellipsis',
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
        ] as const;
    }

    return [
        1,
        'ellipsis',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        'ellipsis',
        totalPages,
    ] as const;
};

export const MyImpactRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();
    const [summary, setSummary] =
        React.useState<StudentDashboardSummary | null>(null);
    const [activities, setActivities] = React.useState<StudentActivityItem[]>(
        [],
    );
    const [recommendedCampaign, setRecommendedCampaign] =
        React.useState<PublicCampaignCard | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState('');
    const [selectedSemester, setSelectedSemester] =
        React.useState<SemesterFilter>('ALL');
    const [currentPage, setCurrentPage] = React.useState(1);

    const isStudent = user.data?.role === ROLES.SINHVIEN;

    React.useEffect(() => {
        if (!isStudent) {
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(null);

        Promise.allSettled([
            getStudentDashboard(),
            getStudentActivities(),
            getPublicCampaigns({ status: 'PUBLISHED', limit: 1 }),
        ])
            .then((results) => {
                if (!mounted) {
                    return;
                }

                const [summaryResult, activitiesResult, campaignsResult] =
                    results;

                if (
                    summaryResult.status !== 'fulfilled' ||
                    activitiesResult.status !== 'fulfilled'
                ) {
                    throw new Error('Không thể tải dữ liệu lịch sử hoạt động.');
                }

                setSummary(summaryResult.value);
                setActivities(activitiesResult.value);

                if (campaignsResult.status === 'fulfilled') {
                    setRecommendedCampaign(
                        campaignsResult.value.items[0] ?? null,
                    );
                }
            })
            .catch((loadError) => {
                if (!mounted) {
                    return;
                }

                const message =
                    loadError instanceof Error
                        ? loadError.message
                        : 'Không thể tải dữ liệu lịch sử hoạt động.';
                setError(message);
                addNotification({
                    type: 'error',
                    title: 'Không thể tải lịch sử hoạt động',
                    message,
                });
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [addNotification, isStudent]);

    const academicYearOptions = React.useMemo(
        () => buildAcademicYearOptions(activities),
        [activities],
    );

    React.useEffect(() => {
        if (academicYearOptions.length === 0) {
            return;
        }

        if (
            !selectedAcademicYear ||
            !academicYearOptions.includes(selectedAcademicYear)
        ) {
            setSelectedAcademicYear(academicYearOptions[0]);
            setCurrentPage(1);
        }
    }, [academicYearOptions, selectedAcademicYear]);

    const historyRows = React.useMemo(
        () => buildHistoryRows(activities),
        [activities],
    );

    const filteredRows = React.useMemo(
        () =>
            historyRows.filter((row) => {
                const matchesAcademicYear =
                    !selectedAcademicYear ||
                    getAcademicYear(row.occurredAt) === selectedAcademicYear;
                const matchesSemester =
                    selectedSemester === 'ALL' ||
                    row.semester === selectedSemester;

                return matchesAcademicYear && matchesSemester;
            }),
        [historyRows, selectedAcademicYear, selectedSemester],
    );

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const pagedRows = filteredRows.slice(
        (currentPageSafe - 1) * PAGE_SIZE,
        currentPageSafe * PAGE_SIZE,
    );
    const progressPercent = Math.min(
        100,
        Math.round(
            ((summary?.event_hours ?? 0) / VOLUNTEER_TARGET_HOURS) * 100,
        ),
    );
    const pageItems = getPageItems(currentPageSafe, totalPages);

    const handleResetFilters = () => {
        setSelectedAcademicYear(academicYearOptions[0] ?? '');
        setSelectedSemester('ALL');
        setCurrentPage(1);
    };

    const handleExport = () => {
        if (filteredRows.length === 0 || typeof window === 'undefined') {
            addNotification({
                type: 'error',
                title: 'Không có dữ liệu để xuất',
                message: 'Vui lòng điều chỉnh bộ lọc trước khi xuất báo cáo.',
            });
            return;
        }

        const header = [
            'Tên chiến dịch',
            'Vai trò',
            'Thời gian',
            'Trạng thái',
            'Mã tham chiếu',
        ];
        const rows = filteredRows.map((row) => [
            row.campaignTitle,
            row.roleLabel,
            formatDate(row.occurredAt),
            statusLabel[row.status] ?? toDisplayText(row.status),
            row.referenceCode.replace('Mã: ', ''),
        ]);
        const csvContent = [header, ...rows]
            .map((columns) =>
                columns
                    .map((column) => `"${String(column).replace(/"/g, '""')}"`)
                    .join(','),
            )
            .join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'lich-su-hoat-dong.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!isStudent) {
        return <Navigate to={paths.app.dashboard.getHref()} replace />;
    }

    return (
        <>
            <Head title="Lịch sử hoạt động" />
            <div className="bg-white">
                <section className="border-b border-[#E5E7EB] pb-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-4xl">
                            <p className="broadsheet-kicker">
                                Khu vực sinh viên
                            </p>
                            <h1 className="mt-3 font-heading text-[42px] leading-[1.05] font-bold text-[#0A0A0A] sm:text-[56px]">
                                Lịch sử hoạt động
                            </h1>
                            <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-[#4B5563]">
                                Theo dõi hành trình tham gia chiến dịch, số giờ
                                tình nguyện và những dấu mốc đã được ghi nhận
                                trên cổng BK Volunteers.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2">
                                <span className="broadsheet-kicker">
                                    Năm học
                                </span>
                                <select
                                    aria-label="Năm học"
                                    value={selectedAcademicYear}
                                    onChange={(event) => {
                                        setSelectedAcademicYear(
                                            event.target.value,
                                        );
                                        setCurrentPage(1);
                                    }}
                                    className="broadsheet-select min-w-[220px]"
                                >
                                    {academicYearOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-2">
                                <span className="broadsheet-kicker">
                                    Học kỳ
                                </span>
                                <select
                                    aria-label="Học kỳ"
                                    value={selectedSemester}
                                    onChange={(event) => {
                                        setSelectedSemester(
                                            event.target
                                                .value as SemesterFilter,
                                        );
                                        setCurrentPage(1);
                                    }}
                                    className="broadsheet-select min-w-[180px]"
                                >
                                    {semesterOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="pt-8">
                    {loading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}

                    {!loading && !error ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <section className="border border-[#D1D5DB] bg-white p-5">
                                    <CalendarDays
                                        className="size-5 text-[#0A0A0A]"
                                        strokeWidth={1.5}
                                    />
                                    <p className="mt-4 text-[32px] font-bold text-[#0A0A0A]">
                                        {summary?.campaigns_count ?? 0}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-6 text-[#4B5563]">
                                        Chiến dịch tham gia
                                    </p>
                                </section>

                                <section className="border border-[#D1D5DB] bg-white p-5">
                                    <TimerReset
                                        className="size-5 text-[#0A0A0A]"
                                        strokeWidth={1.5}
                                    />
                                    <p className="mt-4 text-[32px] font-bold text-[#0A0A0A]">
                                        {summary?.event_hours ?? 0}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-6 text-[#4B5563]">
                                        Giờ tình nguyện
                                    </p>
                                </section>

                                <section className="border border-[#D1D5DB] bg-white p-5">
                                    <Award
                                        className="size-5 text-[#0A0A0A]"
                                        strokeWidth={1.5}
                                    />
                                    <p className="mt-4 text-[32px] font-bold text-[#0A0A0A]">
                                        {summary?.certificates_count ?? 0}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-6 text-[#4B5563]">
                                        Giấy chứng nhận
                                    </p>
                                </section>

                                <section className="border border-[#D1D5DB] bg-white p-5">
                                    <HandCoins
                                        className="size-5 text-[#0A0A0A]"
                                        strokeWidth={1.5}
                                    />
                                    <p className="mt-4 text-[32px] font-bold text-[#0A0A0A]">
                                        {formatCompactMoney(
                                            summary?.money_amount ?? 0,
                                        )}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-6 text-[#4B5563]">
                                        Tổng đóng góp tiền
                                    </p>
                                </section>
                            </div>

                            <section className="mt-8 border border-[#D1D5DB] bg-white">
                                <div className="flex flex-col gap-4 border-b border-[#D1D5DB] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="broadsheet-kicker">
                                            Nhật ký cá nhân
                                        </p>
                                        <h2 className="mt-3 font-heading text-[32px] leading-[1.1] font-bold text-[#0A0A0A]">
                                            Danh sách hoạt động
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={handleResetFilters}
                                            className="inline-flex items-center gap-2 border border-[#D1D5DB] px-4 py-2 text-[14px] font-semibold text-[#0A0A0A] transition hover:bg-[#F9FAFB]"
                                        >
                                            <History
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                            Đặt lại bộ lọc
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExport}
                                            className="inline-flex items-center gap-2 border border-[#D1D5DB] px-4 py-2 text-[14px] font-semibold text-[#0A0A0A] transition hover:bg-[#F9FAFB]"
                                        >
                                            <Download
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                            Xuất báo cáo
                                        </button>
                                    </div>
                                </div>

                                {filteredRows.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse">
                                                <thead>
                                                    <tr className="border-b border-[#D1D5DB] bg-[#F9FAFB] text-left">
                                                        <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                                            Tên chiến dịch
                                                        </th>
                                                        <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                                            Vai trò
                                                        </th>
                                                        <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                                            Thời gian
                                                        </th>
                                                        <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                                            Trạng thái
                                                        </th>
                                                        <th className="px-5 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                                            Hành động
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pagedRows.map((row) => (
                                                        <tr
                                                            key={row.id}
                                                            className="border-b border-[#E5E7EB] last:border-b-0"
                                                        >
                                                            <td className="px-5 py-5 align-top">
                                                                <p className="text-[20px] font-semibold leading-8 text-[#0A0A0A]">
                                                                    {
                                                                        row.campaignTitle
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-[13px] leading-6 text-[#4B5563]">
                                                                    {
                                                                        row.referenceCode
                                                                    }
                                                                </p>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <span className="inline-flex border border-[#D1D5DB] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0A0A0A]">
                                                                    {
                                                                        row.roleLabel
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-5 align-top text-[16px] leading-7 text-[#0A0A0A]">
                                                                {formatDate(
                                                                    row.occurredAt,
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <span
                                                                    className={`inline-flex border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] ${getStatusClasses(
                                                                        row.status,
                                                                    )}`}
                                                                >
                                                                    {statusLabel[
                                                                        row
                                                                            .status
                                                                    ] ??
                                                                        toDisplayText(
                                                                            row.status,
                                                                        )}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-5 align-top text-right">
                                                                <Link
                                                                    to={
                                                                        row.actionHref
                                                                    }
                                                                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0A0A0A] transition hover:text-[#DC2626]"
                                                                >
                                                                    {
                                                                        row.actionLabel
                                                                    }
                                                                    <ArrowRight
                                                                        className="size-4"
                                                                        strokeWidth={
                                                                            1.75
                                                                        }
                                                                    />
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-col gap-4 border-t border-[#D1D5DB] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                            <p className="text-[14px] leading-6 text-[#4B5563]">
                                                Hiển thị{' '}
                                                {(currentPageSafe - 1) *
                                                    PAGE_SIZE +
                                                    1}
                                                -
                                                {Math.min(
                                                    filteredRows.length,
                                                    currentPageSafe * PAGE_SIZE,
                                                )}{' '}
                                                trên {filteredRows.length} hoạt
                                                động.
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            Math.max(
                                                                1,
                                                                currentPageSafe -
                                                                    1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        currentPageSafe <= 1
                                                    }
                                                    className="border border-[#D1D5DB] px-3 py-2 text-[14px] font-semibold text-[#0A0A0A] disabled:cursor-not-allowed disabled:text-[#9CA3AF]"
                                                >
                                                    Trước
                                                </button>
                                                {pageItems.map((item, index) =>
                                                    item === 'ellipsis' ? (
                                                        <span
                                                            key={`${item}-${index}`}
                                                            className="px-2 text-[14px] text-[#4B5563]"
                                                        >
                                                            ...
                                                        </span>
                                                    ) : (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            aria-label={`Trang ${item}`}
                                                            onClick={() =>
                                                                setCurrentPage(
                                                                    item,
                                                                )
                                                            }
                                                            className={`border px-3 py-2 text-[14px] font-semibold ${
                                                                item ===
                                                                currentPageSafe
                                                                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                                                                    : 'border-[#D1D5DB] text-[#0A0A0A]'
                                                            }`}
                                                        >
                                                            {item}
                                                        </button>
                                                    ),
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            Math.min(
                                                                totalPages,
                                                                currentPageSafe +
                                                                    1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        currentPageSafe >=
                                                        totalPages
                                                    }
                                                    className="border border-[#D1D5DB] px-3 py-2 text-[14px] font-semibold text-[#0A0A0A] disabled:cursor-not-allowed disabled:text-[#9CA3AF]"
                                                >
                                                    Sau
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-5 py-8">
                                        <EmptyState
                                            title="Chưa có hoạt động phù hợp"
                                            description="Hãy thay đổi năm học hoặc học kỳ để xem thêm lịch sử đã được ghi nhận."
                                        />
                                    </div>
                                )}
                            </section>

                            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                                <div className="border border-[#0A0A0A] bg-[#0A0A0A] p-6 text-white">
                                    <p className="broadsheet-kicker text-white/70">
                                        Mốc tiếp theo
                                    </p>
                                    <h2 className="mt-3 font-heading text-[36px] leading-[1.1] font-bold">
                                        Đạt {VOLUNTEER_TARGET_HOURS} giờ để chạm
                                        cột mốc mới
                                    </h2>
                                    <p className="mt-4 text-[18px] leading-8 text-white/80">
                                        Bạn đã ghi nhận{' '}
                                        {summary?.event_hours ?? 0} giờ tình
                                        nguyện. Còn{' '}
                                        {Math.max(
                                            0,
                                            VOLUNTEER_TARGET_HOURS -
                                                (summary?.event_hours ?? 0),
                                        )}{' '}
                                        giờ để hoàn thành mục tiêu hiện tại.
                                    </p>

                                    <div className="mt-8 border border-white/20 p-4">
                                        <div className="h-4 border border-white/30 bg-white/10">
                                            <div
                                                className="h-full bg-white"
                                                style={{
                                                    width: `${progressPercent}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[14px] font-semibold uppercase tracking-[0.08em] text-white/80">
                                            <span>
                                                {summary?.event_hours ?? 0} giờ
                                                hiện tại
                                            </span>
                                            <span>
                                                Mục tiêu{' '}
                                                {VOLUNTEER_TARGET_HOURS}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-[#D1D5DB] bg-white p-6">
                                    <p className="broadsheet-kicker">
                                        Đề xuất tiếp theo
                                    </p>
                                    <h2 className="mt-3 font-heading text-[32px] leading-[1.1] font-bold text-[#0A0A0A]">
                                        Hoạt động mới cho bạn
                                    </h2>
                                    <p className="mt-4 text-[16px] leading-7 text-[#4B5563]">
                                        Dựa trên các hoạt động đã ghi nhận, đây
                                        là chiến dịch công khai bạn có thể tiếp
                                        tục theo dõi.
                                    </p>

                                    {recommendedCampaign ? (
                                        <Link
                                            to={paths.app.campaigns.detail.getHref(
                                                recommendedCampaign.slug,
                                            )}
                                            className="mt-6 block border border-[#D1D5DB] bg-[#F9FAFB] p-4 transition hover:border-[#0A0A0A]"
                                        >
                                            <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center">
                                                <div className="aspect-square border border-[#D1D5DB] bg-white">
                                                    {recommendedCampaign.cover_image_url ? (
                                                        <img
                                                            src={
                                                                recommendedCampaign.cover_image_url
                                                            }
                                                            alt={toDisplayTitle(
                                                                recommendedCampaign.title,
                                                            )}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-[14px] font-semibold text-[#4B5563]">
                                                            BK Volunteers
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[22px] font-semibold leading-8 text-[#0A0A0A]">
                                                        {toDisplayTitle(
                                                            recommendedCampaign.title,
                                                        )}
                                                    </p>
                                                    <p className="mt-2 text-[14px] leading-6 text-[#4B5563]">
                                                        Bắt đầu:{' '}
                                                        {formatDate(
                                                            recommendedCampaign.start_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="mt-6 border border-[#D1D5DB] bg-[#F9FAFB] p-4 text-[15px] leading-7 text-[#4B5563]">
                                            Chưa có chiến dịch phù hợp để đề
                                            xuất ngay lúc này.
                                        </div>
                                    )}

                                    <Link
                                        to={paths.app.campaigns.getHref()}
                                        className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-[#0A0A0A] transition hover:text-[#DC2626]"
                                    >
                                        Xem tất cả chiến dịch
                                        <ArrowRight
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                    </Link>
                                </div>
                            </section>
                        </>
                    ) : null}
                </section>
            </div>
        </>
    );
};
