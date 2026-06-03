import * as React from 'react';
import { Link } from 'react-router';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCheck,
    ClipboardCheck,
    RefreshCw,
    Search,
    TimerReset,
    Undo2,
    XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    editorialInsetNoteClassName,
    editorialSelectClassName,
    FilterField,
    FilterToolbar,
    ManagementGrid,
    ManagementHeader,
    ManagementPanel,
    ManagementPanelHeader,
    ManagementStatCard,
} from '@/components/ui/management-shell';
import { paths } from '@/config/paths';
import type { ApprovalQueueItem } from '@/features/campaign/api/approval';
import { cn } from '@/lib/utils';
import type { CampaignStatus, ModuleType } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

export type ApprovalQueueAction =
    | 'pre-approve'
    | 'approve'
    | 'request-revision'
    | 'reject';

export type ApprovalQueueFilterState = {
    q: string;
    status: CampaignStatus | '';
    module_type: ModuleType | '';
    urgency: 'high' | 'medium' | 'low' | '';
    sort: 'newest' | 'oldest';
    page: number;
    pageSize: number;
};

export type ApprovalReviewDialogState = {
    campaignId: string;
    campaignTitle: string;
    action: Extract<ApprovalQueueAction, 'request-revision' | 'reject'>;
    value: string;
};

type SchoolApprovalQueueProps = {
    role: 'DOANTRUONG' | 'LCD';
    items: ApprovalQueueItem[];
    loading: boolean;
    error: string | null;
    filters: ApprovalQueueFilterState;
    actionSubmitting: {
        campaignId: string;
        action: ApprovalQueueAction;
    } | null;
    reviewDialog: ApprovalReviewDialogState | null;
    onFiltersChange: (patch: Partial<ApprovalQueueFilterState>) => void;
    onResetFilters: () => void;
    onRefresh: () => void;
    onQuickAction: (
        campaignId: string,
        action: Extract<ApprovalQueueAction, 'pre-approve' | 'approve'>,
    ) => void;
    onOpenReviewDialog: (
        campaignId: string,
        campaignTitle: string,
        action: Extract<ApprovalQueueAction, 'request-revision' | 'reject'>,
    ) => void;
    onCloseReviewDialog: () => void;
    onReviewReasonChange: (value: string) => void;
    onSubmitReviewDialog: () => void;
};

const statusLabels: Record<string, string> = {
    SUBMITTED: 'Chờ sơ duyệt',
    PRE_APPROVED: 'Chờ duyệt cuối',
    APPROVED: 'Đã duyệt',
    REVISION_REQUIRED: 'Yêu cầu chỉnh sửa',
    REJECTED: 'Từ chối',
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
    DRAFT: 'Nháp',
    ARCHIVED: 'Lưu trữ',
};

const moduleTypeLabels: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ',
    item_donation: 'Hiện vật',
    event: 'Sự kiện',
};

const statusOptions: Array<{ value: CampaignStatus | ''; label: string }> = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'SUBMITTED', label: 'Chờ sơ duyệt' },
    { value: 'PRE_APPROVED', label: 'Chờ duyệt cuối' },
    { value: 'REVISION_REQUIRED', label: 'Yêu cầu chỉnh sửa' },
    { value: 'REJECTED', label: 'Từ chối' },
];

const moduleOptions: Array<{ value: ModuleType | ''; label: string }> = [
    { value: '', label: 'Tất cả hạng mục' },
    { value: 'fundraising', label: 'Gây quỹ' },
    { value: 'item_donation', label: 'Hiện vật' },
    { value: 'event', label: 'Sự kiện' },
];

