/* eslint-disable @typescript-eslint/no-explicit-any, no-irregular-whitespace */
import * as React from 'react';
import {
    ArrowLeft,
    Clock3,
    FileText,
    History,
    ImagePlus,
    PencilLine,
    PlayCircle,
    Send,
    SquareChartGantt,
    StopCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getEventRegistrations } from '@/features/campaign/api/events';
import {
    getFundraisingDonations,
    getFundraisingTransactions,
} from '@/features/campaign/api/fundraising';
import {
    getItemPledges,
    getItemTargets,
} from '@/features/campaign/api/item-donations';
import { EventPanel } from '@/features/campaign/components/event-panel';
import { FundraisingPanel } from '@/features/campaign/components/fundraising-panel';
import { ItemDonationPanel } from '@/features/campaign/components/item-donation-panel';
import { ModuleCertificatePanel } from '@/features/campaign/components/module-certificate-panel';
import { downloadCampaignReportWorkbook } from '@/features/campaign/lib/campaign-report-excel';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import {
    formatCountdown,
    getCountdownState,
    useCountdownTicker,
} from '@/features/campaign/lib/countdown';
import { uploadStorageFile } from '@/features/storage/api/storage';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const formatDateRange = (startAt?: string | null, endAt?: string | null) => {
    if (!startAt || !endAt) return 'Chưa cập nhật';
    const formatter = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Chưa cập nhật';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatCurrency = (value?: number | null) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatModuleTypeLabel = (value?: string | null) => {
    switch (value) {
        case 'FUNDRAISING_MONEY':
        case 'fundraising':
            return 'Gây quỹ';
        case 'ITEM_DONATION':
        case 'item_donation':
            return 'Quyên góp hiện vật';
        case 'VOLUNTEER_RECRUITMENT':
        case 'event':
        case 'volunteer':
        case 'EVENT':
            return 'Tuyển tình nguyện viên';
        default:
            return 'Module chiến dịch';
    }
};

const normalizeManagedModuleType = (value?: string | null) => {
    switch (value) {
        case 'FUNDRAISING_MONEY':
            return 'fundraising';
        case 'ITEM_DONATION':
            return 'item_donation';
        case 'VOLUNTEER_RECRUITMENT':
        case 'EVENT':
            return 'volunteer';
        default:
            return value ?? '';
    }
};

const formatStatusLabel = (value?: string | null) => {
    switch (value) {
        case 'DRAFT':
            return 'Nháp';
        case 'SUBMITTED':
            return 'Đã gửi duyệt';
        case 'PRE_APPROVED':
            return 'Đã sơ duyệt';
        case 'APPROVED':
            return 'Đã duyệt chính thức';
        case 'PUBLISHED':
            return 'Đã công khai';
        case 'ONGOING':
            return 'Đang diễn ra';
        case 'ENDED':
            return 'Đã kết thúc';
        case 'READY':
            return 'Sẵn sàng';
        case 'OPEN':
            return 'Đang mở';
        case 'CLOSED':
            return 'Đã đóng';
        case 'APPROVED_REGISTRATION':
            return 'Đã duyệt';
        case 'PENDING':
            return 'Chờ xử lý';
        case 'VERIFIED':
            return 'Đã xác nhận';
        case 'MATCHED':
            return 'Đã đối soát';
        case 'REJECTED':
            return 'Đã từ chối';
        case 'RECEIVED':
            return 'Đã tiếp nhận';
        case 'COMPLETED':
            return 'Đã hoàn thành';
        case 'CHECKED_IN':
            return 'Đã check-in';
        default:
            return value ? String(value) : 'Chưa cập nhật';
    }
};

const slugifyFileName = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

const truncateSheetName = (value: string) =>
    value.length > 31 ? value.slice(0, 31) : value;

const fetchArrayPages = async (
    loader: (page: number, limit: number) => Promise<any[]>,
    limit = 100,
) => {
    const items: any[] = [];
    let page = 1;

    for (;;) {
        const pageItems = await loader(page, limit);
        if (!Array.isArray(pageItems) || pageItems.length === 0) {
            break;
        }

        items.push(...pageItems);

        if (pageItems.length < limit) {
            break;
        }

        page += 1;
    }

    return items;
};

const fetchPaginatedItems = async (
    loader: (
        page: number,
        limit: number,
    ) => Promise<{
        items: any[];
        pagination?: { totalPages?: number; total_pages?: number } | null;
    }>,
    limit = 100,
) => {
    const items: any[] = [];
    let page = 1;

    for (;;) {
        const response = await loader(page, limit);
        const pageItems = Array.isArray(response?.items) ? response.items : [];
        items.push(...pageItems);

        const totalPages =
            response?.pagination?.totalPages ?? response?.pagination?.total_pages;

        if (pageItems.length === 0 || (totalPages != null && page >= totalPages)) {
            break;
        }

        if (pageItems.length < limit && totalPages == null) {
            break;
        }

        page += 1;
    }

    return items;
};

const buildTimelineGroups = (detail: any) => {
    const modules = [...(detail?.modules ?? [])]
        .map((module) => ({
            ...module,
            normalizedType: normalizeManagedModuleType(module.type),
        }))
        .sort(
        (left, right) =>
            new Date(left.start_at).getTime() -
            new Date(right.start_at).getTime(),
    );

    const phaseOneTypes = new Set(['fundraising', 'item_donation']);
    const phaseTwoTypes = new Set(['event', 'volunteer']);
    const hasPhaseOne = modules.some((module) =>
        phaseOneTypes.has(module.normalizedType),
    );
    const hasPhaseTwo = modules.some((module) =>
        phaseTwoTypes.has(module.normalizedType),
    );

    if (hasPhaseOne && hasPhaseTwo) {
        return [
            {
                id: 'stage-1',
                title: 'Giai đoạn 1',
                modules: modules.filter((module) =>
                    phaseOneTypes.has(module.normalizedType),
                ),
            },
            {
                id: 'stage-2',
                title: 'Giai đoạn 2',
                modules: modules.filter((module) =>
                    phaseTwoTypes.has(module.normalizedType),
                ),
            },
        ].filter((group) => group.modules.length > 0);
    }

    return [
        {
            id: 'single',
            title:
                modules.length > 1
                    ? 'Các hạng mục chiến dịch'
                    : 'Tiến độ chiến dịch',
            modules,
        },
    ];
};

const buildCountdownView = (input: {
    now: number;
    startAt?: string | null;
    endAt?: string | null;
    endedAt?: string | null;
}) => {
    const state = getCountdownState({
        now: input.now,
        startAt: input.startAt,
        endAt: input.endAt,
        endedAt: input.endedAt,
    });

    return {
        ...state,
        value: formatCountdown(state.remainingMs),
    };
};

type ActionDialogState = {
    kind: 'extend' | 'end-early';
    title: string;
    endAt: string;
    reason: string;
    note: string;
    notifyParticipants: boolean;
};

type ReportActor = {
    fullName: string;
    roleLabel: string;
    organizationName: string;
};

type VolunteerModuleReport = {
    module: any;
    registrations: any[];
};

type FundraisingModuleReport = {
    module: any;
    donations: any[];
    transactions: any[];
};

type ItemModuleReport = {
    module: any;
    targets: any[];
    pledges: any[];
};

type CampaignReportSnapshot = {
    generatedAt: string;
    volunteerModules: VolunteerModuleReport[];
    fundraisingModules: FundraisingModuleReport[];
    itemModules: ItemModuleReport[];
};

