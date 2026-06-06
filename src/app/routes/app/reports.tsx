import { useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    Banknote,
    Building2,
    ClipboardCheck,
    Download,
    FileSpreadsheet,
    GitCompareArrows,
    RefreshCw,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    getManagedCampaigns,
    type ManagedCampaignItem,
} from '@/features/campaign/api/campaign';
import {
    getCampaignReconciliationReport,
    getCampaignReport,
    getSchoolOverview,
    type CampaignReconciliationReport,
    type CampaignReport,
    type SchoolOverview,
    type SchoolOverviewQuery,
} from '@/features/reports/api/reports';

type OverviewFilterDraft = {
    from: string;
    to: string;
    organization_id: string;
    module_type: string;
    status: string;
};

type ExportScope = 'school-overview' | 'campaign-report';

const moduleTypeLabel: Record<string, string> = {
    fundraising: 'Gây quỹ',
    item_donation: 'Hiện vật',
    event: 'Sự kiện',
};

const statCards = [
    {
        key: 'total_campaigns' as const,
        label: 'Tổng chiến dịch',
        icon: BarChart3,
        color: 'bg-blue-50 text-blue-600',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'total_students' as const,
        label: 'Tổng sinh viên',
        icon: Users,
        color: 'bg-emerald-50 text-emerald-600',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'total_organizations' as const,
        label: 'Tổng đơn vị',
        icon: Building2,
        color: 'bg-violet-50 text-violet-600',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'total_money_donations' as const,
        label: 'Verified funding',
        icon: Banknote,
        color: 'bg-amber-50 text-amber-600',
        format: (value: number) => formatCurrency(value),
    },
];

const reconciliationCards = [
    {
        key: 'matched_transactions' as const,
        label: 'Giao dịch đã match',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'unmatched_transactions' as const,
        label: 'Giao dịch chưa match',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'matched_transaction_amount' as const,
        label: 'Giá trị đã match',
        format: (value: number) => formatCurrency(value),
    },
    {
        key: 'amount_gap_vs_verified' as const,
        label: 'Chênh lệch chờ verify',
        format: (value: number) => formatCurrency(value),
    },
];

