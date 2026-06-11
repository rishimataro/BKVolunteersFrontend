/* eslint-disable */

// @ts-nocheck

import * as React from 'react';

import { Link, useNavigate } from 'react-router';

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

    MapPin,

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

import { Head } from '@/components/seo';

import { ActionDrawer } from '@/components/ui/action-drawer';
import { Button } from '@/components/ui/button';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';

import { useNotifications } from '@/components/ui/notifications';

import { paths } from '@/config/paths';

import { ROLES, useUser } from '@/features/auth';

import { getPublicCampaigns } from '@/features/campaign/api/public';

import {

    createCampaignModule,

    createManagedCampaign,

    deleteManagedCampaign,

    endManagedCampaignEarly,

    extendManagedCampaign,

    getManagedCampaignDetail,

    getManagedCampaigns,

    saveCampaignCompletionReport,

    publishCampaign,

    submitCampaignReview,

    updateManagedCampaign,

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

    extendFundraisingDeadline,

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

    bulkApproveEventRegistrations,

    checkInEventRegistration,

    completeEventRegistration,

    extendEventRegistrationDeadline,

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

import { ManagedCampaignWorkspace } from '@/features/campaign/components/managed-campaign-workspace';

import { formatLocationValue } from '@/features/locations/api/locations';

import { LocationPickerDialog } from '@/features/locations/components/location-picker-dialog';

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

import {

    listOrganizations,

    type OrganizationCard,

} from '@/features/organizations/api/organizations';

import { StatusBadge } from '@/features/campaign/components/status-badge';

import type { Meta, ModuleType, PublicCampaignCard } from '@/types/api';

import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

import { CampaignCreateFlowRoute } from './campaign-create-flow';



type CampaignModuleFilterValue =

    | ModuleType

    | 'volunteer'

    | 'ALL';



const moduleTypeLabel: Record<string, string> = {

    fundraising: 'Gây quỹ hiện kim',

    item_donation: 'Quyên góp hiện vật',

    event: 'Hoạt động / sự kiện',

    volunteer: 'Tuyển tình nguyện viên',

};



export const CampaignsRoute = () => <CampaignsScreen mode="manage" />;



export const CampaignCreateRoute = () => <CampaignCreateFlowRoute />;



const publicModuleOptions: Array<{

    value: ModuleType | 'volunteer' | '';

    label: string;

}> = [

    { value: '', label: 'Tất cả hạng mục' },

    { value: 'fundraising', label: 'Gây quỹ' },

    { value: 'item_donation', label: 'Quyên góp hiện vật' },

    { value: 'event', label: 'Hoạt động / sự kiện' },

    { value: 'volunteer', label: 'Tuyển tình nguyện viên' },

];



const organizerStatusOptions = [

    { value: 'ALL', label: 'Tất cả trạng thái' },

    { value: 'DRAFT', label: 'Chiến dịch nháp' },

    { value: 'SUBMITTED', label: 'Chiến dịch đã gửi duyệt' },

    { value: 'PRE_APPROVED', label: 'Chiến dịch đã sơ duyệt' },

    { value: 'APPROVED', label: 'Chiến dịch đã được duyệt chính thức' },

    { value: 'PUBLISHED', label: 'Chiến dịch đã được công khai' },

] as const;



const organizerStatusLabel: Record<string, string> = Object.fromEntries(

    organizerStatusOptions

        .filter((o) => o.value !== 'ALL')

        .map((o) => [o.value, o.label]),

);



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



const normalizeCampaignModuleType = (value: unknown): ModuleType | 'volunteer' => {

    const normalized = String(value ?? '')

        .trim()

        .toUpperCase();



    if (normalized === 'FUNDRAISING_MONEY' || normalized === 'FUNDRAISING') {

        return 'fundraising';

    }



    if (normalized === 'ITEM_DONATION') {

        return 'item_donation';

    }



    if (normalized === 'EVENT') {

        return 'event';

    }



    return 'volunteer';

};



const normalizeManagedCampaignItem = (campaign: ManagedCampaignItem) => ({

    ...campaign,

    module_types: Array.from(

        new Set((campaign.module_types ?? []).map(normalizeCampaignModuleType)),

    ),

});



const getCampaignOrganizationLabel = (organizationId: string) => {

    if (!organizationId) {

        return 'Chưa xác định đơn vị';

    }



    if (organizationId === 'doan-truong') {

        return 'Đoàn trường';

    }



    if (organizationId.startsWith('faculty-')) {

        return `Khoa ${organizationId.replace('faculty-', '')}`;

    }



    if (organizationId.startsWith('club-')) {

        return `Câu lạc bộ ${organizationId.replace('club-', '').toUpperCase()}`;

    }



    return organizationId;

};



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



type StudentCampaignStage = 'ONGOING' | 'UPCOMING' | 'ENDED';

type StudentDiscoveryView = 'grid' | 'list';



const studentDiscoveryPageSize = 6;



const studentStageOptions: Array<{

    value: StudentCampaignStage;

    label: string;

}> = [

    { value: 'ONGOING', label: 'Đang diễn ra' },

    { value: 'UPCOMING', label: 'Sắp diễn ra' },

    { value: 'ENDED', label: 'Đã kết thúc' },

];



const formatStudentDiscoveryDate = (value: string) =>

    new Intl.DateTimeFormat('vi-VN', {

        day: '2-digit',

        month: '2-digit',

        year: 'numeric',

    }).format(new Date(value));



const formatStudentDiscoveryMoney = (value: number) =>

    new Intl.NumberFormat('vi-VN').format(value);



const resolveStudentCampaignStage = (

    campaign: PublicCampaignCard,

): StudentCampaignStage => {

    const now = Date.now();

    const startAt = new Date(campaign.start_at).getTime();

    const endAt = new Date(campaign.end_at).getTime();



    if (Number.isFinite(endAt) && now > endAt) {

        return 'ENDED';

    }



    if (Number.isFinite(startAt) && now < startAt) {

        return 'UPCOMING';

    }



    return 'ONGOING';

};



const getStudentCampaignStageLabel = (stage: StudentCampaignStage) => {

    if (stage === 'UPCOMING') {

        return 'Sắp diễn ra';

    }



    if (stage === 'ENDED') {

        return 'Đã kết thúc';

    }



    return 'Đang diễn ra';

};



const getStudentCampaignStageClassName = (stage: StudentCampaignStage) => {

    if (stage === 'UPCOMING') {

        return 'border-destructive bg-[#FEF2F2] text-[#991B1B]';

    }



    if (stage === 'ENDED') {

        return 'border-input bg-muted text-muted-foreground';

    }



    return 'border-primary bg-primary text-white';

};



const getStudentCampaignMetric = (campaign: PublicCampaignCard) => {

    const primaryModule =

        campaign.progress.modules.find((module) =>

            campaign.module_types.includes(module.type),

        ) ?? campaign.progress.modules[0];



    if (!primaryModule) {

        return {

            label: 'Tiến độ chiến dịch',

            value: `${campaign.progress.percent}%`,

            percent: campaign.progress.percent,

        };

    }



    if (primaryModule.type === 'fundraising') {

        return {

            label: 'Mốc gây quỹ',

            value: `${formatStudentDiscoveryMoney(primaryModule.current)} / ${formatStudentDiscoveryMoney(primaryModule.target)} d`,

            percent: primaryModule.percent,

        };

    }



    if (primaryModule.type === 'item_donation') {

        return {

            label: 'Hiện vật tiếp nhận',

            value: `${primaryModule.current}/${primaryModule.target}`,

            percent: primaryModule.percent,

        };

    }



    return {

        label: 'Tình nguyện viên',

        value: `${primaryModule.current}/${primaryModule.target}`,

        percent: primaryModule.percent,

    };

};



const getStudentCampaignPageItems = (

    page: number,

    totalPages: number,

): Array<number | 'ellipsis'> => {

    if (totalPages <= 5) {

        return Array.from({ length: totalPages }, (_, index) => index + 1);

    }



    if (page <= 3) {

        return [1, 2, 3, 4, 'ellipsis', totalPages];

    }



    if (page >= totalPages - 2) {

        return [

            1,

            'ellipsis',

            totalPages - 3,

            totalPages - 2,

            totalPages - 1,

            totalPages,

        ];

    }



    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];

};

