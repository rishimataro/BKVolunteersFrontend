import * as React from 'react';
import { Link } from 'react-router';
import {
    ArrowRight,
    CalendarDays,
    Copy,
    FolderKanban,
    GraduationCap,
    HandCoins,
    Hourglass,
    Megaphone,
    TimerReset,
    type LucideIcon,
} from 'lucide-react';

import { paths } from '@/config/paths';
import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    getApprovalQueue,
    type ApprovalQueueItem,
} from '@/features/campaign/api/approval';
import {
    getStudentActivities,
    getStudentDashboard,
    getStudentDonations,
    type StudentActivityItem,
    type StudentDashboardSummary,
    type StudentDonationItem,
} from '@/features/campaign/api/student';
import {
    getSchoolOverview,
    type SchoolOverview,
    type SchoolOverviewQuery,
} from '@/features/reports/api/reports';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

type SchoolTimeRange = '30d' | '90d' | 'year';
type RankingMetric = 'hours' | 'funds' | 'campaigns';

const roleLabel: Record<string, string> = {
    SINHVIEN: 'Sinh viên',
    CLB: 'Quản trị đơn vị',
    LCD: 'Liên chi đoàn khoa',
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
    SUBMITTED: 'Chờ phê duyệt',
    PRE_APPROVED: 'Chờ duyệt cuối',
    REVISION_REQUIRED: 'Cần chỉnh sửa',
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
    DRAFT: 'Nháp',
    ARCHIVED: 'Lưu trữ',
};

const moduleTypeLabel: Record<string, string> = {
    fundraising: 'Gây quỹ',
    item_donation: 'Hiện vật',
    event: 'Sự kiện',
};

const timeRangeOptions: Array<{ value: SchoolTimeRange; label: string }> = [
    { value: '30d', label: '30 ngày qua' },
    { value: '90d', label: '90 ngày qua' },
    { value: 'year', label: 'Năm nay' },
];

const rankingMetricOptions: Array<{
    value: RankingMetric;
    label: string;
}> = [
    { value: 'hours', label: 'Theo giờ tình nguyện' },
    { value: 'funds', label: 'Theo quỹ gây được' },
    { value: 'campaigns', label: 'Theo số chiến dịch' },
];

const panelClassName =
    'rounded-xl border border-[#C3C6D2] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]';

const selectClassName =
    'h-12 w-full rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const toUiStatus = (value: string) =>
    statusLabel[value] ?? toDisplayText(value);

const toUiActivityType = (value: string) =>
    activityTypeLabel[value] ?? toDisplayText(value);

const formatCurrencyCompact = (value: number) => {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
    }

    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }

    return value.toLocaleString('vi-VN');
};

