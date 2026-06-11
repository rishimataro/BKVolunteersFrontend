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
    SUBMITTED: 'Ch\u1edd s\u01a1 duy\u1ec7t',
    PRE_APPROVED: 'Ch\u1edd duy\u1ec7t cu\u1ed1i',
    APPROVED: '\u0110\u00e3 duy\u1ec7t',
    REVISION_REQUIRED: 'Y\u00eau c\u1ea7u ch\u1ec9nh s\u1eeda',
    REJECTED: 'T\u1eeb ch\u1ed1i',
    PUBLISHED: '\u0110\u00e3 c\u00f4ng khai',
    ONGOING: '\u0110ang di\u1ec5n ra',
    ENDED: '\u0110\u00e3 k\u1ebft th\u00fac',
    DRAFT: 'Nh\u00e1p',
    ARCHIVED: 'L\u01b0u tr\u1eef',
};

const moduleTypeLabels: Record<ModuleType, string> = {
    fundraising: 'G\u00e2y qu\u1ef9',
    item_donation: 'Hi\u1ec7n v\u1eadt',
    event: 'S\u1ef1 ki\u1ec7n',
    volunteer: 'Tuy\u1ec3n t\u00ecnh nguy\u1ec7n vi\u00ean',
};

const statusOptions: Array<{ value: CampaignStatus | ''; label: string }> = [
    { value: '', label: 'T\u1ea5t c\u1ea3 tr\u1ea1ng th\u00e1i' },
    { value: 'SUBMITTED', label: 'Ch\u1edd s\u01a1 duy\u1ec7t' },
    { value: 'PRE_APPROVED', label: 'Ch\u1edd duy\u1ec7t cu\u1ed1i' },
    { value: 'REVISION_REQUIRED', label: 'Y\u00eau c\u1ea7u ch\u1ec9nh s\u1eeda' },
    { value: 'REJECTED', label: 'T\u1eeb ch\u1ed1i' },
];

const moduleOptions: Array<{ value: ModuleType | ''; label: string }> = [
    { value: '', label: 'T\u1ea5t c\u1ea3 h\u1ea1ng m\u1ee5c' },
    { value: 'fundraising', label: 'G\u00e2y qu\u1ef9' },
    { value: 'item_donation', label: 'Hi\u1ec7n v\u1eadt' },
    { value: 'event', label: 'S\u1ef1 ki\u1ec7n' },
    { value: 'volunteer', label: 'Tuy\u1ec3n t\u00ecnh nguy\u1ec7n vi\u00ean' },
];

const urgencyOptions = [
    { value: '', label: 'T\u1ea5t c\u1ea3 m\u1ee9c \u01b0u ti\u00ean' },
    { value: 'high', label: 'Kh\u1ea9n c\u1ea5p' },
    { value: 'medium', label: 'Trung b\u00ecnh' },
    { value: 'low', label: 'Theo d\u00f5i' },
] as const;

const sortOptions = [
    { value: 'newest', label: 'Ng\u00e0y g\u1eedi m\u1edbi nh\u1ea5t' },
    { value: 'oldest', label: 'Ng\u00e0y g\u1eedi c\u0169 nh\u1ea5t' },
] as const;

const parseSubmittedAt = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
};

const formatSubmittedAt = (value?: string | null) => {
    const timestamp = parseSubmittedAt(value);
    if (timestamp === null) {
        return 'Chưa có thời gian gửi';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(timestamp));
};

const getStatusLabel = (value: string) =>
    statusLabels[value] ?? toDisplayText(value);

const getUrgency = (submittedAt: string | null | undefined, currentTime: number) => {
    const submittedAtTime = parseSubmittedAt(submittedAt);
    if (submittedAtTime === null) {
        return {
            value: 'low' as const,
            label: 'Theo d\u00f5i',
            dotClassName: 'bg-slate-400',
            textClassName: 'text-slate-500',
        };
    }

    const diffHours = Math.max(0, (currentTime - submittedAtTime) / 3_600_000);

    if (diffHours >= 72) {
        return {
            value: 'high' as const,
            label: 'Kh\u1ea9n c\u1ea5p',
            dotClassName: 'bg-destructive',
            textClassName: 'text-destructive',
        };
    }

    if (diffHours >= 24) {
        return {
            value: 'medium' as const,
            label: 'Trung b\u00ecnh',
            dotClassName: 'bg-[#D97706]',
            textClassName: 'text-[#D97706]',
        };
    }

    return {
        value: 'low' as const,
        label: 'Theo d\u00f5i',
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
        return 'border-destructive bg-[#FEF2F2] text-[#B91C1C]';
    }

    return 'border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]';
};