const buildCampaignReportSummary = (
    detail: any,
    snapshot: CampaignReportSnapshot | null,
) => {
    if (!snapshot) {
        return null;
    }

    const approvedVolunteers = snapshot.volunteerModules.reduce(
        (total, entry) =>
            total +
            entry.registrations.filter((registration) =>
                ['APPROVED', 'CHECKED_IN', 'COMPLETED'].includes(
                    registration.status,
                ),
            ).length,
        0,
    );

    const checkedInVolunteers = snapshot.volunteerModules.reduce(
        (total, entry) =>
            total +
            entry.registrations.filter((registration) =>
                ['CHECKED_IN', 'COMPLETED'].includes(registration.status),
            ).length,
        0,
    );

    const verifiedMoney = snapshot.fundraisingModules.reduce(
        (total, entry) =>
            total +
            entry.donations
                .filter((donation) =>
                    ['VERIFIED', 'MATCHED'].includes(donation.status),
                )
                .reduce(
                    (moneyTotal, donation) =>
                        moneyTotal + Number(donation.amount ?? 0),
                    0,
                ),
        0,
    );

    const pendingTransactions = snapshot.fundraisingModules.reduce(
        (total, entry) =>
            total +
            entry.transactions.filter(
                (transaction) => transaction.match_status === 'UNMATCHED',
            ).length,
        0,
    );

    const receivedItems = snapshot.itemModules.reduce(
        (total, entry) =>
            total +
            entry.pledges.reduce(
                (pledgeTotal, pledge) =>
                    pledgeTotal + Number(pledge.received_quantity ?? 0),
                0,
            ),
        0,
    );

    return {
        generatedAtLabel: formatDateTime(snapshot.generatedAt),
        metrics: [
            {
                label: 'Tổng module trong chiến dịch',
                value: String(detail?.modules?.length ?? 0),
            },
            {
                label: 'Lượt đăng ký tình nguyện viên',
                value: String(
                    snapshot.volunteerModules.reduce(
                        (total, entry) => total + entry.registrations.length,
                        0,
                    ),
                ),
            },
            {
                label: 'Tình nguyện viên đã duyệt',
                value: String(approvedVolunteers),
            },
            {
                label: 'Tình nguyện viên đã check-in / hoàn thành',
                value: String(checkedInVolunteers),
            },
            {
                label: 'Khoản ủng hộ đã xác nhận',
                value: formatCurrency(verifiedMoney),
            },
            {
                label: 'Giao dịch đang chờ đối soát',
                value: String(pendingTransactions),
            },
            {
                label: 'Phiếu đăng ký hiện vật',
                value: String(
                    snapshot.itemModules.reduce(
                        (total, entry) => total + entry.pledges.length,
                        0,
                    ),
                ),
            },
            {
                label: 'Số lượng hiện vật đã tiếp nhận',
                value: String(receivedItems),
            },
        ],
        moduleRows: (detail?.modules ?? []).map((module: any) => ({
            id: module.id,
            title: toDisplayTitle(module.title),
            moduleType: formatModuleTypeLabel(module.type),
            status: formatStatusLabel(module.status),
            timeWindow: formatDateRange(module.start_at, module.end_at),
            progress:
                module.progress != null
                    ? `${module.progress.current}/${module.progress.target} (${module.progress.percent}%)`
                    : 'Chưa có tiến độ',
        })),
    };
};

