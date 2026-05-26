import { useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    Building2,
    Banknote,
    ClipboardCheck,
    GitCompareArrows,
    TrendingUp,
    Users,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
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
        color: 'text-blue-600 bg-blue-50',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'total_students' as const,
        label: 'Tổng sinh viên',
        icon: Users,
        color: 'text-emerald-600 bg-emerald-50',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'total_organizations' as const,
        label: 'Tổng CLB/Đội',
        icon: Building2,
        color: 'text-violet-600 bg-violet-50',
        format: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
        key: 'total_money_donations' as const,
        label: 'Tổng quyên góp',
        icon: Banknote,
        color: 'text-amber-600 bg-amber-50',
        format: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
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
        format: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
    {
        key: 'amount_gap_vs_verified' as const,
        label: 'Chênh lệch chờ verify',
        format: (value: number) => `${value.toLocaleString('vi-VN')} ₫`,
    },
];

export const ReportsRoute = () => {
    const user = useUser();
    const role = user.data?.role;
    const [overview, setOverview] = useState<SchoolOverview | null>(null);
    const [campaigns, setCampaigns] = useState<ManagedCampaignItem[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
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

    const canViewOperatorReports = user.data?.accountType === 'OPERATOR';
    const canViewSchoolOverview = role === ROLES.DOANTRUONG;

    useEffect(() => {
        if (!canViewOperatorReports) {
            setIsOverviewLoading(false);
            return;
        }

        let isMounted = true;

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

                if (!isMounted) return;
                setOverview(overviewData);
                setCampaigns(campaignItems);
                if (campaignItems.length > 0) {
                    setSelectedCampaignId(
                        (current) => current || campaignItems[0].id,
                    );
                }
            } catch (error) {
                if (!isMounted) return;
                setOverviewError(
                    error instanceof Error
                        ? error.message
                        : 'Không thể tải báo cáo tổng quan',
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
            return;
        }

        let isMounted = true;
        setIsReportLoading(true);
        setReportError(null);

        Promise.all([
            getCampaignReport(selectedCampaignId),
            getCampaignReconciliationReport(selectedCampaignId),
        ])
            .then(([campaignReportData, reconciliationData]) => {
                if (!isMounted) return;
                setCampaignReport(campaignReportData);
                setReconciliation(reconciliationData);
            })
            .catch((error) => {
                if (!isMounted) return;
                setReportError(
                    error instanceof Error
                        ? error.message
                        : 'Không thể tải báo cáo chiến dịch',
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

    if (!canViewOperatorReports) {
        return (
            <ContentLayout title="Báo cáo">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền truy cập báo cáo vận hành.
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Báo cáo">
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-7 w-7 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            {canViewSchoolOverview
                                ? 'Tổng quan trường'
                                : 'Báo cáo chiến dịch'}
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-400">
                            {canViewSchoolOverview
                                ? 'Thống kê tổng hợp và đối soát vận hành theo chiến dịch.'
                                : 'Thống kê canonical và đối soát theo chiến dịch mà bạn có quyền xem.'}
                        </p>
                    </div>
                </div>

                {overviewError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {overviewError}
                    </div>
                ) : null}

                {canViewSchoolOverview ? (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                <label className="text-sm text-slate-600">
                                    <span className="mb-1 block">Từ ngày</span>
                                    <input
                                        data-testid="school-overview-filter-from"
                                        type="datetime-local"
                                        value={overviewFilters.from ?? ''}
                                        onChange={(event) =>
                                            setOverviewFilters((current) => ({
                                                ...current,
                                                from: event.target.value
                                                    ? new Date(
                                                          event.target.value,
                                                      ).toISOString()
                                                    : undefined,
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    />
                                </label>
                                <label className="text-sm text-slate-600">
                                    <span className="mb-1 block">Đến ngày</span>
                                    <input
                                        data-testid="school-overview-filter-to"
                                        type="datetime-local"
                                        value={overviewFilters.to ?? ''}
                                        onChange={(event) =>
                                            setOverviewFilters((current) => ({
                                                ...current,
                                                to: event.target.value
                                                    ? new Date(
                                                          event.target.value,
                                                      ).toISOString()
                                                    : undefined,
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    />
                                </label>
                                <label className="text-sm text-slate-600">
                                    <span className="mb-1 block">Module</span>
                                    <select
                                        data-testid="school-overview-filter-module-type"
                                        value={
                                            overviewFilters.module_type ?? ''
                                        }
                                        onChange={(event) =>
                                            setOverviewFilters((current) => ({
                                                ...current,
                                                module_type:
                                                    event.target.value ||
                                                    undefined,
                                            }))
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
                                        <option value="event">Sự kiện</option>
                                    </select>
                                </label>
                                <label className="text-sm text-slate-600">
                                    <span className="mb-1 block">
                                        Trạng thái chiến dịch
                                    </span>
                                    <select
                                        data-testid="school-overview-filter-status"
                                        value={overviewFilters.status ?? ''}
                                        onChange={(event) =>
                                            setOverviewFilters((current) => ({
                                                ...current,
                                                status:
                                                    event.target.value ||
                                                    undefined,
                                            }))
                                        }
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="PUBLISHED">
                                            PUBLISHED
                                        </option>
                                        <option value="ONGOING">ONGOING</option>
                                        <option value="ENDED">ENDED</option>
                                    </select>
                                </label>
                                <label className="text-sm text-slate-600">
                                    <span className="mb-1 block">Tổ chức</span>
                                    <select
                                        data-testid="school-overview-filter-organization"
                                        value={
                                            overviewFilters.organization_id ??
                                            ''
                                        }
                                        onChange={(event) =>
                                            setOverviewFilters((current) => ({
                                                ...current,
                                                organization_id:
                                                    event.target.value ||
                                                    undefined,
                                            }))
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
                                </label>
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                                              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                                          >
                                              <div className="flex items-center justify-between">
                                                  <span className="text-sm text-slate-400">
                                                      {card.label}
                                                  </span>
                                                  <span
                                                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
                                                  >
                                                      <Icon className="h-5 w-5" />
                                                  </span>
                                              </div>
                                              <p className="mt-2 text-2xl font-bold text-slate-800">
                                                  {card.format(value)}
                                              </p>
                                          </div>
                                      );
                                  })}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Tổng hợp theo tổ chức
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Aggregate canonical theo từng đơn vị
                                            trong phạm vi filter hiện tại.
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
                                                        Event complete
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
                                                                    {organization.verified_money_amount.toLocaleString(
                                                                        'vi-VN',
                                                                    )}{' '}
                                                                    ₫
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
                                        Phân bố theo loại module
                                    </h3>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {overview?.module_breakdown.map(
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
                                        Phân bố theo trạng thái campaign
                                    </h3>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {overview?.status_breakdown.map(
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
                                Báo cáo chiến dịch
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Chọn chiến dịch để xem thống kê chuẩn và báo cáo
                                đối soát SePay.
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

                    {selectedCampaignId && (
                        <div className="mt-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {selectedCampaign?.title ??
                                            campaignReport?.campaign.title ??
                                            'Chiến dịch đã chọn'}
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
                                    Verified là số chuẩn cho báo cáo canonical
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-[#2E5077]" />
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            Báo cáo chuẩn chiến dịch
                                        </h4>
                                    </div>
                                    {isReportLoading || !campaignReport ? (
                                        <div className="mt-4 h-32 animate-pulse rounded-lg bg-slate-100" />
                                    ) : (
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <MetricCard
                                                label="Tiền đã xác minh"
                                                value={`${campaignReport.fundraising.total_verified_amount.toLocaleString('vi-VN')} ₫`}
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
                                            Đối soát SePay
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
                                                được ghép đúng donation.
                                                `VERIFIED` mới được tính vào báo
                                                cáo fundraising chuẩn.
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
                    )}
                </section>
            </div>
        </ContentLayout>
    );
};

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
