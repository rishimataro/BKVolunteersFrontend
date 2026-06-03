import * as React from 'react';
import { useNavigate } from 'react-router';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    ClipboardList,
    Eye,
    FolderKanban,
    HandCoins,
    ImageUp,
    Layers3,
    Megaphone,
    PencilLine,
    RefreshCw,
    Save,
    Search,
    Send,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { ActionDrawer } from '@/components/ui/action-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import {
    getPublicCampaigns,
    type PublicCampaignFilters,
} from '@/features/campaign/api/public';
import {
    createCampaignModule,
    createManagedCampaign,
    deleteManagedCampaign,
    getManagedCampaignDetail,
    getManagedCampaigns,
    publishCampaign,
    submitCampaignReview,
    type ManagedCampaignDetail,
    type ManagedCampaignItem,
} from '@/features/campaign/api/campaign';
import {
    approvalTransition,
    getApprovalQueue,
    type ApprovalQueueItem,
} from '@/features/campaign/api/approval';
import {
    attachFundraisingTransaction,
    getFundraisingDonations,
    getFundraisingModule,
    getFundraisingTransactions,
    rejectFundraisingDonation,
    unmatchFundraisingTransaction,
    updateFundraisingConfig,
    verifyFundraisingDonation,
    type FundraisingDonationItem,
    type FundraisingTransactionItem,
} from '@/features/campaign/api/fundraising';
import {
    approveEventRegistration,
    checkInEventRegistration,
    completeEventRegistration,
    getEventModule,
    getEventRegistrations,
    rejectEventRegistration,
    updateEventConfig,
    type EventRegistrationItem,
} from '@/features/campaign/api/events';
import {
    confirmItemPledge,
    createItemTarget,
    deleteItemTarget,
    getItemPledges,
    getItemTargets,
    handoverItemPledge,
    rejectItemPledge,
    updateItemTarget,
    updateItemDonationConfig,
    type ItemPledgeItem,
    type ItemTargetItem,
} from '@/features/campaign/api/item-donations';
import { FundraisingPanel } from '@/features/campaign/components/fundraising-panel';
import { ItemDonationPanel } from '@/features/campaign/components/item-donation-panel';
import { EventPanel } from '@/features/campaign/components/event-panel';
import { CampaignCard } from '@/features/campaign/components/campaign-card';
import {
    SchoolApprovalQueue,
    type ApprovalQueueAction,
    type ApprovalQueueFilterState,
    type ApprovalReviewDialogState,
} from '@/features/campaign/components/school-approval-queue';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import type { Meta, ModuleType, PublicCampaignCard } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const moduleTypeLabel: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ hiện kim',
    item_donation: 'Quyên góp hiện vật',
    event: 'Tuyển tình nguyện viên',
};

export const CampaignsRoute = () => <CampaignsScreen mode="manage" />;

export const CampaignCreateRoute = () => <CampaignsScreen mode="create" />;

const publicModuleOptions: Array<{ value: ModuleType | ''; label: string }> = [
    { value: '', label: 'Tất cả hạng mục' },
    { value: 'fundraising', label: 'Gây quỹ' },
    { value: 'item_donation', label: 'Hiện vật' },
    { value: 'event', label: 'Tình nguyện' },
];

const publicStatusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ONGOING', label: 'Đang diễn ra' },
    { value: 'PUBLISHED', label: 'Đã công khai' },
] as const;

const organizerStatusOptions = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'ONGOING', label: 'Đang diễn ra' },
    { value: 'PUBLISHED', label: 'Đã công khai' },
    { value: 'SUBMITTED', label: 'Chờ duyệt' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'REVISION_REQUIRED', label: 'Cần chỉnh sửa' },
] as const;

const organizerSortOptions = [
    { value: 'newest', label: 'Thời gian: Gần nhất' },
    { value: 'oldest', label: 'Thời gian: Cũ nhất' },
    { value: 'title', label: 'Theo tên A-Z' },
] as const;

const campaignCategoryOptions = [
    { value: '', label: 'Chọn loại hình' },
    { value: 'education', label: 'Giáo dục và trẻ em' },
    { value: 'environment', label: 'Môi trường và xanh hóa' },
    { value: 'health', label: 'Y tế và sức khỏe' },
    { value: 'social', label: 'An sinh xã hội' },
] as const;

const createWizardLabels = [
    'Thông tin chung',
    'Nội dung chi tiết',
    'Tuyển tình nguyện viên',
    'Tài liệu & Hoàn tất',
] as const;

const volunteerSkillSuggestions = [
    'Gia sư',
    'Biên dịch',
    'Thiết kế',
    'Truyền thông',
    'Hậu cần',
] as const;

const volunteerBenefitOptions = [
    {
        key: 'certificate',
        label: 'Giấy chứng nhận',
        description: 'Cấp bởi Đoàn trường/Tổ chức sau khi hoàn thành.',
    },
    {
        key: 'training',
        label: 'Đào tạo đầu vào',
        description: 'Tập huấn kỹ năng trước khi bắt đầu nhiệm vụ.',
    },
    {
        key: 'uniform',
        label: 'Đồng phục & thẻ tên',
        description: 'Cấp phát áo đồng phục và thẻ ban tổ chức.',
    },
    {
        key: 'allowance',
        label: 'Phụ cấp hỗ trợ',
        description: 'Hỗ trợ ăn uống hoặc di chuyển trong sự kiện.',
    },
] as const;

type VolunteerBenefitKey = (typeof volunteerBenefitOptions)[number]['key'];

const campusLocationOptions = [
    'Cơ sở chính - Quận 1',
    'Cơ sở 2 - Thủ Đức',
    'Cơ sở đào tạo quốc tế',
] as const;

const academicPanelClassName =
    'rounded-xl border border-[#C3C6D2] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]';

const academicInputClassName =
    'h-12 w-full rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const formatCampaignDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

const formatCampaignDateRange = (startAt: string, endAt: string) =>
    `${formatCampaignDate(startAt)} - ${formatCampaignDate(endAt)}`;

const readStringListSetting = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
};

const readTimelineSetting = (
    value: unknown,
): Array<{
    id: string;
    title: string;
    date: string;
    description: string;
}> => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item, index) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const candidate = item as Record<string, unknown>;
            const title = String(candidate.title ?? '').trim();
            const date = String(candidate.date ?? '').trim();
            const description = String(candidate.description ?? '').trim();

            if (!title || !date) {
                return null;
            }

            return {
                id: String(candidate.id ?? `${index}`),
                title,
                date,
                description,
            };
        })
        .filter(
            (
                item,
            ): item is {
                id: string;
                title: string;
                date: string;
                description: string;
            } => item !== null,
        );
};

type CampaignActionDialogState =
    | {
          kind: 'reject-donation';
          targetId: string;
          value: string;
      }
    | {
          kind: 'reject-item-pledge';
          targetId: string;
          value: string;
      }
    | {
          kind: 'handover-item-pledge';
          targetId: string;
          value: string;
      }
    | {
          kind: 'reject-registration';
          targetId: string;
          value: string;
      }
    | {
          kind: 'complete-registration';
          targetId: string;
          value: string;
      };

const defaultApprovalFilters: ApprovalQueueFilterState = {
    q: '',
    status: '',
    module_type: '',
    urgency: '',
    sort: 'newest',
    page: 1,
    pageSize: 8,
};