const managedCampaignPageSize = 10;



const StudentDiscoveryCard = ({

    campaign,

    view,

}: {

    campaign: PublicCampaignCard;

    view: StudentDiscoveryView;

}) => {

    const stage = resolveStudentCampaignStage(campaign);

    const metric = getStudentCampaignMetric(campaign);

    const detailHref = paths.app.campaigns.detail.getHref(campaign.slug);

    const moduleSummary = campaign.module_types

        .map((type) =>

            publicModuleOptions.find((option) => option.value === type),

        )

        .filter((option): option is { value: ModuleType | ''; label: string } =>

            Boolean(option),

        )

        .map((option) => option.label)

        .join(' / ');



    return (

        <article

            className={`border border-border bg-white ${

                view === 'list'

                    ? 'grid gap-0 md:grid-cols-[240px_minmax(0,1fr)]'

                    : 'flex h-full flex-col'

            }`}

        >

            <div

                className={`relative overflow-hidden border-b border-border bg-[#F3F4F6] ${

                    view === 'list' ? 'md:border-b-0 md:border-r' : ''

                }`}

            >

                {campaign.cover_image_url ? (

                    <img

                        src={campaign.cover_image_url}

                        alt={toDisplayTitle(campaign.title)}

                        className={`w-full object-cover ${

                            view === 'list'

                                ? 'h-full min-h-[220px]'

                                : 'h-[220px]'

                        }`}

                    />

                ) : (

                    <div

                        className={`flex items-center justify-center bg-[#F3F4F6] px-6 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${

                            view === 'list'

                                ? 'h-full min-h-[220px]'

                                : 'h-[220px]'

                        }`}

                    >

                        BK Volunteers

                    </div>

                )}

                <span

                    className={`absolute left-4 top-4 inline-flex border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStudentCampaignStageClassName(

                        stage,

                    )}`}

                >

                    {getStudentCampaignStageLabel(stage)}

                </span>

            </div>



            <div className="flex flex-col min-h-full p-5">

                <div className="min-w-0">

                    <p className="broadsheet-kicker text-muted-foreground">

                        {toDisplayTitle(campaign.organization.name)}

                    </p>

                    <h2 className="mt-3 font-heading text-[28px] leading-[1.2] font-bold text-primary">

                        {toDisplayTitle(campaign.title)}

                    </h2>

                </div>



                <p className="mt-3 text-[16px] leading-[1.7] text-muted-foreground">

                    {toDisplayText(campaign.summary)}

                </p>



                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] leading-6 text-muted-foreground">

                    <span className="inline-flex items-center gap-2">

                        <Building2 className="size-4" strokeWidth={1.75} />

                        {toDisplayTitle(campaign.organization.name)}

                    </span>

                    <span className="inline-flex items-center gap-2">

                        <Layers3 className="size-4" strokeWidth={1.75} />

                        {moduleSummary}

                    </span>

                    <span className="inline-flex items-center gap-2">

                        <CalendarDays className="size-4" strokeWidth={1.75} />

                        {formatStudentDiscoveryDate(campaign.start_at)} -{' '}

                        {formatStudentDiscoveryDate(campaign.end_at)}

                    </span>

                </div>



                <div className="pt-4 mt-6 border-t border-border">

                    <div className="flex items-center justify-between gap-3 text-[14px] leading-6">

                        <p className="font-semibold text-primary">

                            {metric.label}

                        </p>

                        <p className="font-semibold text-primary">

                            {metric.value}

                        </p>

                    </div>

                    <div className="mt-2 h-2 bg-[#E5E7EB]">

                        <div

                            className="h-2 bg-primary"

                            style={{

                                width: `${Math.max(

                                    0,

                                    Math.min(100, metric.percent),

                                )}%`,

                            }}

                        />

                    </div>

                </div>



                <div className="flex items-center justify-between gap-4 pt-4 mt-5 border-t border-border">

                    <span className="broadsheet-kicker text-muted-foreground">

                        H? s? chi?n d?ch

                    </span>

                    <Link

                        to={detailHref}

                        className="inline-flex items-center gap-2 border border-primary px-4 py-2 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-white"

                    >

                        Xem chi tiết

                        <ArrowRight className="size-4" strokeWidth={1.75} />

                    </Link>

                </div>

            </div>

        </article>

    );

};