const urgencyOptions = [
    { value: '', label: 'Tất cả mức ưu tiên' },
    { value: 'high', label: 'Khẩn cấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'low', label: 'Theo dõi' },
] as const;

const sortOptions = [
    { value: 'newest', label: 'Ngày gửi mới nhất' },
    { value: 'oldest', label: 'Ngày gửi cũ nhất' },
] as const;

const formatSubmittedAt = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

const getStatusLabel = (value: string) =>
    statusLabels[value] ?? toDisplayText(value);

const getUrgency = (submittedAt: string, currentTime: number) => {
    const diffHours = Math.max(
        0,
        (currentTime - new Date(submittedAt).getTime()) / 3_600_000,
    );

    if (diffHours >= 72) {
        return {
            value: 'high' as const,
            label: 'Khẩn cấp',
            dotClassName: 'bg-[#DC2626]',
            textClassName: 'text-[#DC2626]',
        };
    }

    if (diffHours >= 24) {
        return {
            value: 'medium' as const,
            label: 'Trung bình',
            dotClassName: 'bg-[#D97706]',
            textClassName: 'text-[#D97706]',
        };
    }

    return {
        value: 'low' as const,
        label: 'Theo dõi',
        dotClassName: 'bg-[#16A34A]',
        textClassName: 'text-[#16A34A]',
    };
};

const getStatusClassName = (status: CampaignStatus) => {
    if (status === 'PRE_APPROVED') {
        return 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]';
    }

    if (
        status === 'APPROVED' ||
        status === 'PUBLISHED' ||
        status === 'ONGOING'
    ) {
        return 'border-[#16A34A] bg-[#F0FDF4] text-[#166534]';
    }

    if (status === 'REVISION_REQUIRED') {
        return 'border-[#D97706] bg-[#FFF7ED] text-[#B45309]';
    }

    if (status === 'REJECTED') {
        return 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]';
    }

    return 'border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]';
};

const getPrimaryAction = (
    role: 'DOANTRUONG' | 'LCD',
    status: CampaignStatus,
) => {
    if (status === 'SUBMITTED') {
        return {
            label: 'Sơ duyệt',
            action: 'pre-approve' as const,
        };
    }

    if (role === 'DOANTRUONG' && status === 'PRE_APPROVED') {
        return {
            label: 'Phê duyệt',
            action: 'approve' as const,
        };
    }

    return null;
};