const getPrimaryAction = (
    role: 'DOANTRUONG' | 'LCD',
    status: CampaignStatus,
) => {
    if (status === 'SUBMITTED') {
        return {
            label: 'S\u01a1 duy\u1ec7t',
            action: 'pre-approve' as const,
        };
    }

    if (role === 'DOANTRUONG' && status === 'PRE_APPROVED') {
        return {
            label: 'Ph\u00ea duy\u1ec7t',
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
    const safeItems = React.useMemo(
        () => (Array.isArray(items) ? items : []),
        [items],
    );

    React.useEffect(() => {
        setCurrentTime(Date.now());
    }, [safeItems]);

    const totalSubmitted = React.useMemo(
        () => safeItems.filter((item) => item.status === 'SUBMITTED').length,
        [safeItems],
    );

    const totalPreApproved = React.useMemo(
        () => safeItems.filter((item) => item.status === 'PRE_APPROVED').length,
        [safeItems],
    );

    const urgentItems = React.useMemo(
        () =>
            safeItems.filter(
                (item) =>
                    getUrgency(item.submitted_at, currentTime).value === 'high',
            ).length,
        [currentTime, safeItems],
    );

    const averageWaitLabel = React.useMemo(() => {
        if (safeItems.length === 0) {
            return '0 gi\u1edd';
        }

        const totalHours = safeItems.reduce((sum, item) => {
            const submittedAtTime = parseSubmittedAt(item.submitted_at);
            if (submittedAtTime === null) {
                return sum;
            }

            const diffHours = Math.max(0, (currentTime - submittedAtTime) / 3_600_000);
            return sum + diffHours;
        }, 0);

        const averageHours = totalHours / safeItems.length;

        if (averageHours >= 24) {
            return `${(averageHours / 24).toFixed(1).replace(/\.0$/, '')} ng\u00e0y`;
        }

        return `${Math.round(averageHours)} gi\u1edd`;
    }, [currentTime, safeItems]);

    const filteredItems = React.useMemo(() => {
        const byUrgency = safeItems.filter((item) => {
            if (!filters.urgency) {
                return true;
            }

            return (
                getUrgency(item.submitted_at, currentTime).value ===
                filters.urgency
            );
        });

        const sortedItems = [...byUrgency].sort((left, right) => {
            const leftTime = parseSubmittedAt(left.submitted_at) ?? 0;
            const rightTime = parseSubmittedAt(right.submitted_at) ?? 0;

            return filters.sort === 'oldest'
                ? leftTime - rightTime
                : rightTime - leftTime;
        });

        return sortedItems;
    }, [currentTime, filters.sort, filters.urgency, safeItems]);

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
                <nav className="flex flex-wrap items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <Link
                        to={paths.app.dashboard.getHref()}
                        className="transition hover:text-primary"
                    >
                        {'T\u1ed5ng quan'}
                    </Link>
                    <span>/</span>
                    <span className="text-primary">
                        {'Danh s\u00e1ch ph\u00ea duy\u1ec7t chi\u1ebfn d\u1ecbch'}
                    </span>
                </nav>

                <ManagementHeader
                    badge={'H\u1ed9i \u0111\u1ed3ng x\u00e9t duy\u1ec7t'}
                    title={'H\u00e0ng \u0111\u1ee3i ph\u00ea duy\u1ec7t chi\u1ebfn d\u1ecbch'}
                    description={'Theo d\u00f5i to\u00e0n b\u1ed9 h\u1ed3 s\u01a1 \u0111ang ch\u1edd th\u1ea9m \u0111\u1ecbnh t\u1eeb c\u00e2u l\u1ea1c b\u1ed9 v\u00e0 \u0111\u01a1n v\u1ecb tr\u1ef1c thu\u1ed9c. Lu\u1ed3ng duy\u1ec7t gi\u1eef nguy\u00ean theo h\u1ec7 th\u1ed1ng hi\u1ec7n t\u1ea1i; giao di\u1ec7n n\u00e0y ch\u1ec9 t\u1ed5 ch\u1ee9c l\u1ea1i th\u00f4ng tin \u0111\u1ec3 x\u1eed l\u00fd nhanh h\u01a1n.'}
                    icon={ClipboardCheck}
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onRefresh}
                        >
                            <RefreshCw className="size-4" />
                            {'L\u00e0m m\u1edbi danh s\u00e1ch'}
                        </Button>
                    }
                />

                <ManagementGrid>
                    <ManagementStatCard
                        label={'Ch\u1edd s\u01a1 duy\u1ec7t'}
                        value={`${totalSubmitted.toLocaleString('vi-VN')} h\u1ed3 s\u01a1`}
                        note={'C\u00e1c chi\u1ebfn d\u1ecbch v\u1eeba \u0111\u01b0\u1ee3c g\u1eedi l\u00ean h\u1ed9i \u0111\u1ed3ng x\u00e9t duy\u1ec7t.'}
                        icon={TimerReset}
                        tone="warning"
                    />
                    <ManagementStatCard
                        label={'Ch\u1edd duy\u1ec7t cu\u1ed1i'}
                        value={`${totalPreApproved.toLocaleString('vi-VN')} h\u1ed3 s\u01a1`}
                        note={'H\u1ed3 s\u01a1 \u0111\u00e3 qua b\u01b0\u1edbc s\u01a1 duy\u1ec7t v\u00e0 ch\u1edd quy\u1ebft \u0111\u1ecbnh cu\u1ed1i.'}
                        icon={CheckCheck}
                        tone="default"
                    />
                    <ManagementStatCard
                        label={'Th\u1eddi gian ch\u1edd trung b\u00ecnh'}
                        value={averageWaitLabel}
                        note={'T\u00ednh t\u1eeb th\u1eddi \u0111i\u1ec3m h\u1ed3 s\u01a1 \u0111\u01b0\u1ee3c g\u1eedi v\u00e0o h\u00e0ng \u0111\u1ee3i.'}
                        icon={TimerReset}
                        tone="success"
                    />
                    <ManagementStatCard
                        label={'C\u1ea7n x\u1eed l\u00fd kh\u1ea9n'}
                        value={`${urgentItems.toLocaleString('vi-VN')} h\u1ed3 s\u01a1`}
                        note={'\u01afu ti\u00ean suy ra theo th\u1eddi gian ch\u1edd trong h\u1ec7 th\u1ed1ng.'}
                        icon={AlertTriangle}
                        tone="danger"
                    />
                </ManagementGrid>

                {error ? (
                    <div className="border border-destructive bg-[#FEF2F2] px-4 py-3 text-[15px] leading-6 text-[#991B1B]">
                        {error}
                    </div>
                ) : null}

                <ManagementPanel className="p-0">
                    <ManagementPanelHeader
                        title={'B\u1ed9 l\u1ecdc x\u00e9t duy\u1ec7t'}
                        description={'L\u1ecdc theo t\u1eeb kh\u00f3a, tr\u1ea1ng th\u00e1i v\u00e0 h\u1ea1ng m\u1ee5c \u0111\u1ec3 gom c\u00e1c h\u1ed3 s\u01a1 c\u1ea7n x\u1eed l\u00fd trong c\u00f9ng m\u1ed9t nh\u1ecbp l\u00e0m vi\u1ec7c.'}
                        actions={
                            <button
                                type="button"
                                className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary transition hover:text-destructive"
                                onClick={onResetFilters}
                            >
                                {'X\u00f3a b\u1ed9 l\u1ecdc'}
                            </button>
                        }
                    />

                    <FilterToolbar>
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
                            <FilterField label={'T\u00ecm ki\u1ebfm'}>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={filters.q}
                                        onChange={(event) =>
                                            onFiltersChange({
                                                q: event.target.value,
                                            })
                                        }
                                        placeholder={'T\u00ean chi\u1ebfn d\u1ecbch ho\u1eb7c \u0111\u01a1n v\u1ecb t\u1ed5 ch\u1ee9c'}
                                        className="pl-10"
                                    />
                                </div>
                            </FilterField>

                            <FilterField label={'Tr\u1ea1ng th\u00e1i'}>
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

                            <FilterField label={'H\u1ea1ng m\u1ee5c'}>
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

                            <FilterField label={'M\u1ee9c \u01b0u ti\u00ean'}>
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

                            <FilterField label={'S\u1eafp x\u1ebfp'}>
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
                                {'Vai tr\u00f2 hi\u1ec7n t\u1ea1i:'}{' '}
                                <strong>
                                    {role === 'DOANTRUONG'
                                        ? '\u0110o\u00e0n tr\u01b0\u1eddng'
                                        : 'Li\u00ean chi \u0111o\u00e0n khoa'}
                                </strong>
                                {'. C\u00e1c m\u1ee9c \u01b0u ti\u00ean tr\u00ean trang n\u00e0y \u0111\u01b0\u1ee3c suy ra t\u1eeb'}
                                {'th\u1eddi gian ch\u1edd k\u1ec3 t\u1eeb l\u00fac h\u1ed3 s\u01a1 \u0111\u01b0\u1ee3c g\u1eedi v\u00e0o h\u1ec7'}
                                {'th\u1ed1ng.'}
                            </p>
                        </div>
                    </FilterToolbar>

                    <div className="overflow-x-auto">
                        <table className="min-w-[1120px] w-full border-collapse">
                            <thead>
                                <tr className="border-y border-border bg-muted text-left">
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'Chi\u1ebfn d\u1ecbch'}
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'\u0110\u01a1n v\u1ecb t\u1ed5 ch\u1ee9c'}
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'Ng\u00e0y g\u1eedi'}
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'H\u1ea1ng m\u1ee5c'}
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'\u01afu ti\u00ean'}
                                    </th>
                                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'Tr\u1ea1ng th\u00e1i'}
                                    </th>
                                    <th className="px-5 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {'H\u00e0nh \u0111\u1ed9ng'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-8 text-[15px] text-muted-foreground"
                                        >
                                            {'\u0110ang t\u1ea3i danh s\u00e1ch chi\u1ebfn d\u1ecbch ch\u1edd'}
                                            {'ph\u00ea duy\u1ec7t...'}
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
                                                className="border-b border-border align-top transition hover:bg-[#FAFAFA]"
                                            >
                                                <td className="px-5 py-5">
                                                    <div className="grid gap-2">
                                                        <p className="font-heading text-[28px] leading-[1.2] font-bold text-primary">
                                                            {toDisplayTitle(
                                                                campaign.title,
                                                            )}
                                                        </p>
                                                        <p className="text-[14px] leading-6 text-muted-foreground">
                                                            ID: {campaign.id}
                                                        </p>
                                                        <p className="line-clamp-2 max-w-[320px] text-[15px] leading-6 text-muted-foreground">
                                                            {toDisplayText(
                                                                campaign.summary,
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted text-muted-foreground">
                                                            <Building2 className="size-5" />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <p className="text-[17px] font-semibold leading-7 text-primary">
                                                                {toDisplayTitle(
                                                                    campaign
                                                                        .organization
                                                                        .name,
                                                                )}
                                                            </p>
                                                            <p className="text-[14px] leading-6 text-muted-foreground">
                                                                {'M\u00e3 \u0111\u01a1n v\u1ecb:'}{' '}
                                                                {
                                                                    campaign
                                                                        .organization
                                                                        .code
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 text-[15px] leading-7 text-primary">
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
                                                                    className="border border-border bg-muted px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
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
                                                            {'Xem h\u1ed3 s\u01a1'}
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
                                                                    ? '\u0110ang x\u1eed l\u00fd'
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
                                                                {'Y\u00eau c\u1ea7u s\u1eeda'}
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
                                                                {'T\u1eeb ch\u1ed1i'}
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
                                            className="px-5 py-10 text-center text-[15px] leading-6 text-muted-foreground"
                                        >
                                            {'Kh\u00f4ng c\u00f3 h\u1ed3 s\u01a1 ph\u00f9 h\u1ee3p v\u1edbi b\u1ed9 l\u1ecdc'}
                                            {'hi\u1ec7n t\u1ea1i.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ManagementPanel>

                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[15px] leading-6 text-muted-foreground">
                        {'Hi\u1ec3n th\u1ecb'}{' '}
                        <strong className="text-primary">
                            {visibleItems.length}
                        </strong>{' '}
                        {'tr\u00ean'}{' '}
                        <strong className="text-primary">
                            {filteredItems.length}
                        </strong>{' '}
                        {'h\u1ed3 s\u01a1 trong danh s\u00e1ch \u0111\u00e3 t\u1ea3i.'}
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
                            {'Trang tr\u01b0\u1edbc'}
                        </Button>
                        <span className="border border-border px-3 py-1.5 text-[14px] font-semibold text-primary">
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
                        <div className="border-b border-primary px-6 py-5">
                            <DialogTitle className="font-heading text-[32px] leading-[1.2] font-bold text-primary">
                                {reviewDialog.action === 'reject'
                                    ? 'T\u1eeb ch\u1ed1i h\u1ed3 s\u01a1 chi\u1ebfn d\u1ecbch'
                                    : 'Y\u00eau c\u1ea7u ch\u1ec9nh s\u1eeda h\u1ed3 s\u01a1'}
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-[16px] leading-7 text-muted-foreground">
                                {'Nh\u1eadp l\u00fd do ph\u1ea3n h\u1ed3i \u0111\u1ec3 \u0111\u01a1n v\u1ecb t\u1ed5 ch\u1ee9c n\u1eafm r\u00f5 y\u00eau'}
                                {'c\u1ea7u \u0111i\u1ec1u ch\u1ec9nh tr\u01b0\u1edbc khi g\u1eedi l\u1ea1i h\u1ed3 s\u01a1.'}
                            </DialogDescription>
                        </div>

                        <div className="grid gap-5 px-6 py-6">
                            <div
                                className={cn(
                                    editorialInsetNoteClassName,
                                    'border-l-[#DC2626]',
                                )}
                            >
                                <p className="broadsheet-kicker text-primary">
                                    {'Chi\u1ebfn d\u1ecbch'}
                                </p>
                                <p className="mt-2 text-[18px] leading-7 text-primary">
                                    {reviewDialog.campaignTitle}
                                </p>
                            </div>

                            <label className="grid gap-2">
                                <span className="broadsheet-kicker">
                                    {'L\u00fd do ph\u1ea3n h\u1ed3i'}
                                </span>
                                <textarea
                                    value={reviewDialog.value}
                                    onChange={(event) =>
                                        onReviewReasonChange(event.target.value)
                                    }
                                    rows={6}
                                    placeholder={'M\u00f4 t\u1ea3 r\u00f5 n\u1ed9i dung c\u1ea7n ch\u1ec9nh s\u1eeda ho\u1eb7c l\u00fd do t\u1eeb ch\u1ed1i.'}
                                    className="min-h-[160px] border border-input bg-white px-3 py-3 text-[16px] leading-7 text-primary outline-none transition focus:border-2 focus:border-primary"
                                />
                            </label>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCloseReviewDialog}
                            >
                                {'\u0110\u00f3ng'}
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
                                    ? '\u0110ang g\u1eedi ph\u1ea3n h\u1ed3i'
                                    : reviewDialog.action === 'reject'
                                      ? 'X\u00e1c nh\u1eadn t\u1eeb ch\u1ed1i'
                                      : 'G\u1eedi y\u00eau c\u1ea7u ch\u1ec9nh s\u1eeda'}
                            </Button>
                        </div>
                    </DialogContent>
                ) : null}
            </Dialog>
        </>
    );
};