const StudentCampaignDiscovery = () => {
    const [filters, setFilters] = React.useState<PublicCampaignFilters>({
        page: 1,
        limit: 9,
    });
    const [campaignItems, setCampaignItems] = React.useState<
        PublicCampaignCard[]
    >([]);
    const [meta, setMeta] = React.useState<Meta | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setError(null);

        getPublicCampaigns(filters)
            .then((result) => {
                if (!mounted) return;
                setCampaignItems(result.items);
                setMeta(result.meta);
            })
            .catch(() => {
                if (!mounted) return;
                setError('Không thể tải danh sách chiến dịch.');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [filters]);

    const totalPages = meta?.total_pages ?? meta?.totalPages ?? 1;

    return (
        <ContentLayout title="Chiến Dịch Công Khai">
            <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
                        <Input
                            value={filters.q ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    q: event.target.value,
                                    page: 1,
                                }))
                            }
                            placeholder="Tìm theo tên chiến dịch hoặc đơn vị"
                        />
                        <select
                            value={filters.module_type ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    module_type: event.target.value as
                                        | ModuleType
                                        | '',
                                    page: 1,
                                }))
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                            {publicModuleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.status ?? ''}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: event.target.value as
                                        | 'PUBLISHED'
                                        | 'ONGOING'
                                        | '',
                                    page: 1,
                                }))
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                            {publicStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}
                {!isLoading && !error && campaignItems.length === 0 ? (
                    <EmptyState
                        title="Chưa có chiến dịch phù hợp"
                        description="Thử thay đổi bộ lọc hoặc quay lại sau."
                    />
                ) : null}

                {!isLoading && !error && campaignItems.length > 0 ? (
                    <>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {campaignItems.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    detailHref={paths.app.campaigns.detail.getHref(
                                        campaign.slug,
                                    )}
                                />
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                Trang {meta?.page ?? 1}/{totalPages || 1} - tổng{' '}
                                {meta?.total ?? campaignItems.length} chiến dịch
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={(filters.page ?? 1) <= 1}
                                    onClick={() =>
                                        setFilters((current) => ({
                                            ...current,
                                            page: Math.max(
                                                1,
                                                (current.page ?? 1) - 1,
                                            ),
                                        }))
                                    }
                                >
                                    Trước
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={(filters.page ?? 1) >= totalPages}
                                    onClick={() =>
                                        setFilters((current) => ({
                                            ...current,
                                            page: (current.page ?? 1) + 1,
                                        }))
                                    }
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </ContentLayout>
    );
};

const CampaignsScreen = ({ mode }: { mode: 'manage' | 'create' }) => {
    const isCreatePage = mode === 'create';
    const navigate = useNavigate();
    const user = useUser();
    const { addNotification } = useNotifications();

    const [campaigns, setCampaigns] = React.useState<ManagedCampaignItem[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = React.useState<
        string | null
    >(null);
    const [detail, setDetail] = React.useState<ManagedCampaignDetail | null>(
        null,
    );
    const [loadingList, setLoadingList] = React.useState(false);

    const [fundraisingModuleId, setFundraisingModuleId] = React.useState('');
    const [fundraisingDonations, setFundraisingDonations] = React.useState<
        FundraisingDonationItem[]
    >([]);
    const [fundraisingTransactions, setFundraisingTransactions] =
        React.useState<FundraisingTransactionItem[]>([]);
    const [fundraisingConfig, setFundraisingConfig] = React.useState({
        target_amount: 0,
        receiver_name: '',
        bank_name: '',
        bank_account_no: '',
        currency: 'VND',
        sepay_enabled: false,
        sepay_account_id: '',
    });

    const [itemModuleId, setItemModuleId] = React.useState('');
    const [itemConfig, setItemConfig] = React.useState({
        receiver_address: '',
        receiver_contact: '',
        allow_over_target: false,
        handover_note: '',
    });
    const [itemTargets, setItemTargets] = React.useState<ItemTargetItem[]>([]);
    const [itemTargetForm, setItemTargetForm] = React.useState({
        name: '',
        unit: '',
        target_quantity: 0,
        description: '',
    });
    const [itemPledges, setItemPledges] = React.useState<ItemPledgeItem[]>([]);

    const [eventModuleId, setEventModuleId] = React.useState('');
    const [eventConfig, setEventConfig] = React.useState({
        location: '',
        quota: 0,
        registration_required: true,
        checkin_required: true,
        benefits_text: '',
    });
    const [eventRegistrations, setEventRegistrations] = React.useState<
        EventRegistrationItem[]
    >([]);
    const [actionDialog, setActionDialog] =
        React.useState<CampaignActionDialogState | null>(null);
    const [submittingActionDialog, setSubmittingActionDialog] =
        React.useState(false);
    const [approvalQueue, setApprovalQueue] = React.useState<
        ApprovalQueueItem[]
    >([]);
    const [approvalLoading, setApprovalLoading] = React.useState(false);
    const [approvalError, setApprovalError] = React.useState<string | null>(
        null,
    );
    const [approvalFilters, setApprovalFilters] =
        React.useState<ApprovalQueueFilterState>(defaultApprovalFilters);
    const [approvalSubmitting, setApprovalSubmitting] = React.useState<{
        campaignId: string;
        action: ApprovalQueueAction;
    } | null>(null);
    const [approvalReviewDialog, setApprovalReviewDialog] =
        React.useState<ApprovalReviewDialogState | null>(null);

    const [createForm, setCreateForm] = React.useState({
        title: '',
        summary: '',
        description: '',
        scope_type: 'PUBLIC' as 'FACULTY' | 'SCHOOL' | 'PUBLIC',
        start_at: '',
        end_at: '',
    });

    const [moduleForm, setModuleForm] = React.useState({
        type: 'fundraising' as ModuleType,
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        target_amount: 0,
        receiver_name: '',
        bank_name: '',
        bank_account_no: '',
        receiver_address: '',
        receiver_contact: '',
        quota: 0,
        location: '',
    });
    const [campaignSearch, setCampaignSearch] = React.useState('');
    const [campaignStatusFilter, setCampaignStatusFilter] =
        React.useState<(typeof organizerStatusOptions)[number]['value']>('ALL');
    const [campaignSort, setCampaignSort] =
        React.useState<(typeof organizerSortOptions)[number]['value']>(
            'newest',
        );
    const [showCreateComposer, setShowCreateComposer] = React.useState(
        mode === 'create',
    );
    const [campaignCategory, setCampaignCategory] = React.useState('');
    const [coverImagePreview, setCoverImagePreview] = React.useState<
        string | null
    >(null);
    const [createWizardStep, setCreateWizardStep] = React.useState<
        1 | 2 | 3 | 4
    >(1);
    const [createSubmitIntent, setCreateSubmitIntent] = React.useState<
        'draft' | 'next'
    >('next');
    const coverImageInputRef = React.useRef<HTMLInputElement | null>(null);
    const [campaignPlan, setCampaignPlan] = React.useState('');
    const [timelineItems, setTimelineItems] = React.useState<
        Array<{
            id: string;
            title: string;
            date: string;
            description: string;
        }>
    >([]);
    const [timelineDraft, setTimelineDraft] = React.useState({
        title: '',
        date: '',
        description: '',
    });
    const [volunteerTarget, setVolunteerTarget] = React.useState('');
    const [volunteerDeadline, setVolunteerDeadline] = React.useState('');
    const [volunteerSkills, setVolunteerSkills] = React.useState<string[]>([]);
    const [volunteerSkillDraft, setVolunteerSkillDraft] = React.useState('');
    const [volunteerBenefits, setVolunteerBenefits] = React.useState<
        Record<VolunteerBenefitKey, boolean>
    >({
        certificate: true,
        training: false,
        uniform: true,
        allowance: false,
    });
    const [volunteerNotes, setVolunteerNotes] = React.useState('');
    const [campaignVenueArea, setCampaignVenueArea] = React.useState('');
    const [campaignVenueCampus, setCampaignVenueCampus] =
        React.useState<string>(campusLocationOptions[0]);
    const [campaignVenueAddress, setCampaignVenueAddress] = React.useState('');
    const [planDocumentName, setPlanDocumentName] = React.useState('');
    const [approvalDocumentName, setApprovalDocumentName] = React.useState('');
    const [finalCommitmentChecked, setFinalCommitmentChecked] =
        React.useState(false);
    const planDocumentInputRef = React.useRef<HTMLInputElement | null>(null);
    const approvalDocumentInputRef = React.useRef<HTMLInputElement | null>(
        null,
    );

    const role = user.data?.role;
    const isStudent = role === ROLES.SINHVIEN;
    const canManageCampaign = role === ROLES.CLB || role === ROLES.LCD;
    const canReviewCampaign = role === ROLES.DOANTRUONG;
    const canMutateCampaign = role === ROLES.CLB || role === ROLES.LCD;
    const organizerName =
        user.data?.organization?.name ?? 'CLB Tình nguyện Unity Academic';
    const canDeleteDraft =
        canMutateCampaign &&
        !!detail &&
        ['DRAFT', 'REVISION_REQUIRED'].includes(detail.status);
    const createWizardHeading =
        createWizardStep === 1
            ? 'Bước 1: Thông tin cơ bản'
            : createWizardStep === 2
              ? 'Bước 2: Hoạt động & Lịch trình'
              : createWizardStep === 3
                ? 'Bước 3: Tuyển tình nguyện viên'
                : 'Bước 4: Tài liệu & Hoàn tất';
    const createWizardDescription =
        createWizardStep === 1
            ? 'Cung cấp các thông tin nền tảng để tình nguyện viên và nhà tài trợ dễ dàng nhận diện chiến dịch của bạn.'
            : createWizardStep === 2
              ? 'Xác định các mốc thời gian quan trọng và kế hoạch triển khai chi tiết cho chiến dịch của bạn.'
              : createWizardStep === 3
                ? 'Thiết lập chỉ tiêu tuyển dụng, kỹ năng cần có, quyền lợi và lưu ý quan trọng cho tình nguyện viên.'
                : 'Hoàn thiện địa điểm tổ chức, tài liệu đính kèm và xác nhận thông tin trước khi tạo chiến dịch.';
    const eventSummaryModule = React.useMemo(
        () =>
            detail?.modules.find((module) =>
                eventModuleId
                    ? module.type === 'event' && module.id === eventModuleId
                    : module.type === 'event',
            ) ?? null,
        [detail, eventModuleId],
    );
    const eventSummary = React.useMemo(() => {
        if (!eventSummaryModule) return null;

        const settings = (eventSummaryModule.settings ?? {}) as Record<
            string,
            unknown
        >;
        const benefitsFromConfig = eventConfig.benefits_text
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);
        const benefits =
            benefitsFromConfig.length > 0
                ? benefitsFromConfig
                : readStringListSetting(settings.benefits);

        return {
            title: eventSummaryModule.title,
            location:
                eventModuleId === eventSummaryModule.id
                    ? eventConfig.location || String(settings.location ?? '')
                    : String(settings.location ?? ''),
            quota:
                eventModuleId === eventSummaryModule.id
                    ? eventConfig.quota || Number(settings.quota ?? 0)
                    : Number(settings.quota ?? 0),
            registrationDeadline: String(
                settings.registration_deadline ?? '',
            ).trim(),
            requiredSkills: readStringListSetting(settings.required_skills),
            benefits,
            timelineItems: readTimelineSetting(settings.timeline_items),
            planDocumentName: String(settings.plan_document_name ?? '').trim(),
            approvalDocumentName: String(
                settings.approval_document_name ?? '',
            ).trim(),
            venueArea: String(settings.venue_area ?? '').trim(),
            venueCampus: String(settings.venue_campus ?? '').trim(),
            venueAddress: String(settings.venue_address ?? '').trim(),
        };
    }, [
        eventConfig.benefits_text,
        eventConfig.location,
        eventConfig.quota,
        eventModuleId,
        eventSummaryModule,
    ]);

    const closeActionDialog = React.useCallback(() => {
        setActionDialog(null);
        setSubmittingActionDialog(false);
    }, []);

    const closeApprovalReviewDialog = React.useCallback(() => {
        setApprovalReviewDialog(null);
    }, []);

    const resetCreateWizard = React.useCallback(() => {
        setCreateWizardStep(1);
        setCampaignCategory('');
        setCoverImagePreview(null);
        setCampaignPlan('');
        setTimelineItems([]);
        setTimelineDraft({
            title: '',
            date: '',
            description: '',
        });
        setVolunteerTarget('');
        setVolunteerDeadline('');
        setVolunteerSkills([]);
        setVolunteerSkillDraft('');
        setVolunteerBenefits({
            certificate: true,
            training: false,
            uniform: true,
            allowance: false,
        });
        setVolunteerNotes('');
        setCampaignVenueArea('');
        setCampaignVenueCampus(campusLocationOptions[0]);
        setCampaignVenueAddress('');
        setPlanDocumentName('');
        setApprovalDocumentName('');
        setFinalCommitmentChecked(false);
        if (coverImageInputRef.current) {
            coverImageInputRef.current.value = '';
        }
        if (planDocumentInputRef.current) {
            planDocumentInputRef.current.value = '';
        }
        if (approvalDocumentInputRef.current) {
            approvalDocumentInputRef.current.value = '';
        }
    }, []);

    const onCoverImageChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) {
                setCoverImagePreview(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                setCoverImagePreview(
                    typeof reader.result === 'string' ? reader.result : null,
                );
            };
            reader.readAsDataURL(file);
        },
        [],
    );

    const goToScheduleStep = React.useCallback(() => {
        if (
            !createForm.title.trim() ||
            !createForm.summary.trim() ||
            !createForm.description.trim() ||
            !createForm.start_at ||
            !createForm.end_at
        ) {
            addNotification({
                type: 'error',
                title: 'Thiếu thông tin cơ bản',
                message:
                    'Vui lòng nhập đầy đủ tên chiến dịch, mô tả, thời gian bắt đầu và kết thúc trước khi sang bước tiếp theo.',
            });
            return;
        }

        setCreateWizardStep(2);
    }, [
        addNotification,
        createForm.description,
        createForm.end_at,
        createForm.start_at,
        createForm.summary,
        createForm.title,
    ]);

    const addTimelineItem = React.useCallback(() => {
        if (
            !timelineDraft.title.trim() ||
            !timelineDraft.date ||
            !timelineDraft.description.trim()
        ) {
            addNotification({
                type: 'error',
                title: 'Thiếu mốc thời gian',
                message:
                    'Vui lòng nhập tên hoạt động, ngày thực hiện và mô tả ngắn trước khi lưu mốc thời gian.',
            });
            return;
        }

        setTimelineItems((current) => [
            ...current,
            {
                id: `${Date.now()}`,
                title: timelineDraft.title.trim(),
                date: timelineDraft.date,
                description: timelineDraft.description.trim(),
            },
        ]);
        setTimelineDraft({
            title: '',
            date: '',
            description: '',
        });
    }, [addNotification, timelineDraft]);

    const goToVolunteerStep = React.useCallback(() => {
        if (!campaignPlan.trim() || timelineItems.length === 0) {
            addNotification({
                type: 'error',
                title: 'Thiếu nội dung chi tiết',
                message:
                    'Vui lòng mô tả kế hoạch triển khai và thêm ít nhất một mốc thời gian trước khi sang bước tuyển tình nguyện viên.',
            });
            return;
        }

        setCreateWizardStep(3);
    }, [addNotification, campaignPlan, timelineItems.length]);

    const goToCompletionStep = React.useCallback(() => {
        if (
            !volunteerTarget ||
            !volunteerDeadline ||
            volunteerSkills.length === 0
        ) {
            addNotification({
                type: 'error',
                title: 'Thiếu cấu hình tuyển dụng',
                message:
                    'Vui lòng nhập chỉ tiêu tuyển dụng, hạn cuối đăng ký và ít nhất một kỹ năng trước khi sang bước hoàn tất.',
            });
            return;
        }

        setCreateWizardStep(4);
    }, [
        addNotification,
        volunteerDeadline,
        volunteerSkills.length,
        volunteerTarget,
    ]);

    const onPlanDocumentChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            setPlanDocumentName(file?.name ?? '');
        },
        [],
    );

    const onApprovalDocumentChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            setApprovalDocumentName(file?.name ?? '');
        },
        [],
    );

    const buildVolunteerBenefits = React.useCallback(
        () =>
            volunteerBenefitOptions
                .filter((option) => volunteerBenefits[option.key])
                .map((option) => option.label),
        [volunteerBenefits],
    );

    const addVolunteerSkill = React.useCallback((skillValue: string) => {
        const normalizedSkill = skillValue.trim();
        if (!normalizedSkill) return;

        setVolunteerSkills((current) =>
            current.includes(normalizedSkill)
                ? current
                : [...current, normalizedSkill],
        );
        setVolunteerSkillDraft('');
    }, []);

    const removeVolunteerSkill = React.useCallback((skillValue: string) => {
        setVolunteerSkills((current) =>
            current.filter((skill) => skill !== skillValue),
        );
    }, []);

    const toggleVolunteerBenefit = React.useCallback(
        (benefitKey: VolunteerBenefitKey) => {
            setVolunteerBenefits((current) => ({
                ...current,
                [benefitKey]: !current[benefitKey],
            }));
        },
        [],
    );

    const filteredCampaigns = React.useMemo(() => {
        const normalizedQuery = campaignSearch.trim().toLowerCase();
        const nextItems = campaigns.filter((campaign) => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                campaign.title.toLowerCase().includes(normalizedQuery) ||
                campaign.summary.toLowerCase().includes(normalizedQuery);
            const matchesStatus =
                campaignStatusFilter === 'ALL' ||
                campaign.status === campaignStatusFilter;

            return matchesQuery && matchesStatus;
        });

        const sortedItems = [...nextItems];
        sortedItems.sort((left, right) => {
            if (campaignSort === 'title') {
                return left.title.localeCompare(right.title, 'vi');
            }

            const leftTime = new Date(left.start_at).getTime();
            const rightTime = new Date(right.start_at).getTime();

            return campaignSort === 'oldest'
                ? leftTime - rightTime
                : rightTime - leftTime;
        });

        return sortedItems;
    }, [campaignSearch, campaignSort, campaignStatusFilter, campaigns]);

    const activeCampaignCount = React.useMemo(
        () =>
            campaigns.filter((campaign) =>
                ['ONGOING', 'PUBLISHED', 'APPROVED'].includes(campaign.status),
            ).length,
        [campaigns],
    );

    const pendingCampaignCount = React.useMemo(
        () =>
            campaigns.filter((campaign) =>
                [
                    'DRAFT',
                    'SUBMITTED',
                    'PRE_APPROVED',
                    'REVISION_REQUIRED',
                ].includes(campaign.status),
            ).length,
        [campaigns],
    );

    const totalModuleCount = React.useMemo(
        () =>
            campaigns.reduce(
                (total, campaign) =>
                    total + (campaign.module_types?.length ?? 0),
                0,
            ),
        [campaigns],
    );

    const loadApprovalQueue = React.useCallback(async () => {
        if (!canReviewCampaign) return;
        setApprovalLoading(true);
        setApprovalError(null);

        try {
            const data = await getApprovalQueue({
                status: approvalFilters.status || undefined,
                module_type: approvalFilters.module_type || undefined,
                q: approvalFilters.q.trim() || undefined,
                page: 1,
                limit: 100,
            });
            setApprovalQueue(data);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Lỗi hệ thống khi tải danh sách phê duyệt.';
            setApprovalError(message);
            addNotification({
                type: 'error',
                title: 'Không tải được hàng đợi phê duyệt',
                message,
            });
        } finally {
            setApprovalLoading(false);
        }
    }, [
        addNotification,
        approvalFilters.module_type,
        approvalFilters.q,
        approvalFilters.status,
        canReviewCampaign,
    ]);

    const loadCampaigns = React.useCallback(async () => {
        if (!canManageCampaign) return;
        setLoadingList(true);
        try {
            const data = await getManagedCampaigns({ page: 1, limit: 50 });
            setCampaigns(data);
            if (data.length === 0) {
                setSelectedCampaignId(null);
                return;
            }
            if (
                !selectedCampaignId ||
                !data.some((campaign) => campaign.id === selectedCampaignId)
            ) {
                setSelectedCampaignId(data[0].id);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không tải được danh sách chiến dịch',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        } finally {
            setLoadingList(false);
        }
    }, [addNotification, canManageCampaign, selectedCampaignId]);

    const loadCampaignDetail = React.useCallback(
        async (campaignId: string) => {
            try {
                const data = await getManagedCampaignDetail(campaignId);
                setDetail(data);
                setFundraisingModuleId(
                    data.modules.find((module) => module.type === 'fundraising')
                        ?.id ?? '',
                );
                setItemModuleId(
                    data.modules.find(
                        (module) => module.type === 'item_donation',
                    )?.id ?? '',
                );
                setEventModuleId(
                    data.modules.find((module) => module.type === 'event')
                        ?.id ?? '',
                );
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Không tải được chi tiết chiến dịch',
                    message:
                        error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            }
        },
        [addNotification],
    );

    const loadFundraisingData = React.useCallback(async (moduleId: string) => {
        if (!moduleId) return;
        const [moduleDetail, donationsPage, transactionsPage] =
            await Promise.all([
                getFundraisingModule(moduleId),
                getFundraisingDonations(moduleId, { page: 1, limit: 100 }),
                getFundraisingTransactions({
                    module_id: moduleId,
                    page: 1,
                    limit: 100,
                }),
            ]);

        const config = moduleDetail.config ?? {};
        setFundraisingConfig({
            target_amount: Number(config.target_amount ?? 0),
            receiver_name: String(config.receiver_name ?? ''),
            bank_name: String(config.bank_name ?? ''),
            bank_account_no: String(config.bank_account_no ?? ''),
            currency: String(config.currency ?? 'VND'),
            sepay_enabled: Boolean(config.sepay_enabled),
            sepay_account_id: String(config.sepay_account_id ?? ''),
        });
        setFundraisingDonations(donationsPage.items);
        setFundraisingTransactions(transactionsPage.items);
    }, []);

    const loadItemData = React.useCallback(
        async (moduleId: string) => {
            if (!moduleId) return;
            const [targets, pledges, moduleDetail] = await Promise.all([
                getItemTargets(moduleId),
                getItemPledges(moduleId, { page: 1, limit: 100 }),
                detail?.modules.find((module) => module.id === moduleId)
                    ? Promise.resolve(
                          detail.modules.find(
                              (module) => module.id === moduleId,
                          ),
                      )
                    : Promise.resolve(undefined),
            ]);

            const config = (moduleDetail?.settings ?? {}) as Record<
                string,
                unknown
            >;
            setItemConfig({
                receiver_address: String(config.receiver_address ?? ''),
                receiver_contact: String(config.receiver_contact ?? ''),
                allow_over_target: Boolean(config.allow_over_target),
                handover_note: String(config.handover_note ?? ''),
            });
            setItemTargets(targets);
            setItemPledges(pledges);
        },
        [detail?.modules],
    );

    const loadEventData = React.useCallback(async (moduleId: string) => {
        if (!moduleId) return;
        const [registrations, moduleDetail] = await Promise.all([
            getEventRegistrations(moduleId, { page: 1, limit: 100 }),
            getEventModule(moduleId),
        ]);
        setEventConfig({
            location: moduleDetail.config.location,
            quota: moduleDetail.config.quota,
            registration_required: moduleDetail.config.registration_required,
            checkin_required: moduleDetail.config.checkin_required,
            benefits_text: moduleDetail.config.benefits_text,
        });
        setEventRegistrations(registrations);
    }, []);

    React.useEffect(() => {
        void loadCampaigns();
    }, [loadCampaigns]);

    React.useEffect(() => {
        if (!canReviewCampaign) return;
        void loadApprovalQueue();
    }, [canReviewCampaign, loadApprovalQueue]);

    React.useEffect(() => {
        if (showCreateComposer) return;
        resetCreateWizard();
    }, [resetCreateWizard, showCreateComposer]);

    React.useEffect(() => {
        if (!isCreatePage || showCreateComposer) return;
        navigate(paths.app.campaigns.getHref());
    }, [isCreatePage, navigate, showCreateComposer]);

    React.useEffect(() => {
        if (!selectedCampaignId) {
            setDetail(null);
            setFundraisingModuleId('');
            setItemModuleId('');
            setEventModuleId('');
            return;
        }
        void loadCampaignDetail(selectedCampaignId);
    }, [loadCampaignDetail, selectedCampaignId]);

    React.useEffect(() => {
        if (!fundraisingModuleId) {
            setFundraisingDonations([]);
            setFundraisingTransactions([]);
            return;
        }
        loadFundraisingData(fundraisingModuleId).catch((error) => {
            addNotification({
                type: 'error',
                title: 'Không tải được dữ liệu gây quỹ',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        });
    }, [addNotification, fundraisingModuleId, loadFundraisingData]);

    React.useEffect(() => {
        if (!itemModuleId) {
            setItemTargets([]);
            setItemPledges([]);
            return;
        }
        loadItemData(itemModuleId).catch((error) => {
            addNotification({
                type: 'error',
                title: 'Không tải được dữ liệu hiện vật',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        });
    }, [addNotification, itemModuleId, loadItemData]);

    React.useEffect(() => {
        if (!eventModuleId) {
            setEventRegistrations([]);
            return;
        }
        loadEventData(eventModuleId).catch((error) => {
            addNotification({
                type: 'error',
                title: 'Không tải được dữ liệu sự kiện',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        });
    }, [addNotification, eventModuleId, loadEventData]);

    const onCreateCampaign = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign) return;
        if (createSubmitIntent !== 'draft' && createWizardStep === 4) {
            if (
                !campaignVenueArea.trim() ||
                !campaignVenueAddress.trim() ||
                !finalCommitmentChecked
            ) {
                addNotification({
                    type: 'error',
                    title: 'Chưa thể hoàn tất chiến dịch',
                    message:
                        'Vui lòng nhập đầy đủ địa điểm tổ chức và xác nhận cam kết trước khi tạo chiến dịch.',
                });
                return;
            }
        }

        const shouldCreateVolunteerModule =
            createWizardStep >= 3 &&
            !!volunteerTarget &&
            !!volunteerDeadline &&
            volunteerSkills.length > 0;

        try {
            const payload = {
                ...createForm,
                start_at: new Date(createForm.start_at).toISOString(),
                end_at: new Date(createForm.end_at).toISOString(),
            };
            const created = await createManagedCampaign(payload);
            if (shouldCreateVolunteerModule) {
                const locationParts = [
                    campaignVenueArea.trim(),
                    campaignVenueCampus.trim(),
                    campaignVenueAddress.trim(),
                ].filter(Boolean);
                const volunteerBenefits = buildVolunteerBenefits();
                const eventDescription = [
                    campaignPlan.trim(),
                    volunteerNotes.trim(),
                    volunteerDeadline
                        ? `Hạn cuối đăng ký: ${formatCampaignDate(
                              volunteerDeadline,
                          )}`
                        : '',
                ]
                    .filter(Boolean)
                    .join('\n\n');

                await createCampaignModule(created.id, {
                    type: 'event',
                    title: `${createForm.title.trim()} - Tuyển tình nguyện viên`,
                    description: eventDescription,
                    start_at: new Date(createForm.start_at).toISOString(),
                    end_at: new Date(createForm.end_at).toISOString(),
                    settings: {
                        quota: Number(volunteerTarget),
                        location: locationParts.join(' | '),
                        registration_required: true,
                        checkin_required: true,
                        benefits: volunteerBenefits,
                        benefits_text: volunteerBenefits.join('\n'),
                        registration_deadline: volunteerDeadline,
                        required_skills: volunteerSkills,
                        venue_area: campaignVenueArea.trim(),
                        venue_campus: campaignVenueCampus.trim(),
                        venue_address: campaignVenueAddress.trim(),
                        timeline_items: timelineItems,
                        plan_document_name: planDocumentName,
                        approval_document_name: approvalDocumentName,
                    },
                });
            }

            if (createSubmitIntent !== 'draft' && createWizardStep === 4) {
                await submitCampaignReview(created.id);
            }

            addNotification({
                type: 'success',
                title:
                    createSubmitIntent === 'draft'
                        ? 'Đã lưu chiến dịch nháp'
                        : createWizardStep === 4
                          ? 'Đã tạo và gửi duyệt chiến dịch'
                          : 'Đã tạo chiến dịch',
                message:
                    createSubmitIntent === 'draft'
                        ? `Chiến dịch nháp #${created.id} đã được lưu.`
                        : createWizardStep === 4
                          ? `Chiến dịch #${created.id} đã được gửi sang trạng thái chờ duyệt.`
                          : `Mã chiến dịch: #${created.id}`,
            });
            setCreateForm((current) => ({
                ...current,
                title: '',
                summary: '',
                description: '',
                start_at: '',
                end_at: '',
            }));
            resetCreateWizard();
            if (isCreatePage) {
                navigate(paths.app.campaigns.getHref());
                return;
            }
            setShowCreateComposer(false);
            await loadCampaigns();
            setSelectedCampaignId(created.id);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo chiến dịch thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onCreateModule = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canMutateCampaign || !detail) return;

        const settings =
            moduleForm.type === 'fundraising'
                ? {
                      target_amount: moduleForm.target_amount,
                      receiver_name: moduleForm.receiver_name,
                      bank_name: moduleForm.bank_name,
                      bank_account_no: moduleForm.bank_account_no,
                  }
                : moduleForm.type === 'item_donation'
                  ? {
                        receiver_address: moduleForm.receiver_address,
                        receiver_contact: moduleForm.receiver_contact,
                    }
                  : {
                        quota: moduleForm.quota,
                        location: moduleForm.location,
                        registration_required: true,
                        checkin_required: true,
                    };

        try {
            await createCampaignModule(detail.id, {
                type: moduleForm.type,
                title: moduleForm.title,
                description: moduleForm.description,
                start_at: new Date(moduleForm.start_at).toISOString(),
                end_at: new Date(moduleForm.end_at).toISOString(),
                settings,
            });
            addNotification({
                type: 'success',
                title: 'Đã thêm hạng mục',
                message: 'Cấu hình hạng mục đã được lưu',
            });
            await loadCampaignDetail(detail.id);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo hạng mục thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSubmitReview = async () => {
        if (!canMutateCampaign || !detail) return;
        try {
            await submitCampaignReview(detail.id);
            addNotification({
                type: 'success',
                title: 'Đã gửi duyệt',
                message: 'Chiến dịch đã chuyển sang trạng thái đã gửi duyệt',
            });
            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gửi duyệt thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onPublish = async () => {
        if (!canMutateCampaign || !detail) return;
        try {
            await publishCampaign(detail.id);
            addNotification({
                type: 'success',
                title: 'Đã công khai chiến dịch',
                message: 'Chiến dịch đã chuyển sang trạng thái công khai',
            });
            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Công khai chiến dịch thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onDeleteDraftCampaign = async () => {
        if (!canDeleteDraft || !detail) return;
        const confirmed = window.confirm(
            'Xóa mềm chiến dịch nháp này? Thao tác này sẽ ẩn campaign khỏi danh sách quản trị.',
        );
        if (!confirmed) return;

        try {
            await deleteManagedCampaign(detail.id);
            addNotification({
                type: 'success',
                title: 'Đã xóa chiến dịch nháp',
                message: 'Chiến dịch đã được gỡ khỏi danh sách quản trị.',
            });
            await loadCampaigns();
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xóa chiến dịch thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSaveFundraisingConfig = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !fundraisingModuleId) return;

        try {
            await updateFundraisingConfig(fundraisingModuleId, {
                ...fundraisingConfig,
                sepay_account_id: fundraisingConfig.sepay_enabled
                    ? fundraisingConfig.sepay_account_id
                    : null,
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu cấu hình gây quỹ',
                message: 'Cập nhật thành công hạng mục gây quỹ',
            });
            await loadFundraisingData(fundraisingModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Lưu cấu hình thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onVerifyDonation = async (donationId: string) => {
        const donation = fundraisingDonations.find(
            (item) => item.id === donationId,
        );
        try {
            await verifyFundraisingDonation(
                donationId,
                donation?.matched_transaction_id
                    ? {
                          transaction_id: donation.matched_transaction_id,
                          note: 'verify_from_campaign_management',
                      }
                    : undefined,
            );
            addNotification({
                type: 'success',
                title: 'Xác minh thành công',
                message: `Khoản đóng góp #${donationId} đã được xác minh`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xác minh thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectDonation = async (donationId: string) => {
        setActionDialog({
            kind: 'reject-donation',
            targetId: donationId,
            value: '',
        });
    };

    const onAttachTransaction = async (
        transactionId: string,
        donationId: string,
    ) => {
        try {
            await attachFundraisingTransaction(transactionId, donationId);
            addNotification({
                type: 'success',
                title: 'Đã gắn transaction',
                message: `Transaction #${transactionId} đã được đối soát thủ công.`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gắn transaction thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onUnmatchTransaction = async (transactionId: string) => {
        try {
            await unmatchFundraisingTransaction(transactionId);
            addNotification({
                type: 'success',
                title: 'Đã gỡ đối soát',
                message: `Transaction #${transactionId} đã trở về trạng thái unmatched.`,
            });
            if (fundraisingModuleId) {
                await loadFundraisingData(fundraisingModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gỡ đối soát thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onSaveItemConfig = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !itemModuleId) return;
        try {
            await updateItemDonationConfig(itemModuleId, {
                receiver_address: itemConfig.receiver_address,
                receiver_contact: itemConfig.receiver_contact,
                allow_over_target: itemConfig.allow_over_target,
                handover_note: itemConfig.handover_note || null,
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu cấu hình hiện vật',
                message: 'Cập nhật cấu hình thành công',
            });
            await loadItemData(itemModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Lưu cấu hình thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onCreateItemTarget = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !itemModuleId) return;
        try {
            await createItemTarget(itemModuleId, {
                name: itemTargetForm.name,
                unit: itemTargetForm.unit,
                target_quantity: itemTargetForm.target_quantity,
                description: itemTargetForm.description || undefined,
            });
            addNotification({
                type: 'success',
                title: 'Đã thêm nhu cầu hiện vật',
                message: 'Mục tiêu hiện vật đã được tạo',
            });
            setItemTargetForm({
                name: '',
                unit: '',
                target_quantity: 0,
                description: '',
            });
            await loadItemData(itemModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Tạo nhu cầu hiện vật thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onUpdateItemTarget = async (
        targetId: string,
        payload: {
            name: string;
            unit: string;
            target_quantity: number;
            description: string;
            status: 'ACTIVE' | 'CLOSED';
        },
    ) => {
        try {
            await updateItemTarget(targetId, {
                name: payload.name,
                unit: payload.unit,
                target_quantity: payload.target_quantity,
                description: payload.description || undefined,
                status: payload.status,
            });
            addNotification({
                type: 'success',
                title: 'Đã cập nhật nhu cầu hiện vật',
                message: `Target #${targetId} đã được cập nhật`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Cập nhật target thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
            throw error;
        }
    };

    const onDeleteItemTarget = async (targetId: string) => {
        try {
            await deleteItemTarget(targetId);
            addNotification({
                type: 'success',
                title: 'Đã xóa nhu cầu hiện vật',
                message: `Target #${targetId} đã được xóa`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xóa target thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
            throw error;
        }
    };

    const onConfirmItemPledge = async (pledgeId: string) => {
        try {
            await confirmItemPledge(pledgeId);
            addNotification({
                type: 'success',
                title: 'Đã xác nhận đăng ký hiện vật',
                message: `Pledge #${pledgeId} đã được xác nhận`,
            });
            if (itemModuleId) {
                await loadItemData(itemModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Xác nhận pledge thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectItemPledge = async (pledgeId: string) => {
        setActionDialog({
            kind: 'reject-item-pledge',
            targetId: pledgeId,
            value: '',
        });
    };

    const onHandoverItemPledge = async (pledgeId: string, quantity: number) => {
        setActionDialog({
            kind: 'handover-item-pledge',
            targetId: pledgeId,
            value: String(quantity),
        });
    };

    const onSaveEventConfig = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        if (!canMutateCampaign || !eventModuleId) return;
        try {
            await updateEventConfig(eventModuleId, {
                location: eventConfig.location,
                quota: eventConfig.quota,
                registration_required: eventConfig.registration_required,
                checkin_required: eventConfig.checkin_required,
                benefits: eventConfig.benefits_text
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu cấu hình sự kiện',
                message: 'Cập nhật cấu hình thành công',
            });
            await loadEventData(eventModuleId);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Lưu cấu hình thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onApproveRegistration = async (registrationId: string) => {
        try {
            await approveEventRegistration(registrationId);
            addNotification({
                type: 'success',
                title: 'Đã duyệt đăng ký sự kiện',
                message: `Registration #${registrationId} đã được duyệt`,
            });
            if (eventModuleId) {
                await loadEventData(eventModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Duyệt đăng ký thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onRejectRegistration = async (registrationId: string) => {
        setActionDialog({
            kind: 'reject-registration',
            targetId: registrationId,
            value: '',
        });
    };

    const onCheckInRegistration = async (registrationId: string) => {
        try {
            await checkInEventRegistration(registrationId);
            addNotification({
                type: 'success',
                title: 'Đã check-in',
                message: `Registration #${registrationId} đã được check-in`,
            });
            if (eventModuleId) {
                await loadEventData(eventModuleId);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Check-in thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onCompleteRegistration = async (registrationId: string) => {
        setActionDialog({
            kind: 'complete-registration',
            targetId: registrationId,
            value: '',
        });
    };

    const actionDialogConfig = React.useMemo(() => {
        if (!actionDialog) return null;

        switch (actionDialog.kind) {
            case 'reject-donation':
                return {
                    title: 'Từ chối khoản đóng góp',
                    description:
                        'Nhập lý do để lưu vào lịch sử xử lý khoản đóng góp này.',
                    label: 'Lý do từ chối',
                    placeholder: 'VD: Nội dung chuyển khoản không hợp lệ',
                    submitLabel: 'Xác nhận từ chối',
                    fieldType: 'textarea' as const,
                    required: true,
                };
            case 'reject-item-pledge':
                return {
                    title: 'Từ chối pledge hiện vật',
                    description:
                        'Giải thích ngắn gọn để sinh viên biết vì sao pledge bị từ chối.',
                    label: 'Lý do từ chối',
                    placeholder: 'VD: Nhu cầu hiện tại đã đủ số lượng',
                    submitLabel: 'Xác nhận từ chối',
                    fieldType: 'textarea' as const,
                    required: true,
                };
            case 'handover-item-pledge':
                return {
                    title: 'Ghi nhận bàn giao hiện vật',
                    description:
                        'Nhập số lượng thực nhận để cập nhật tiến độ nhận hiện vật.',
                    label: 'Số lượng thực nhận',
                    placeholder: 'VD: 10',
                    submitLabel: 'Lưu bàn giao',
                    fieldType: 'number' as const,
                    required: true,
                };
            case 'reject-registration':
                return {
                    title: 'Từ chối đăng ký sự kiện',
                    description:
                        'Nhập lý do để phản hồi rõ ràng cho sinh viên.',
                    label: 'Lý do từ chối',
                    placeholder: 'VD: Sự kiện đã đủ số lượng tham gia',
                    submitLabel: 'Xác nhận từ chối',
                    fieldType: 'textarea' as const,
                    required: true,
                };
            case 'complete-registration':
                return {
                    title: 'Hoàn thành tham gia sự kiện',
                    description:
                        'Bạn có thể nhập số giờ tham gia, hoặc để trống nếu không cần ghi nhận giờ.',
                    label: 'Số giờ tham gia',
                    placeholder: 'VD: 4',
                    submitLabel: 'Ghi nhận hoàn thành',
                    fieldType: 'number' as const,
                    required: false,
                };
        }
    }, [actionDialog]);

    const submitActionDialog = async () => {
        if (!actionDialog) return;

        const trimmedValue = actionDialog.value.trim();
        setSubmittingActionDialog(true);

        try {
            switch (actionDialog.kind) {
                case 'reject-donation': {
                    if (!trimmedValue) {
                        throw new Error('Vui lòng nhập lý do từ chối.');
                    }
                    await rejectFundraisingDonation(
                        actionDialog.targetId,
                        trimmedValue,
                    );
                    addNotification({
                        type: 'success',
                        title: 'Đã từ chối khoản đóng góp',
                        message: `Khoản đóng góp #${actionDialog.targetId} đã bị từ chối`,
                    });
                    if (fundraisingModuleId) {
                        await loadFundraisingData(fundraisingModuleId);
                    }
                    break;
                }
                case 'reject-item-pledge': {
                    if (!trimmedValue) {
                        throw new Error('Vui lòng nhập lý do từ chối.');
                    }
                    await rejectItemPledge(actionDialog.targetId, trimmedValue);
                    addNotification({
                        type: 'success',
                        title: 'Đã từ chối pledge hiện vật',
                        message: `Pledge #${actionDialog.targetId} đã bị từ chối`,
                    });
                    if (itemModuleId) {
                        await loadItemData(itemModuleId);
                    }
                    break;
                }
                case 'handover-item-pledge': {
                    const parsedQuantity = Number(trimmedValue);
                    if (
                        !Number.isFinite(parsedQuantity) ||
                        parsedQuantity <= 0
                    ) {
                        throw new Error('Số lượng thực nhận phải lớn hơn 0.');
                    }
                    await handoverItemPledge(actionDialog.targetId, {
                        received_quantity: parsedQuantity,
                    });
                    addNotification({
                        type: 'success',
                        title: 'Đã ghi nhận bàn giao',
                        message: `Pledge #${actionDialog.targetId} đã cập nhật trạng thái đã nhận`,
                    });
                    if (itemModuleId) {
                        await loadItemData(itemModuleId);
                    }
                    break;
                }
                case 'reject-registration': {
                    if (!trimmedValue) {
                        throw new Error('Vui lòng nhập lý do từ chối.');
                    }
                    await rejectEventRegistration(
                        actionDialog.targetId,
                        trimmedValue,
                    );
                    addNotification({
                        type: 'success',
                        title: 'Đã từ chối đăng ký sự kiện',
                        message: `Registration #${actionDialog.targetId} đã bị từ chối`,
                    });
                    if (eventModuleId) {
                        await loadEventData(eventModuleId);
                    }
                    break;
                }
                case 'complete-registration': {
                    const hours =
                        trimmedValue.length > 0
                            ? Number(trimmedValue)
                            : undefined;
                    if (
                        typeof hours !== 'undefined' &&
                        (!Number.isFinite(hours) || hours < 0)
                    ) {
                        throw new Error(
                            'Số giờ tham gia phải là số hợp lệ từ 0 trở lên.',
                        );
                    }
                    await completeEventRegistration(actionDialog.targetId, {
                        hours,
                    });
                    addNotification({
                        type: 'success',
                        title: 'Đã ghi nhận hoàn thành sự kiện',
                        message: `Registration #${actionDialog.targetId} đã hoàn thành`,
                    });
                    if (eventModuleId) {
                        await loadEventData(eventModuleId);
                    }
                    break;
                }
            }

            closeActionDialog();
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Thao tác thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
            setSubmittingActionDialog(false);
        }
    };

    const updateApprovalFilters = React.useCallback(
        (patch: Partial<ApprovalQueueFilterState>) => {
            setApprovalFilters((current) => ({
                ...current,
                ...patch,
                page: typeof patch.page === 'number' ? patch.page : 1,
            }));
        },
        [],
    );

    const resetApprovalFilters = React.useCallback(() => {
        setApprovalFilters(defaultApprovalFilters);
    }, []);

    const submitApprovalAction = React.useCallback(
        async (
            campaignId: string,
            action: ApprovalQueueAction,
            reason?: string,
        ) => {
            setApprovalSubmitting({ campaignId, action });

            try {
                await approvalTransition(campaignId, action, reason);

                const successTitle: Record<ApprovalQueueAction, string> = {
                    'pre-approve': 'Đã sơ duyệt chiến dịch',
                    approve: 'Đã phê duyệt chiến dịch',
                    'request-revision': 'Đã gửi yêu cầu chỉnh sửa',
                    reject: 'Đã từ chối chiến dịch',
                };

                const successMessage: Record<ApprovalQueueAction, string> = {
                    'pre-approve': 'Hồ sơ đã chuyển sang bước chờ duyệt cuối.',
                    approve: 'Chiến dịch đã được phê duyệt theo đúng luồng.',
                    'request-revision':
                        'Đơn vị tổ chức đã nhận phản hồi để cập nhật hồ sơ.',
                    reject: 'Hồ sơ đã được đưa ra khỏi hàng đợi phê duyệt.',
                };

                addNotification({
                    type: 'success',
                    title: successTitle[action],
                    message: successMessage[action],
                });

                closeApprovalReviewDialog();
                await loadApprovalQueue();
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Không thể cập nhật hồ sơ phê duyệt',
                    message:
                        error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            } finally {
                setApprovalSubmitting(null);
            }
        },
        [addNotification, closeApprovalReviewDialog, loadApprovalQueue],
    );

    const submitApprovalReviewDialog = React.useCallback(async () => {
        if (!approvalReviewDialog) return;

        const reason = approvalReviewDialog.value.trim();
        if (!reason) {
            addNotification({
                type: 'error',
                title: 'Thiếu nội dung phản hồi',
                message: 'Vui lòng nhập lý do trước khi gửi phản hồi.',
            });
            return;
        }

        await submitApprovalAction(
            approvalReviewDialog.campaignId,
            approvalReviewDialog.action,
            reason,
        );
    }, [addNotification, approvalReviewDialog, submitApprovalAction]);

    if (!user.data) return null;

    if (isStudent) {
        return <StudentCampaignDiscovery />;
    }

    if (canReviewCampaign && !isCreatePage) {
        return (
            <ContentLayout title="Phê Duyệt Chiến Dịch">
                <SchoolApprovalQueue
                    role={role}
                    items={approvalQueue}
                    loading={approvalLoading}
                    error={approvalError}
                    filters={approvalFilters}
                    actionSubmitting={approvalSubmitting}
                    reviewDialog={approvalReviewDialog}
                    onFiltersChange={updateApprovalFilters}
                    onResetFilters={resetApprovalFilters}
                    onRefresh={() => void loadApprovalQueue()}
                    onQuickAction={(campaignId, action) => {
                        void submitApprovalAction(campaignId, action);
                    }}
                    onOpenReviewDialog={(campaignId, campaignTitle, action) =>
                        setApprovalReviewDialog({
                            campaignId,
                            campaignTitle,
                            action,
                            value: '',
                        })
                    }
                    onCloseReviewDialog={closeApprovalReviewDialog}
                    onReviewReasonChange={(value) =>
                        setApprovalReviewDialog((current) =>
                            current ? { ...current, value } : current,
                        )
                    }
                    onSubmitReviewDialog={() => {
                        void submitApprovalReviewDialog();
                    }}
                />
            </ContentLayout>
        );
    }

    if (!canManageCampaign) {
        return (
            <ContentLayout title="Vận Hành Chiến Dịch">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                    Vai trò hiện tại không có quyền truy cập khu vực quản trị
                    chiến dịch.
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout
            title={isCreatePage ? 'Tạo Chiến Dịch' : 'Vận Hành Chiến Dịch'}
        >
            <div className="space-y-6">
                <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-2">
                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                            {isCreatePage ? 'Tạo chiến dịch' : 'Khu vận hành'}
                        </p>
                        <div>
                            <h2 className="text-[32px] font-semibold leading-[40px] text-[#002A58]">
                                {isCreatePage
                                    ? 'Khởi tạo chiến dịch mới'
                                    : 'Danh sách chiến dịch'}
                            </h2>
                            <p className="mt-2 max-w-3xl text-[16px] leading-6 text-[#424750]">
                                {isCreatePage
                                    ? 'Hoàn thiện hồ sơ chiến dịch theo từng bước trên một trang riêng trước khi gửi duyệt.'
                                    : 'Theo dõi tiến độ, quản lý hạng mục và xử lý các thao tác vận hành cho từng chiến dịch của đơn vị.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {isCreatePage ? (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(paths.app.campaigns.getHref())
                                }
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                            >
                                <RefreshCw
                                    className="size-4"
                                    strokeWidth={1.75}
                                />
                                Quay lại quản lý chiến dịch
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => void loadCampaigns()}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    <RefreshCw
                                        className="size-4"
                                        strokeWidth={1.75}
                                    />
                                    Làm mới
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            paths.app.campaigns.create.getHref(),
                                        )
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,42,88,0.18)] transition hover:bg-[#0E4686]"
                                >
                                    <Megaphone
                                        className="size-4"
                                        strokeWidth={1.75}
                                    />
                                    Tạo chiến dịch mới
                                </button>
                            </>
                        )}
                    </div>
                </section>

                {!isCreatePage ? (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <article className={`${academicPanelClassName} p-6`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                        Tổng chiến dịch
                                    </p>
                                    <p className="mt-4 text-[40px] font-bold leading-[48px] text-[#002A58]">
                                        {campaigns.length
                                            .toString()
                                            .padStart(2, '0')}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                        {pendingCampaignCount} chiến dịch đang
                                        chờ xử lý tiếp theo.
                                    </p>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D6E3FF] text-[#002A58]">
                                    <FolderKanban
                                        className="size-7"
                                        strokeWidth={1.75}
                                    />
                                </div>
                            </div>
                        </article>
                        <article className={`${academicPanelClassName} p-6`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                        Chiến dịch đang hoạt động
                                    </p>
                                    <p className="mt-4 text-[40px] font-bold leading-[48px] text-[#002A58]">
                                        {activeCampaignCount
                                            .toString()
                                            .padStart(2, '0')}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-5 text-[#006D37]">
                                        Ưu tiên theo dõi các chiến dịch đang
                                        diễn ra hoặc đã công khai.
                                    </p>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6BFE9C]/35 text-[#006D37]">
                                    <Users
                                        className="size-7"
                                        strokeWidth={1.75}
                                    />
                                </div>
                            </div>
                        </article>
                        <article className={`${academicPanelClassName} p-6`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                        Hạng mục đã cấu hình
                                    </p>
                                    <p className="mt-4 text-[40px] font-bold leading-[48px] text-[#002A58]">
                                        {totalModuleCount
                                            .toString()
                                            .padStart(2, '0')}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                        {detail?.modules.length ?? 0} hạng mục
                                        thuộc chiến dịch đang chọn.
                                    </p>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFDBCB] text-[#773305]">
                                    <HandCoins
                                        className="size-7"
                                        strokeWidth={1.75}
                                    />
                                </div>
                            </div>
                        </article>
                    </section>
                ) : null}

                {showCreateComposer ? (
                    <section className="space-y-6">
                        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 overflow-x-auto px-2 pb-2">
                            {createWizardLabels.map((stepLabel, index) => {
                                const stepIndex = index + 1;
                                const isActive = stepIndex === createWizardStep;
                                const isComplete = stepIndex < createWizardStep;

                                return (
                                    <React.Fragment key={stepLabel}>
                                        <div className="flex min-w-[120px] flex-col items-center gap-3 text-center">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full border text-[24px] font-bold transition ${
                                                    isActive
                                                        ? 'border-[#002A58] bg-[#002A58] text-white shadow-[0_8px_24px_rgba(0,42,88,0.18)]'
                                                        : isComplete
                                                          ? 'border-[#006D37] bg-[#006D37] text-white'
                                                          : 'border-[#C3C6D2] bg-white text-[#A3A7B0]'
                                                }`}
                                            >
                                                {isComplete ? '✓' : stepIndex}
                                            </div>
                                            <p
                                                className={`text-[12px] font-bold uppercase tracking-[0.08em] ${
                                                    isActive
                                                        ? 'text-[#002A58]'
                                                        : isComplete
                                                          ? 'text-[#006D37]'
                                                          : 'text-[#A3A7B0]'
                                                }`}
                                            >
                                                {stepLabel}
                                            </p>
                                        </div>
                                        {index < 3 ? (
                                            <div
                                                className={`mt-6 hidden h-[2px] min-w-16 flex-1 md:block ${
                                                    stepIndex < createWizardStep
                                                        ? 'bg-[#006D37]'
                                                        : 'bg-[#C3C6D2]'
                                                }`}
                                            />
                                        ) : null}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        <form
                            onSubmit={onCreateCampaign}
                            className={`${academicPanelClassName} overflow-hidden`}
                        >
                            <div className="border-b border-[#C3C6D2] px-6 py-6 sm:px-8">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-[32px] font-semibold leading-[40px] text-[#002A58]">
                                            {createWizardHeading}
                                        </h3>
                                        <p className="mt-2 max-w-4xl text-[16px] leading-7 text-[#424750]">
                                            {createWizardDescription}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCreateComposer(false)
                                        }
                                        className="text-[14px] font-semibold text-[#002A58] transition hover:text-[#0E4686]"
                                    >
                                        Quay lại quản lý chiến dịch
                                    </button>
                                </div>
                            </div>

                            {createWizardStep === 1 ? (
                                <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                                    <div className="space-y-3">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                            Ảnh bìa chiến dịch
                                        </p>
                                        <input
                                            ref={coverImageInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={onCoverImageChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                coverImageInputRef.current?.click()
                                            }
                                            className="group relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#C3C6D2] bg-[#F3F4F5] px-6 text-center transition hover:border-[#002A58] hover:bg-[#E7E8E9]"
                                        >
                                            {coverImagePreview ? (
                                                <img
                                                    src={coverImagePreview}
                                                    alt="Xem trước ảnh bìa chiến dịch"
                                                    className="absolute inset-0 h-full w-full object-cover opacity-35 transition group-hover:opacity-50"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(214,227,255,0.7),rgba(243,244,245,0.95))]" />
                                            )}
                                            <div className="relative z-10">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#002A58] shadow-[0_8px_24px_rgba(0,42,88,0.12)]">
                                                    <ImageUp
                                                        className="size-7"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <p className="mt-4 text-[15px] font-semibold uppercase tracking-[0.06em] text-[#002A58]">
                                                    Tải ảnh lên
                                                </p>
                                                <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                    Kích thước tối ưu
                                                    1200x1600px. Định dạng JPG,
                                                    PNG hoặc WEBP.
                                                </p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                Tên chiến dịch *
                                            </span>
                                            <input
                                                required
                                                className={
                                                    academicInputClassName
                                                }
                                                placeholder="Ví dụ: Mùa hè xanh 2024 - Unity Academic"
                                                value={createForm.title}
                                                onChange={(event) =>
                                                    setCreateForm(
                                                        (current) => ({
                                                            ...current,
                                                            title: event.target
                                                                .value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                Slogan/Mô tả ngắn *
                                            </span>
                                            <input
                                                required
                                                className={
                                                    academicInputClassName
                                                }
                                                placeholder="Câu khẩu hiệu truyền cảm hứng cho chiến dịch"
                                                value={createForm.summary}
                                                onChange={(event) =>
                                                    setCreateForm(
                                                        (current) => ({
                                                            ...current,
                                                            summary:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </label>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Đơn vị tổ chức
                                                </span>
                                                <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] px-4 py-3 text-[15px] leading-6 text-[#191C1D]">
                                                    <Building2
                                                        className="size-4 shrink-0 text-[#737781]"
                                                        strokeWidth={1.75}
                                                    />
                                                    <span>{organizerName}</span>
                                                </div>
                                            </div>
                                            <label className="block">
                                                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Loại hình hoạt động
                                                </span>
                                                <select
                                                    className={
                                                        academicInputClassName
                                                    }
                                                    value={campaignCategory}
                                                    onChange={(event) =>
                                                        setCampaignCategory(
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    {campaignCategoryOptions.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </label>
                                        </div>

                                        <label className="block">
                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                Mô tả chi tiết *
                                            </span>
                                            <textarea
                                                required
                                                rows={6}
                                                className="min-h-44 w-full rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] px-4 py-3 text-[15px] leading-7 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                                placeholder="Trình bày mục đích, ý nghĩa và những giá trị mà chiến dịch mang lại cho cộng đồng..."
                                                value={createForm.description}
                                                onChange={(event) =>
                                                    setCreateForm(
                                                        (current) => ({
                                                            ...current,
                                                            description:
                                                                event.target
                                                                    .value,
                                                        }),
                                                    )
                                                }
                                            />
                                        </label>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="block">
                                                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Bắt đầu dự kiến *
                                                </span>
                                                <input
                                                    required
                                                    className={
                                                        academicInputClassName
                                                    }
                                                    type="datetime-local"
                                                    value={createForm.start_at}
                                                    onChange={(event) =>
                                                        setCreateForm(
                                                            (current) => ({
                                                                ...current,
                                                                start_at:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Kết thúc dự kiến *
                                                </span>
                                                <input
                                                    required
                                                    className={
                                                        academicInputClassName
                                                    }
                                                    type="datetime-local"
                                                    value={createForm.end_at}
                                                    onChange={(event) =>
                                                        setCreateForm(
                                                            (current) => ({
                                                                ...current,
                                                                end_at: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ) : createWizardStep === 2 ? (
                                <div className="space-y-8 px-6 py-6 sm:px-8">
                                    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="mb-3 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Thời gian chiến dịch tổng
                                                    thể
                                                </label>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        type="datetime-local"
                                                        value={
                                                            createForm.start_at
                                                        }
                                                        onChange={(event) =>
                                                            setCreateForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    start_at:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        type="datetime-local"
                                                        value={
                                                            createForm.end_at
                                                        }
                                                        onChange={(event) =>
                                                            setCreateForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    end_at: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <p className="mt-3 text-[14px] italic leading-6 text-[#737781]">
                                                    Lưu ý: Thời gian tối thiểu
                                                    là 7 ngày và tối đa là 90
                                                    ngày.
                                                </p>
                                            </div>

                                            <label className="block">
                                                <span className="mb-3 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Mô tả kế hoạch chi tiết
                                                </span>
                                                <textarea
                                                    rows={8}
                                                    className="min-h-64 w-full rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] px-4 py-3 text-[15px] leading-7 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                                    placeholder="Trình bày chi tiết các giai đoạn thực hiện, phương thức vận động và cách thức phối hợp..."
                                                    value={campaignPlan}
                                                    onChange={(event) =>
                                                        setCampaignPlan(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="flex items-end justify-between gap-4">
                                                <label className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Các mốc thời gian quan trọng
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={addTimelineItem}
                                                    className="text-[15px] font-semibold text-[#006D37] transition hover:text-[#005228]"
                                                >
                                                    + Thêm mốc thời gian
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                {timelineItems.length > 0 ? (
                                                    timelineItems.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="rounded-xl border border-[#C3C6D2] bg-white p-5"
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D6E3FF] text-[#002A58]">
                                                                            <CalendarDays
                                                                                className="size-4"
                                                                                strokeWidth={
                                                                                    1.75
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div className="mt-2 h-10 w-px bg-[#C3C6D2]" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                                            <p className="text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                                                {
                                                                                    item.title
                                                                                }
                                                                            </p>
                                                                            <p className="text-[14px] leading-6 text-[#424750]">
                                                                                {formatCampaignDate(
                                                                                    item.date,
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <p className="mt-2 text-[15px] leading-7 text-[#424750]">
                                                                            {
                                                                                item.description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-[#C3C6D2] bg-[#F8F9FA] px-5 py-6 text-[14px] leading-6 text-[#737781]">
                                                        Chưa có mốc thời gian
                                                        nào. Hãy thêm ít nhất
                                                        một hoạt động quan trọng
                                                        cho chiến dịch.
                                                    </div>
                                                )}

                                                <div className="rounded-xl border-2 border-dashed border-[#C3C6D2] bg-[#F8F9FA] p-5">
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                                Tên hoạt động
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Ví dụ: Ngày hội quyên góp..."
                                                                value={
                                                                    timelineDraft.title
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setTimelineDraft(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            title: event
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                                Ngày thực hiện
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                type="date"
                                                                value={
                                                                    timelineDraft.date
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setTimelineDraft(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            date: event
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                    <label className="mt-4 block">
                                                        <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                            Mô tả ngắn gọn
                                                        </span>
                                                        <textarea
                                                            rows={3}
                                                            className="w-full rounded-xl border border-[#C3C6D2] bg-white px-4 py-3 text-[15px] leading-7 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                                            placeholder="Mô tả ngắn gọn về hoạt động..."
                                                            value={
                                                                timelineDraft.description
                                                            }
                                                            onChange={(event) =>
                                                                setTimelineDraft(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        description:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                    <div className="mt-4 flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setTimelineDraft(
                                                                    {
                                                                        title: '',
                                                                        date: '',
                                                                        description:
                                                                            '',
                                                                    },
                                                                )
                                                            }
                                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#424750] transition hover:bg-[#F3F4F5]"
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                addTimelineItem
                                                            }
                                                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#002A58] px-5 text-[15px] font-semibold text-white transition hover:bg-[#0E4686]"
                                                        >
                                                            Lưu mốc thời gian
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="max-w-3xl rounded-xl border border-[#FFDBCB] bg-[#FFF4EE] px-5 py-4">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#773305]">
                                            Mẹo nhỏ
                                        </p>
                                        <p className="mt-2 text-[15px] leading-7 text-[#773305]">
                                            Các chiến dịch có lịch trình rõ ràng
                                            và các sự kiện kick-off thường thu
                                            hút sự tham gia của tình nguyện viên
                                            cao hơn so với các chiến dịch chỉ
                                            vận động trực tuyến.
                                        </p>
                                    </div>
                                </div>
                            ) : createWizardStep === 3 ? (
                                <div className="space-y-8 px-6 py-6 sm:px-8">
                                    <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA]">
                                        <div className="border-b border-[#C3C6D2] bg-[#F3F4F5] px-6 py-5">
                                            <h4 className="text-[28px] font-semibold leading-9 text-[#002A58]">
                                                Cấu hình tình nguyện viên
                                            </h4>
                                            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#424750]">
                                                Thiết lập chỉ tiêu tuyển dụng,
                                                kỹ năng cần có và quyền lợi để
                                                ứng viên hiểu rõ trước khi đăng
                                                ký tham gia chiến dịch.
                                            </p>
                                        </div>

                                        <div className="space-y-8 px-6 py-6">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                        Chỉ tiêu tuyển dụng
                                                        (người)
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        type="number"
                                                        min={0}
                                                        placeholder="Ví dụ: 50"
                                                        value={volunteerTarget}
                                                        onChange={(event) =>
                                                            setVolunteerTarget(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <p className="mt-3 text-[13px] italic leading-6 text-[#737781]">
                                                        Hệ thống có thể tự động
                                                        đóng đơn khi đạt đủ số
                                                        lượng nếu bạn kích hoạt
                                                        ở bước xác nhận cuối.
                                                    </p>
                                                </label>
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                        Hạn cuối đăng ký
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        type="date"
                                                        value={
                                                            volunteerDeadline
                                                        }
                                                        onChange={(event) =>
                                                            setVolunteerDeadline(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </label>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                        Yêu cầu kỹ năng chuyên
                                                        môn
                                                    </label>
                                                    <div className="rounded-xl border border-[#C3C6D2] bg-white px-4 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {volunteerSkills.map(
                                                                (skill) => (
                                                                    <button
                                                                        key={
                                                                            skill
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeVolunteerSkill(
                                                                                skill,
                                                                            )
                                                                        }
                                                                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#002A58] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0E4686]"
                                                                    >
                                                                        {skill}
                                                                        <span aria-hidden="true">
                                                                            ×
                                                                        </span>
                                                                    </button>
                                                                ),
                                                            )}
                                                            <input
                                                                className="min-w-[180px] flex-1 border-none bg-transparent px-2 py-2 text-[15px] text-[#191C1D] outline-none placeholder:text-[#737781]"
                                                                placeholder="Nhập kỹ năng mới..."
                                                                value={
                                                                    volunteerSkillDraft
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setVolunteerSkillDraft(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                onKeyDown={(
                                                                    event,
                                                                ) => {
                                                                    if (
                                                                        event.key ===
                                                                        'Enter'
                                                                    ) {
                                                                        event.preventDefault();
                                                                        addVolunteerSkill(
                                                                            volunteerSkillDraft,
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-[13px] leading-6 text-[#737781]">
                                                        Nhấn Enter để thêm kỹ
                                                        năng mới cho đợt tuyển
                                                        tình nguyện viên.
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {volunteerSkillSuggestions
                                                        .filter(
                                                            (skill) =>
                                                                !volunteerSkills.includes(
                                                                    skill,
                                                                ),
                                                        )
                                                        .map((skill) => (
                                                            <button
                                                                key={skill}
                                                                type="button"
                                                                onClick={() =>
                                                                    addVolunteerSkill(
                                                                        skill,
                                                                    )
                                                                }
                                                                className="inline-flex h-9 items-center rounded-full border border-[#C3C6D2] bg-white px-4 text-[14px] text-[#424750] transition hover:border-[#002A58] hover:text-[#002A58]"
                                                            >
                                                                + {skill}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Quyền lợi và chế độ đãi ngộ
                                                </p>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {volunteerBenefitOptions.map(
                                                        (benefit) => {
                                                            const isChecked =
                                                                volunteerBenefits[
                                                                    benefit.key
                                                                ];

                                                            return (
                                                                <label
                                                                    key={
                                                                        benefit.key
                                                                    }
                                                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 transition ${
                                                                        isChecked
                                                                            ? 'border-[#002A58] bg-[#F3F7FF]'
                                                                            : 'border-[#C3C6D2] bg-white hover:bg-[#F8F9FA]'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            isChecked
                                                                        }
                                                                        onChange={() =>
                                                                            toggleVolunteerBenefit(
                                                                                benefit.key,
                                                                            )
                                                                        }
                                                                        className="mt-1 h-5 w-5 rounded border-[#737781] text-[#002A58] focus:ring-[#A9C7FF]"
                                                                    />
                                                                    <span className="min-w-0">
                                                                        <span className="block text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                                            {
                                                                                benefit.label
                                                                            }
                                                                        </span>
                                                                        <span className="mt-1 block text-[14px] leading-6 text-[#424750]">
                                                                            {
                                                                                benefit.description
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>

                                            <label className="block">
                                                <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                    Ghi chú bổ sung cho ứng viên
                                                </span>
                                                <textarea
                                                    rows={5}
                                                    className="min-h-44 w-full rounded-xl border border-[#C3C6D2] bg-white px-4 py-3 text-[15px] leading-7 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                                    placeholder="Mô tả công việc cụ thể hoặc các lưu ý đặc biệt dành cho tình nguyện viên..."
                                                    value={volunteerNotes}
                                                    onChange={(event) =>
                                                        setVolunteerNotes(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-3">
                                        <article className="rounded-xl border border-[#C3C6D2] bg-white p-5">
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#006D37]">
                                                Gợi ý
                                            </p>
                                            <p className="mt-3 text-[15px] leading-7 text-[#424750]">
                                                Nên chia rõ theo các đội như
                                                Media, hậu cần hoặc điều phối để
                                                dễ quản lý đơn đăng ký.
                                            </p>
                                        </article>
                                        <article className="rounded-xl border border-[#C3C6D2] bg-white p-5">
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#002A58]">
                                                Quy tắc
                                            </p>
                                            <p className="mt-3 text-[15px] leading-7 text-[#424750]">
                                                Mọi tình nguyện viên đăng ký qua
                                                hệ thống đều được lưu hồ sơ để
                                                phục vụ xét duyệt và điểm rèn
                                                luyện.
                                            </p>
                                        </article>
                                        <article className="rounded-xl border border-[#C3C6D2] bg-white p-5">
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#773305]">
                                                Cam kết
                                            </p>
                                            <p className="mt-3 text-[15px] leading-7 text-[#424750]">
                                                Chỉ công bố các quyền lợi mà câu
                                                lạc bộ thực sự có thể bảo đảm
                                                trong suốt chiến dịch.
                                            </p>
                                        </article>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-8 px-6 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                                    <div className="space-y-6">
                                        <section className="rounded-xl border border-[#C3C6D2] bg-white p-6">
                                            <div className="border-b border-[#C3C6D2] pb-4">
                                                <p className="text-[28px] font-semibold leading-9 text-[#002A58]">
                                                    Địa điểm tổ chức
                                                </p>
                                                <p className="mt-2 text-[15px] leading-7 text-[#424750]">
                                                    Bổ sung vị trí tổ chức để
                                                    người tham gia dễ tìm và ban
                                                    điều phối thuận tiện xác
                                                    minh kế hoạch triển khai.
                                                </p>
                                            </div>

                                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                        Tòa nhà / Khu vực *
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        placeholder="Ví dụ: Tòa A1, khuôn viên trung tâm"
                                                        value={
                                                            campaignVenueArea
                                                        }
                                                        onChange={(event) =>
                                                            setCampaignVenueArea(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                        Cơ sở trường
                                                    </span>
                                                    <select
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        value={
                                                            campaignVenueCampus
                                                        }
                                                        onChange={(event) =>
                                                            setCampaignVenueCampus(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        {campusLocationOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </label>
                                                <label className="block md:col-span-2">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                                        Địa chỉ chi tiết *
                                                    </span>
                                                    <textarea
                                                        rows={3}
                                                        className="w-full rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] px-4 py-3 text-[15px] leading-7 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                                        placeholder="Số 10, đường ABC, phường XYZ..."
                                                        value={
                                                            campaignVenueAddress
                                                        }
                                                        onChange={(event) =>
                                                            setCampaignVenueAddress(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-6 overflow-hidden rounded-xl border border-[#C3C6D2] bg-[#E7E8E9]">
                                                <div className="relative flex h-56 items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.65),_rgba(217,218,219,0.95))]">
                                                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(195,198,210,0.85))]" />
                                                    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#002A58] text-white">
                                                        <Building2
                                                            className="size-7"
                                                            strokeWidth={1.75}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-xl border border-[#C3C6D2] bg-white p-6">
                                            <div className="border-b border-[#C3C6D2] pb-4">
                                                <p className="text-[28px] font-semibold leading-9 text-[#002A58]">
                                                    Tài liệu đính kèm
                                                </p>
                                                <p className="mt-2 text-[15px] leading-7 text-[#424750]">
                                                    Đính kèm bản kế hoạch hoặc
                                                    quyết định phê duyệt nếu đã
                                                    có để giúp ban xét duyệt có
                                                    thêm ngữ cảnh khi tiếp nhận.
                                                </p>
                                            </div>

                                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                <input
                                                    ref={planDocumentInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    className="hidden"
                                                    onChange={
                                                        onPlanDocumentChange
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        planDocumentInputRef.current?.click()
                                                    }
                                                    className="rounded-xl border-2 border-dashed border-[#C3C6D2] bg-[#F8F9FA] px-5 py-7 text-center transition hover:border-[#002A58] hover:bg-[#F3F4F5]"
                                                >
                                                    <p className="text-[17px] font-semibold leading-7 text-[#191C1D]">
                                                        Kế hoạch chi tiết (PDF)
                                                    </p>
                                                    <p className="mt-2 text-[13px] leading-6 text-[#737781]">
                                                        {planDocumentName ||
                                                            'Kéo thả hoặc bấm để chọn tệp'}
                                                    </p>
                                                </button>

                                                <input
                                                    ref={
                                                        approvalDocumentInputRef
                                                    }
                                                    type="file"
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                    className="hidden"
                                                    onChange={
                                                        onApprovalDocumentChange
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        approvalDocumentInputRef.current?.click()
                                                    }
                                                    className="rounded-xl border-2 border-dashed border-[#C3C6D2] bg-[#F8F9FA] px-5 py-7 text-center transition hover:border-[#002A58] hover:bg-[#F3F4F5]"
                                                >
                                                    <p className="text-[17px] font-semibold leading-7 text-[#191C1D]">
                                                        Quyết định phê duyệt
                                                    </p>
                                                    <p className="mt-2 text-[13px] leading-6 text-[#737781]">
                                                        {approvalDocumentName ||
                                                            'Không bắt buộc, tệp hình ảnh/PDF'}
                                                    </p>
                                                </button>
                                            </div>
                                        </section>

                                        <label className="flex items-start gap-3 rounded-xl border border-[#C3C6D2] bg-white px-5 py-5">
                                            <input
                                                type="checkbox"
                                                checked={finalCommitmentChecked}
                                                onChange={(event) =>
                                                    setFinalCommitmentChecked(
                                                        event.target.checked,
                                                    )
                                                }
                                                className="mt-1 h-5 w-5 rounded border-[#737781] text-[#002A58] focus:ring-[#A9C7FF]"
                                            />
                                            <span className="text-[15px] leading-7 text-[#424750]">
                                                Tôi cam kết các thông tin cung
                                                cấp là chính xác và hoàn toàn
                                                chịu trách nhiệm về các hoạt
                                                động diễn ra trong chiến dịch.
                                                Tôi đã đọc và đồng ý với điều
                                                khoản dành cho người tổ chức.
                                            </span>
                                        </label>
                                    </div>

                                    <aside className="space-y-4">
                                        <div className="overflow-hidden rounded-xl border border-[#C3C6D2] bg-white">
                                            <div className="bg-[#0E2E5C] px-5 py-5 text-white">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/80">
                                                    Tóm tắt chiến dịch
                                                </p>
                                                <p className="mt-3 text-[24px] font-semibold leading-8">
                                                    {createForm.title ||
                                                        'Chiến dịch chưa đặt tên'}
                                                </p>
                                            </div>
                                            <div className="space-y-4 px-5 py-5">
                                                <div className="overflow-hidden rounded-xl border border-[#C3C6D2] bg-[#F3F4F5]">
                                                    {coverImagePreview ? (
                                                        <img
                                                            src={
                                                                coverImagePreview
                                                            }
                                                            alt="Ảnh bìa xem trước của chiến dịch"
                                                            className="h-40 w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-40 items-center justify-center text-[14px] text-[#737781]">
                                                            Chưa có ảnh bìa
                                                        </div>
                                                    )}
                                                </div>
                                                <dl className="space-y-3 text-[15px] leading-6 text-[#424750]">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <dt>Thời gian:</dt>
                                                        <dd className="text-right font-semibold text-[#191C1D]">
                                                            {createForm.start_at &&
                                                            createForm.end_at
                                                                ? `${formatCampaignDate(createForm.start_at)} - ${formatCampaignDate(createForm.end_at)}`
                                                                : 'Chưa xác định'}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <dt>Chỉ tiêu:</dt>
                                                        <dd className="text-right font-semibold text-[#006D37]">
                                                            {volunteerTarget
                                                                ? `${volunteerTarget} người`
                                                                : 'Chưa xác định'}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <dt>Địa điểm:</dt>
                                                        <dd className="text-right font-semibold text-[#191C1D]">
                                                            {campaignVenueArea ||
                                                                'Chưa xác định'}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <dt>Trạng thái:</dt>
                                                        <dd className="rounded-full bg-[#F3F4F5] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                            Bản nháp cuối
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-[#FFDBCB] bg-[#FFF4EE] px-5 py-5">
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#773305]">
                                                Mẹo nhỏ
                                            </p>
                                            <p className="mt-3 text-[15px] leading-7 text-[#773305]">
                                                Đính kèm bản kế hoạch chi tiết
                                                giúp ban quản lý hiểu bối cảnh
                                                và rút ngắn thời gian phản hồi
                                                cho chiến dịch của bạn.
                                            </p>
                                        </div>
                                    </aside>
                                </div>
                            )}

                            <div className="flex flex-col gap-4 border-t border-[#C3C6D2] px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                                {createWizardStep === 1 ? (
                                    <button
                                        type="submit"
                                        onClick={() =>
                                            setCreateSubmitIntent('draft')
                                        }
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#424750] transition hover:bg-[#F3F4F5]"
                                    >
                                        <Save
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                        Lưu nháp
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCreateWizardStep(
                                                createWizardStep === 4
                                                    ? 3
                                                    : createWizardStep === 3
                                                      ? 2
                                                      : 1,
                                            )
                                        }
                                        className="inline-flex h-12 items-center justify-center rounded-xl border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#424750] transition hover:bg-[#F3F4F5]"
                                    >
                                        Quay lại
                                    </button>
                                )}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    {createWizardStep === 1 ? (
                                        <span className="text-[14px] italic leading-5 text-[#737781]">
                                            * Trường bắt buộc
                                        </span>
                                    ) : null}
                                    {createWizardStep > 1 ? (
                                        <button
                                            type="submit"
                                            onClick={() =>
                                                setCreateSubmitIntent('draft')
                                            }
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#424750] transition hover:bg-[#F3F4F5]"
                                        >
                                            <Save
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                            Lưu nháp
                                        </button>
                                    ) : null}
                                    {createWizardStep === 1 ? (
                                        <button
                                            type="button"
                                            onClick={goToScheduleStep}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,42,88,0.18)] transition hover:bg-[#0E4686]"
                                        >
                                            Tiếp theo
                                            <ArrowRight
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    ) : createWizardStep === 2 ? (
                                        <button
                                            type="button"
                                            onClick={goToVolunteerStep}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,42,88,0.18)] transition hover:bg-[#0E4686]"
                                        >
                                            Tiếp theo
                                            <ArrowRight
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    ) : createWizardStep === 3 ? (
                                        <button
                                            type="button"
                                            onClick={goToCompletionStep}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,42,88,0.18)] transition hover:bg-[#0E4686]"
                                        >
                                            Tiếp theo
                                            <ArrowRight
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            onClick={() =>
                                                setCreateSubmitIntent('next')
                                            }
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,42,88,0.18)] transition hover:bg-[#0E4686]"
                                        >
                                            Hoàn tất tạo chiến dịch
                                            <Send
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </section>
                ) : null}

                {!isCreatePage ? (
                    <>
                        <section
                            className={`${academicPanelClassName} overflow-hidden`}
                        >
                            <div className="flex flex-col gap-4 border-b border-[#C3C6D2] bg-[#F3F4F5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
                                    <label className="relative block">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#737781]" />
                                        <input
                                            className="h-12 w-full rounded-lg border border-[#C3C6D2] bg-white pl-11 pr-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                            placeholder="Tìm kiếm chiến dịch..."
                                            value={campaignSearch}
                                            onChange={(event) =>
                                                setCampaignSearch(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                    <select
                                        className={academicInputClassName}
                                        value={campaignStatusFilter}
                                        onChange={(event) =>
                                            setCampaignStatusFilter(
                                                event.target
                                                    .value as (typeof organizerStatusOptions)[number]['value'],
                                            )
                                        }
                                    >
                                        {organizerStatusOptions.map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <select
                                        className={academicInputClassName}
                                        value={campaignSort}
                                        onChange={(event) =>
                                            setCampaignSort(
                                                event.target
                                                    .value as (typeof organizerSortOptions)[number]['value'],
                                            )
                                        }
                                    >
                                        {organizerSortOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-right text-[14px] leading-5 text-[#424750]">
                                    Hiển thị{' '}
                                    <span className="font-bold text-[#002A58]">
                                        {filteredCampaigns.length}
                                    </span>{' '}
                                    trên {campaigns.length} chiến dịch
                                </p>
                            </div>

                            {loadingList ? (
                                <div className="px-5 py-10 text-[15px] text-[#424750]">
                                    Đang tải danh sách chiến dịch...
                                </div>
                            ) : filteredCampaigns.length === 0 ? (
                                <div className="px-5 py-10 text-[15px] text-[#424750]">
                                    Không tìm thấy chiến dịch phù hợp với bộ lọc
                                    hiện tại.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#C3C6D2] bg-white">
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Tên chiến dịch
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Trạng thái
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Hạng mục
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Thời gian
                                                </th>
                                                <th className="px-5 py-4 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCampaigns.map(
                                                (campaign) => (
                                                    <tr
                                                        key={campaign.id}
                                                        className={`border-b border-[#E7E8E9] transition ${
                                                            selectedCampaignId ===
                                                            campaign.id
                                                                ? 'bg-[#F3F4F5]'
                                                                : 'bg-white hover:bg-[#F8F9FA]'
                                                        }`}
                                                    >
                                                        <td className="px-5 py-5 align-top">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedCampaignId(
                                                                        campaign.id,
                                                                    )
                                                                }
                                                                className="text-left"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F5] text-[#002A58]">
                                                                        <Megaphone
                                                                            className="size-5"
                                                                            strokeWidth={
                                                                                1.75
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="line-clamp-2 text-[16px] font-semibold leading-6 text-[#002A58]">
                                                                            {toDisplayTitle(
                                                                                campaign.title,
                                                                            )}
                                                                        </p>
                                                                        <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-[#424750]">
                                                                            {toDisplayText(
                                                                                campaign.summary,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-5 align-top">
                                                            <StatusBadge
                                                                status={
                                                                    campaign.status
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-5 py-5 align-top">
                                                            <div className="flex flex-wrap gap-2">
                                                                {(
                                                                    campaign.module_types ??
                                                                    []
                                                                ).length > 0 ? (
                                                                    campaign.module_types?.map(
                                                                        (
                                                                            moduleType,
                                                                        ) => (
                                                                            <span
                                                                                key={`${campaign.id}-${moduleType}`}
                                                                                className="inline-flex items-center gap-1 rounded-full bg-[#E7E8E9] px-3 py-1 text-[12px] font-semibold text-[#424750]"
                                                                            >
                                                                                <Layers3
                                                                                    className="size-3.5"
                                                                                    strokeWidth={
                                                                                        1.75
                                                                                    }
                                                                                />
                                                                                {
                                                                                    moduleTypeLabel[
                                                                                        moduleType
                                                                                    ]
                                                                                }
                                                                            </span>
                                                                        ),
                                                                    )
                                                                ) : (
                                                                    <span className="text-[14px] text-[#737781]">
                                                                        Chưa có
                                                                        hạng mục
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5 align-top text-[14px] leading-5 text-[#424750]">
                                                            <div className="flex items-start gap-2">
                                                                <CalendarDays
                                                                    className="mt-0.5 size-4 shrink-0 text-[#737781]"
                                                                    strokeWidth={
                                                                        1.75
                                                                    }
                                                                />
                                                                <div>
                                                                    <p>
                                                                        {formatCampaignDateRange(
                                                                            campaign.start_at,
                                                                            campaign.end_at,
                                                                        )}
                                                                    </p>
                                                                    <p className="mt-1 text-[#737781]">
                                                                        Bắt đầu{' '}
                                                                        {formatCampaignDate(
                                                                            campaign.start_at,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5 align-top">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedCampaignId(
                                                                            campaign.id,
                                                                        )
                                                                    }
                                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                                                    aria-label={`Xem chi tiết ${campaign.title}`}
                                                                >
                                                                    <Eye
                                                                        className="size-4"
                                                                        strokeWidth={
                                                                            1.75
                                                                        }
                                                                    />
                                                                </button>
                                                                {selectedCampaignId ===
                                                                campaign.id ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            window.open(
                                                                                paths.app.campaigns.preview.getHref(
                                                                                    campaign.id,
                                                                                ),
                                                                                '_blank',
                                                                                'noopener,noreferrer',
                                                                            )
                                                                        }
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                                                        aria-label={`Xem trước ${campaign.title}`}
                                                                    >
                                                                        <PencilLine
                                                                            className="size-4"
                                                                            strokeWidth={
                                                                                1.75
                                                                            }
                                                                        />
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {detail ? (
                            <section className="space-y-6">
                                <div
                                    className={`${academicPanelClassName} p-6`}
                                >
                                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                                        <div className="space-y-5">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Chiến dịch đang chọn
                                                    </p>
                                                    <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                                        {toDisplayTitle(
                                                            detail.title,
                                                        )}
                                                    </h3>
                                                    <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#424750]">
                                                        {toDisplayText(
                                                            detail.summary,
                                                        )}
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    status={detail.status}
                                                />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Thời gian
                                                    </p>
                                                    <p className="mt-2 text-[14px] leading-5 text-[#191C1D]">
                                                        {formatCampaignDateRange(
                                                            detail.start_at,
                                                            detail.end_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Phạm vi
                                                    </p>
                                                    <p className="mt-2 text-[14px] leading-5 text-[#191C1D]">
                                                        {detail.scope_type ===
                                                        'PUBLIC'
                                                            ? 'Công khai'
                                                            : detail.scope_type ===
                                                                'SCHOOL'
                                                              ? 'Cấp trường'
                                                              : 'Cấp khoa'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Hạng mục
                                                    </p>
                                                    <p className="mt-2 text-[14px] leading-5 text-[#191C1D]">
                                                        {detail.modules.length}{' '}
                                                        hạng mục đang cấu hình
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-5">
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                Thao tác nhanh
                                            </p>
                                            <div className="grid gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        window.open(
                                                            paths.app.campaigns.preview.getHref(
                                                                detail.id,
                                                            ),
                                                            '_blank',
                                                            'noopener,noreferrer',
                                                        )
                                                    }
                                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C3C6D2] bg-white px-4 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                                >
                                                    <Eye
                                                        className="size-4"
                                                        strokeWidth={1.75}
                                                    />
                                                    Xem trước
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void onSubmitReview()
                                                    }
                                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#C3C6D2] bg-white px-4 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                                >
                                                    <Send
                                                        className="size-4"
                                                        strokeWidth={1.75}
                                                    />
                                                    Gửi duyệt
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void onPublish()
                                                    }
                                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002A58] px-4 text-[15px] font-semibold text-white transition hover:bg-[#0E4686]"
                                                >
                                                    <ShieldCheck
                                                        className="size-4"
                                                        strokeWidth={1.75}
                                                    />
                                                    Công khai
                                                </button>
                                                {canDeleteDraft ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void onDeleteDraftCampaign()
                                                        }
                                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#FFDAD6] bg-[#FFF1EF] px-4 text-[15px] font-semibold text-[#93000A] transition hover:bg-[#FFE4DF]"
                                                    >
                                                        <Trash2
                                                            className="size-4"
                                                            strokeWidth={1.75}
                                                        />
                                                        Xóa chiến dịch nháp
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {eventSummary ? (
                                    <div
                                        className={`${academicPanelClassName} p-6`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Dữ liệu từ wizard tạo chiến
                                                    dịch
                                                </p>
                                                <h4 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                                    Cấu hình tuyển tình nguyện
                                                    viên
                                                </h4>
                                                <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#424750]">
                                                    Tóm tắt nhanh các thông tin
                                                    đã khai báo ở bước lịch
                                                    trình, tuyển tình nguyện
                                                    viên và hoàn tất hồ sơ.
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] px-4 py-3 text-right">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Hạng mục đang đọc
                                                </p>
                                                <p className="mt-2 text-[15px] font-semibold leading-6 text-[#191C1D]">
                                                    {toDisplayTitle(
                                                        eventSummary.title,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                                            <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Địa điểm
                                                </p>
                                                <p className="mt-2 text-[15px] leading-6 text-[#191C1D]">
                                                    {eventSummary.location ||
                                                        'Chưa cấu hình'}
                                                </p>
                                                {(eventSummary.venueArea ||
                                                    eventSummary.venueCampus ||
                                                    eventSummary.venueAddress) && (
                                                    <p className="mt-2 text-[13px] leading-5 text-[#424750]">
                                                        {[
                                                            eventSummary.venueArea,
                                                            eventSummary.venueCampus,
                                                            eventSummary.venueAddress,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' | ')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Chỉ tiêu & hạn đăng ký
                                                </p>
                                                <p className="mt-2 text-[15px] leading-6 text-[#191C1D]">
                                                    {eventSummary.quota > 0
                                                        ? `${eventSummary.quota} người`
                                                        : 'Chưa cấu hình'}
                                                </p>
                                                <p className="mt-2 text-[13px] leading-5 text-[#424750]">
                                                    {eventSummary.registrationDeadline
                                                        ? `Hạn cuối: ${formatCampaignDate(eventSummary.registrationDeadline)}`
                                                        : 'Chưa có hạn đăng ký'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Tài liệu đính kèm
                                                </p>
                                                <div className="mt-2 space-y-2 text-[13px] leading-5 text-[#424750]">
                                                    <p>
                                                        Kế hoạch:{' '}
                                                        <span className="font-semibold text-[#191C1D]">
                                                            {eventSummary.planDocumentName ||
                                                                'Chưa đính kèm'}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        Phê duyệt:{' '}
                                                        <span className="font-semibold text-[#191C1D]">
                                                            {eventSummary.approvalDocumentName ||
                                                                'Chưa đính kèm'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-[#C3C6D2] bg-white p-5">
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Kỹ năng yêu cầu
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {eventSummary
                                                            .requiredSkills
                                                            .length > 0 ? (
                                                            eventSummary.requiredSkills.map(
                                                                (skill) => (
                                                                    <span
                                                                        key={
                                                                            skill
                                                                        }
                                                                        className="inline-flex items-center rounded-full bg-[#D6E3FF] px-3 py-1 text-[13px] font-semibold text-[#002A58]"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-[14px] leading-5 text-[#737781]">
                                                                Chưa khai báo kỹ
                                                                năng.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-[#C3C6D2] bg-white p-5">
                                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Quyền lợi đã công bố
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {eventSummary.benefits
                                                            .length > 0 ? (
                                                            eventSummary.benefits.map(
                                                                (benefit) => (
                                                                    <span
                                                                        key={
                                                                            benefit
                                                                        }
                                                                        className="inline-flex items-center rounded-full bg-[#FFDBCB] px-3 py-1 text-[13px] font-semibold text-[#773305]"
                                                                    >
                                                                        {
                                                                            benefit
                                                                        }
                                                                    </span>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-[14px] leading-5 text-[#737781]">
                                                                Chưa công bố
                                                                quyền lợi.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-[#C3C6D2] bg-white p-5">
                                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                    Mốc thời gian đã lưu
                                                </p>
                                                <div className="mt-4 space-y-4">
                                                    {eventSummary.timelineItems
                                                        .length > 0 ? (
                                                        eventSummary.timelineItems.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="rounded-xl border border-[#E7E8E9] bg-[#F8F9FA] p-4"
                                                                >
                                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                                        <p className="text-[15px] font-semibold leading-6 text-[#191C1D]">
                                                                            {
                                                                                item.title
                                                                            }
                                                                        </p>
                                                                        <p className="text-[13px] leading-5 text-[#424750]">
                                                                            {formatCampaignDate(
                                                                                item.date,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    {item.description ? (
                                                                        <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                                            {
                                                                                item.description
                                                                            }
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                            ),
                                                        )
                                                    ) : (
                                                        <div className="rounded-xl border border-dashed border-[#C3C6D2] bg-[#F8F9FA] px-4 py-6 text-[14px] leading-5 text-[#737781]">
                                                            Chưa có mốc thời
                                                            gian nào được lưu
                                                            trong hạng mục tuyển
                                                            tình nguyện viên.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                                    {canMutateCampaign ? (
                                        <form
                                            onSubmit={onCreateModule}
                                            className={`${academicPanelClassName} space-y-4 p-6`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D6E3FF] text-[#002A58]">
                                                    <ClipboardList
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="text-[20px] font-semibold leading-7 text-[#002A58]">
                                                        Thêm hạng mục vào chiến
                                                        dịch
                                                    </h4>
                                                    <p className="text-[14px] leading-5 text-[#424750]">
                                                        Chọn loại hạng mục và
                                                        cấu hình thông tin cơ
                                                        bản trước khi vận hành.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Loại hạng mục
                                                    </span>
                                                    <select
                                                        value={moduleForm.type}
                                                        onChange={(event) =>
                                                            setModuleForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    type: event
                                                                        .target
                                                                        .value as ModuleType,
                                                                }),
                                                            )
                                                        }
                                                        className={
                                                            academicInputClassName
                                                        }
                                                    >
                                                        <option value="fundraising">
                                                            Gây quỹ hiện kim
                                                        </option>
                                                        <option value="item_donation">
                                                            Quyên góp hiện vật
                                                        </option>
                                                        <option value="event">
                                                            Tuyển tình nguyện
                                                            viên
                                                        </option>
                                                    </select>
                                                </label>
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Tên hạng mục
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        placeholder="Nhập tên hạng mục"
                                                        value={moduleForm.title}
                                                        onChange={(event) =>
                                                            setModuleForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    title: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="block md:col-span-2">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Mô tả hạng mục
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        placeholder="Mô tả ngắn cho hạng mục"
                                                        value={
                                                            moduleForm.description
                                                        }
                                                        onChange={(event) =>
                                                            setModuleForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    description:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Bắt đầu
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        type="datetime-local"
                                                        value={
                                                            moduleForm.start_at
                                                        }
                                                        onChange={(event) =>
                                                            setModuleForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    start_at:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                        Kết thúc
                                                    </span>
                                                    <input
                                                        className={
                                                            academicInputClassName
                                                        }
                                                        type="datetime-local"
                                                        value={
                                                            moduleForm.end_at
                                                        }
                                                        onChange={(event) =>
                                                            setModuleForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    end_at: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                {moduleForm.type ===
                                                'fundraising' ? (
                                                    <>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Mục tiêu gây quỹ
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                type="number"
                                                                placeholder="Nhập mục tiêu gây quỹ"
                                                                value={
                                                                    moduleForm.target_amount ||
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            target_amount:
                                                                                Number(
                                                                                    event
                                                                                        .target
                                                                                        .value ||
                                                                                        0,
                                                                                ),
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Người thụ hưởng
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Nhập tên người thụ hưởng"
                                                                value={
                                                                    moduleForm.receiver_name
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            receiver_name:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Ngân hàng
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Nhập tên ngân hàng"
                                                                value={
                                                                    moduleForm.bank_name
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            bank_name:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Số tài khoản
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Nhập số tài khoản"
                                                                value={
                                                                    moduleForm.bank_account_no
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            bank_account_no:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    </>
                                                ) : null}
                                                {moduleForm.type ===
                                                'item_donation' ? (
                                                    <>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Địa chỉ tiếp
                                                                nhận
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Nhập địa chỉ tiếp nhận"
                                                                value={
                                                                    moduleForm.receiver_address
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            receiver_address:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Liên hệ tiếp
                                                                nhận
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Nhập người liên hệ"
                                                                value={
                                                                    moduleForm.receiver_contact
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            receiver_contact:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    </>
                                                ) : null}
                                                {moduleForm.type === 'event' ? (
                                                    <>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Chỉ tiêu tham
                                                                gia
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                type="number"
                                                                placeholder="Nhập số lượng quota"
                                                                value={
                                                                    moduleForm.quota ||
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            quota: Number(
                                                                                event
                                                                                    .target
                                                                                    .value ||
                                                                                    0,
                                                                            ),
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                                Địa điểm
                                                            </span>
                                                            <input
                                                                className={
                                                                    academicInputClassName
                                                                }
                                                                placeholder="Nhập địa điểm tổ chức"
                                                                value={
                                                                    moduleForm.location
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setModuleForm(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            location:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    </>
                                                ) : null}
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="submit"
                                                    className="inline-flex h-12 items-center justify-center rounded-xl bg-[#002A58] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0E4686]"
                                                >
                                                    Tạo hạng mục
                                                </button>
                                            </div>
                                        </form>
                                    ) : null}

                                    <aside
                                        className={`${academicPanelClassName} p-6`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E7E8E9] text-[#002A58]">
                                                <Layers3
                                                    className="size-5"
                                                    strokeWidth={1.75}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-[20px] font-semibold leading-7 text-[#002A58]">
                                                    Các hạng mục đã tạo
                                                </h4>
                                                <p className="text-[14px] leading-5 text-[#424750]">
                                                    Theo dõi nhanh trạng thái
                                                    từng hạng mục trong chiến
                                                    dịch đang chọn.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-5 space-y-3">
                                            {detail.modules.length > 0 ? (
                                                detail.modules.map((module) => (
                                                    <div
                                                        key={module.id}
                                                        className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4"
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-[15px] font-semibold leading-6 text-[#191C1D]">
                                                                    {toDisplayTitle(
                                                                        module.title,
                                                                    )}
                                                                </p>
                                                                <p className="mt-1 text-[13px] leading-5 text-[#424750]">
                                                                    {
                                                                        moduleTypeLabel[
                                                                            module
                                                                                .type
                                                                        ]
                                                                    }
                                                                </p>
                                                            </div>
                                                            <StatusBadge
                                                                status={
                                                                    module.status
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-[#C3C6D2] bg-white px-4 py-6 text-[14px] leading-5 text-[#737781]">
                                                    Chiến dịch này chưa có hạng
                                                    mục nào. Hãy tạo ít nhất một
                                                    hạng mục để bắt đầu vận
                                                    hành.
                                                </div>
                                            )}
                                        </div>
                                    </aside>
                                </div>

                                {detail.modules.some(
                                    (module) => module.type === 'fundraising',
                                ) ? (
                                    <FundraisingPanel
                                        fundraisingModuleId={
                                            fundraisingModuleId
                                        }
                                        modules={detail.modules.filter(
                                            (module) =>
                                                module.type === 'fundraising',
                                        )}
                                        config={fundraisingConfig}
                                        donations={fundraisingDonations}
                                        transactions={fundraisingTransactions}
                                        canMutateCampaign={canMutateCampaign}
                                        onModuleChange={(id) =>
                                            setFundraisingModuleId(id)
                                        }
                                        onConfigChange={(patch) =>
                                            setFundraisingConfig((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onSaveConfig={onSaveFundraisingConfig}
                                        onVerifyDonation={onVerifyDonation}
                                        onRejectDonation={onRejectDonation}
                                        onAttachTransaction={
                                            onAttachTransaction
                                        }
                                        onUnmatchTransaction={
                                            onUnmatchTransaction
                                        }
                                        managementHref={
                                            fundraisingModuleId
                                                ? paths.app.fundraisingManagement.getHref(
                                                      fundraisingModuleId,
                                                  )
                                                : undefined
                                        }
                                    />
                                ) : null}

                                {detail.modules.some(
                                    (module) => module.type === 'item_donation',
                                ) ? (
                                    <ItemDonationPanel
                                        itemModuleId={itemModuleId}
                                        modules={detail.modules.filter(
                                            (module) =>
                                                module.type === 'item_donation',
                                        )}
                                        config={itemConfig}
                                        targetForm={itemTargetForm}
                                        targets={itemTargets}
                                        pledges={itemPledges}
                                        canMutateCampaign={canMutateCampaign}
                                        onModuleChange={(id) =>
                                            setItemModuleId(id)
                                        }
                                        onConfigChange={(patch) =>
                                            setItemConfig((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onSaveConfig={onSaveItemConfig}
                                        onTargetFormChange={(patch) =>
                                            setItemTargetForm((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onCreateTarget={onCreateItemTarget}
                                        onUpdateTarget={onUpdateItemTarget}
                                        onDeleteTarget={onDeleteItemTarget}
                                        onConfirmPledge={onConfirmItemPledge}
                                        onRejectPledge={onRejectItemPledge}
                                        onHandoverPledge={onHandoverItemPledge}
                                    />
                                ) : null}

                                {detail.modules.some(
                                    (module) => module.type === 'event',
                                ) ? (
                                    <EventPanel
                                        eventModuleId={eventModuleId}
                                        modules={detail.modules.filter(
                                            (module) => module.type === 'event',
                                        )}
                                        config={eventConfig}
                                        registrations={eventRegistrations}
                                        canMutateCampaign={canMutateCampaign}
                                        onModuleChange={(id) =>
                                            setEventModuleId(id)
                                        }
                                        onConfigChange={(patch) =>
                                            setEventConfig((prev) => ({
                                                ...prev,
                                                ...patch,
                                            }))
                                        }
                                        onSaveConfig={onSaveEventConfig}
                                        onApproveRegistration={
                                            onApproveRegistration
                                        }
                                        onRejectRegistration={
                                            onRejectRegistration
                                        }
                                        onCheckInRegistration={
                                            onCheckInRegistration
                                        }
                                        onCompleteRegistration={
                                            onCompleteRegistration
                                        }
                                        managementHref={
                                            eventModuleId
                                                ? paths.app.eventManagement.getHref(
                                                      eventModuleId,
                                                  )
                                                : undefined
                                        }
                                    />
                                ) : null}
                            </section>
                        ) : (
                            <section
                                className={`${academicPanelClassName} p-6 text-[15px] leading-6 text-[#424750]`}
                            >
                                Chưa có chiến dịch để vận hành. Hãy tạo chiến
                                dịch mới hoặc chọn một chiến dịch từ bảng bên
                                trên.
                            </section>
                        )}
                    </>
                ) : null}
                {actionDialog && actionDialogConfig ? (
                    <ActionDrawer
                        open
                        onOpenChange={(open) => {
                            if (!open) {
                                closeActionDialog();
                            }
                        }}
                        title={actionDialogConfig.title}
                        description={actionDialogConfig.description}
                        label={actionDialogConfig.label}
                        value={actionDialog.value}
                        onValueChange={(value) =>
                            setActionDialog((current) =>
                                current ? { ...current, value } : current,
                            )
                        }
                        submitLabel={actionDialogConfig.submitLabel}
                        placeholder={actionDialogConfig.placeholder}
                        fieldType={actionDialogConfig.fieldType}
                        required={actionDialogConfig.required}
                        isSubmitting={submittingActionDialog}
                        onSubmit={submitActionDialog}
                    />
                ) : null}
            </div>
        </ContentLayout>
    );
};