export const SchoolApprovalQueue = ({
    role,
    items,
    loading,
    error,
    filters,
    actionSubmitting,
    reviewDialog,
    onFiltersChange,
    onResetFilters,
    onRefresh,
    onQuickAction,
    onOpenReviewDialog,
    onCloseReviewDialog,
    onReviewReasonChange,
    onSubmitReviewDialog,
}: SchoolApprovalQueueProps) => {
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());

    React.useEffect(() => {
        setCurrentTime(Date.now());
    }, [items]);

    const totalSubmitted = React.useMemo(
        () => items.filter((item) => item.status === 'SUBMITTED').length,
        [items],
    );

    const totalPreApproved = React.useMemo(
        () => items.filter((item) => item.status === 'PRE_APPROVED').length,
        [items],
    );

    const urgentItems = React.useMemo(
        () =>
            items.filter(
                (item) =>
                    getUrgency(item.submitted_at, currentTime).value === 'high',
            ).length,
        [currentTime, items],
    );

    const averageWaitLabel = React.useMemo(() => {
        if (items.length === 0) {
            return '0 giờ';
        }

        const totalHours = items.reduce((sum, item) => {
            const diffHours = Math.max(
                0,
                (currentTime - new Date(item.submitted_at).getTime()) /
                    3_600_000,
            );
            return sum + diffHours;
        }, 0);

        const averageHours = totalHours / items.length;

        if (averageHours >= 24) {
            return `${(averageHours / 24).toFixed(1).replace(/\.0$/, '')} ngày`;
        }

        return `${Math.round(averageHours)} giờ`;
    }, [currentTime, items]);

    const filteredItems = React.useMemo(() => {
        const byUrgency = items.filter((item) => {
            if (!filters.urgency) {
                return true;
            }

            return (
                getUrgency(item.submitted_at, currentTime).value ===
                filters.urgency
            );
        });

        const sortedItems = [...byUrgency].sort((left, right) => {
            const leftTime = new Date(left.submitted_at).getTime();
            const rightTime = new Date(right.submitted_at).getTime();

            return filters.sort === 'oldest'
                ? leftTime - rightTime
                : rightTime - leftTime;
        });

        return sortedItems;
    }, [currentTime, filters.sort, filters.urgency, items]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / filters.pageSize),
    );
    const currentPage = Math.min(filters.page, totalPages);

    React.useEffect(() => {
        if (currentPage !== filters.page) {
            onFiltersChange({ page: currentPage });
        }
    }, [currentPage, filters.page, onFiltersChange]);

    const visibleItems = React.useMemo(() => {
        const startIndex = (currentPage - 1) * filters.pageSize;
        return filteredItems.slice(startIndex, startIndex + filters.pageSize);
    }, [currentPage, filteredItems, filters.pageSize]);

    return (
        <>
            <div className="space-y-6">
                <nav className="flex flex-wrap items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#4B5563]">
                    <Link
                        to={paths.app.dashboard.getHref()}
                        className="transition hover:text-[#0A0A0A]"
                    >
                        Tổng quan
                    </Link>
                    <span>/</span>
                    <span className="text-[#0A0A0A]">
                        Danh sách phê duyệt chiến dịch
                    </span>
                </nav>

                <ManagementHeader
                    badge="Hội đồng xét duyệt"
                    title="Hàng đợi phê duyệt chiến dịch"
                    description="Theo dõi toàn bộ hồ sơ đang chờ thẩm định từ câu lạc bộ và đơn vị trực thuộc. Luồng duyệt giữ nguyên theo hệ thống hiện tại; giao diện này chỉ tổ chức lại thông tin để xử lý nhanh hơn."
                    icon={ClipboardCheck}
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onRefresh}
                        >
                            <RefreshCw className="size-4" />
                            Làm mới danh sách
                        </Button>
                    }
                />

                <ManagementGrid>
                    <ManagementStatCard
                        label="Chờ sơ duyệt"
                        value={`${totalSubmitted.toLocaleString('vi-VN')} hồ sơ`}
                        note="Các chiến dịch vừa được gửi lên hội đồng xét duyệt."
                        icon={TimerReset}
                        tone="warning"
                    />
                    <ManagementStatCard
                        label="Chờ duyệt cuối"
                        value={`${totalPreApproved.toLocaleString('vi-VN')} hồ sơ`}
                        note="Hồ sơ đã qua bước sơ duyệt và chờ quyết định cuối."
                        icon={CheckCheck}
                        tone="default"
                    />
                    <ManagementStatCard
                        label="Thời gian chờ trung bình"
                        value={averageWaitLabel}
                        note="Tính từ thời điểm hồ sơ được gửi vào hàng đợi."
                        icon={TimerReset}
                        tone="success"
                    />
                    <ManagementStatCard
                        label="Cần xử lý khẩn"
                        value={`${urgentItems.toLocaleString('vi-VN')} hồ sơ`}
                        note="Ưu tiên suy ra theo thời gian chờ trong hệ thống."
                        icon={AlertTriangle}
                        tone="danger"
                    />
                </ManagementGrid>

                {error ? (
                    <div className="border border-[#DC2626] bg-[#FEF2F2] px-4 py-3 text-[15px] leading-6 text-[#991B1B]">
                        {error}
                    </div>
                ) : null}

                <ManagementPanel className="p-0">
                    <ManagementPanelHeader
                        title="Bộ lọc xét duyệt"
                        description="Lọc theo từ khóa, trạng thái và hạng mục để gom các hồ sơ cần xử lý trong cùng một nhịp làm việc."
                        actions={
                            <button
                                type="button"
                                className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0A0A0A] transition hover:text-[#DC2626]"
                                onClick={onResetFilters}
                            >
                                Xóa bộ lọc
                            </button>
                        }
                    />

                    <FilterToolbar>
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
                            <FilterField label="Tìm kiếm">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4B5563]" />
                                    <Input
                                        value={filters.q}
                                        onChange={(event) =>
                                            onFiltersChange({
                                                q: event.target.value,
                                            })
                                        }
                                        placeholder="Tên chiến dịch hoặc đơn vị tổ chức"
                                        className="pl-10"
                                    />
                                </div>
                            </FilterField>

                            <FilterField label="Trạng thái">
                                <select
                                    value={filters.status}
                                    onChange={(event) =>
                                        onFiltersChange({
                                            status: event.target.value as
                                                | CampaignStatus
                                                | '',
                                        })
                                    }
                                    className={editorialSelectClassName}
                                >
                                    {statusOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>

                            <FilterField label="Hạng mục">
                                <select
                                    value={filters.module_type}
                                    onChange={(event) =>
                                        onFiltersChange({
                                            module_type: event.target.value as
                                                | ModuleType
                                                | '',
                                        })
                                    }
                                    className={editorialSelectClassName}
                                >
                                    {moduleOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>

                            <FilterField label="Mức ưu tiên">
                                <select
                                    value={filters.urgency}
                                    onChange={(event) =>
                                        onFiltersChange({
                                            urgency: event.target
                                                .value as ApprovalQueueFilterState['urgency'],
                                        })
                                    }
                                    className={editorialSelectClassName}
                                >
                                    {urgencyOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>

                            <FilterField label="Sắp xếp">
                                <select
                                    value={filters.sort}
                                    onChange={(event) =>
                                        onFiltersChange({
                                            sort: event.target
                                                .value as ApprovalQueueFilterState['sort'],
                                        })
                                    }
                                    className={editorialSelectClassName}
                                >
                                    {sortOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>
                        </div>

                        <div className={editorialInsetNoteClassName}>
                            <p>
                                Vai trò hiện tại:{' '}
                                <strong>
                                    {role === 'DOANTRUONG'
                                        ? 'Đoàn trường'
                                        : 'Liên chi đoàn khoa'}
                                </strong>
                                . Các mức ưu tiên trên trang này được suy ra từ
                                thời gian chờ kể từ lúc hồ sơ được gửi vào hệ
                                thống.
                            </p>
                        </div>
                    </FilterToolbar>

                    <div className="overflow-x-auto">
                        <table className="min-w-[1120px] w-full border-collapse">
                            <thead>
                                <tr className="border-y border-[#E5E7EB] bg-[#F9FAFB] text-left">
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                        Chiến dịch
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                        Đơn vị tổ chức
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                        Ngày gửi
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                        Hạng mục
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                                        Ưu tiên
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
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-8 text-[15px] text-[#4B5563]"
                                        >
                                            Đang tải danh sách chiến dịch chờ
                                            phê duyệt...
                                        </td>
                                    </tr>
                                ) : visibleItems.length > 0 ? (
                                    visibleItems.map((campaign) => {
                                        const urgency = getUrgency(
                                            campaign.submitted_at,
                                            currentTime,
                                        );
                                        const primaryAction = getPrimaryAction(
                                            role,
                                            campaign.status,
                                        );
                                        const disableRowActions =
                                            actionSubmitting?.campaignId ===
                                            campaign.id;

                                        return (
                                            <tr
                                                key={campaign.id}
                                                className="border-b border-[#E5E7EB] align-top transition hover:bg-[#FAFAFA]"
                                            >
                                                <td className="px-5 py-5">
                                                    <div className="grid gap-2">
                                                        <p className="font-heading text-[28px] leading-[1.2] font-bold text-[#0A0A0A]">
                                                            {toDisplayTitle(
                                                                campaign.title,
                                                            )}
                                                        </p>
                                                        <p className="text-[14px] leading-6 text-[#4B5563]">
                                                            ID: {campaign.id}
                                                        </p>
                                                        <p className="line-clamp-2 max-w-[320px] text-[15px] leading-6 text-[#4B5563]">
                                                            {toDisplayText(
                                                                campaign.summary,
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center border border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]">
                                                            <Building2 className="size-5" />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <p className="text-[17px] font-semibold leading-7 text-[#0A0A0A]">
                                                                {toDisplayTitle(
                                                                    campaign
                                                                        .organization
                                                                        .name,
                                                                )}
                                                            </p>
                                                            <p className="text-[14px] leading-6 text-[#4B5563]">
                                                                Mã đơn vị:{' '}
                                                                {
                                                                    campaign
                                                                        .organization
                                                                        .code
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 text-[15px] leading-7 text-[#0A0A0A]">
                                                    {formatSubmittedAt(
                                                        campaign.submitted_at,
                                                    )}
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex max-w-[220px] flex-wrap gap-2">
                                                        {campaign.module_types.map(
                                                            (moduleType) => (
                                                                <span
                                                                    key={
                                                                        moduleType
                                                                    }
                                                                    className="border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4B5563]"
                                                                >
                                                                    {moduleTypeLabels[
                                                                        moduleType
                                                                    ] ??
                                                                        toDisplayText(
                                                                            moduleType,
                                                                        )}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-2 text-[15px] font-semibold',
                                                            urgency.textClassName,
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'h-2.5 w-2.5',
                                                                urgency.dotClassName,
                                                            )}
                                                        />
                                                        {urgency.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <span
                                                        className={cn(
                                                            'inline-flex border px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.08em]',
                                                            getStatusClassName(
                                                                campaign.status,
                                                            ),
                                                        )}
                                                    >
                                                        {getStatusLabel(
                                                            campaign.status,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex min-w-[320px] flex-wrap justify-end gap-2">
                                                        <Link
                                                            to={`${paths.app.campaigns.detail.getHref(
                                                                campaign.slug,
                                                            )}?approvalId=${campaign.id}`}
                                                            className={buttonVariants(
                                                                {
                                                                    variant:
                                                                        'outline',
                                                                    size: 'sm',
                                                                },
                                                            )}
                                                        >
                                                            <ArrowRight className="size-4" />
                                                            Xem hồ sơ
                                                        </Link>
                                                        {primaryAction ? (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={
                                                                    disableRowActions
                                                                }
                                                                onClick={() =>
                                                                    onQuickAction(
                                                                        campaign.id,
                                                                        primaryAction.action,
                                                                    )
                                                                }
                                                            >
                                                                {disableRowActions &&
                                                                actionSubmitting?.action ===
                                                                    primaryAction.action
                                                                    ? 'Đang xử lý'
                                                                    : primaryAction.label}
                                                            </Button>
                                                        ) : null}
                                                        {(campaign.status ===
                                                            'SUBMITTED' ||
                                                            campaign.status ===
                                                                'PRE_APPROVED') && (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                disabled={
                                                                    disableRowActions
                                                                }
                                                                onClick={() =>
                                                                    onOpenReviewDialog(
                                                                        campaign.id,
                                                                        toDisplayTitle(
                                                                            campaign.title,
                                                                        ),
                                                                        'request-revision',
                                                                    )
                                                                }
                                                            >
                                                                <Undo2 className="size-4" />
                                                                Yêu cầu sửa
                                                            </Button>
                                                        )}
                                                        {(campaign.status ===
                                                            'SUBMITTED' ||
                                                            campaign.status ===
                                                                'PRE_APPROVED') && (
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={
                                                                    disableRowActions
                                                                }
                                                                onClick={() =>
                                                                    onOpenReviewDialog(
                                                                        campaign.id,
                                                                        toDisplayTitle(
                                                                            campaign.title,
                                                                        ),
                                                                        'reject',
                                                                    )
                                                                }
                                                            >
                                                                <XCircle className="size-4" />
                                                                Từ chối
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-10 text-center text-[15px] leading-6 text-[#4B5563]"
                                        >
                                            Không có hồ sơ phù hợp với bộ lọc
                                            hiện tại.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ManagementPanel>

                <div className="flex flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[15px] leading-6 text-[#4B5563]">
                        Hiển thị{' '}
                        <strong className="text-[#0A0A0A]">
                            {visibleItems.length}
                        </strong>{' '}
                        trên{' '}
                        <strong className="text-[#0A0A0A]">
                            {filteredItems.length}
                        </strong>{' '}
                        hồ sơ trong danh sách đã tải.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() =>
                                onFiltersChange({ page: currentPage - 1 })
                            }
                        >
                            Trang trước
                        </Button>
                        <span className="border border-[#E5E7EB] px-3 py-1.5 text-[14px] font-semibold text-[#0A0A0A]">
                            {currentPage}/{totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() =>
                                onFiltersChange({ page: currentPage + 1 })
                            }
                        >
                            Trang sau
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog
                open={Boolean(reviewDialog)}
                onOpenChange={(open) => {
                    if (!open) {
                        onCloseReviewDialog();
                    }
                }}
            >
                {reviewDialog ? (
                    <DialogContent className="max-w-2xl">
                        <div className="border-b border-[#0A0A0A] px-6 py-5">
                            <DialogTitle className="font-heading text-[32px] leading-[1.2] font-bold text-[#0A0A0A]">
                                {reviewDialog.action === 'reject'
                                    ? 'Từ chối hồ sơ chiến dịch'
                                    : 'Yêu cầu chỉnh sửa hồ sơ'}
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-[16px] leading-7 text-[#4B5563]">
                                Nhập lý do phản hồi để đơn vị tổ chức nắm rõ yêu
                                cầu điều chỉnh trước khi gửi lại hồ sơ.
                            </DialogDescription>
                        </div>

                        <div className="grid gap-5 px-6 py-6">
                            <div
                                className={cn(
                                    editorialInsetNoteClassName,
                                    'border-l-[#DC2626]',
                                )}
                            >
                                <p className="broadsheet-kicker text-[#0A0A0A]">
                                    Chiến dịch
                                </p>
                                <p className="mt-2 text-[18px] leading-7 text-[#0A0A0A]">
                                    {reviewDialog.campaignTitle}
                                </p>
                            </div>

                            <label className="grid gap-2">
                                <span className="broadsheet-kicker">
                                    Lý do phản hồi
                                </span>
                                <textarea
                                    value={reviewDialog.value}
                                    onChange={(event) =>
                                        onReviewReasonChange(event.target.value)
                                    }
                                    rows={6}
                                    placeholder="Mô tả rõ nội dung cần chỉnh sửa hoặc lý do từ chối."
                                    className="min-h-[160px] border border-[#D1D5DB] bg-white px-3 py-3 text-[16px] leading-7 text-[#0A0A0A] outline-none transition focus:border-2 focus:border-[#0A0A0A]"
                                />
                            </label>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-[#E5E7EB] px-6 py-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCloseReviewDialog}
                            >
                                Đóng
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    reviewDialog.action === 'reject'
                                        ? 'destructive'
                                        : 'default'
                                }
                                disabled={
                                    !reviewDialog.value.trim() ||
                                    actionSubmitting?.campaignId ===
                                        reviewDialog.campaignId
                                }
                                onClick={onSubmitReviewDialog}
                            >
                                {actionSubmitting?.campaignId ===
                                    reviewDialog.campaignId &&
                                actionSubmitting.action === reviewDialog.action
                                    ? 'Đang gửi phản hồi'
                                    : reviewDialog.action === 'reject'
                                      ? 'Xác nhận từ chối'
                                      : 'Gửi yêu cầu chỉnh sửa'}
                            </Button>
                        </div>
                    </DialogContent>
                ) : null}
            </Dialog>
        </>
    );
};