const StudentCampaignDiscovery = () => {

    const [searchQuery, setSearchQuery] = React.useState('');

    const deferredSearchQuery = React.useDeferredValue(searchQuery);

    const [selectedOrganizationId, setSelectedOrganizationId] =

        React.useState('');

    const [selectedModuleType, setSelectedModuleType] = React.useState<

        ModuleType | ''

    >('');

    const [selectedStages, setSelectedStages] = React.useState<

        StudentCampaignStage[]

    >(['ONGOING']);

    const [view, setView] = React.useState<StudentDiscoveryView>('grid');

    const [currentPage, setCurrentPage] = React.useState(1);

    const [campaignItems, setCampaignItems] = React.useState<

        PublicCampaignCard[]

    >([]);

    const [organizations, setOrganizations] = React.useState<

        OrganizationCard[]

    >([]);

    const [meta, setMeta] = React.useState<Meta | null>(null);

    const [isLoading, setIsLoading] = React.useState(true);

    const [error, setError] = React.useState<string | null>(null);



    React.useEffect(() => {

        let mounted = true;



        void listOrganizations()

            .then((items) => {

                if (!mounted) return;

                setOrganizations(items);

            })

            .catch(() => {

                if (!mounted) return;

                setOrganizations([]);

            });



        return () => {

            mounted = false;

        };

    }, []);



    React.useEffect(() => {

        let mounted = true;

        setIsLoading(true);

        setError(null);



        void getPublicCampaigns({

            q: deferredSearchQuery.trim() || undefined,

            organization_id: selectedOrganizationId || undefined,

            module_type: selectedModuleType || undefined,

            page: 1,

            limit: 24,

        })

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

    }, [deferredSearchQuery, selectedModuleType, selectedOrganizationId]);



    React.useEffect(() => {

        setCurrentPage(1);

    }, [

        deferredSearchQuery,

        selectedModuleType,

        selectedOrganizationId,

        selectedStages,

    ]);



    const filteredCampaigns = React.useMemo(() => {

        if (selectedStages.length === 0) {

            return campaignItems;

        }



        return campaignItems.filter((campaign) =>

            selectedStages.includes(resolveStudentCampaignStage(campaign)),

        );

    }, [campaignItems, selectedStages]);



    const totalPages = Math.max(

        1,

        Math.ceil(filteredCampaigns.length / studentDiscoveryPageSize),

    );

    const currentPageSafe = Math.min(currentPage, totalPages);

    const pagedCampaigns = React.useMemo(() => {

        const startIndex = (currentPageSafe - 1) * studentDiscoveryPageSize;

        return filteredCampaigns.slice(

            startIndex,

            startIndex + studentDiscoveryPageSize,

        );

    }, [currentPageSafe, filteredCampaigns]);

    const visibleStart =

        filteredCampaigns.length === 0

            ? 0

            : (currentPageSafe - 1) * studentDiscoveryPageSize + 1;

    const visibleEnd =

        filteredCampaigns.length === 0

            ? 0

            : Math.min(

                  filteredCampaigns.length,

                  currentPageSafe * studentDiscoveryPageSize,

              );

    const pageItems = getStudentCampaignPageItems(currentPageSafe, totalPages);



    const toggleStage = (stage: StudentCampaignStage) => {

        setSelectedStages((current) =>

            current.includes(stage)

                ? current.filter((item) => item !== stage)

                : [...current, stage],

        );

    };



    const resetFilters = () => {

        setSearchQuery('');

        setSelectedOrganizationId('');

        setSelectedModuleType('');

        setSelectedStages(['ONGOING']);

        setCurrentPage(1);

    };



    return (

        <>

            <Head title="Khám phá chiến dịch" />

            <div className="bg-white">

                <section className="pb-6 border-b border-border">

                    <p className="broadsheet-kicker">Khu vực sinh viên</p>

                    <div className="flex flex-col gap-5 mt-3 xl:flex-row xl:items-end xl:justify-between">

                        <div className="max-w-4xl">

                            <h2 className="font-heading text-[42px] leading-[1.05] font-bold text-primary sm:text-[56px]">

                                Khám phá chiến dịch

                            </h2>

                            <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">

                                Theo dõi các chi?n ??ch công khai, tìm ??n v? t?

                                ch?c phù h?p và m? h? so tham gia ngay t? c?ng

                                sinh viên.

                            </p>

                        </div>

                        <div

                            className="inline-flex w-full bg-white border border-input xl:w-auto"

                            role="group"

                            aria-label="Chế độ hiển thị"

                        >

                            <button

                                type="button"

                                aria-pressed={view === 'grid'}

                                onClick={() => setView('grid')}

                                className={`px-4 py-3 text-[14px] font-semibold transition ${

                                    view === 'grid'

                                        ? 'bg-primary text-white'

                                        : 'text-muted-foreground hover:bg-muted'

                                }`}

                            >

                                Lưới

                            </button>

                            <button

                                type="button"

                                aria-pressed={view === 'list'}

                                onClick={() => setView('list')}

                                className={`border-l border-input px-4 py-3 text-[14px] font-semibold transition ${

                                    view === 'list'

                                        ? 'bg-primary text-white'

                                        : 'text-muted-foreground hover:bg-muted'

                                }`}

                            >

                                Danh sách

                            </button>

                        </div>

                    </div>

                </section>



                <section className="grid gap-8 pt-8 xl:grid-cols-[300px_minmax(0,1fr)]">

                    <aside className="space-y-6">

                        <div className="p-5 bg-white border border-border">

                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">

                                <div>

                                    <p className="broadsheet-kicker">

                                        Bộ lọc tìm kiếm

                                    </p>

                                    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">

                                        Thu h?p danh sách theo ??n v?, lo?i hình

                                        và tr?ng thái th?i gian.

                                    </p>

                                </div>

                                <button

                                    type="button"

                                    onClick={resetFilters}

                                    className="text-[13px] font-semibold text-muted-foreground transition hover:text-primary"

                                >

                                    Xóa tất cả

                                </button>

                            </div>



                            <div className="mt-5 space-y-5">

                                <div>

                                    <label

                                        htmlFor="student-campaign-search"

                                        className="broadsheet-kicker"

                                    >

                                        Tìm kiếm

                                    </label>

                                    <div className="relative mt-2">

                                        <Search

                                            className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 size-4 text-muted-foreground"

                                            strokeWidth={1.75}

                                        />

                                        <input

                                            id="student-campaign-search"

                                            value={searchQuery}

                                            onChange={(event) =>

                                                setSearchQuery(

                                                    event.target.value,

                                                )

                                            }

                                            className="w-full pl-10 broadsheet-input"

                                            placeholder="Tên chiến dịch hoặc đơn vị"

                                            type="text"

                                        />

                                    </div>

                                </div>



                                <div>

                                    <p className="broadsheet-kicker">

                                        Trạng thái

                                    </p>

                                    <div className="mt-3 space-y-3">

                                        {studentStageOptions.map((option) => (

                                            <label

                                                key={option.value}

                                                className="flex items-center gap-3 text-[15px] text-primary"

                                            >

                                                <input

                                                    type="checkbox"

                                                    checked={selectedStages.includes(

                                                        option.value,

                                                    )}

                                                    onChange={() =>

                                                        toggleStage(

                                                            option.value,

                                                        )

                                                    }

                                                    aria-label={option.label}

                                                    className="w-4 h-4 border border-input text-primary focus:ring-0"

                                                />

                                                <span>{option.label}</span>

                                            </label>

                                        ))}

                                    </div>

                                </div>



                                <div>

                                    <label

                                        htmlFor="student-campaign-organization"

                                        className="broadsheet-kicker"

                                    >

                                        Đon v? t? ch?c

                                    </label>

                                    <select

                                        id="student-campaign-organization"

                                        value={selectedOrganizationId}

                                        onChange={(event) =>

                                            setSelectedOrganizationId(

                                                event.target.value,

                                            )

                                        }

                                        className="mt-2 broadsheet-select"

                                    >

                                        <option value="">T?t c? ??n v?</option>

                                        {organizations.map((organization) => (

                                            <option

                                                key={organization.id}

                                                value={organization.id}

                                            >

                                                {organization.name}

                                            </option>

                                        ))}

                                    </select>

                                </div>



                                <div>

                                    <p className="broadsheet-kicker">

                                        Lo?i hình

                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-3">

                                        {publicModuleOptions

                                            .filter((option) => option.value)

                                            .map((option) => {

                                                const isActive =

                                                    selectedModuleType ===

                                                    option.value;



                                                return (

                                                    <button

                                                        key={option.value}

                                                        type="button"

                                                        aria-pressed={isActive}

                                                        onClick={() =>

                                                            setSelectedModuleType(

                                                                isActive

                                                                    ? ''

                                                                    : (option.value as ModuleType),

                                                            )

                                                        }

                                                        className={`border px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.12em] transition ${

                                                            isActive

                                                                ? 'border-primary bg-primary text-white'

                                                                : 'border-input text-muted-foreground hover:border-primary hover:text-primary'

                                                        }`}

                                                    >

                                                        {option.label}

                                                    </button>

                                                );

                                            })}

                                    </div>

                                </div>

                            </div>

                        </div>



                        <div className="p-5 text-white border border-primary bg-primary">

                            <p className="broadsheet-kicker text-white/70">

                                C? h?i tham gia

                            </p>

                            <h3 className="mt-3 font-heading text-[32px] leading-[1.1] font-bold">

                                Tr? thành ??i s?

                            </h3>

                            <p className="mt-3 text-[16px] leading-[1.7] text-white/80">

                                K?t n?i thêm sinh viên quan tâm, theo dõi chi?n

                                ??ch n?i b?t và nh?n thông báo s?m v? ??t m?

                                dang ký ti?p theo.

                            </p>

                            <button

                                type="button"

                                className="mt-5 inline-flex items-center gap-2 border border-white bg-white px-4 py-2 text-[14px] font-semibold text-primary transition hover:bg-transparent hover:text-white"

                            >

                                Tìm hi?u thêm

                                <ArrowRight

                                    className="size-4"

                                    strokeWidth={1.75}

                                />

                            </button>

                        </div>

                    </aside>



                    <div className="space-y-6">

                        <div className="flex flex-col gap-3 pb-4 border-b border-border lg:flex-row lg:items-center lg:justify-between">

                            <div>

                                <p className="broadsheet-kicker">

                                    Toàn c?nh danh m?c

                                </p>

                                <p className="mt-2 text-[16px] leading-7 text-muted-foreground">

                                    Hi?n th? {visibleStart}-{visibleEnd} trên{' '}

                                    {filteredCampaigns.length} chi?n ??ch phù

                                    h?p. Ngu?n ?? li?u hi?n có{' '}

                                    {meta?.total ?? campaignItems.length} chi?n

                                    ??ch công khai.

                                </p>

                            </div>

                            <div className="border border-border bg-muted px-4 py-3 text-[14px] leading-6 text-muted-foreground">

                                B? l?c th?i gian áp ??ng tr?c ti?p trên danh

                                sách khám phá dành cho sinh viên.

                            </div>

                        </div>



                        {isLoading ? <LoadingState /> : null}

                        {error ? <ErrorState message={error} /> : null}

                        {!isLoading &&

                        !error &&

                        filteredCampaigns.length === 0 ? (

                            <EmptyState

                                title="Chưa có chiến dịch phù hợp"

                                description="Thử thay đổi bộ lọc hoặc quay lại sau để xem những chiến dịch mới được công khai."

                            />

                        ) : null}



                        {!isLoading &&

                        !error &&

                        filteredCampaigns.length > 0 ? (

                            <>

                                <div

                                    className={

                                        view === 'grid'

                                            ? 'grid gap-6 md:grid-cols-2'

                                            : 'grid gap-4'

                                    }

                                >

                                    {pagedCampaigns.map((campaign) => (

                                        <StudentDiscoveryCard

                                            key={campaign.id}

                                            campaign={campaign}

                                            view={view}

                                        />

                                    ))}

                                </div>



                                <div className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-border">

                                    <button

                                        type="button"

                                        onClick={() =>

                                            setCurrentPage((current) =>

                                                Math.max(1, current - 1),

                                            )

                                        }

                                        disabled={currentPageSafe <= 1}

                                        className="border border-input px-4 py-2 text-[14px] font-semibold text-primary transition hover:bg-muted disabled:cursor-not-allowed disabled:text-[#9CA3AF]"

                                    >

                                        Trang tr??c

                                    </button>



                                    {pageItems.map((item, index) =>

                                        item === 'ellipsis' ? (

                                            <span

                                                key={`${item}-${index}`}

                                                className="px-2 text-[14px] text-muted-foreground"

                                            >

                                                ...

                                            </span>

                                        ) : (

                                            <button

                                                key={item}

                                                type="button"

                                                aria-label={`Trang ${item}`}

                                                onClick={() =>

                                                    setCurrentPage(item)

                                                }

                                                className={`min-w-10 border px-3 py-2 text-[14px] font-semibold transition ${

                                                    item === currentPageSafe

                                                        ? 'border-primary bg-primary text-white'

                                                        : 'border-input text-primary hover:bg-muted'

                                                }`}

                                            >

                                                {item}

                                            </button>

                                        ),

                                    )}



                                    <button

                                        type="button"

                                        onClick={() =>

                                            setCurrentPage((current) =>

                                                Math.min(

                                                    totalPages,

                                                    current + 1,

                                                ),

                                            )

                                        }

                                        disabled={currentPageSafe >= totalPages}

                                        className="border border-input px-4 py-2 text-[14px] font-semibold text-primary transition hover:bg-muted disabled:cursor-not-allowed disabled:text-[#9CA3AF]"

                                    >

                                        Trang sau

                                    </button>

                                </div>

                            </>

                        ) : null}

                    </div>

                </section>

            </div>

        </>

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

    const [loadingDetail, setLoadingDetail] = React.useState(false);

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

    const [isModuleLocationDialogOpen, setIsModuleLocationDialogOpen] =

        React.useState(false);

    const [campaignSearch, setCampaignSearch] = React.useState('');

    const deferredCampaignSearch = React.useDeferredValue(campaignSearch);

    const [campaignStatusFilter, setCampaignStatusFilter] =

        React.useState<(typeof organizerStatusOptions)[number]['value']>('ALL');

    const [campaignSort, setCampaignSort] =

        React.useState<(typeof organizerSortOptions)[number]['value']>(

            'newest',

        );

    const [campaignModuleFilter, setCampaignModuleFilter] =

        React.useState<CampaignModuleFilterValue>('ALL');

    const [managedCampaignPage, setManagedCampaignPage] = React.useState(1);

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

    const useManagedCampaignDetailDialog = canManageCampaign;

    const organizerName =

        user.data?.organization?.name ?? 'Đơn vị đang đăng nhập';

    const reportActor = {

        fullName:

            user.data?.fullName ||

            [user.data?.firstName, user.data?.lastName]

                .filter(Boolean)

                .join(' ')

                .trim() ||

            user.data?.username ||

            'Người phụ trách chiến dịch',

        roleLabel:

            role === ROLES.LCD

                ? 'Liên chi doàn khoa'

                : role === ROLES.CLB

                  ? 'Câu lạc bộ'

                  : 'Đơn vị quản lý',

        organizationName: organizerName,

    };

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

        const normalizedQuery = deferredCampaignSearch.trim().toLowerCase();

        const nextItems = campaigns.filter((campaign) => {

            const matchesQuery =

                normalizedQuery.length === 0 ||

                campaign.title.toLowerCase().includes(normalizedQuery) ||

                campaign.summary.toLowerCase().includes(normalizedQuery);

            const matchesStatus =

                campaignStatusFilter === 'ALL' ||

                campaign.status === campaignStatusFilter;

            const matchesModule =

                campaignModuleFilter === 'ALL' ||

                (campaign.module_types ?? []).includes(campaignModuleFilter);



            return matchesQuery && matchesStatus && matchesModule;

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

    }, [

        campaignModuleFilter,

        deferredCampaignSearch,

        campaignSort,

        campaignStatusFilter,

        campaigns,

    ]);



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

    const totalManagedCampaignPages = React.useMemo(
        () =>
            Math.max(
                1,
                Math.ceil(
                    filteredCampaigns.length / managedCampaignPageSize,
                ),
            ),
        [filteredCampaigns.length],
    );

    const currentManagedCampaignPage = React.useMemo(
        () =>
            filteredCampaigns.length === 0
                ? 1
                : Math.min(managedCampaignPage, totalManagedCampaignPages),
        [filteredCampaigns.length, managedCampaignPage, totalManagedCampaignPages],
    );

    const pagedManagedCampaigns = React.useMemo(() => {
        const startIndex =
            (currentManagedCampaignPage - 1) * managedCampaignPageSize;

        return filteredCampaigns.slice(
            startIndex,
            startIndex + managedCampaignPageSize,
        );
    }, [currentManagedCampaignPage, filteredCampaigns]);

    const managedCampaignPageItems = React.useMemo(
        () =>
            getStudentCampaignPageItems(
                currentManagedCampaignPage,
                totalManagedCampaignPages,
            ),
        [currentManagedCampaignPage, totalManagedCampaignPages],
    );

    const managedCampaignStartIndex =
        filteredCampaigns.length === 0
            ? 0
            : (currentManagedCampaignPage - 1) * managedCampaignPageSize + 1;

    const managedCampaignEndIndex =
        filteredCampaigns.length === 0
            ? 0
            : Math.min(
                  currentManagedCampaignPage * managedCampaignPageSize,
                  filteredCampaigns.length,
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

    React.useEffect(() => {
        setManagedCampaignPage(1);
    }, [
        deferredCampaignSearch,
        campaignStatusFilter,
        campaignModuleFilter,
        campaignSort,
    ]);



    const loadCampaigns = React.useCallback(async () => {

        if (!canManageCampaign) return;

        setLoadingList(true);

        try {

            const data = await getManagedCampaigns({

                page: 1,

                limit: 100,

                q: deferredCampaignSearch.trim() || undefined,

                status:

                    campaignStatusFilter === 'ALL'

                        ? undefined

                        : campaignStatusFilter,

                module_type:

                    campaignModuleFilter === 'ALL'

                        ? undefined

                        : (campaignModuleFilter as any),

            });

            const normalizedData = data.map(normalizeManagedCampaignItem);

            setCampaigns(normalizedData);

            if (normalizedData.length === 0) {

                setSelectedCampaignId(null);

                return;

            }

            const hasSelectedCampaign =

                !!selectedCampaignId &&

                normalizedData.some(

                    (campaign) => campaign.id === selectedCampaignId,

                );



            if (useManagedCampaignDetailDialog) {

                if (!hasSelectedCampaign) {

                    setSelectedCampaignId(null);

                }

                return;

            }



            if (!hasSelectedCampaign) {

                setSelectedCampaignId(normalizedData[0].id);

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

    }, [

        addNotification,

        canManageCampaign,

        campaignModuleFilter,

        campaignStatusFilter,

        deferredCampaignSearch,

        selectedCampaignId,

        useManagedCampaignDetailDialog,

    ]);



    const loadCampaignDetail = React.useCallback(

        async (campaignId: string) => {

            setLoadingDetail(true);

            setDetail(null);

            try {

                const data = await getManagedCampaignDetail(campaignId);

                setDetail(data);

                const modules = data.modules.map((module) => ({

                    ...module,

                    normalizedType: normalizeCampaignModuleType(module.type),

                }));

                setFundraisingModuleId(

                    modules.find((module) => module.normalizedType === 'fundraising')

                        ?.id ?? '',

                );

                setItemModuleId(

                    modules.find(

                        (module) => module.normalizedType === 'item_donation',

                    )?.id ?? '',

                );

                setEventModuleId(

                    modules.find(

                        (module) =>

                            module.normalizedType === 'event' ||

                            module.normalizedType === 'volunteer',

                    )

                        ?.id ?? '',

                );

            } catch (error) {

                addNotification({

                    type: 'error',

                    title: 'Không tải được chi tiết chiến dịch',

                    message:

                        error instanceof Error ? error.message : 'Lỗi hệ thống',

                });

            } finally {

                setLoadingDetail(false);

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

            setLoadingDetail(false);

            setFundraisingModuleId('');

            setItemModuleId('');

            setEventModuleId('');

            return;

        }

        void loadCampaignDetail(selectedCampaignId);

    }, [loadCampaignDetail, selectedCampaignId]);



    const closeManagedCampaignDetailDialog = React.useCallback(() => {

        setSelectedCampaignId(null);

    }, []);



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

                        ? `H?n cu?i dang ký: ${formatCampaignDate(

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



        if (!['DRAFT', 'REVISION_REQUIRED'].includes(detail.status)) {

            addNotification({

                type: 'error',

                title: 'Không thể gửi duyệt',

                message:

                    'Chỉ có thể gửi duyệt chiến dịch đang ở trạng thái nháp hoặc cần chỉnh sửa.',

            });

            return;

        }



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



        if (detail.status !== 'APPROVED') {

            addNotification({

                type: 'error',

                title: 'Chưa thể công khai',

                message:

                    'Chiến dịch chỉ được công khai sau khi Đoàn trường phê duyệt.',

            });

            return;

        }



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



    const onHandoverItemPledge = async (

        pledgeId: string,

        payload: {

            received_quantity: number;

            received_at?: string;

            note?: string;

        },

    ) => {

        try {

            await handoverItemPledge(pledgeId, payload);

            addNotification({

                type: 'success',

                title: 'Đã ghi nhận bàn giao',

                message: `Pledge #${pledgeId} đã cập nhật trạng thái đã nhận`,

            });

            if (itemModuleId) {

                await loadItemData(itemModuleId);

            }

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Ghi nhận bàn giao thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

        }

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



    const onBulkApproveRegistrations = async (registrationIds: string[]) => {

        if (!eventModuleId || registrationIds.length === 0) return;

        try {

            const result = await bulkApproveEventRegistrations(eventModuleId, {

                registration_ids: registrationIds,

            });

            addNotification({

                type: 'success',

                title: 'Đã duyệt hàng loạt',

                message: `Đã duyệt ${result.approved_count} đăng ký tình nguyện viên.`,

            });

            await loadEventData(eventModuleId);

            await loadCampaignDetail(detail?.id ?? selectedCampaignId ?? '');

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Duyệt hàng loạt thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

        }

    };



    const onExtendVolunteerDeadline = async (payload: {

        end_at: string;

        reason?: string;

        notify_participants?: boolean;

    }) => {

        if (!eventModuleId) return;

        try {

            await extendEventRegistrationDeadline(eventModuleId, payload);

            addNotification({

                type: 'success',

                title: 'Đã gia hạn tuyển tình nguyện viên',

                message: 'Hạn đăng ký mới đã được cập nhật.',

            });

            await Promise.all([

                loadEventData(eventModuleId),

                loadCampaignDetail(detail?.id ?? selectedCampaignId ?? ''),

                loadCampaigns(),

            ]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Gia hạn thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

        }

    };

    const onEndVolunteerEarly = async (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => {
        if (!detail || !eventModuleId) return;

        try {
            await endManagedCampaignEarly(detail.id, {
                module_id: eventModuleId,
                ...payload,
            });

            addNotification({
                type: 'success',
                title: 'Đã kết thúc sớm hạng mục tình nguyện viên',
                message: 'Thời gian của hạng mục đã được cập nhật theo mốc kết thúc mới.',
            });

            await Promise.all([
                loadEventData(eventModuleId),
                loadCampaignDetail(detail.id),
                loadCampaigns(),
            ]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Kết thúc sớm thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };



    const onExtendFundraisingDeadline = async (payload: {

        end_at: string;

        reason?: string;

        notify_participants?: boolean;

    }) => {

        if (!fundraisingModuleId) return;

        try {

            await extendFundraisingDeadline(fundraisingModuleId, payload);

            addNotification({

                type: 'success',

                title: 'Đã gia hạn gây quỹ',

                message: 'Mốc thời gian gây quỹ đã được cập nhật.',

            });

            await Promise.all([

                loadFundraisingData(fundraisingModuleId),

                loadCampaignDetail(detail?.id ?? selectedCampaignId ?? ''),

                loadCampaigns(),

            ]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Gia hạn thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

        }

    };

    const onEndFundraisingEarly = async (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => {
        if (!detail || !fundraisingModuleId) return;

        try {
            await endManagedCampaignEarly(detail.id, {
                module_id: fundraisingModuleId,
                ...payload,
            });

            addNotification({
                type: 'success',
                title: 'Đã kết thúc sớm hạng mục gây quỹ',
                message: 'Mốc thời gian gây quỹ đã được cập nhật.',
            });

            await Promise.all([
                loadFundraisingData(fundraisingModuleId),
                loadCampaignDetail(detail.id),
                loadCampaigns(),
            ]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Kết thúc sớm thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };



    const onExtendItemDeadline = async (payload: {

        end_at: string;

        reason?: string;

        notify_participants?: boolean;

    }) => {

        if (!detail || !itemModuleId) return;

        try {

            await extendManagedCampaign(detail.id, {

                module_id: itemModuleId,

                ...payload,

            });

            addNotification({

                type: 'success',

                title: 'Đã gia hạn tiếp nhận hiện vật',

                message: 'Hạn tiếp nhận mới đã được cập nhật.',

            });

            await Promise.all([

                loadItemData(itemModuleId),

                loadCampaignDetail(detail.id),

                loadCampaigns(),

            ]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Gia hạn thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

        }

    };

    const onEndItemEarly = async (payload: {
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    }) => {
        if (!detail || !itemModuleId) return;

        try {
            await endManagedCampaignEarly(detail.id, {
                module_id: itemModuleId,
                ...payload,
            });

            addNotification({
                type: 'success',
                title: 'Đã kết thúc sớm hạng mục hiện vật',
                message: 'Thời gian tiếp nhận hiện vật đã được cập nhật.',
            });

            await Promise.all([
                loadItemData(itemModuleId),
                loadCampaignDetail(detail.id),
                loadCampaigns(),
            ]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Kết thúc sớm thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };



    const onUpdateCampaignDetail = async (payload: {

        title?: string;

        summary?: string;

        slogan?: string | null;

        description?: string | null;

        beneficiary?: string | null;

        start_at?: string;

        end_at?: string;

    }) => {

        if (!detail) return;

        try {

            await updateManagedCampaign(detail.id, payload);

            addNotification({

                type: 'success',

                title: 'Đã cập nhật chiến dịch',

                message: 'Thông tin chiến dịch đã được lưu.',

            });

            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Cập nhật chiến dịch thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

            throw error;

        }

    };



    const onExtendCampaignDetail = async (payload: {

        end_at: string;

        reason?: string;

        notify_participants?: boolean;

    }) => {

        if (!detail) return;

        try {

            await extendManagedCampaign(detail.id, payload);

            addNotification({

                type: 'success',

                title: 'Đã gia hạn chiến dịch',

                message: 'Ngày kết thúc mới đã được cập nhật.',

            });

            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Gia hạn chiến dịch thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

            throw error;

        }

    };



    const onEndCampaignEarlyDetail = async (payload: {

        end_at?: string;

        reason?: string;

        note?: string;

        notify_participants?: boolean;

    }) => {

        if (!detail) return;

        try {

            await endManagedCampaignEarly(detail.id, payload);

            addNotification({

                type: 'success',

                title: 'Đã kết thúc sớm chiến dịch',

                message: 'Trạng thái và mốc thời gian đã được cập nhật.',

            });

            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Kết thúc sớm thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

            throw error;

        }

    };



    const onSaveCompletionReportDetail = async (payload: {

        title?: string;

        content: string;

        result_summary?: string;

        completed_tasks?: string[];

        volunteer_count?: number | null;

        verified_money_amount?: number | null;

        received_item_quantity?: number | null;

        challenges?: string | null;

        conclusion?: string | null;

        image_file_ids?: string[];

        submit?: boolean;

    }) => {

        if (!detail) return;

        try {

            await saveCampaignCompletionReport(detail.id, payload);

            addNotification({

                type: 'success',

                title: payload.submit

                    ? 'Đã gửi báo cáo hoàn thành'

                    : 'Đã lưu nháp báo cáo',

                message: payload.submit

                    ? 'Báo cáo sau chiến dịch đã được gửi.'

                    : 'Báo cáo đã được lưu vào bản nháp.',

            });

            await Promise.all([loadCampaignDetail(detail.id), loadCampaigns()]);

        } catch (error) {

            addNotification({

                type: 'error',

                title: 'Lưu báo cáo thất bại',

                message:

                    error instanceof Error ? error.message : 'Lỗi hệ thống',

            });

            throw error;

        }

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

                    submitLabel: 'Luu bàn giao',

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

                        message: `Registration #${actionDialog.targetId} dã hoàn thành`,

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

            <ContentLayout title="Quản Lý Chiến Dịch">

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

            <ContentLayout title="Quản Lý Chiến Dịch">

                <div className="p-5 text-sm bg-white border rounded-xl border-slate-200 text-slate-700">

                    Vai trò hi?n t?i không có quy?n truy c?p khu v?c qu?n tr?

                    chi?n ??ch.

                </div>

            </ContentLayout>

        );

    }



    return (

        <ContentLayout

            title={isCreatePage ? 'Tạo Chiến Dịch' : 'Quản Lý Chiến Dịch'}

        >

            <div className="space-y-6">

                <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

                    <div className="space-y-2">

                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">

                            {isCreatePage ? 'Tạo chiến dịch' : 'Khu Quản lý'}

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

                                    : 'Theo dõi tiến độ, quản lý hạng mục và xử lý các thao tác quản lý cho từng chiến dịch của đơn vị.'}

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

                                Quay l?i qu?n lý chi?n ??ch

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

                                    Làm m?i

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

                                    Tạo chiến dịch m?i

                                </button>

                            </>

                        )}

                    </div>

                </section>



                {!isCreatePage ? (

                    <>
                        <section className="p-5 bg-white border rounded-xl border-slate-200">

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

                                <div>

                                    <h3 className="text-xl font-semibold text-[#002A58]">

                                        Tìm kiếm và bộ lọc

                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-slate-600">

                                        Tìm nhanh theo tên chi?n ??ch, tr?ng thái và

                                        h?ng m?c tri?n khai ?? m? dúng h? so c?n x? lý.

                                    </p>

                                </div>

                                <button

                                    type="button"

                                    onClick={() => {

                                        setCampaignSearch('');

                                        setCampaignStatusFilter('ALL');

                                        setCampaignSort('newest');

                                        setCampaignModuleFilter('ALL');

                                    }}

                                    className="inline-flex items-center justify-center px-4 text-sm font-semibold transition bg-white border rounded-lg h-11 border-slate-300 text-slate-700 hover:bg-slate-50"

                                >

                                    Đ?t l?i b? l?c

                                </button>

                            </div>



                            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_220px]">

                                <label className="block">

                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">

                                        Tìm kiếm chi?n ??ch

                                    </span>

                                    <div className="relative">

                                        <Search className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 size-4 text-slate-400" />

                                        <input

                                            type="text"

                                            value={campaignSearch}

                                            onChange={(event) =>

                                                setCampaignSearch(event.target.value)

                                            }

                                            placeholder="Nhập tên hoặc mô tả ngắn chiến dịch"

                                            className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#0E4686]"

                                        />

                                    </div>

                                </label>



                                <label className="block">

                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">

                                        Trạng thái

                                    </span>

                                    <select

                                        value={campaignStatusFilter}

                                        onChange={(event) =>

                                            setCampaignStatusFilter(

                                                event.target.value as

                                                    (typeof organizerStatusOptions)[number]['value'],

                                            )

                                        }

                                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#0E4686]"

                                    >

                                        {organizerStatusOptions.map((option) => (

                                            <option key={option.value} value={option.value}>

                                                {option.label}

                                            </option>

                                        ))}

                                    </select>

                                </label>



                                <label className="block">

                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">

                                        H?ng m?c

                                    </span>

                                    <select

                                        value={campaignModuleFilter}

                                        onChange={(event) =>

                                            setCampaignModuleFilter(

                                                event.target.value as CampaignModuleFilterValue,

                                            )

                                        }

                                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#0E4686]"

                                    >

                                        <option value="ALL">Tất cả hạng mục</option>

                                        {publicModuleOptions

                                            .filter((option) => option.value)

                                            .map((option) => (

                                                <option

                                                    key={option.value}

                                                    value={option.value ?? ''}

                                                >

                                                    {option.label}

                                                </option>

                                            ))}

                                    </select>

                                </label>



                                <label className="block">

                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">

                                        S?p x?p

                                    </span>

                                    <select

                                        value={campaignSort}

                                        onChange={(event) =>

                                            setCampaignSort(

                                                event.target.value as

                                                    (typeof organizerSortOptions)[number]['value'],

                                            )

                                        }

                                        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#0E4686]"

                                    >

                                        {organizerSortOptions.map((option) => (

                                            <option key={option.value} value={option.value}>

                                                {option.label}

                                            </option>

                                        ))}

                                    </select>

                                </label>

                            </div>

                        </section>



                        <section

                            className={

                                useManagedCampaignDetailDialog

                                    ? 'grid gap-6'

                                    : 'grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]'

                            }

                        >

                            <div className="bg-white border rounded-xl border-slate-200">

                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">

                                    <div>

                                        <h3 className="text-xl font-semibold text-[#002A58]">

                                            Danh sách chiến dịch

                                        </h3>

                                        <p className="mt-1 text-sm text-slate-600">

                                            {filteredCampaigns.length} chi?n ??ch phù h?p v?i b? l?c hi?n t?i

                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Hiển thị {managedCampaignStartIndex}-{managedCampaignEndIndex} trên tổng số {filteredCampaigns.length} chiến dịch
                                        </p>

                                    </div>

                                    <div className="text-right">

                                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">

                                            H?ng m?c ?ang hi?n th?

                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">

                                            {campaignModuleFilter === 'ALL'

                                                ? 'Tất cả module'

                                                : moduleTypeLabel[campaignModuleFilter]}

                                        </p>

                                    </div>

                                </div>



                                {loadingList ? (

                                    <div className="p-5">

                                        <LoadingState />

                                    </div>

                                ) : filteredCampaigns.length === 0 ? (

                                    <div className="p-5">

                                        <EmptyState title="Chưa có chiến dịch phù hợp với bộ lọc hiện tại" />

                                    </div>

                                ) : (

                                    <div className="overflow-x-auto">

                                        <table className="min-w-full border-collapse">

                                            <thead className="bg-slate-50">

                                                <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500">

                                                    <th className="px-5 py-3">Chi?n ??ch</th>

                                                    <th className="px-5 py-3">Đon v?</th>

                                                    <th className="px-5 py-3">Module tri?n khai</th>

                                                    <th className="px-5 py-3">Th?i gian</th>

                                                    <th className="px-5 py-3">Trạng thái</th>

                                                    <th className="px-5 py-3 text-right">Thao tác</th>

                                                </tr>

                                            </thead>

                                            <tbody className="divide-y divide-slate-200">

                                                {pagedManagedCampaigns.map((campaign) => {

                                                    const isSelected =

                                                        selectedCampaignId === campaign.id;



                                                    return (

                                                        <tr

                                                            key={campaign.id}

                                                            className={`align-top transition hover:bg-slate-50 ${

                                                                isSelected ? 'bg-blue-50/60' : 'bg-white'

                                                            }`}

                                                        >

                                                            <td className="px-5 py-4">

                                                                <button

                                                                    type="button"

                                                                    onClick={() =>

                                                                        setSelectedCampaignId(campaign.id)

                                                                    }

                                                                    className="block text-left"

                                                                >

                                                                    <div className="flex flex-wrap items-center gap-2">

                                                                        <span className="text-base font-semibold text-slate-900">

                                                                            {toDisplayTitle(campaign.title)}

                                                                        </span>

                                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">

                                                                            {campaign.module_types?.length ?? 0} module

                                                                        </span>

                                                                    </div>

                                                                    <p className="max-w-xl mt-2 text-sm leading-6 text-slate-600">

                                                                        {toDisplayText(campaign.summary) ||

                                                                            'Chưa có mô tả ngắn cho chiến dịch này.'}

                                                                    </p>

                                                                </button>

                                                            </td>

                                                            <td className="px-5 py-4">

                                                                <div className="text-sm font-medium text-slate-800">

                                                                    {getCampaignOrganizationLabel(

                                                                        campaign.organization_id,

                                                                    )}

                                                                </div>

                                                                <div className="mt-1 text-xs text-slate-500">

                                                                    {campaign.organization_id}

                                                                </div>

                                                            </td>

                                                            <td className="px-5 py-4">

                                                                <div className="flex flex-wrap max-w-sm gap-2">

                                                                    {(campaign.module_types ?? []).map(

                                                                        (moduleType) => (

                                                                            <span

                                                                                key={`${campaign.id}-${moduleType}`}

                                                                                className="px-3 py-1 text-xs font-semibold border rounded-full border-slate-200 bg-slate-50 text-slate-700"

                                                                            >

                                                                                {moduleTypeLabel[moduleType] ??

                                                                                    moduleType}

                                                                            </span>

                                                                        ),

                                                                    )}

                                                                </div>

                                                            </td>

                                                            <td className="px-5 py-4">

                                                                <div className="text-sm font-medium text-slate-800">

                                                                    {formatCampaignDateRange(

                                                                        campaign.start_at,

                                                                        campaign.end_at,

                                                                    )}

                                                                </div>

                                                                <div className="mt-1 text-xs text-slate-500">

                                                                    B?t ??u: {formatCampaignDate(campaign.start_at)}

                                                                </div>

                                                            </td>

                                                            <td className="px-5 py-4">

                                                                <div className="flex flex-col gap-2">

                                                                    <StatusBadge status={campaign.status} />

                                                                    <span className="text-xs font-medium text-slate-600">

                                                                        {organizerStatusLabel[campaign.status] ??

                                                                            campaign.status}

                                                                    </span>

                                                                </div>

                                                            </td>

                                                            <td className="px-5 py-4">

                                                                <div className="flex justify-end">

                                                                    <button

                                                                        type="button"

                                                                        onClick={() =>

                                                                            setSelectedCampaignId(campaign.id)

                                                                        }

                                                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#C3C6D2] bg-white px-4 text-sm font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"

                                                                    >

                                                                        <Eye

                                                                            className="size-4"

                                                                            strokeWidth={1.75}

                                                                        />

                                                                        {useManagedCampaignDetailDialog

                                                                            ? 'Mở chi tiết'

                                                                            : isSelected

                                                                              ? 'Đang xem'

                                                                              : 'Xem chi tiết'}

                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    );

                                                })}

                                            </tbody>

                                        </table>

                                        <div className="flex flex-col gap-3 px-5 py-4 border-t border-slate-200 md:flex-row md:items-center md:justify-between">
                                            <div className="text-sm text-slate-600">
                                                Trang {currentManagedCampaignPage} / {totalManagedCampaignPages}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setManagedCampaignPage(1)}
                                                    disabled={currentManagedCampaignPage <= 1}
                                                >
                                                    Trang đầu
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setManagedCampaignPage((current) =>
                                                            Math.max(1, current - 1),
                                                        )
                                                    }
                                                    disabled={currentManagedCampaignPage <= 1}
                                                >
                                                    Trang trước
                                                </Button>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {managedCampaignPageItems.map((item, index) =>
                                                        item === 'ellipsis' ? (
                                                            <span
                                                                key={`managed-page-ellipsis-${index}`}
                                                                className="px-2 text-sm text-slate-400"
                                                            >
                                                                ...
                                                            </span>
                                                        ) : (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                onClick={() =>
                                                                    setManagedCampaignPage(item)
                                                                }
                                                                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
                                                                    item ===
                                                                    currentManagedCampaignPage
                                                                        ? 'border-[#002A58] bg-[#002A58] text-white'
                                                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {item}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setManagedCampaignPage((current) =>
                                                            Math.min(
                                                                totalManagedCampaignPages,
                                                                current + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        currentManagedCampaignPage >=
                                                        totalManagedCampaignPages
                                                    }
                                                >
                                                    Trang sau
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setManagedCampaignPage(
                                                            totalManagedCampaignPages,
                                                        )
                                                    }
                                                    disabled={
                                                        currentManagedCampaignPage >=
                                                        totalManagedCampaignPages
                                                    }
                                                >
                                                    Trang cuối
                                                </Button>
                                            </div>
                                        </div>

                                    </div>

                                )}

                            </div>



                            {!useManagedCampaignDetailDialog ? (

                                <div className="space-y-6">

                                    {loadingDetail ? (

                                        <section className="p-5 bg-white border rounded-xl border-slate-200">

                                            <LoadingState />

                                        </section>

                                    ) : detail ? (

                                        <ManagedCampaignWorkspace

                                            detail={detail}

                                            canMutateCampaign={canMutateCampaign}

                                            canDeleteDraft={canDeleteDraft}

                                            reportActor={reportActor}

                                            fundraisingModuleId={fundraisingModuleId}

                                            fundraisingConfig={fundraisingConfig}

                                            fundraisingDonations={fundraisingDonations}

                                            fundraisingTransactions={fundraisingTransactions}

                                            itemModuleId={itemModuleId}

                                            itemConfig={itemConfig}

                                            itemTargets={itemTargets}

                                            itemTargetForm={itemTargetForm}

                                            itemPledges={itemPledges}

                                            eventModuleId={eventModuleId}

                                            eventConfig={eventConfig}

                                            eventRegistrations={eventRegistrations}

                                            setFundraisingModuleId={setFundraisingModuleId}

                                            setFundraisingConfig={setFundraisingConfig}

                                            setItemModuleId={setItemModuleId}

                                            setItemConfig={setItemConfig}

                                            setItemTargetForm={setItemTargetForm}

                                            setEventModuleId={setEventModuleId}

                                            setEventConfig={setEventConfig}

                                            onSaveFundraisingConfig={onSaveFundraisingConfig}

                                            onVerifyDonation={onVerifyDonation}

                                            onRejectDonation={onRejectDonation}

                                            onAttachTransaction={onAttachTransaction}

                                            onUnmatchTransaction={onUnmatchTransaction}

                                            onSaveItemConfig={onSaveItemConfig}

                                            onCreateItemTarget={onCreateItemTarget}

                                            onUpdateItemTarget={onUpdateItemTarget}

                                            onDeleteItemTarget={onDeleteItemTarget}

                                            onConfirmItemPledge={onConfirmItemPledge}

                                            onRejectItemPledge={onRejectItemPledge}

                                            onHandoverItemPledge={onHandoverItemPledge}

                                            onSaveEventConfig={onSaveEventConfig}

                                            onApproveRegistration={onApproveRegistration}

                                            onRejectRegistration={onRejectRegistration}

                                            onCheckInRegistration={onCheckInRegistration}

                                            onCompleteRegistration={onCompleteRegistration}

                                            onBulkApproveRegistrations={onBulkApproveRegistrations}

                                            onExtendVolunteerDeadline={onExtendVolunteerDeadline}

                                            onEndVolunteerEarly={onEndVolunteerEarly}

                                            onExtendFundraisingDeadline={onExtendFundraisingDeadline}

                                            onEndFundraisingEarly={onEndFundraisingEarly}

                                            onExtendItemDeadline={onExtendItemDeadline}

                                            onEndItemEarly={onEndItemEarly}

                                            onSubmitReview={() => void onSubmitReview()}

                                            onPublish={() => void onPublish()}

                                            onDeleteDraftCampaign={() => void onDeleteDraftCampaign()}

                                            onUpdateCampaign={onUpdateCampaignDetail}

                                            onExtendCampaign={onExtendCampaignDetail}

                                            onEndCampaignEarly={onEndCampaignEarlyDetail}

                                            onSaveCompletionReport={onSaveCompletionReportDetail}

                                        />

                                    ) : (

                                        <section className="p-5 bg-white border rounded-xl border-slate-200">

                                            <EmptyState title="Chọn một chiến dịch để xem chi tiết và quản lý hạng mục" />

                                        </section>

                                    )}

                                </div>

                            ) : null}

                        </section>

                    </>

                ) : null}

                {useManagedCampaignDetailDialog ? (

                    <Dialog

                        open={Boolean(selectedCampaignId)}

                        onOpenChange={(open) => {

                            if (!open) {

                                closeManagedCampaignDetailDialog();

                            }

                        }}

                    >

                        <DialogContent className="max-h-[94vh] max-w-[min(96vw,1520px)] p-0">

                            <DialogTitle className="sr-only">

                                Chi ti?t chi?n d?ch

                            </DialogTitle>

                            <DialogDescription className="sr-only">

                                Xem và qu?n lý toàn b? thông tin chi ti?t chi?n ??ch trong m?t h?p tho?i riêng.

                            </DialogDescription>

                            <div className="flex max-h-[calc(94vh-2rem)] flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6fb_100%)]">

                                <div className="px-6 py-4 border-b border-slate-200 bg-white/92 backdrop-blur">

                                    <div className="pr-12">

                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">

                                            Qu?n lý chi?n ??ch

                                        </div>

                                        <div className="mt-1 text-lg font-semibold text-slate-950">

                                            Chi ti?t và v?n hành chi?n ??ch

                                        </div>

                                        <div className="mt-1 text-sm text-slate-600">

                                            Toàn b? thao tác ???c gi? trong cùng m?t modal ?? không m?t ng? c?nh qu?n lý.

                                        </div>

                                    </div>

                                </div>



                                <div className="flex-1 p-6 overflow-y-auto">

                                    {loadingDetail ? (

                                        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">

                                            <LoadingState />

                                        </div>

                                    ) : detail ? (

                                        <ManagedCampaignWorkspace

                                            detail={detail}

                                            canMutateCampaign={canMutateCampaign}

                                            canDeleteDraft={canDeleteDraft}

                                            reportActor={reportActor}

                                            fundraisingModuleId={fundraisingModuleId}

                                            fundraisingConfig={fundraisingConfig}

                                            fundraisingDonations={fundraisingDonations}

                                            fundraisingTransactions={fundraisingTransactions}

                                            itemModuleId={itemModuleId}

                                            itemConfig={itemConfig}

                                            itemTargets={itemTargets}

                                            itemTargetForm={itemTargetForm}

                                            itemPledges={itemPledges}

                                            eventModuleId={eventModuleId}

                                            eventConfig={eventConfig}

                                            eventRegistrations={eventRegistrations}

                                            setFundraisingModuleId={setFundraisingModuleId}

                                            setFundraisingConfig={setFundraisingConfig}

                                            setItemModuleId={setItemModuleId}

                                            setItemConfig={setItemConfig}

                                            setItemTargetForm={setItemTargetForm}

                                            setEventModuleId={setEventModuleId}

                                            setEventConfig={setEventConfig}

                                            onSaveFundraisingConfig={onSaveFundraisingConfig}

                                            onVerifyDonation={onVerifyDonation}

                                            onRejectDonation={onRejectDonation}

                                            onAttachTransaction={onAttachTransaction}

                                            onUnmatchTransaction={onUnmatchTransaction}

                                            onSaveItemConfig={onSaveItemConfig}

                                            onCreateItemTarget={onCreateItemTarget}

                                            onUpdateItemTarget={onUpdateItemTarget}

                                            onDeleteItemTarget={onDeleteItemTarget}

                                            onConfirmItemPledge={onConfirmItemPledge}

                                            onRejectItemPledge={onRejectItemPledge}

                                            onHandoverItemPledge={onHandoverItemPledge}

                                            onSaveEventConfig={onSaveEventConfig}

                                            onApproveRegistration={onApproveRegistration}

                                            onRejectRegistration={onRejectRegistration}

                                            onCheckInRegistration={onCheckInRegistration}

                                            onCompleteRegistration={onCompleteRegistration}

                                            onBulkApproveRegistrations={onBulkApproveRegistrations}

                                            onExtendVolunteerDeadline={onExtendVolunteerDeadline}

                                            onEndVolunteerEarly={onEndVolunteerEarly}

                                            onExtendFundraisingDeadline={onExtendFundraisingDeadline}

                                            onEndFundraisingEarly={onEndFundraisingEarly}

                                            onExtendItemDeadline={onExtendItemDeadline}

                                            onEndItemEarly={onEndItemEarly}

                                            onSubmitReview={() => void onSubmitReview()}

                                            onPublish={() => void onPublish()}

                                            onDeleteDraftCampaign={() => void onDeleteDraftCampaign()}

                                            onUpdateCampaign={onUpdateCampaignDetail}

                                            onExtendCampaign={onExtendCampaignDetail}

                                            onEndCampaignEarly={onEndCampaignEarlyDetail}

                                            onSaveCompletionReport={onSaveCompletionReportDetail}

                                        />

                                    ) : (

                                        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">

                                            <EmptyState title="Không tìm thấy chi tiết chiến dịch" />

                                        </section>

                                    )}

                                </div>

                            </div>

                        </DialogContent>

                    </Dialog>

                ) : null}

                <LocationPickerDialog

                    open={isModuleLocationDialogOpen}

                    onOpenChange={setIsModuleLocationDialogOpen}

                    currentValue={moduleForm.location}

                    onSelectLocation={(location) =>

                        setModuleForm((current) => ({

                            ...current,

                            location: formatLocationValue(location),

                        }))

                    }

                />

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