const formatRelativeTime = (value: Date | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const diffMinutes = Math.max(
        1,
        Math.round((Date.now() - value.getTime()) / 60000),
    );

    if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    }

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ngày trước`;
};

const formatMonthHeading = (range: SchoolTimeRange) => {
    if (range === 'year') {
        return 'Năm hiện tại';
    }

    if (range === '90d') {
        return '90 ngày gần nhất';
    }

    return '30 ngày gần nhất';
};

const buildOverviewQuery = (range: SchoolTimeRange): SchoolOverviewQuery => {
    const now = new Date();
    const from = new Date(now);

    if (range === '90d') {
        from.setDate(now.getDate() - 90);
    } else if (range === 'year') {
        from.setMonth(0, 1);
        from.setHours(0, 0, 0, 0);
    } else {
        from.setDate(now.getDate() - 30);
    }

    return {
        from: from.toISOString(),
        to: now.toISOString(),
    };
};

const getStatusCount = (
    overview: SchoolOverview | null,
    statuses: string[],
): number =>
    (overview?.status_breakdown ?? [])
        .filter((item) => statuses.includes(item.status))
        .reduce((total, item) => total + item.campaign_count, 0);

type DashboardStatCardProps = {
    label: string;
    value: string;
    note: string;
    icon: LucideIcon;
    tone: 'blue' | 'green' | 'orange' | 'gray';
};

const statToneMap: Record<
    DashboardStatCardProps['tone'],
    {
        border: string;
        iconBox: string;
        iconColor: string;
    }
> = {
    blue: {
        border: 'border-[#002A58]',
        iconBox: 'bg-[#D6E3FF]',
        iconColor: 'text-[#002A58]',
    },
    green: {
        border: 'border-[#006D37]',
        iconBox: 'bg-[#6BFE9C]/30',
        iconColor: 'text-[#006D37]',
    },
    orange: {
        border: 'border-[#6F2D00]',
        iconBox: 'bg-[#FFDBCB]',
        iconColor: 'text-[#773305]',
    },
    gray: {
        border: 'border-[#737781]',
        iconBox: 'bg-[#E7E8E9]',
        iconColor: 'text-[#424750]',
    },
};

const DashboardStatCard = ({
    label,
    value,
    note,
    icon: Icon,
    tone,
}: DashboardStatCardProps) => {
    const toneClass = statToneMap[tone];

    return (
        <section
            className={`${panelClassName} border-l-4 p-6 ${toneClass.border}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass.iconBox}`}
                >
                    <Icon
                        className={`size-6 ${toneClass.iconColor}`}
                        strokeWidth={1.5}
                    />
                </div>
            </div>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                {label}
            </p>
            <p className="mt-3 text-[30px] font-bold leading-[38px] text-[#002A58]">
                {value}
            </p>
            <p className="mt-3 text-[14px] leading-6 text-[#424750]">{note}</p>
        </section>
    );
};

const ProgressRing = ({ percent }: { percent: number }) => {
    const normalizedPercent = Math.max(0, Math.min(100, percent));
    const radius = 76;
    const circumference = 2 * Math.PI * radius;
    const dashOffset =
        circumference - (normalizedPercent / 100) * circumference;

    return (
        <svg viewBox="0 0 180 180" className="h-52 w-52" aria-hidden="true">
            <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#1D4E89"
                strokeWidth="12"
                opacity="0.45"
            />
            <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#6BFE9C"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 90 90)"
            />
        </svg>
    );
};

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

    const [overview, setOverview] = React.useState<SchoolOverview | null>(null);
    const [approvalQueue, setApprovalQueue] = React.useState<
        ApprovalQueueItem[]
    >([]);
    const [schoolLoading, setSchoolLoading] = React.useState(false);
    const [schoolError, setSchoolError] = React.useState<string | null>(null);
    const [timeRange, setTimeRange] = React.useState<SchoolTimeRange>('30d');
    const [rankingMetric, setRankingMetric] =
        React.useState<RankingMetric>('hours');
    const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

    const role = user.data?.role;
    const isStudent = role === ROLES.SINHVIEN;
    const isSchoolBoard = role === ROLES.DOANTRUONG;

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
                    title: 'Không tải được dữ liệu bảng điều khiển',
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

    React.useEffect(() => {
        if (!isSchoolBoard) return;
        let mounted = true;
        setSchoolLoading(true);
        setSchoolError(null);

        Promise.all([
            getSchoolOverview(buildOverviewQuery(timeRange)),
            getApprovalQueue({ page: 1, limit: 4 }),
        ])
            .then(([overviewData, approvalData]) => {
                if (!mounted) return;
                setOverview(overviewData);
                setApprovalQueue(approvalData);
                setLastUpdatedAt(new Date());
            })
            .catch((error) => {
                if (!mounted) return;
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Không thể tải báo cáo tổng quan.';
                setSchoolError(message);
                addNotification({
                    type: 'error',
                    title: 'Không tải được bảng điều khiển',
                    message,
                });
            })
            .finally(() => {
                if (mounted) setSchoolLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [addNotification, isSchoolBoard, timeRange]);

    const totalVolunteerHours = React.useMemo(
        () =>
            (overview?.organization_breakdown ?? []).reduce(
                (total, item) => total + item.completed_event_hours,
                0,
            ),
        [overview],
    );

    const activeCampaigns = React.useMemo(
        () => getStatusCount(overview, ['APPROVED', 'PUBLISHED', 'ONGOING']),
        [overview],
    );

    const submittedCampaigns = React.useMemo(
        () => getStatusCount(overview, ['SUBMITTED', 'PRE_APPROVED']),
        [overview],
    );

    const rankedOrganizations = React.useMemo(() => {
        const metricValue = (
            item: SchoolOverview['organization_breakdown'][number],
        ) => {
            if (rankingMetric === 'funds') {
                return item.verified_money_amount;
            }

            if (rankingMetric === 'campaigns') {
                return item.campaign_count;
            }

            return item.completed_event_hours;
        };

        return [...(overview?.organization_breakdown ?? [])]
            .sort((left, right) => metricValue(right) - metricValue(left))
            .slice(0, 4);
    }, [overview, rankingMetric]);

    const rankingMax = React.useMemo(() => {
        if (rankedOrganizations.length === 0) {
            return 1;
        }

        return Math.max(
            ...rankedOrganizations.map((item) => {
                if (rankingMetric === 'funds') {
                    return item.verified_money_amount;
                }

                if (rankingMetric === 'campaigns') {
                    return item.campaign_count;
                }

                return item.completed_event_hours;
            }),
        );
    }, [rankedOrganizations, rankingMetric]);

    const progressPercent =
        overview && overview.total_campaigns > 0
            ? Math.round((activeCampaigns / overview.total_campaigns) * 100)
            : 0;

    const handleShareReport = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            addNotification({
                type: 'success',
                title: 'Đã sao chép liên kết',
                message:
                    'Liên kết bảng điều khiển đã được sao chép để chia sẻ nội bộ.',
            });
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể sao chép liên kết',
                message:
                    'Trình duyệt hiện tại không cho phép sao chép tự động.',
            });
        }
    };

    if (!user.data) return null;

    if (isSchoolBoard) {
        return (
            <>
                <Head title="Bảng điều khiển" />
                <div className="space-y-6 bg-[#F8F9FA] py-2 font-sans">
                    <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-3">
                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                Hệ thống quản trị tình nguyện
                            </p>
                            <div className="space-y-2">
                                <h1 className="text-[40px] font-bold leading-[48px] text-[#002A58]">
                                    Báo cáo tổng quan Đoàn trường
                                </h1>
                                <p className="text-[18px] leading-7 text-[#424750]">
                                    {formatMonthHeading(timeRange)} · Cập nhật
                                    lần cuối:{' '}
                                    {formatRelativeTime(lastUpdatedAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label
                                className={`${panelClassName} flex items-center gap-3 px-4 py-3`}
                            >
                                <CalendarDays
                                    className="size-5 text-[#002A58]"
                                    strokeWidth={1.5}
                                />
                                <select
                                    aria-label="Khoảng thời gian báo cáo"
                                    className="min-w-[180px] border-0 bg-transparent pr-8 text-[15px] font-semibold text-[#191C1D] outline-none"
                                    value={timeRange}
                                    onChange={(event) =>
                                        setTimeRange(
                                            event.target
                                                .value as SchoolTimeRange,
                                        )
                                    }
                                >
                                    {timeRangeOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <Button
                                type="button"
                                size="lg"
                                className="rounded-lg bg-[#006D37] px-6 normal-case tracking-normal text-white hover:bg-[#005228]"
                                onClick={handleShareReport}
                            >
                                <Copy className="size-4" strokeWidth={1.5} />
                                Chia sẻ báo cáo
                            </Button>
                        </div>
                    </section>

                    {schoolError ? (
                        <div className="rounded-xl border border-[#F2B8B5] bg-[#FFF8F7] px-5 py-4 text-[14px] leading-6 text-[#93000A]">
                            {schoolError}
                        </div>
                    ) : null}

                    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <DashboardStatCard
                            icon={TimerReset}
                            label="Tổng giờ tình nguyện"
                            value={totalVolunteerHours.toLocaleString('vi-VN')}
                            note={`${overview?.total_students?.toLocaleString('vi-VN') ?? 0} sinh viên đã phát sinh hoạt động`}
                            tone="blue"
                        />
                        <DashboardStatCard
                            icon={HandCoins}
                            label="Tổng quỹ gây được"
                            value={`${formatCurrencyCompact(overview?.total_money_donations ?? 0)} VND`}
                            note="Tổng hợp từ các chiến dịch đã được ghi nhận trong hệ thống"
                            tone="green"
                        />
                        <DashboardStatCard
                            icon={Megaphone}
                            label="Chiến dịch đang chạy"
                            value={activeCampaigns.toLocaleString('vi-VN')}
                            note={`${submittedCampaigns.toLocaleString('vi-VN')} chiến dịch đang chờ luồng phê duyệt`}
                            tone="orange"
                        />
                        <DashboardStatCard
                            icon={GraduationCap}
                            label="Sinh viên tham gia"
                            value={(
                                overview?.total_students ?? 0
                            ).toLocaleString('vi-VN')}
                            note={`${overview?.total_organizations?.toLocaleString('vi-VN') ?? 0} đơn vị đã có đóng góp trong kỳ`}
                            tone="gray"
                        />
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <section className={`${panelClassName} p-6`}>
                            <div className="flex flex-col gap-4 border-b border-[#E1E3E4] pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-[24px] font-semibold leading-8 text-[#002A58]">
                                        Xếp hạng đơn vị hoạt động
                                    </h2>
                                    <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                        Theo dõi các đơn vị dẫn đầu để điều phối
                                        kiểm tra, hỗ trợ và nhân rộng mô hình
                                        hiệu quả.
                                    </p>
                                </div>
                                <label className="grid gap-2">
                                    <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                        Chỉ số xếp hạng
                                    </span>
                                    <select
                                        className={`${selectClassName} min-w-[220px]`}
                                        value={rankingMetric}
                                        onChange={(event) =>
                                            setRankingMetric(
                                                event.target
                                                    .value as RankingMetric,
                                            )
                                        }
                                    >
                                        {rankingMetricOptions.map((option) => (
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

                            <div className="mt-6 space-y-8">
                                {schoolLoading ? (
                                    <p className="text-[14px] leading-6 text-[#737781]">
                                        Đang tổng hợp xếp hạng đơn vị...
                                    </p>
                                ) : rankedOrganizations.length > 0 ? (
                                    rankedOrganizations.map((organization) => {
                                        const metricValue =
                                            rankingMetric === 'funds'
                                                ? organization.verified_money_amount
                                                : rankingMetric === 'campaigns'
                                                  ? organization.campaign_count
                                                  : organization.completed_event_hours;

                                        const ratio =
                                            (metricValue / rankingMax) * 100;

                                        const formattedValue =
                                            rankingMetric === 'funds'
                                                ? formatCurrencyCompact(
                                                      metricValue,
                                                  )
                                                : `${metricValue.toLocaleString('vi-VN')}${rankingMetric === 'hours' ? ' giờ' : ' chiến dịch'}`;

                                        return (
                                            <article
                                                key={
                                                    organization.organization_id
                                                }
                                                className="space-y-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                            {
                                                                organization.organization_name
                                                            }
                                                        </h3>
                                                        <p className="text-[13px] leading-5 text-[#737781]">
                                                            Mã đơn vị:{' '}
                                                            {
                                                                organization.organization_code
                                                            }
                                                        </p>
                                                    </div>
                                                    <p className="text-[15px] font-semibold leading-6 text-[#002A58]">
                                                        {formattedValue}
                                                    </p>
                                                </div>
                                                <div className="h-4 rounded-full bg-[#E7E8E9]">
                                                    <div
                                                        className="h-full rounded-full bg-[#002A58]"
                                                        style={{
                                                            width: `${Math.max(ratio, 8)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <p className="text-[14px] leading-6 text-[#737781]">
                                        Chưa có dữ liệu đơn vị để xếp hạng trong
                                        khoảng thời gian đã chọn.
                                    </p>
                                )}
                            </div>

                            <div className="mt-8 border-t border-[#E1E3E4] pt-5">
                                <Link
                                    to={paths.app.adminOrganizations.getHref()}
                                    className="inline-flex items-center gap-2 text-[16px] font-semibold text-[#002A58] transition hover:text-[#004080]"
                                >
                                    Mở quản lý đơn vị
                                    <ArrowRight
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                </Link>
                            </div>
                        </section>

                        <aside className="rounded-xl bg-[#0E3A73] p-6 text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                            <h2 className="text-[24px] font-semibold leading-8">
                                Tiến độ vận hành
                            </h2>
                            <p className="mt-2 text-[15px] leading-6 text-[#D6E3FF]">
                                Mục tiêu toàn kỳ:{' '}
                                {overview?.total_campaigns?.toLocaleString(
                                    'vi-VN',
                                ) ?? 0}{' '}
                                chiến dịch
                            </p>

                            <div className="relative mt-8 flex items-center justify-center">
                                <ProgressRing percent={progressPercent} />
                                <div className="absolute text-center">
                                    <p className="text-[48px] font-bold leading-none">
                                        {progressPercent}%
                                    </p>
                                    <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.08em] text-[#D6E3FF]">
                                        Đã triển khai
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="rounded-xl bg-[#124D94] px-4 py-4">
                                    <p className="text-[14px] text-[#D6E3FF]">
                                        Hiện tại
                                    </p>
                                    <p className="mt-2 text-[30px] font-bold leading-9">
                                        {activeCampaigns.toLocaleString(
                                            'vi-VN',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-[#124D94] px-4 py-4">
                                    <p className="text-[14px] text-[#D6E3FF]">
                                        Còn lại
                                    </p>
                                    <p className="mt-2 text-[30px] font-bold leading-9">
                                        {Math.max(
                                            0,
                                            (overview?.total_campaigns ?? 0) -
                                                activeCampaigns,
                                        ).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-[#124D94] px-4 py-4">
                                    <p className="text-[14px] text-[#D6E3FF]">
                                        Giá trị gây quỹ
                                    </p>
                                    <p className="mt-2 text-[24px] font-bold leading-8">
                                        {formatCurrencyCompact(
                                            overview?.total_money_donations ??
                                                0,
                                        )}{' '}
                                        VND
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </section>

                    <section className={`${panelClassName} overflow-hidden`}>
                        <div className="flex flex-col gap-4 border-b border-[#E1E3E4] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0E5] text-[#6F2D00]">
                                    <Hourglass
                                        className="size-5"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                        Chiến dịch chờ phê duyệt
                                    </h2>
                                    <p className="mt-1 text-[14px] leading-6 text-[#424750]">
                                        Theo dõi các hồ sơ vừa gửi để giữ nhịp
                                        duyệt chiến dịch toàn trường.
                                    </p>
                                </div>
                            </div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#737781]">
                                Chỉ hiển thị để theo dõi nhanh trong tổng quan
                            </p>
                        </div>

                        <div className="divide-y divide-[#E1E3E4]">
                            {schoolLoading ? (
                                <p className="px-6 py-5 text-[14px] leading-6 text-[#737781]">
                                    Đang tải danh sách chờ phê duyệt...
                                </p>
                            ) : approvalQueue.length > 0 ? (
                                approvalQueue.map((campaign) => (
                                    <article
                                        key={campaign.id}
                                        className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                    {toDisplayTitle(
                                                        campaign.title,
                                                    )}
                                                </h3>
                                                <span className="inline-flex rounded-full bg-[#FFF0E5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6F2D00]">
                                                    {toUiStatus(
                                                        campaign.status,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-[14px] leading-6 text-[#424750]">
                                                {campaign.organization.name} ·
                                                Gửi lúc{' '}
                                                {new Date(
                                                    campaign.submitted_at,
                                                ).toLocaleString('vi-VN')}
                                            </p>
                                            <p className="text-[14px] leading-6 text-[#737781]">
                                                {toDisplayText(
                                                    campaign.summary,
                                                )}
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {campaign.module_types.map(
                                                    (moduleType) => (
                                                        <span
                                                            key={moduleType}
                                                            className="inline-flex rounded-lg bg-[#EEF3FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0E4686]"
                                                        >
                                                            {moduleTypeLabel[
                                                                moduleType
                                                            ] ??
                                                                toDisplayText(
                                                                    moduleType,
                                                                )}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <Link
                                                to={`${paths.app.campaigns.detail.getHref(
                                                    campaign.slug,
                                                )}?approvalId=${campaign.id}`}
                                                className="inline-flex rounded-full bg-[#EEF3FB] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#0E4686] transition hover:bg-[#D6E3FF]"
                                            >
                                                Mở hồ sơ kiểm duyệt
                                            </Link>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <p className="px-6 py-5 text-[14px] leading-6 text-[#737781]">
                                    Hiện không có chiến dịch nào đang chờ phê
                                    duyệt.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </>
        );
    }

    if (isStudent) {
        return (
            <ContentLayout title="Bảng điều khiển sinh viên">
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
        <ContentLayout title="Tổng quan">
            <div className={`${panelClassName} p-5`}>
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#002A58]">
                        <FolderKanban className="size-6" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                            Xin chào {user.data.firstName} {user.data.lastName}
                        </h2>
                        <p className="text-[15px] leading-6 text-[#424750]">
                            Vai trò hiện tại:{' '}
                            {roleLabel[user.data.role] ?? user.data.role}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                to={paths.app.campaigns.getHref()}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#002A58] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#004080]"
                            >
                                Đi tới chiến dịch
                                <ArrowRight
                                    className="size-4"
                                    strokeWidth={1.5}
                                />
                            </Link>
                            <Link
                                to={paths.app.settings.getHref()}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#C3C6D2] bg-white px-5 py-3 text-[15px] font-semibold text-[#191C1D] transition hover:bg-[#F3F4F5]"
                            >
                                Mở cài đặt
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
};