type Props = {
    detail: any;
    canMutateCampaign: boolean;
    canDeleteDraft: boolean;
    reportActor: ReportActor;
    fundraisingModuleId: string;
    fundraisingConfig: any;
    fundraisingDonations: any[];
    fundraisingTransactions: any[];
    itemModuleId: string;
    itemConfig: any;
    itemTargets: any[];
    itemTargetForm: any;
    itemPledges: any[];
    eventModuleId: string;
    eventConfig: any;
    eventRegistrations: any[];
    setFundraisingModuleId: (value: string) => void;
    setFundraisingConfig: (updater: any) => void;
    setItemModuleId: (value: string) => void;
    setItemConfig: (updater: any) => void;
    setItemTargetForm: (updater: any) => void;
    setEventModuleId: (value: string) => void;
    setEventConfig: (updater: any) => void;
    onSaveFundraisingConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onVerifyDonation: (donationId: string) => void;
    onRejectDonation: (donationId: string) => void;
    onAttachTransaction: (transactionId: string, donationId: string) => void;
    onUnmatchTransaction: (transactionId: string) => void;
    onSaveItemConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onCreateItemTarget: (event: React.FormEvent<HTMLFormElement>) => void;
    onUpdateItemTarget: (targetId: string, payload: any) => Promise<void>;
    onDeleteItemTarget: (targetId: string) => Promise<void>;
    onConfirmItemPledge: (pledgeId: string) => void;
    onRejectItemPledge: (pledgeId: string) => void;
    onHandoverItemPledge: (
        pledgeId: string,
        payload: {
            received_quantity: number;
            received_at?: string;
            note?: string;
        },
    ) => void;
    onSaveEventConfig: (event: React.FormEvent<HTMLFormElement>) => void;
    onApproveRegistration: (registrationId: string) => void;
    onRejectRegistration: (registrationId: string) => void;
    onCheckInRegistration: (registrationId: string) => void;
    onCompleteRegistration: (registrationId: string) => void;
    onBulkApproveRegistrations: (registrationIds: string[]) => void;
    onExtendVolunteerDeadline: (payload: {
        end_at: string;
        reason?: string;
        notify_participants?: boolean;
    }) => void;
    onEndVolunteerEarly: (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => void;
    onExtendFundraisingDeadline: (payload: {
        end_at: string;
        reason?: string;
        notify_participants?: boolean;
    }) => void;
    onEndFundraisingEarly: (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => void;
    onExtendItemDeadline: (payload: {
        end_at: string;
        reason?: string;
        notify_participants?: boolean;
    }) => void;
    onEndItemEarly: (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => void;
    onSubmitReview: () => void;
    onPublish: () => void;
    onDeleteDraftCampaign: () => void;
    onUpdateCampaign: (payload: any) => Promise<void>;
    onExtendCampaign: (payload: {
        end_at: string;
        reason?: string;
        notify_participants?: boolean;
    }) => Promise<void>;
    onEndCampaignEarly: (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => Promise<void>;
    onSaveCompletionReport: (payload: any) => Promise<void>;
};

export const ManagedCampaignWorkspace: React.FC<Props> = ({
    detail,
    canMutateCampaign,
    canDeleteDraft,
    reportActor,
    fundraisingModuleId,
    fundraisingConfig,
    fundraisingDonations,
    fundraisingTransactions,
    itemModuleId,
    itemConfig,
    itemTargets,
    itemTargetForm,
    itemPledges,
    eventModuleId,
    eventConfig,
    eventRegistrations,
    setFundraisingModuleId,
    setFundraisingConfig,
    setItemModuleId,
    setItemConfig,
    setItemTargetForm,
    setEventModuleId,
    setEventConfig,
    onSaveFundraisingConfig,
    onVerifyDonation,
    onRejectDonation,
    onAttachTransaction,
    onUnmatchTransaction,
    onSaveItemConfig,
    onCreateItemTarget,
    onUpdateItemTarget,
    onDeleteItemTarget,
    onConfirmItemPledge,
    onRejectItemPledge,
    onHandoverItemPledge,
    onSaveEventConfig,
    onApproveRegistration,
    onRejectRegistration,
    onCheckInRegistration,
    onCompleteRegistration,
    onBulkApproveRegistrations,
    onExtendVolunteerDeadline,
    onEndVolunteerEarly,
    onExtendFundraisingDeadline,
    onEndFundraisingEarly,
    onExtendItemDeadline,
    onEndItemEarly,
    onSubmitReview,
    onPublish,
    onDeleteDraftCampaign,
    onUpdateCampaign,
    onExtendCampaign,
    onEndCampaignEarly,
    onSaveCompletionReport,
}) => {
    const now = useCountdownTicker();
    const [viewMode, setViewMode] = React.useState<'overview' | 'edit'>(
        'overview',
    );
    const [activeTab, setActiveTab] = React.useState<string>('overview');
    const [submitting, setSubmitting] = React.useState(false);
    const [actionDialog, setActionDialog] =
        React.useState<ActionDialogState | null>(null);
    const [editForm, setEditForm] = React.useState({
        title: '',
        summary: '',
        slogan: '',
        description: '',
        beneficiary: '',
        start_at: '',
        end_at: '',
    });
    const [reportForm, setReportForm] = React.useState({
        title: '',
        content: '',
        result_summary: '',
        completed_tasks: '',
        volunteer_count: '',
        verified_money_amount: '',
        received_item_quantity: '',
        challenges: '',
        conclusion: '',
    });
    const [reportImages, setReportImages] = React.useState<any[]>([]);
    const [uploadingImages, setUploadingImages] = React.useState(false);
    const [reportSnapshot, setReportSnapshot] =
        React.useState<CampaignReportSnapshot | null>(null);
    const [reportSnapshotLoading, setReportSnapshotLoading] =
        React.useState(false);
    const [reportSnapshotError, setReportSnapshotError] = React.useState('');
    const [reportExporting, setReportExporting] = React.useState(false);
    const [reportRefreshing, setReportRefreshing] = React.useState(false);

    React.useEffect(() => {
        setViewMode('overview');
        setActiveTab('overview');
        setEditForm({
            title: detail?.title ?? '',
            summary: detail?.summary ?? '',
            slogan: detail?.slogan ?? '',
            description: detail?.description ?? '',
            beneficiary: detail?.beneficiary ?? '',
            start_at: detail?.start_at ? String(detail.start_at).slice(0, 16) : '',
            end_at: detail?.end_at ? String(detail.end_at).slice(0, 16) : '',
        });
        setReportForm({
            title: detail?.completion_report?.title ?? '',
            content: detail?.completion_report?.content ?? '',
            result_summary: detail?.completion_report?.result_summary ?? '',
            completed_tasks: (
                detail?.completion_report?.completed_tasks ?? []
            ).join('\n'),
            volunteer_count:
                detail?.completion_report?.volunteer_count != null
                    ? String(detail.completion_report.volunteer_count)
                    : '',
            verified_money_amount:
                detail?.completion_report?.verified_money_amount != null
                    ? String(detail.completion_report.verified_money_amount)
                    : '',
            received_item_quantity:
                detail?.completion_report?.received_item_quantity != null
                    ? String(detail.completion_report.received_item_quantity)
                    : '',
            challenges: detail?.completion_report?.challenges ?? '',
            conclusion: detail?.completion_report?.conclusion ?? '',
        });
        setReportImages(detail?.completion_report?.images ?? []);
    }, [detail?.id]);

    const campaignCountdown = React.useMemo(
        () =>
            buildCountdownView({
                now,
                startAt: detail?.start_at,
                endAt: detail?.end_at,
                endedAt: detail?.ended_at,
            }),
        [detail?.end_at, detail?.ended_at, detail?.start_at, now],
    );

    const timelineGroups = React.useMemo(
        () => buildTimelineGroups(detail),
        [detail],
    );
    const normalizedModules = React.useMemo(
        () =>
            (detail?.modules ?? []).map((module: any) => ({
                ...module,
                normalizedType: normalizeManagedModuleType(module.type),
            })),
        [detail?.modules],
    );
    const fundraiserModules = normalizedModules.filter(
        (module: any) => module.normalizedType === 'fundraising',
    );
    const itemModules = normalizedModules.filter(
        (module: any) => module.normalizedType === 'item_donation',
    );
    const volunteerModules = normalizedModules.filter(
        (module: any) =>
            module.normalizedType === 'event' ||
            module.normalizedType === 'volunteer',
    );
    const currentFundraisingModule =
        fundraiserModules.find((module: any) => module.id === fundraisingModuleId) ??
        fundraiserModules[0] ??
        null;
    const currentItemModule =
        itemModules.find((module: any) => module.id === itemModuleId) ??
        itemModules[0] ??
        null;
    const currentVolunteerModule =
        volunteerModules.find((module: any) => module.id === eventModuleId) ??
        volunteerModules[0] ??
        null;
    const canEditCampaignContent =
        canMutateCampaign &&
        ['DRAFT', 'REVISION_REQUIRED'].includes(
            detail?.status ?? '',
        );

    React.useEffect(() => {
        if (viewMode === 'edit' && !canEditCampaignContent) {
            setViewMode('overview');
        }
    }, [canEditCampaignContent, viewMode]);

    const loadReportSnapshot = React.useCallback(
        async ({
            silent = false,
            trigger = 'auto',
        }: {
            silent?: boolean;
            trigger?: 'auto' | 'manual' | 'export';
        } = {}) => {
            if (!detail?.id) return null;

            if (trigger === 'manual') {
                setReportRefreshing(true);
            }
            if (!silent) {
                setReportSnapshotLoading(true);
            }
            setReportSnapshotError('');

            try {
                const [volunteerData, fundraisingData, itemData] =
                    await Promise.all([
                        Promise.all(
                            volunteerModules.map(async (module: any) => ({
                                module,
                                registrations: await fetchArrayPages(
                                    (page, limit) =>
                                        getEventRegistrations(module.id, {
                                            page,
                                            limit,
                                        }),
                                ),
                            })),
                        ),
                        Promise.all(
                            fundraiserModules.map(async (module: any) => ({
                                module,
                                donations: await fetchPaginatedItems(
                                    (page, limit) =>
                                        getFundraisingDonations(module.id, {
                                            page,
                                            limit,
                                        }),
                                ),
                                transactions: await fetchPaginatedItems(
                                    (page, limit) =>
                                        getFundraisingTransactions({
                                            module_id: module.id,
                                            page,
                                            limit,
                                        }),
                                ),
                            })),
                        ),
                        Promise.all(
                            itemModules.map(async (module: any) => ({
                                module,
                                targets: await getItemTargets(module.id),
                                pledges: await fetchArrayPages(
                                    (page, limit) =>
                                        getItemPledges(module.id, {
                                            page,
                                            limit,
                                        }),
                                ),
                            })),
                        ),
                    ]);

                const snapshot: CampaignReportSnapshot = {
                    generatedAt: new Date().toISOString(),
                    volunteerModules: volunteerData,
                    fundraisingModules: fundraisingData,
                    itemModules: itemData,
                };

                setReportSnapshot(snapshot);
                return snapshot;
            } catch (error) {
                console.error('Khong the tai du lieu bao cao chien dich', error);
                setReportSnapshotError(
                    'Không thể tải dữ liệu báo cáo theo thời gian thực. Vui lòng thử làm mới lại.',
                );
                return null;
            } finally {
                if (trigger === 'manual') {
                    setReportRefreshing(false);
                }
                if (!silent) {
                    setReportSnapshotLoading(false);
                }
            }
        },
        [detail?.id, fundraiserModules, itemModules, volunteerModules],
    );

    React.useEffect(() => {
        if (activeTab !== 'report') {
            return undefined;
        }

        void loadReportSnapshot({ trigger: 'auto' });
        const intervalId = window.setInterval(() => {
            void loadReportSnapshot({ silent: true, trigger: 'auto' });
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [activeTab, loadReportSnapshot]);

    const reportSummary = React.useMemo(
        () => buildCampaignReportSummary(detail, reportSnapshot),
        [detail, reportSnapshot],
    );

    const exportCampaignReport = React.useCallback(async () => {
        if (!detail?.id) return;

        setReportExporting(true);
        try {
            const snapshot =
                reportSnapshot ??
                (await loadReportSnapshot({
                    silent: true,
                    trigger: 'export',
                }));
            const currentReportSummary = buildCampaignReportSummary(
                detail,
                snapshot,
            );

            if (!snapshot) {
                return;
            }

            const moduleSheets: Array<{
                name: string;
                title: string;
                subtitle: string;
                columns: string[];
                rows: Array<Array<string | number>>;
            }> = [];

            snapshot.volunteerModules.forEach((entry, index) => {
                moduleSheets.push({
                    name: truncateSheetName(`TNV-${index + 1}-${entry.module.title}`),
                    title: 'DANH SÁCH THAM GIA MODULE TUYỂN TÌNH NGUYỆN VIÊN',
                    subtitle: toDisplayTitle(entry.module.title),
                    columns: [
                        'Họ tên',
                        'MSSV',
                        'Khoa',
                        'Lớp',
                        'Trạng thái đăng ký',
                        'Thời gian đăng ký',
                        'Thời gian duyệt',
                        'Check-in',
                        'Hoàn thành',
                    ],
                    rows: entry.registrations.map((registration) => [
                        registration.student?.full_name ?? 'Chưa cập nhật',
                        registration.student?.student_code ?? 'Chưa cập nhật',
                        registration.student?.faculty_name ?? 'Chưa cập nhật',
                        registration.student?.class_name ?? 'Chưa cập nhật',
                        formatStatusLabel(registration.status),
                        formatDateTime(registration.registered_at),
                        formatDateTime(registration.reviewed_at),
                        formatDateTime(registration.checked_in_at),
                        formatDateTime(registration.checked_out_at),
                    ]),
                });
            });

            snapshot.fundraisingModules.forEach((entry, index) => {
                moduleSheets.push({
                    name: truncateSheetName(`GQ-${index + 1}-${entry.module.title}`),
                    title: 'DANH SÁCH ỦNG HỘ MODULE GÂY QUỸ',
                    subtitle: toDisplayTitle(entry.module.title),
                    columns: [
                        'Người ủng hộ',
                        'Số tiền',
                        'Nội dung',
                        'Trạng thái',
                        'Thời gian',
                        'Mã giao dịch ghép',
                    ],
                    rows: entry.donations.map((donation) => [
                        donation.donor_name ?? 'Ẩn danh',
                        formatCurrency(Number(donation.amount ?? 0)),
                        donation.message ?? 'Không có',
                        formatStatusLabel(donation.status),
                        formatDateTime(donation.created_at),
                        donation.matched_transaction_id ?? 'Chưa ghép',
                    ]),
                });

                moduleSheets.push({
                    name: truncateSheetName(
                        `GD-${index + 1}-${entry.module.title}`,
                    ),
                    title: 'GIAO DỊCH ĐỐI SOÁT MODULE GÂY QUỸ',
                    subtitle: toDisplayTitle(entry.module.title),
                    columns: [
                        'Mã giao dịch',
                        'Nguồn',
                        'Số tiền',
                        'Nội dung chuyển khoản',
                        'Trạng thái đối soát',
                        'Thời gian giao dịch',
                    ],
                    rows: entry.transactions.map((transaction) => [
                        transaction.provider_transaction_id ?? transaction.id,
                        transaction.provider ?? 'Không rõ',
                        formatCurrency(Number(transaction.amount ?? 0)),
                        transaction.content ?? 'Không có',
                        transaction.match_status === 'MATCHED'
                            ? 'Đã đối soát'
                            : 'Chờ xác nhận',
                        formatDateTime(transaction.transaction_time),
                    ]),
                });
            });

            snapshot.itemModules.forEach((entry, index) => {
                moduleSheets.push({
                    name: truncateSheetName(`HV-${index + 1}-${entry.module.title}`),
                    title: 'DANH SÁCH QUYÊN GÓP HIỆN VẬT',
                    subtitle: toDisplayTitle(entry.module.title),
                    columns: [
                        'Họ tên',
                        'MSSV',
                        'Khoa',
                        'Lớp',
                        'Hiện vật đăng ký',
                        'Số lượng dự kiến',
                        'Số lượng thực nhận',
                        'Trạng thái',
                        'Ngày đăng ký',
                    ],
                    rows: entry.pledges.map((pledge) => [
                        pledge.student?.full_name ?? pledge.donor_name ?? 'Chưa cập nhật',
                        pledge.student?.student_code ?? 'Chưa cập nhật',
                        pledge.student?.faculty_name ?? 'Chưa cập nhật',
                        pledge.student?.class_name ?? 'Chưa cập nhật',
                        pledge.item_target?.name ?? 'Chưa cập nhật',
                        Number(pledge.quantity ?? 0),
                        Number(pledge.received_quantity ?? 0),
                        formatStatusLabel(pledge.status),
                        formatDateTime(pledge.created_at),
                    ]),
                });
            });

            await downloadCampaignReportWorkbook(
                `bao-cao-${slugifyFileName(detail.slug || detail.title || 'chien-dich')}.xls`,
                {
                    campaignTitle: toDisplayTitle(detail.title),
                    campaignSlug: detail.slug ?? detail.id,
                    campaignStatus: formatStatusLabel(detail.status),
                    organizationName:
                        reportActor.organizationName ||
                        detail?.organization?.name ||
                        'Đơn vị phụ trách',
                    generatedAt: snapshot.generatedAt,
                    actor: reportActor,
                    summaryMetrics: currentReportSummary?.metrics ?? [],
                    moduleOverviewRows:
                        currentReportSummary?.moduleRows.map((row: any) => ({
                            title: row.title,
                            moduleType: row.moduleType,
                            status: row.status,
                            timeWindow: row.timeWindow,
                            progress: row.progress,
                        })) ?? [],
                    moduleSheets,
                },
            );
        } finally {
            setReportExporting(false);
        }
    }, [detail, loadReportSnapshot, reportActor, reportSnapshot]);

    const tabs = React.useMemo(() => {
        const nextTabs = [{ key: 'overview', label: 'Tổng quan' }];
        if (volunteerModules.length > 0)
            nextTabs.push({
                key: 'volunteer',
                label: 'Tuyển tình nguyện viên',
            });
        if (fundraiserModules.length > 0)
            nextTabs.push({ key: 'fundraising', label: 'Gây quỹ' });
        if (itemModules.length > 0)
            nextTabs.push({ key: 'item', label: 'Quyên góp hiện vật' });
        if ((detail?.documents ?? []).length > 0)
            nextTabs.push({ key: 'documents', label: 'Tài liệu / hồ sơ' });
        if (detail?.status_history?.length)
            nextTabs.push({ key: 'history', label: 'Lịch sử trạng thái' });
        if (detail?.status === 'ENDED' || detail?.ended_at || canMutateCampaign) {
            nextTabs.push({ key: 'report', label: 'Báo cáo / kết thúc' });
        }
        return nextTabs;
    }, [
        canMutateCampaign,
        detail?.documents,
        detail?.ended_at,
        detail?.status,
        detail?.status_history,
        fundraiserModules.length,
        itemModules.length,
        volunteerModules.length,
    ]);

    React.useEffect(() => {
        if (!tabs.some((tab) => tab.key === activeTab)) {
            setActiveTab('overview');
        }
    }, [activeTab, tabs]);

    const openActionDialog = (kind: 'extend' | 'end-early') => {
        setActionDialog({
            kind,
            title:
                kind === 'extend'
                    ? 'Gia hạn chiến dịch'
                    : 'Kết thúc sớm chiến dịch',
            endAt: String(detail?.end_at ?? '').slice(0, 16),
            reason: '',
            note: '',
            notifyParticipants: true,
        });
    };

    const submitActionDialog = async () => {
        if (!actionDialog) return;
        setSubmitting(true);
        try {
            if (actionDialog.kind === 'extend') {
                await onExtendCampaign({
                    end_at: new Date(actionDialog.endAt).toISOString(),
                    reason: actionDialog.reason.trim() || undefined,
                    notify_participants: actionDialog.notifyParticipants,
                });
            } else {
                await onEndCampaignEarly({
                    end_at: actionDialog.endAt
                        ? new Date(actionDialog.endAt).toISOString()
                        : undefined,
                    reason: actionDialog.reason.trim() || undefined,
                    note: actionDialog.note.trim() || undefined,
                    notify_participants: actionDialog.notifyParticipants,
                });
            }
            setActionDialog(null);
        } finally {
            setSubmitting(false);
        }
    };

    const saveEditForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await onUpdateCampaign({
                title: editForm.title,
                summary: editForm.summary,
                slogan: editForm.slogan || null,
                description: editForm.description || null,
                beneficiary: editForm.beneficiary || null,
                start_at: new Date(editForm.start_at).toISOString(),
                end_at: new Date(editForm.end_at).toISOString(),
            });
            setViewMode('overview');
        } finally {
            setSubmitting(false);
        }
    };

    const uploadReportImages = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const nextFiles = Array.from(files).slice(
            0,
            Math.max(0, 20 - reportImages.length),
        );
        if (nextFiles.length === 0) return;
        setUploadingImages(true);
        try {
            const uploaded = await Promise.all(
                nextFiles.map((file) =>
                    uploadStorageFile({
                        file,
                        kind: 'image',
                        folder: `campaigns/${detail.id}/completion-images`,
                    }),
                ),
            );
            setReportImages((current) => [...current, ...uploaded]);
        } finally {
            setUploadingImages(false);
        }
    };

    const saveReport = async (submit: boolean) => {
        setSubmitting(true);
        try {
            await onSaveCompletionReport({
                title: reportForm.title || undefined,
                content: reportForm.content,
                result_summary: reportForm.result_summary || undefined,
                completed_tasks: reportForm.completed_tasks
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
                volunteer_count: reportForm.volunteer_count
                    ? Number(reportForm.volunteer_count)
                    : null,
                verified_money_amount: reportForm.verified_money_amount
                    ? Number(reportForm.verified_money_amount)
                    : null,
                received_item_quantity: reportForm.received_item_quantity
                    ? Number(reportForm.received_item_quantity)
                    : null,
                challenges: reportForm.challenges || null,
                conclusion: reportForm.conclusion || null,
                image_file_ids: reportImages.map(
                    (image) => image.file_id ?? image.id,
                ),
                submit,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const removeReportImage = (fileId?: string | null, fallbackId?: string | null) => {
        const targetId = fileId ?? fallbackId;
        if (!targetId) return;
        setReportImages((current) =>
            current.filter((image) => (image.file_id ?? image.id) !== targetId),
        );
    };

    return (
        <div className="space-y-6">
            <section className="overflow-hidden bg-white border rounded-xl border-slate-200">
                <div className="aspect-[16/7] bg-slate-100">
                    {detail?.cover_image_url ? (
                        <img
                            src={detail.cover_image_url}
                            alt={toDisplayTitle(detail.title)}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="grid h-full text-sm font-semibold place-items-center text-slate-500">
                            Chưa có ảnh bìa
                        </div>
                    )}
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Quản lý chiến dịch /{' '}
                                {viewMode === 'edit'
                                    ? 'Chỉnh sửa'
                                    : 'Chi tiết'}
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#0E4686]">
                                {toDisplayTitle(
                                    detail?.organization?.name ??
                                        'Đơn vị tổ chức',
                                )}
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-[#002A58]">
                                {toDisplayTitle(detail?.title)}
                            </h3>
                            {detail?.slogan ? (
                                <p className="mt-2 text-sm font-medium text-slate-600">
                                    {toDisplayText(detail.slogan)}
                                </p>
                            ) : null}
                        </div>
                        <StatusBadge status={detail?.status} />
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div>
                            <p className="text-sm leading-6 text-slate-600">
                                {toDisplayText(
                                    detail?.description ?? detail?.summary,
                                )}
                            </p>
                            <div className="grid gap-3 mt-4 text-sm text-slate-600 sm:grid-cols-2">
                                <div>
                                    <span className="font-semibold text-slate-800">
                                        Thời gian:
                                    </span>{' '}
                                    {formatDateRange(
                                        detail?.start_at,
                                        detail?.end_at,
                                    )}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-800">
                                        Hồ sơ:
                                    </span>{' '}
                                    {detail?.documents?.length ?? 0} tài liệu
                                </div>
                            </div>
                        </div>
                        <div
                            className={`rounded-lg border px-4 py-3 ${
                                campaignCountdown.isUrgent
                                    ? 'border-amber-300 bg-amber-50'
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                <Clock3 className="size-4" />
                                Countdown chiến dịch
                            </div>
                            <div className="mt-2 text-3xl font-bold text-slate-900">
                                {campaignCountdown.value}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                                {campaignCountdown.label}
                            </div>
                            {campaignCountdown.isUrgent ? (
                                <div className="mt-2 text-sm font-medium text-amber-700">
                                    Sắp hết hạn
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        {viewMode === 'edit' ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setViewMode('overview')}
                            >
                                <ArrowLeft className="size-4" />
                                Quay lại quản lý chiến dịch
                            </Button>
                        ) : null}
                        {canEditCampaignContent ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setViewMode('edit')}
                            >
                                <PencilLine className="size-4" />
                                Chỉnh sửa chiến dịch
                            </Button>
                        ) : null}
                        {canMutateCampaign ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => openActionDialog('extend')}
                            >
                                <SquareChartGantt className="size-4" />
                                Gia hạn chiến dịch
                            </Button>
                        ) : null}
                        {canMutateCampaign && detail?.status !== 'ENDED' ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => openActionDialog('end-early')}
                            >
                                <StopCircle className="size-4" />
                                Kết thúc sớm
                            </Button>
                        ) : null}
                        {['DRAFT', 'REVISION_REQUIRED'].includes(
                            detail?.status,
                        ) ? (
                            <Button type="button" onClick={() => void onSubmitReview()}>
                                <Send className="size-4" />
                                Gửi duyệt
                            </Button>
                        ) : null}
                        {detail?.status === 'APPROVED' ? (
                            <Button type="button" onClick={() => void onPublish()}>
                                <PlayCircle className="size-4" />
                                Công khai chiến dịch
                            </Button>
                        ) : null}
                        {canDeleteDraft ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void onDeleteDraftCampaign()}
                            >
                                Xóa bản nháp
                            </Button>
                        ) : null}
                    </div>
                    {!canEditCampaignContent && canMutateCampaign ? (
                        <div className="px-4 py-3 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                            Chiến dịch này không còn ở trạng thái bản nháp nên không thể chỉnh sửa nội dung. Bạn chỉ có thể gia hạn hoặc kết thúc sớm để phục vụ vận hành.
                        </div>
                    ) : null}
                </div>
            </section>

            {viewMode === 'edit' && canEditCampaignContent ? (
                <form
                    onSubmit={saveEditForm}
                    className="grid gap-4 p-5 bg-white border rounded-xl border-slate-200"
                >
                    <h4 className="text-lg font-semibold text-slate-900">
                        Chỉnh sửa chiến dịch
                    </h4>
                    <Input
                        value={editForm.title}
                        onChange={(event) =>
                            setEditForm((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                        placeholder="Tên chiến dịch"
                    />
                    <Input
                        value={editForm.summary}
                        onChange={(event) =>
                            setEditForm((current) => ({
                                ...current,
                                summary: event.target.value,
                            }))
                        }
                        placeholder="Tóm tắt ngắn"
                    />
                    <Input
                        value={editForm.slogan}
                        onChange={(event) =>
                            setEditForm((current) => ({
                                ...current,
                                slogan: event.target.value,
                            }))
                        }
                        placeholder="Slogan"
                    />
                    <textarea
                        value={editForm.description}
                        onChange={(event) =>
                            setEditForm((current) => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                        placeholder="Mô tả"
                        rows={5}
                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                    />
                    <textarea
                        value={editForm.beneficiary}
                        onChange={(event) =>
                            setEditForm((current) => ({
                                ...current,
                                beneficiary: event.target.value,
                            }))
                        }
                        placeholder="Đối tượng thụ hưởng"
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                        <Input
                            type="datetime-local"
                            value={editForm.start_at}
                            onChange={(event) =>
                                setEditForm((current) => ({
                                    ...current,
                                    start_at: event.target.value,
                                }))
                            }
                        />
                        <Input
                            type="datetime-local"
                            value={editForm.end_at}
                            onChange={(event) =>
                                setEditForm((current) => ({
                                    ...current,
                                    end_at: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                            Lưu thay đổi
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewMode('overview')}
                        >
                            Hủy
                        </Button>
                    </div>
                </form>
            ) : (
                <section className="p-5 bg-white border rounded-xl border-slate-200">
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    activeTab === tab.key
                                        ? 'bg-[#002A58] text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="mt-5 space-y-5">
                            <div className="grid gap-4 lg:grid-cols-2">
                                {timelineGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="p-4 border rounded-lg border-slate-200"
                                    >
                                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-900">
                                            <History className="text-blue-700 size-4" />
                                            {group.title}
                                        </div>
                                        <div className="space-y-3">
                                            {group.modules.map((module: any) => {
                                                const moduleCountdown =
                                                    buildCountdownView({
                                                        now,
                                                        startAt:
                                                            module.registration_start_at ||
                                                            module.start_at,
                                                        endAt:
                                                            module.registration_end_at ||
                                                            module.end_at,
                                                        endedAt:
                                                            module.status ===
                                                            'ENDED'
                                                                ? module.end_at
                                                                : null,
                                                    });

                                                return (
                                                    <div
                                                        key={module.id}
                                                        className="p-3 border rounded-lg border-slate-200 bg-slate-50"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-900">
                                                                    {toDisplayTitle(
                                                                        module.title,
                                                                    )}
                                                                </div>
                                                                <div className="mt-1 text-xs text-slate-600">
                                                                    {formatDateRange(
                                                                        module.start_at,
                                                                        module.end_at,
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <StatusBadge
                                                                status={
                                                                    module.status
                                                                }
                                                            />
                                                        </div>
                                                        <div className="mt-3 text-sm font-bold text-slate-900">
                                                            {moduleCountdown.value}
                                                        </div>
                                                        <div className="text-xs text-slate-600">
                                                            {moduleCountdown.label}
                                                        </div>
                                                        {module.progress ? (
                                                            <div className="mt-3 text-xs text-slate-600">
                                                                Tiến độ:{' '}
                                                                {
                                                                    module.progress
                                                                        .current
                                                                }
                                                                /
                                                                {module.progress
                                                                    .target || 0}{' '}
                                                                (
                                                                {
                                                                    module.progress
                                                                        .percent
                                                                }
                                                                %)
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'fundraising' && currentFundraisingModule ? (
                        <div className="mt-5 space-y-4">
                            <FundraisingPanel
                                fundraisingModuleId={
                                    fundraisingModuleId ||
                                    currentFundraisingModule.id
                                }
                                modules={fundraiserModules.map((module: any) => ({
                                    id: module.id,
                                    title: module.title,
                                }))}
                                config={fundraisingConfig}
                                donations={fundraisingDonations}
                                transactions={fundraisingTransactions}
                                canMutateCampaign={canMutateCampaign}
                                canEditModuleContent={canEditCampaignContent}
                                onModuleChange={setFundraisingModuleId}
                                onConfigChange={(patch) =>
                                    setFundraisingConfig((current: any) => ({
                                        ...current,
                                        ...patch,
                                    }))
                                }
                                onSaveConfig={onSaveFundraisingConfig}
                                onVerifyDonation={onVerifyDonation}
                                onRejectDonation={onRejectDonation}
                                onAttachTransaction={onAttachTransaction}
                                onUnmatchTransaction={onUnmatchTransaction}
                                onExtendDeadline={onExtendFundraisingDeadline}
                                onEndEarly={onEndFundraisingEarly}
                                moduleEndAt={currentFundraisingModule.end_at}
                                moduleStatus={currentFundraisingModule.status}
                                countdown={buildCountdownView({
                                    now,
                                    startAt: currentFundraisingModule.start_at,
                                    endAt: currentFundraisingModule.end_at,
                                    endedAt:
                                        currentFundraisingModule.status ===
                                        'ENDED'
                                            ? currentFundraisingModule.end_at
                                            : null,
                                })}
                            />
                            <ModuleCertificatePanel
                                campaignId={detail.id}
                                module={currentFundraisingModule}
                                canMutateCampaign={canMutateCampaign}
                            />
                        </div>
                    ) : null}

                    {activeTab === 'item' && currentItemModule ? (
                        <div className="mt-5 space-y-4">
                            <ItemDonationPanel
                                itemModuleId={itemModuleId || currentItemModule.id}
                                modules={itemModules.map((module: any) => ({
                                    id: module.id,
                                    title: module.title,
                                }))}
                                config={itemConfig}
                                targetForm={itemTargetForm}
                                targets={itemTargets}
                                pledges={itemPledges}
                                canMutateCampaign={canMutateCampaign}
                                canEditModuleContent={canEditCampaignContent}
                                onModuleChange={setItemModuleId}
                                onConfigChange={(patch) =>
                                    setItemConfig((current: any) => ({
                                        ...current,
                                        ...patch,
                                    }))
                                }
                                onSaveConfig={onSaveItemConfig}
                                onTargetFormChange={(patch) =>
                                    setItemTargetForm((current: any) => ({
                                        ...current,
                                        ...patch,
                                    }))
                                }
                                onCreateTarget={onCreateItemTarget}
                                onUpdateTarget={onUpdateItemTarget}
                                onDeleteTarget={onDeleteItemTarget}
                                onConfirmPledge={onConfirmItemPledge}
                                onRejectPledge={onRejectItemPledge}
                                onHandoverPledge={onHandoverItemPledge}
                                onExtendDeadline={onExtendItemDeadline}
                                onEndEarly={onEndItemEarly}
                                moduleEndAt={currentItemModule.end_at}
                                moduleStatus={currentItemModule.status}
                                countdown={buildCountdownView({
                                    now,
                                    startAt: currentItemModule.start_at,
                                    endAt: currentItemModule.end_at,
                                    endedAt:
                                        currentItemModule.status === 'ENDED'
                                            ? currentItemModule.end_at
                                            : null,
                                })}
                            />
                            <ModuleCertificatePanel
                                campaignId={detail.id}
                                module={currentItemModule}
                                canMutateCampaign={canMutateCampaign}
                            />
                        </div>
                    ) : null}

                    {activeTab === 'volunteer' && currentVolunteerModule ? (
                        <div className="mt-5 space-y-4">
                            <EventPanel
                                eventModuleId={eventModuleId || currentVolunteerModule.id}
                                modules={volunteerModules.map((module: any) => ({
                                    id: module.id,
                                    title: module.title,
                                }))}
                                config={eventConfig}
                                registrations={eventRegistrations}
                                canMutateCampaign={canMutateCampaign}
                                canEditModuleContent={canEditCampaignContent}
                                onModuleChange={setEventModuleId}
                                onConfigChange={(patch) =>
                                    setEventConfig((current: any) => ({
                                        ...current,
                                        ...patch,
                                    }))
                                }
                                onSaveConfig={onSaveEventConfig}
                                onApproveRegistration={onApproveRegistration}
                                onRejectRegistration={onRejectRegistration}
                                onCheckInRegistration={onCheckInRegistration}
                                onCompleteRegistration={onCompleteRegistration}
                                onBulkApproveRegistrations={onBulkApproveRegistrations}
                                onExtendRegistrationDeadline={onExtendVolunteerDeadline}
                                onEndEarly={onEndVolunteerEarly}
                                registrationDeadline={
                                    currentVolunteerModule.registration_end_at
                                }
                                moduleStatus={currentVolunteerModule.status}
                                approvedCount={eventRegistrations.filter((registration: any) =>
                                    ['APPROVED', 'COMPLETED'].includes(
                                        registration.status,
                                    ),
                                ).length}
                                countdown={buildCountdownView({
                                    now,
                                    startAt:
                                        currentVolunteerModule.registration_start_at ||
                                        currentVolunteerModule.start_at,
                                    endAt:
                                        currentVolunteerModule.registration_end_at ||
                                        currentVolunteerModule.end_at,
                                    endedAt:
                                        currentVolunteerModule.status ===
                                        'ENDED'
                                            ? currentVolunteerModule.end_at
                                            : null,
                                })}
                            />
                            <ModuleCertificatePanel
                                campaignId={detail.id}
                                module={currentVolunteerModule}
                                canMutateCampaign={canMutateCampaign}
                            />
                        </div>
                    ) : null}

                    {activeTab === 'documents' ? (
                        <div className="mt-5 space-y-3">
                            {(detail?.documents ?? []).map((document: any) => (
                                <div
                                    key={document.id}
                                    className="p-4 border rounded-lg border-slate-200"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {document.file_name}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-600">
                                                {document.type} ·{' '}
                                                {document.mime_type ??
                                                    'Không rõ loại file'}
                                            </div>
                                        </div>
                                        {document.file_url ? (
                                            <a
                                                href={document.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-semibold text-blue-700 hover:underline"
                                            >
                                                Xem file
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                            {(detail?.documents ?? []).length === 0 ? (
                                <div className="p-4 text-sm border border-dashed rounded-lg border-slate-300 text-slate-500">
                                    Chưa có tài liệu đính kèm.
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {activeTab === 'history' ? (
                        <div className="mt-5 space-y-3">
                            {(detail?.status_history ?? []).map((entry: any) => (
                                <div
                                    key={entry.id}
                                    className="p-4 border rounded-lg border-slate-200"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {entry.from_status
                                                    ? `${entry.from_status} sang ${entry.to_status}`
                                                    : entry.to_status}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-600">
                                                {entry.changed_by?.full_name ??
                                                    'Hệ thống'}{' '}
                                                ·{' '}
                                                {new Date(
                                                    entry.created_at,
                                                ).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                        <StatusBadge status={entry.to_status} />
                                    </div>
                                    {entry.note ? (
                                        <div className="mt-3 text-sm text-slate-700">
                                            {entry.note}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {activeTab === 'report' ? (
                        <div className="grid gap-4 mt-5">
                            <div className="p-4 border rounded-xl border-slate-200 bg-slate-50">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                            <FileText className="text-blue-700 size-5" />
                                            Báo cáo chiến dịch theo thời gian thực
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600">
                                            Dành riêng cho {reportActor.roleLabel.toLowerCase()} quản lý chiến dịch này. Dữ liệu được lấy từ từng module đang vận hành và tự làm mới mỗi 30 giây.
                                        </div>
                                        <div className="mt-2 text-xs text-slate-500">
                                            Lần làm mới gần nhất:{' '}
                                            {reportSummary?.generatedAtLabel ??
                                                'Chưa có dữ liệu'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                void loadReportSnapshot({
                                                    silent: false,
                                                    trigger: 'manual',
                                                })
                                            }
                                        >
                                            {reportRefreshing
                                                ? 'Đang làm mới...'
                                                : 'Làm mới số liệu'}
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={reportExporting}
                                            onClick={() =>
                                                void exportCampaignReport()
                                            }
                                        >
                                            {reportExporting
                                                ? 'Đang xuất Excel...'
                                                : 'Xuất Excel theo chiến dịch'}
                                        </Button>
                                        
                                    </div>
                                </div>

                                {reportSnapshotError ? (
                                    <div className="px-3 py-2 mt-3 text-sm border rounded-lg border-rose-200 bg-rose-50 text-rose-700">
                                        {reportSnapshotError}
                                    </div>
                                ) : null}

                                {reportSnapshotLoading && !reportSummary ? (
                                    <div className="px-3 py-2 mt-3 text-sm bg-white border rounded-lg border-slate-200 text-slate-600">
                                        Đang tổng hợp số liệu chiến dịch từ các module...
                                    </div>
                                ) : null}

                                <div className="grid gap-3 mt-4 md:grid-cols-2 xl:grid-cols-4">
                                    {(reportSummary?.metrics ?? []).map((metric) => (
                                        <div
                                            key={metric.label}
                                            className="p-4 bg-white border rounded-lg border-slate-200"
                                        >
                                            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                {metric.label}
                                            </div>
                                            <div className="mt-2 text-lg font-semibold text-slate-900">
                                                {metric.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 mt-4 bg-white border rounded-lg border-slate-200">
                                    <div className="text-sm font-semibold text-slate-900">
                                        Các sheet sẽ được xuất ra file Excel
                                    </div>
                                    <div className="grid gap-3 mt-2 md:grid-cols-2">
                                        {(reportSummary?.moduleRows ?? []).map((row: any) => (
                                            <div
                                                key={row.id}
                                                className="px-3 py-3 border rounded-lg border-slate-200"
                                            >
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {row.title}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600">
                                                    {row.moduleType} · {row.status}
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    {row.timeWindow}
                                                </div>
                                                <div className="mt-2 text-sm text-slate-700">
                                                    {row.progress}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-xs text-slate-500">
                                        File xuất dùng font Times New Roman, có tiêu đề, biểu ngữ và khối chữ ký số nội bộ kèm mã xác thực điện tử.
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white border rounded-xl border-slate-200">
                                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                    <FileText className="text-blue-700 size-5" />
                                    Báo cáo hoàn thành của đơn vị
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    Phần này tách riêng khỏi mẫu tổng hợp của Đoàn trường và được lưu theo từng chiến dịch.
                                </div>
                                <div className="grid gap-4 mt-4">
                                    <Input
                                        value={reportForm.title}
                                        onChange={(event) =>
                                            setReportForm((current) => ({
                                                ...current,
                                                title: event.target.value,
                                            }))
                                        }
                                        placeholder="Tiêu đề báo cáo"
                                    />
                                    <textarea
                                        value={reportForm.content}
                                        onChange={(event) =>
                                            setReportForm((current) => ({
                                                ...current,
                                                content: event.target.value,
                                            }))
                                        }
                                        rows={5}
                                        placeholder="Nội dung đã triển khai trong chiến dịch"
                                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                                    />
                                    <textarea
                                        value={reportForm.result_summary}
                                        onChange={(event) =>
                                            setReportForm((current) => ({
                                                ...current,
                                                result_summary:
                                                    event.target.value,
                                            }))
                                        }
                                        rows={3}
                                        placeholder="Mô tả kết quả thực hiện"
                                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                                    />
                                    <textarea
                                        value={reportForm.completed_tasks}
                                        onChange={(event) =>
                                            setReportForm((current) => ({
                                                ...current,
                                                completed_tasks:
                                                    event.target.value,
                                            }))
                                        }
                                        rows={4}
                                        placeholder="Các công việc đã hoàn thành, mỗi dòng một mục"
                                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                                    />
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <Input
                                            value={reportForm.volunteer_count}
                                            onChange={(event) =>
                                                setReportForm((current) => ({
                                                    ...current,
                                                    volunteer_count:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="Số tình nguyện viên thực tế"
                                        />
                                        <Input
                                            value={
                                                reportForm.verified_money_amount
                                            }
                                            onChange={(event) =>
                                                setReportForm((current) => ({
                                                    ...current,
                                                    verified_money_amount:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="Tổng tiền đã xác nhận"
                                        />
                                        <Input
                                            value={
                                                reportForm.received_item_quantity
                                            }
                                            onChange={(event) =>
                                                setReportForm((current) => ({
                                                    ...current,
                                                    received_item_quantity:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="Tổng hiện vật đã nhận"
                                        />
                                    </div>
                                    <textarea
                                        value={reportForm.challenges}
                                        onChange={(event) =>
                                            setReportForm((current) => ({
                                                ...current,
                                                challenges:
                                                    event.target.value,
                                            }))
                                        }
                                        rows={3}
                                        placeholder="Khó khăn / ghi chú"
                                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                                    />
                                    <textarea
                                        value={reportForm.conclusion}
                                        onChange={(event) =>
                                            setReportForm((current) => ({
                                                ...current,
                                                conclusion:
                                                    event.target.value,
                                            }))
                                        }
                                        rows={3}
                                        placeholder="Kết luận / đề xuất"
                                        className="w-full px-3 py-2 text-sm bg-white border rounded-md border-slate-300 text-slate-900"
                                    />
                                    <div className="p-4 border rounded-lg border-slate-200">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Ảnh sự kiện
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600">
                                                    Tối đa 20 hình, lưu thật qua Supabase Storage.
                                                </div>
                                            </div>
                                            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border rounded-md cursor-pointer border-slate-300 text-slate-700">
                                                <ImagePlus className="size-4" />
                                                Tải ảnh lên
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(event) =>
                                                        void uploadReportImages(
                                                            event.target.files,
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>
                                        {uploadingImages ? (
                                            <div className="mt-3 text-sm text-slate-500">
                                                Đang tải ảnh...
                                            </div>
                                        ) : null}
                                        <div className="grid gap-3 mt-4 md:grid-cols-2 xl:grid-cols-3">
                                            {reportImages.map((image: any) => (
                                                <div
                                                    key={image.file_id ?? image.id}
                                                    className="overflow-hidden border rounded-lg border-slate-200"
                                                >
                                                    {image.file_url ? (
                                                        <img
                                                            src={image.file_url}
                                                            alt={
                                                                image.file_name ??
                                                                'Ảnh báo cáo'
                                                            }
                                                            className="aspect-[4/3] w-full object-cover"
                                                        />
                                                    ) : null}
                                                    <div className="p-3 text-xs text-slate-600">
                                                        <div className="font-medium text-slate-700">
                                                            {image.file_name ??
                                                                'Ảnh minh chứng'}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                                                            onClick={() =>
                                                                removeReportImage(
                                                                    image.file_id,
                                                                    image.id,
                                                                )
                                                            }
                                                        >
                                                            Xóa ảnh khỏi báo cáo
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={submitting}
                                            onClick={() =>
                                                void saveReport(false)
                                            }
                                        >
                                            Lưu nháp báo cáo
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() =>
                                                void saveReport(true)
                                            }
                                        >
                                            Gửi báo cáo hoàn thành
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </section>
            )}

            <Dialog
                open={Boolean(actionDialog)}
                onOpenChange={(open) => !open && setActionDialog(null)}
            >
                <DialogContent className="max-w-2xl p-0">
                    <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] px-6 py-5">
                        <DialogTitle>{actionDialog?.title}</DialogTitle>
                        <DialogDescription className="max-w-2xl">
                        {actionDialog?.kind === 'extend'
                            ? 'Cập nhật hạn mới và lý do thay đổi để lưu vào lịch sử chiến dịch.'
                            : 'Dùng khi chiến dịch đã hoàn thành KPI trước hạn hoặc cần đóng sớm.'}
                        </DialogDescription>
                    </div>
                    {actionDialog ? (
                        <div className="grid gap-5 p-6">
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Mốc thời gian mới
                                    </div>
                                    <div className="mt-3">
                                        <Input
                                            type="datetime-local"
                                            value={actionDialog.endAt}
                                            onChange={(event) =>
                                                setActionDialog((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              endAt: event.target.value,
                                                          }
                                                        : current,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="mt-2 text-xs leading-5 text-slate-500">
                                        Thời gian này sẽ được dùng lại cho countdown và lịch sử chiến dịch sau khi lưu.
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Ghi nhận thay đổi
                                    </div>
                                    <textarea
                                        value={actionDialog.reason}
                                        onChange={(event) =>
                                            setActionDialog((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          reason: event.target.value,
                                                      }
                                                    : current,
                                            )
                                        }
                                        rows={4}
                                        placeholder={
                                            actionDialog.kind === 'extend'
                                                ? 'Nêu rõ lý do gia hạn theo từng module hoặc chiến dịch.'
                                                : 'Nêu rõ lý do kết thúc sớm để lưu vào lịch sử quản trị.'
                                        }
                                        className="w-full px-4 py-3 mt-3 text-sm bg-white border rounded-2xl border-slate-300 text-slate-900"
                                    />
                                </div>
                            </div>

                            {actionDialog.kind === 'end-early' ? (
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Ghi chú bổ sung
                                    </div>
                                    <textarea
                                        value={actionDialog.note}
                                        onChange={(event) =>
                                            setActionDialog((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          note: event.target.value,
                                                      }
                                                    : current,
                                            )
                                        }
                                        rows={4}
                                        placeholder="Thông tin bổ sung về tình trạng KPI, kết quả thực tế hoặc phạm vi ảnh hưởng."
                                        className="w-full px-4 py-3 mt-3 text-sm bg-white border rounded-2xl border-slate-300 text-slate-900"
                                    />
                                </div>
                            ) : null}

                            <label className="inline-flex items-center gap-3 px-4 py-3 text-sm border rounded-2xl border-slate-200 bg-slate-50 text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={actionDialog.notifyParticipants}
                                    onChange={(event) =>
                                        setActionDialog((current) =>
                                            current
                                                ? {
                                                      ...current,
                                                      notifyParticipants:
                                                          event.target.checked,
                                                  }
                                                : current,
                                        )
                                    }
                                />
                                Gửi thông báo liên quan cho người tham gia và các bên phụ trách
                            </label>

                            <div className="flex flex-wrap justify-end gap-3 pt-1 border-t border-slate-200">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActionDialog(null)}
                                >
                                    Hủy thay đổi
                                </Button>
                                <Button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => void submitActionDialog()}
                                >
                                    Xác nhận
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};