const emptyDraftFilters: OverviewFilterDraft = {
    from: '',
    to: '',
    organization_id: '',
    module_type: '',
    status: '',
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

const formatDateTimeCell = (value?: string) => {
    if (!value) {
        return 'Tất cả';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const toDraftValue = (value?: string) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const draftToQuery = (draft: OverviewFilterDraft): SchoolOverviewQuery => ({
    from: draft.from ? new Date(draft.from).toISOString() : undefined,
    to: draft.to ? new Date(draft.to).toISOString() : undefined,
    organization_id: draft.organization_id || undefined,
    module_type: draft.module_type || undefined,
    status: draft.status || undefined,
});

const validateOverviewDraft = (draft: OverviewFilterDraft) => {
    if (!draft.from || !draft.to) {
        return null;
    }

    const from = new Date(draft.from);
    const to = new Date(draft.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return 'Khoảng thời gian lọc không hợp lệ.';
    }

    if (from.getTime() > to.getTime()) {
        return 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.';
    }

    return null;
};

const sanitizeCsvCell = (value: string | number | null | undefined) => {
    const raw = value == null ? '' : String(value);
    return `"${raw.replace(/"/g, '""')}"`;
};

const createCsvContent = (
    rows: Array<Array<string | number | null | undefined>>,
) => rows.map((row) => row.map(sanitizeCsvCell).join(',')).join('\n');

const downloadTextFile = (
    filename: string,
    content: string,
    mimeType: string,
) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

const buildSchoolOverviewCsv = (overview: SchoolOverview) =>
    createCsvContent([
        ['Báo cáo', 'Dashboard toàn trường'],
        ['Từ ngày', formatDateTimeCell(overview.filters_applied.from)],
        ['Đến ngày', formatDateTimeCell(overview.filters_applied.to)],
        ['Tổ chức', overview.filters_applied.organization_id ?? 'Tất cả'],
        ['Module', overview.filters_applied.module_type ?? 'Tất cả'],
        ['Trạng thái', overview.filters_applied.status ?? 'Tất cả'],
        [],
        ['Chỉ số tổng quan', 'Giá trị'],
        ['Tổng chiến dịch', overview.total_campaigns],
        ['Tổng sinh viên', overview.total_students],
        ['Tổng đơn vị', overview.total_organizations],
        ['Verified funding', overview.total_money_donations],
        [],
        [
            'Tổ chức',
            'Mã',
            'Campaign',
            'Verified amount',
            'Received item quantity',
            'Completed registrations',
            'Completed hours',
            'Issued certificates',
        ],
        ...overview.organization_breakdown.map((item) => [
            item.organization_name,
            item.organization_code,
            item.campaign_count,
            item.verified_money_amount,
            item.received_item_quantity,
            item.completed_event_registrations,
            item.completed_event_hours,
            item.issued_certificates,
        ]),
        [],
        ['Loại module', 'Campaign count'],
        ...overview.module_breakdown.map((item) => [
            moduleTypeLabel[item.module_type] ?? item.module_type,
            item.campaign_count,
        ]),
        [],
        ['Trạng thái campaign', 'Campaign count'],
        ...overview.status_breakdown.map((item) => [
            item.status,
            item.campaign_count,
        ]),
    ]);

const buildCampaignReportCsv = (
    report: CampaignReport,
    reconciliation: CampaignReconciliationReport,
) =>
    createCsvContent([
        ['Báo cáo', 'Campaign summary'],
        ['Campaign', report.campaign.title],
        ['Slug', report.campaign.slug],
        ['Status', report.campaign.status],
        [],
        ['Khối', 'Chỉ số', 'Giá trị'],
        [
            'Fundraising',
            'Verified amount',
            report.fundraising.total_verified_amount,
        ],
        ['Fundraising', 'Total donations', report.fundraising.total_donations],
        [
            'Fundraising',
            'Verified donations',
            report.fundraising.verified_donations,
        ],
        ['Item', 'Received quantity', report.item_donations.received_quantity],
        ['Event', 'Registrations', report.events.registrations],
        [
            'Event',
            'Completed registrations',
            report.events.completed_registrations,
        ],
        ['Event', 'Completed hours', report.events.completed_hours],
        ['Certificate', 'Issued total', report.certificates.issued_total],
        [],
        ['Đối soát', 'Chỉ số', 'Giá trị'],
        [
            'Reconciliation',
            'Matched transactions',
            reconciliation.reconciliation.matched_transactions,
        ],
        [
            'Reconciliation',
            'Unmatched transactions',
            reconciliation.reconciliation.unmatched_transactions,
        ],
        [
            'Reconciliation',
            'Matched amount',
            reconciliation.reconciliation.matched_transaction_amount,
        ],
        [
            'Reconciliation',
            'Unmatched amount',
            reconciliation.reconciliation.unmatched_transaction_amount,
        ],
        [
            'Reconciliation',
            'Pending donations',
            reconciliation.reconciliation.pending_donations,
        ],
        [
            'Reconciliation',
            'Matched donations',
            reconciliation.reconciliation.matched_donations,
        ],
        [
            'Reconciliation',
            'Verified donations',
            reconciliation.reconciliation.verified_donations,
        ],
        [
            'Reconciliation',
            'Rejected donations',
            reconciliation.reconciliation.rejected_donations,
        ],
        [
            'Reconciliation',
            'Verified amount',
            reconciliation.reconciliation.verified_amount,
        ],
        [
            'Reconciliation',
            'Gap vs verified',
            reconciliation.reconciliation.amount_gap_vs_verified,
        ],
    ]);

export const ReportsRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();
    const role = user.data?.role;

    const [overview, setOverview] = useState<SchoolOverview | null>(null);
    const [campaigns, setCampaigns] = useState<ManagedCampaignItem[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [campaignReport, setCampaignReport] = useState<CampaignReport | null>(
        null,
    );
    const [reconciliation, setReconciliation] =
        useState<CampaignReconciliationReport | null>(null);

    const [isOverviewLoading, setIsOverviewLoading] = useState(true);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [overviewError, setOverviewError] = useState<string | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);

    const [overviewFilters, setOverviewFilters] = useState<SchoolOverviewQuery>(
        {
            module_type: '',
            status: '',
        },
    );
    const [draftOverviewFilters, setDraftOverviewFilters] =
        useState<OverviewFilterDraft>(emptyDraftFilters);
    const [filterError, setFilterError] = useState<string | null>(null);

    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportScope, setExportScope] =
        useState<ExportScope>('campaign-report');
    const [isExporting, setIsExporting] = useState(false);

    const canViewOperatorReports =
        role === ROLES.DOANTRUONG || role === ROLES.LCD || role === ROLES.CLB;
    const canViewSchoolOverview = role === ROLES.DOANTRUONG;

    useEffect(() => {
        setDraftOverviewFilters({
            from: toDraftValue(overviewFilters.from),
            to: toDraftValue(overviewFilters.to),
            organization_id: overviewFilters.organization_id ?? '',
            module_type: overviewFilters.module_type ?? '',
            status: overviewFilters.status ?? '',
        });
    }, [
        overviewFilters.from,
        overviewFilters.to,
        overviewFilters.organization_id,
        overviewFilters.module_type,
        overviewFilters.status,
    ]);

    useEffect(() => {
        if (!canViewOperatorReports) {
            setIsOverviewLoading(false);
            return;
        }

        let isMounted = true;
        setIsOverviewLoading(true);
        setOverviewError(null);

        const loadData = async () => {
            try {
                const campaignPromise = getManagedCampaigns({
                    page: 1,
                    limit: 100,
                });
                const overviewPromise = canViewSchoolOverview
                    ? getSchoolOverview(overviewFilters)
                    : Promise.resolve(null);
                const [overviewData, campaignItems] = await Promise.all([
                    overviewPromise,
                    campaignPromise,
                ]);

                if (!isMounted) {
                    return;
                }

                setOverview(overviewData);
                setCampaigns(campaignItems);
                if (campaignItems.length > 0) {
                    setSelectedCampaignId(
                        (current) => current || campaignItems[0].id,
                    );
                } else {
                    setSelectedCampaignId('');
                }
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setOverviewError(
                    error instanceof Error
                        ? error.message
                        : 'Không thể tải báo cáo tổng quan.',
                );
            } finally {
                if (isMounted) {
                    setIsOverviewLoading(false);
                }
            }
        };

        void loadData();

        return () => {
            isMounted = false;
        };
    }, [canViewOperatorReports, canViewSchoolOverview, overviewFilters]);

    useEffect(() => {
        if (!canViewOperatorReports || !selectedCampaignId) {
            setCampaignReport(null);
            setReconciliation(null);
            return;
        }

        let isMounted = true;
        setIsReportLoading(true);
        setReportError(null);

        Promise.all([
            getCampaignReport(selectedCampaignId),
            getCampaignReconciliationReport(selectedCampaignId),
        ])
            .then(([reportData, reconciliationData]) => {
                if (!isMounted) {
                    return;
                }

                setCampaignReport(reportData);
                setReconciliation(reconciliationData);
            })
            .catch((error) => {
                if (!isMounted) {
                    return;
                }

                setReportError(
                    error instanceof Error
                        ? error.message
                        : 'Không thể tải báo cáo chiến dịch.',
                );
            })
            .finally(() => {
                if (isMounted) {
                    setIsReportLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [canViewOperatorReports, selectedCampaignId]);

    const selectedCampaign = useMemo(
        () => campaigns.find((campaign) => campaign.id === selectedCampaignId),
        [campaigns, selectedCampaignId],
    );

    const organizationOptions = useMemo(() => {
        const seen = new Set<number>();

        return (overview?.organization_breakdown ?? []).filter((item) => {
            if (seen.has(item.organization_id)) {
                return false;
            }

            seen.add(item.organization_id);
            return true;
        });
    }, [overview]);

    const availableExportScopes = useMemo(() => {
        const options: Array<{
            value: ExportScope;
            label: string;
            description: string;
        }> = [];

        if (canViewSchoolOverview && overview) {
            options.push({
                value: 'school-overview',
                label: 'Dashboard toàn trường',
                description:
                    'Xuất số liệu tổng quan, phân bổ theo tổ chức, loại module và trạng thái campaign.',
            });
        }

        if (selectedCampaignId && campaignReport && reconciliation) {
            options.push({
                value: 'campaign-report',
                label: 'Báo cáo campaign',
                description:
                    'Xuất số liệu campaign summary và đối soát verified theo campaign đang chọn.',
            });
        }

        return options;
    }, [
        canViewSchoolOverview,
        overview,
        selectedCampaignId,
        campaignReport,
        reconciliation,
    ]);

    const handleApplyOverviewFilters = () => {
        const validationMessage = validateOverviewDraft(draftOverviewFilters);
        if (validationMessage) {
            setFilterError(validationMessage);
            return;
        }

        setFilterError(null);
        setOverviewFilters(draftToQuery(draftOverviewFilters));
    };

    const handleResetOverviewFilters = () => {
        setDraftOverviewFilters(emptyDraftFilters);
        setFilterError(null);
        setOverviewFilters({
            module_type: '',
            status: '',
        });
    };

    const openExportDialog = (scope: ExportScope) => {
        setExportScope(scope);
        setIsExportDialogOpen(true);
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            if (exportScope === 'school-overview') {
                if (!overview) {
                    throw new Error(
                        'Chưa có dữ liệu dashboard toàn trường để xuất.',
                    );
                }

                const content = buildSchoolOverviewCsv(overview);
                downloadTextFile(
                    'dashboard-toan-truong.csv',
                    content,
                    'text/csv;charset=utf-8;',
                );
                addNotification({
                    type: 'success',
                    title: 'Đã xuất dashboard toàn trường',
                    message:
                        'Tệp CSV đã được tạo từ dữ liệu dashboard hiện tại.',
                });
            } else {
                if (!campaignReport || !reconciliation) {
                    throw new Error('Chưa có dữ liệu campaign report để xuất.');
                }

                const content = buildCampaignReportCsv(
                    campaignReport,
                    reconciliation,
                );
                const slug = campaignReport.campaign.slug || 'campaign-report';
                downloadTextFile(
                    `${slug}-summary-report.csv`,
                    content,
                    'text/csv;charset=utf-8;',
                );
                addNotification({
                    type: 'success',
                    title: 'Đã xuất báo cáo campaign',
                    message:
                        'Tệp CSV campaign summary và đối soát verified đã được tải xuống.',
                });
            }

            setIsExportDialogOpen(false);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không thể xuất báo cáo',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Hệ thống chưa thể tạo tệp báo cáo ở thời điểm này.',
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (!canViewOperatorReports) {
        return (
            <ContentLayout title="Báo cáo">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền truy cập khu vực báo cáo vận
                    hành.
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Báo cáo">
            <div className="space-y-8">
                <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#002A58]">
                            <TrendingUp className="size-6" />
                        </div>
                        <div className="space-y-2">
                            <p className="broadsheet-kicker">
                                Dashboard và export
                            </p>
                            <h2 className="font-heading text-[32px] leading-[1.2] font-bold text-[#0A0A0A]">
                                {canViewSchoolOverview
                                    ? 'Dashboard toàn trường'
                                    : 'Báo cáo campaign'}
                            </h2>
                            <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                Xem số liệu canonical theo quyền hiện tại, kiểm
                                tra verified funding và xuất báo cáo chuẩn từ dữ
                                liệu đã tải.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {canViewSchoolOverview && overview ? (
                            <Button
                                type="button"
                                variant="outline"
                                data-testid="reports-export-school-trigger"
                                onClick={() =>
                                    openExportDialog('school-overview')
                                }
                            >
                                <FileSpreadsheet className="size-4" />
                                Xuất dashboard
                            </Button>
                        ) : null}
                        {selectedCampaignId &&
                        campaignReport &&
                        reconciliation ? (
                            <Button
                                type="button"
                                data-testid="reports-export-campaign-trigger"
                                onClick={() =>
                                    openExportDialog('campaign-report')
                                }
                            >
                                <Download className="size-4" />
                                Xuất báo cáo campaign
                            </Button>
                        ) : null}
                    </div>
                </section>

                {overviewError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {overviewError}
                    </div>
                ) : null}

                {canViewSchoolOverview ? (
                    <>
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">
                                            Bộ lọc dashboard toàn trường
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Chỉ áp dụng filter khi bấm cập nhật,
                                            tránh gọi API liên tục khi người
                                            dùng đang chọn khoảng thời gian.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleResetOverviewFilters}
                                        >
                                            Reset filter
                                        </Button>
                                        <Button
                                            type="button"
                                            data-testid="reports-apply-filters"
                                            onClick={handleApplyOverviewFilters}
                                        >
                                            <RefreshCw className="size-4" />
                                            Cập nhật dashboard
                                        </Button>
                                    </div>
                                </div>

                                {filterError ? (
                                    <div
                                        data-testid="reports-filter-error"
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                                    >
                                        {filterError}
                                    </div>
                                ) : null}

                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                    <FilterField label="Từ ngày">
                                        <input
                                            data-testid="school-overview-filter-from"
                                            type="datetime-local"
                                            value={draftOverviewFilters.from}
                                            onChange={(event) =>
                                                setDraftOverviewFilters(
                                                    (current) => ({
                                                        ...current,
                                                        from: event.target
                                                            .value,
                                                    }),
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        />
                                    </FilterField>
                                    <FilterField label="Đến ngày">
                                        <input
                                            data-testid="school-overview-filter-to"
                                            type="datetime-local"
                                            value={draftOverviewFilters.to}
                                            onChange={(event) =>
                                                setDraftOverviewFilters(
                                                    (current) => ({
                                                        ...current,
                                                        to: event.target.value,
                                                    }),
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        />
                                    </FilterField>
                                    <FilterField label="Module">
                                        <select
                                            data-testid="school-overview-filter-module-type"
                                            value={
                                                draftOverviewFilters.module_type
                                            }
                                            onChange={(event) =>
                                                setDraftOverviewFilters(
                                                    (current) => ({
                                                        ...current,
                                                        module_type:
                                                            event.target.value,
                                                    }),
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="fundraising">
                                                Gây quỹ
                                            </option>
                                            <option value="item_donation">
                                                Hiện vật
                                            </option>
                                            <option value="event">
                                                Sự kiện
                                            </option>
                                        </select>
                                    </FilterField>
                                    <FilterField label="Trạng thái campaign">
                                        <select
                                            data-testid="school-overview-filter-status"
                                            value={draftOverviewFilters.status}
                                            onChange={(event) =>
                                                setDraftOverviewFilters(
                                                    (current) => ({
                                                        ...current,
                                                        status: event.target
                                                            .value,
                                                    }),
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="PUBLISHED">
                                                PUBLISHED
                                            </option>
                                            <option value="ONGOING">
                                                ONGOING
                                            </option>
                                            <option value="ENDED">ENDED</option>
                                        </select>
                                    </FilterField>
                                    <FilterField label="Tổ chức">
                                        <select
                                            data-testid="school-overview-filter-organization"
                                            value={
                                                draftOverviewFilters.organization_id
                                            }
                                            onChange={(event) =>
                                                setDraftOverviewFilters(
                                                    (current) => ({
                                                        ...current,
                                                        organization_id:
                                                            event.target.value,
                                                    }),
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                        >
                                            <option value="">Tất cả</option>
                                            {organizationOptions.map(
                                                (organization) => (
                                                    <option
                                                        key={
                                                            organization.organization_id
                                                        }
                                                        value={String(
                                                            organization.organization_id,
                                                        )}
                                                    >
                                                        {
                                                            organization.organization_name
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </FilterField>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {isOverviewLoading
                                ? statCards.map((card) => (
                                      <div
                                          key={card.key}
                                          className="h-28 animate-pulse rounded-xl bg-slate-100"
                                      />
                                  ))
                                : statCards.map((card) => {
                                      const value = overview
                                          ? overview[card.key]
                                          : 0;
                                      const Icon = card.icon;

                                      return (
                                          <div
                                              key={card.key}
                                              data-testid={`school-overview-stat-${card.key}`}
                                              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                          >
                                              <div className="flex items-center justify-between">
                                                  <span className="text-sm text-slate-500">
                                                      {card.label}
                                                  </span>
                                                  <span
                                                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
                                                  >
                                                      <Icon className="h-5 w-5" />
                                                  </span>
                                              </div>
                                              <p className="mt-3 text-2xl font-bold text-slate-900">
                                                  {card.format(value)}
                                              </p>
                                          </div>
                                      );
                                  })}
                        </section>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Tổng hợp theo tổ chức
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            So sánh campaign, verified amount,
                                            hiện vật, giờ tham gia và chứng nhận
                                            giữa các đơn vị.
                                        </p>
                                    </div>
                                    {overview?.filters_applied
                                        .organization_id ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                            Đang lọc 1 tổ chức
                                        </span>
                                    ) : null}
                                </div>

                                {isOverviewLoading ? (
                                    <div className="mt-4 h-40 animate-pulse rounded-lg bg-slate-100" />
                                ) : (
                                    <div
                                        className="mt-4 overflow-x-auto"
                                        data-testid="school-overview-organization-table"
                                    >
                                        <table className="w-full min-w-[760px] text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                                                    <th className="px-3 py-3">
                                                        Tổ chức
                                                    </th>
                                                    <th className="px-3 py-3">
                                                        Campaign
                                                    </th>
                                                    <th className="px-3 py-3">
                                                        Verified
                                                    </th>
                                                    <th className="px-3 py-3">
                                                        Received
                                                    </th>
                                                    <th className="px-3 py-3">
                                                        Complete
                                                    </th>
                                                    <th className="px-3 py-3">
                                                        Giờ complete
                                                    </th>
                                                    <th className="px-3 py-3">
                                                        Certificates
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {overview &&
                                                overview.organization_breakdown
                                                    .length > 0 ? (
                                                    overview.organization_breakdown.map(
                                                        (organization) => (
                                                            <tr
                                                                key={
                                                                    organization.organization_id
                                                                }
                                                            >
                                                                <td className="px-3 py-3">
                                                                    <p className="font-medium text-slate-900">
                                                                        {
                                                                            organization.organization_name
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {
                                                                            organization.organization_code
                                                                        }
                                                                    </p>
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-700">
                                                                    {organization.campaign_count.toLocaleString(
                                                                        'vi-VN',
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-700">
                                                                    {formatCurrency(
                                                                        organization.verified_money_amount,
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-700">
                                                                    {organization.received_item_quantity.toLocaleString(
                                                                        'vi-VN',
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-700">
                                                                    {organization.completed_event_registrations.toLocaleString(
                                                                        'vi-VN',
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-700">
                                                                    {organization.completed_event_hours.toLocaleString(
                                                                        'vi-VN',
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-700">
                                                                    {organization.issued_certificates.toLocaleString(
                                                                        'vi-VN',
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={7}
                                                            className="px-3 py-6 text-center text-sm text-slate-500"
                                                        >
                                                            Không có dữ liệu tổ
                                                            chức trong phạm vi
                                                            filter hiện tại.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <div className="grid gap-4">
                                <section
                                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    data-testid="school-overview-module-breakdown"
                                >
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Phân bổ theo loại module
                                    </h3>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {(overview?.module_breakdown ?? []).map(
                                            (item) => (
                                                <MetricStrip
                                                    key={item.module_type}
                                                    label={
                                                        moduleTypeLabel[
                                                            item.module_type
                                                        ] ?? item.module_type
                                                    }
                                                    value={item.campaign_count.toLocaleString(
                                                        'vi-VN',
                                                    )}
                                                />
                                            ),
                                        )}
                                    </div>
                                </section>

                                <section
                                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    data-testid="school-overview-status-breakdown"
                                >
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Phân bổ theo trạng thái campaign
                                    </h3>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {(overview?.status_breakdown ?? []).map(
                                            (item) => (
                                                <MetricStrip
                                                    key={item.status}
                                                    label={item.status}
                                                    value={item.campaign_count.toLocaleString(
                                                        'vi-VN',
                                                    )}
                                                />
                                            ),
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Báo cáo campaign
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Chọn chiến dịch để xem campaign summary và báo
                                cáo đối soát verified theo luồng canonical.
                            </p>
                        </div>
                        <label className="flex min-w-[280px] flex-col gap-2 text-sm text-slate-600">
                            <span>Chiến dịch</span>
                            <select
                                value={selectedCampaignId}
                                onChange={(event) =>
                                    setSelectedCampaignId(event.target.value)
                                }
                                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                            >
                                {campaigns.length === 0 ? (
                                    <option value="">
                                        Chưa có chiến dịch khả dụng
                                    </option>
                                ) : null}
                                {campaigns.map((campaign) => (
                                    <option
                                        key={campaign.id}
                                        value={campaign.id}
                                    >
                                        {campaign.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {reportError ? (
                        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {reportError}
                        </div>
                    ) : null}

                    {!selectedCampaignId ? (
                        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                            Chưa có chiến dịch để hiển thị báo cáo.
                        </div>
                    ) : null}

                    {selectedCampaignId ? (
                        <div className="mt-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {selectedCampaign?.title ??
                                            campaignReport?.campaign.title ??
                                            'Campaign đã chọn'}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Trạng thái:{' '}
                                        {campaignReport?.campaign.status ??
                                            selectedCampaign?.status ??
                                            'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                    Verified là số chuẩn để export báo cáo
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-[#2E5077]" />
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            Campaign summary
                                        </h4>
                                    </div>
                                    {isReportLoading || !campaignReport ? (
                                        <div className="mt-4 h-32 animate-pulse rounded-lg bg-slate-100" />
                                    ) : (
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <MetricCard
                                                label="Tiền đã xác minh"
                                                value={formatCurrency(
                                                    campaignReport.fundraising
                                                        .total_verified_amount,
                                                )}
                                            />
                                            <MetricCard
                                                label="Lượt đóng góp"
                                                value={campaignReport.fundraising.total_donations.toLocaleString(
                                                    'vi-VN',
                                                )}
                                            />
                                            <MetricCard
                                                label="Hiện vật đã tiếp nhận"
                                                value={campaignReport.item_donations.received_quantity.toLocaleString(
                                                    'vi-VN',
                                                )}
                                            />
                                            <MetricCard
                                                label="Sự kiện hoàn thành"
                                                value={campaignReport.events.completed_registrations.toLocaleString(
                                                    'vi-VN',
                                                )}
                                            />
                                            <MetricCard
                                                label="Giờ tham gia hoàn thành"
                                                value={campaignReport.events.completed_hours.toLocaleString(
                                                    'vi-VN',
                                                )}
                                            />
                                            <MetricCard
                                                label="Chứng nhận đã phát hành"
                                                value={campaignReport.certificates.issued_total.toLocaleString(
                                                    'vi-VN',
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <GitCompareArrows className="h-5 w-5 text-[#2E5077]" />
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            Đối soát verified
                                        </h4>
                                    </div>
                                    {isReportLoading || !reconciliation ? (
                                        <div className="mt-4 h-32 animate-pulse rounded-lg bg-slate-100" />
                                    ) : (
                                        <>
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {reconciliationCards.map(
                                                    (card) => (
                                                        <MetricCard
                                                            key={card.key}
                                                            label={card.label}
                                                            value={card.format(
                                                                reconciliation
                                                                    .reconciliation[
                                                                    card.key
                                                                ],
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                            <p className="mt-4 text-xs leading-6 text-slate-500">
                                                `MATCHED` cho biết giao dịch đã
                                                ghép đúng donation. `VERIFIED`
                                                mới được tính vào fundraising
                                                canonical và export.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {reconciliation ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <MetricStrip
                                        label="Donation pending"
                                        value={reconciliation.reconciliation.pending_donations.toLocaleString(
                                            'vi-VN',
                                        )}
                                    />
                                    <MetricStrip
                                        label="Donation matched"
                                        value={reconciliation.reconciliation.matched_donations.toLocaleString(
                                            'vi-VN',
                                        )}
                                    />
                                    <MetricStrip
                                        label="Donation verified"
                                        value={reconciliation.reconciliation.verified_donations.toLocaleString(
                                            'vi-VN',
                                        )}
                                    />
                                    <MetricStrip
                                        label="Donation rejected"
                                        value={reconciliation.reconciliation.rejected_donations.toLocaleString(
                                            'vi-VN',
                                        )}
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </section>
            </div>

            <Dialog
                open={isExportDialogOpen}
                onOpenChange={(open) => setIsExportDialogOpen(open)}
            >
                <DialogContent className="max-w-2xl">
                    <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
                        <div>
                            <p className="broadsheet-kicker">
                                Export báo cáo chuẩn
                            </p>
                            <DialogTitle className="mt-2 text-[26px] font-semibold leading-8 text-[#002A58]">
                                Xuất dữ liệu báo cáo
                            </DialogTitle>
                            <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Chọn phạm vi báo cáo cần tải xuống. Export sẽ
                                dùng đúng dữ liệu đang hiển thị trên màn hình
                                hiện tại.
                            </DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-10 rounded-lg p-0"
                            onClick={() => setIsExportDialogOpen(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    <div className="space-y-4 px-5 py-5 sm:px-6">
                        <div className="grid gap-3">
                            {availableExportScopes.map((option) => (
                                <label
                                    key={option.value}
                                    className={`rounded-xl border px-4 py-3 text-sm transition ${
                                        exportScope === option.value
                                            ? 'border-[#0E4686] bg-[#EEF3FB]'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="report-export-scope"
                                            value={option.value}
                                            checked={
                                                exportScope === option.value
                                            }
                                            onChange={() =>
                                                setExportScope(option.value)
                                            }
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {option.label}
                                            </p>
                                            <p className="mt-1 text-slate-600">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {availableExportScopes.length === 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                Chưa có đủ dữ liệu để xuất báo cáo. Hãy tải
                                dashboard hoặc campaign report trước.
                            </div>
                        ) : null}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Định dạng hiện hỗ trợ: <strong>CSV</strong>. Tệp
                            được tạo trực tiếp từ dữ liệu đã tải để tránh phụ
                            thuộc vào export job backend chưa sẵn sàng.
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsExportDialogOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="button"
                                data-testid="reports-export-submit"
                                disabled={
                                    isExporting ||
                                    availableExportScopes.length === 0
                                }
                                onClick={() => void handleExport()}
                            >
                                {isExporting ? 'Đang xuất...' : 'Tải tệp CSV'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </ContentLayout>
    );
};

const FilterField = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <label className="text-sm text-slate-600">
        <span className="mb-1 block">{label}</span>
        {children}
    </label>
);

const MetricCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
);

const MetricStrip = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
);
