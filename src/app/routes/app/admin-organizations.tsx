import * as React from 'react';
import { Link } from 'react-router';
import {
    ArrowRight,
    Bolt,
    Building2,
    CircleDollarSign,
    Eye,
    FileBarChart2,
    PencilLine,
    Plus,
    Search,
    Trash2,
    X,
    type LucideIcon,
} from 'lucide-react';

import { paths } from '@/config/paths';
import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    createAdminOrganization,
    deleteAdminOrganization,
    getAdminOrganizations,
    updateAdminOrganization,
    type AdminOrganization,
} from '@/features/admin/api/organizations';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import {
    getOrganizationBySlug,
    type OrganizationDetail,
} from '@/features/organizations/api/organizations';
import {
    getSchoolOverview,
    type SchoolOverview,
} from '@/features/reports/api/reports';

type FormMode = 'create' | 'edit';

type OrgFormState = {
    code: string;
    name: string;
    type: string;
    status: string;
    description: string;
};

type QuickTypeFilter = '' | 'CLUB' | 'TEAM';

const DEFAULT_FORM: OrgFormState = {
    code: '',
    name: '',
    type: 'CLUB',
    status: 'ACTIVE',
    description: '',
};

const orgTypeOptions = [
    { value: 'CLUB', label: 'Câu lạc bộ' },
    { value: 'TEAM', label: 'Đội' },
    { value: 'GROUP', label: 'Nhóm' },
    { value: 'CENTER', label: 'Trung tâm' },
];

const quickTypeTabs: Array<{ value: QuickTypeFilter; label: string }> = [
    { value: '', label: 'Tất cả' },
    { value: 'CLUB', label: 'Câu lạc bộ' },
    { value: 'TEAM', label: 'Đội' },
];

const panelClassName =
    'rounded-xl border border-[#C3C6D2] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]';

const selectClassName =
    'h-12 w-full rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const inputClassName =
    'h-12 rounded-lg border-[#C3C6D2] bg-[#F3F4F5] text-[#191C1D] placeholder:text-[#737781] focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const cardLabelClassName =
    'text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]';

const fieldLabelClassName =
    'text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]';

const getOrgTypeLabel = (type: string) =>
    orgTypeOptions.find((option) => option.value === type)?.label ?? type;

const getStatusLabel = (status: string) =>
    status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';

const getStatusBadgeClassName = (status: string) =>
    status === 'ACTIVE'
        ? 'bg-[#6BFE9C]/30 text-[#006D37]'
        : 'bg-[#FFF0E5] text-[#6F2D00]';

const getTypeBadgeClassName = (type: string) => {
    if (type === 'CLUB') {
        return 'bg-[#D6E3FF] text-[#0E4686]';
    }

    if (type === 'TEAM') {
        return 'bg-[#E7F6EE] text-[#006D37]';
    }

    return 'bg-[#E7E8E9] text-[#424750]';
};

const getOrganizationInitials = (organization: {
    name: string;
    code: string;
}) => {
    const initials = organization.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return initials || organization.code.slice(0, 2).toUpperCase();
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const formatCompactCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ`;
    }

    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(0)} triệu`;
    }

    return value.toLocaleString('vi-VN');
};

const getModuleTypeLabel = (value: string) => {
    if (value === 'fundraising') {
        return 'Gây quỹ';
    }

    if (value === 'item_donation') {
        return 'Hiện vật';
    }

    if (value === 'event') {
        return 'Sự kiện';
    }

    return value;
};

const getCampaignStatusLabel = (status: string) => {
    if (status === 'PUBLISHED' || status === 'ONGOING') {
        return 'Đang diễn ra';
    }

    if (status === 'APPROVED') {
        return 'Đã duyệt';
    }

    if (status === 'ENDED') {
        return 'Đã kết thúc';
    }

    if (status === 'SUBMITTED') {
        return 'Chờ phê duyệt';
    }

    if (status === 'REJECTED') {
        return 'Bị từ chối';
    }

    return status;
};

const getCampaignStatusBadgeClassName = (status: string) => {
    if (status === 'PUBLISHED' || status === 'ONGOING') {
        return 'bg-[#D6E3FF] text-[#0E4686]';
    }

    if (status === 'APPROVED') {
        return 'bg-[#E7F6EE] text-[#006D37]';
    }

    if (status === 'ENDED') {
        return 'bg-[#E7E8E9] text-[#424750]';
    }

    return 'bg-[#FFF0E5] text-[#6F2D00]';
};

const findOrganizationReport = (
    organization: AdminOrganization | null,
    overview: SchoolOverview | null,
) => {
    if (!organization || !overview) {
        return null;
    }

    return (
        overview.organization_breakdown.find(
            (item) => String(item.organization_id) === organization.id,
        ) ??
        overview.organization_breakdown.find(
            (item) => item.organization_code === organization.code,
        ) ??
        overview.organization_breakdown.find(
            (item) => item.organization_name === organization.name,
        ) ??
        null
    );
};

const computeImpactScore = (
    report: SchoolOverview['organization_breakdown'][number] | null,
) => {
    if (!report) {
        return 0;
    }

    const score = Math.round(
        report.campaign_count * 8 +
            report.completed_event_hours / 180 +
            report.verified_money_amount / 20_000_000 +
            report.completed_event_registrations / 35 +
            report.issued_certificates / 50,
    );

    return Math.max(0, Math.min(100, score));
};

type FilterFieldProps = {
    label: string;
    hint?: string;
    children: React.ReactNode;
};

const FilterField = ({ label, hint, children }: FilterFieldProps) => (
    <label className="grid gap-2 text-left">
        <span className={fieldLabelClassName}>{label}</span>
        {children}
        {hint ? (
            <span className="text-[12px] leading-4 text-[#737781]">{hint}</span>
        ) : null}
    </label>
);

type SummaryCardProps = {
    icon: LucideIcon;
    label: string;
    value: string;
    note: string;
    tone: 'blue' | 'green' | 'orange' | 'red';
};

const summaryToneMap: Record<
    SummaryCardProps['tone'],
    { iconBox: string; iconColor: string; noteColor: string }
> = {
    blue: {
        iconBox: 'bg-[#D6E3FF]',
        iconColor: 'text-[#002A58]',
        noteColor: 'text-[#006D37]',
    },
    green: {
        iconBox: 'bg-[#6BFE9C]/30',
        iconColor: 'text-[#006D37]',
        noteColor: 'text-[#006D37]',
    },
    orange: {
        iconBox: 'bg-[#FFDBCB]',
        iconColor: 'text-[#6F2D00]',
        noteColor: 'text-[#6F2D00]',
    },
    red: {
        iconBox: 'bg-[#FFDAD6]',
        iconColor: 'text-[#BA1A1A]',
        noteColor: 'text-[#BA1A1A]',
    },
};

const SummaryCard = ({
    icon: Icon,
    label,
    value,
    note,
    tone,
}: SummaryCardProps) => {
    const toneClass = summaryToneMap[tone];

    return (
        <section className={`${panelClassName} p-5`}>
            <div className="flex items-center justify-between gap-4">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass.iconBox}`}
                >
                    <Icon
                        className={`size-5 ${toneClass.iconColor}`}
                        strokeWidth={1.5}
                    />
                </div>
                <p
                    className={`text-[15px] font-semibold ${toneClass.noteColor}`}
                >
                    {note}
                </p>
            </div>
            <p className={`mt-5 ${cardLabelClassName}`}>{label}</p>
            <p className="mt-3 text-[18px] font-semibold leading-7 text-[#191C1D]">
                {value}
            </p>
        </section>
    );
};

export const AdminOrganizationsRoute = () => {
    const user = useUser();
    const canManageOrganizations = user.data?.role === ROLES.DOANTRUONG;
    const { addNotification } = useNotifications();

    const [orgs, setOrgs] = React.useState<AdminOrganization[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [overview, setOverview] = React.useState<SchoolOverview | null>(null);
    const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(
        null,
    );
    const [selectedOrgDetail, setSelectedOrgDetail] =
        React.useState<OrganizationDetail | null>(null);
    const [detailLoading, setDetailLoading] = React.useState(false);
    const [detailError, setDetailError] = React.useState<string | null>(null);

    const [filterQ, setFilterQ] = React.useState('');
    const [filterType, setFilterType] = React.useState<QuickTypeFilter>('');
    const [filterStatus, setFilterStatus] = React.useState('');

    const [formMode, setFormMode] = React.useState<FormMode>('create');
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState<OrgFormState>(DEFAULT_FORM);
    const [saving, setSaving] = React.useState(false);
    const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);

    const loadData = React.useCallback(
        async (override?: { q?: string; type?: string; status?: string }) => {
            if (!canManageOrganizations) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            const q = override?.q ?? filterQ;
            const type = override?.type ?? filterType;
            const status = override?.status ?? filterStatus;

            try {
                const [orgData, overviewData] = await Promise.all([
                    getAdminOrganizations({
                        q: q.trim() || undefined,
                        type: type || undefined,
                        status: status || undefined,
                    }),
                    getSchoolOverview(),
                ]);
                setOrgs(orgData);
                setOverview(overviewData);
            } catch {
                setError('Không thể tải danh mục đơn vị.');
            } finally {
                setIsLoading(false);
            }
        },
        [canManageOrganizations, filterQ, filterStatus, filterType],
    );

    React.useEffect(() => {
        void loadData();
    }, [loadData]);

    React.useEffect(() => {
        if (selectedOrgId && orgs.some((org) => org.id === selectedOrgId)) {
            return;
        }

        setSelectedOrgId(orgs[0]?.id ?? null);
    }, [orgs, selectedOrgId]);

    const selectedOrg = React.useMemo(
        () => orgs.find((org) => org.id === selectedOrgId) ?? null,
        [orgs, selectedOrgId],
    );

    React.useEffect(() => {
        if (!selectedOrg?.slug) {
            setSelectedOrgDetail(null);
            setDetailError(null);
            return;
        }

        let mounted = true;
        setDetailLoading(true);
        setDetailError(null);

        getOrganizationBySlug(selectedOrg.slug)
            .then((data) => {
                if (!mounted) return;
                setSelectedOrgDetail(data);
            })
            .catch(() => {
                if (!mounted) return;
                setSelectedOrgDetail(null);
                setDetailError('Không thể tải chi tiết đơn vị.');
            })
            .finally(() => {
                if (mounted) {
                    setDetailLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [selectedOrg]);

    const closeFormDialog = React.useCallback(() => {
        setIsFormDialogOpen(false);
        setFormMode('create');
        setEditingId(null);
        setForm(DEFAULT_FORM);
    }, []);

    const openCreateDialog = () => {
        setFormMode('create');
        setEditingId(null);
        setForm(DEFAULT_FORM);
        setIsFormDialogOpen(true);
    };

    const openEditDialog = (organization: AdminOrganization) => {
        setFormMode('edit');
        setEditingId(organization.id);
        setForm({
            code: organization.code,
            name: organization.name,
            type: organization.type,
            status: organization.status,
            description: organization.description ?? '',
        });
        setIsFormDialogOpen(true);
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.name.trim() || !form.code.trim()) {
            return;
        }

        setSaving(true);

        try {
            if (editingId) {
                await updateAdminOrganization(editingId, {
                    name: form.name.trim(),
                    code: form.code.trim(),
                    type: form.type,
                    status: form.status,
                    description: form.description.trim() || undefined,
                });
                addNotification({
                    type: 'success',
                    title: 'Cập nhật thành công',
                    message: 'Thông tin đơn vị đã được cập nhật.',
                });
            } else {
                await createAdminOrganization({
                    name: form.name.trim(),
                    code: form.code.trim(),
                    type: form.type,
                    status: form.status,
                    description: form.description.trim() || undefined,
                });
                addNotification({
                    type: 'success',
                    title: 'Tạo đơn vị thành công',
                    message: 'Đơn vị mới đã được thêm vào hệ thống.',
                });
            }

            closeFormDialog();
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể lưu đơn vị',
                message: 'Vui lòng kiểm tra lại dữ liệu và thử lại.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (organization: AdminOrganization) => {
        if (
            !window.confirm(`Bạn có chắc muốn xóa đơn vị ${organization.name}?`)
        ) {
            return;
        }

        try {
            await deleteAdminOrganization(organization.id);
            addNotification({
                type: 'success',
                title: 'Đã xóa đơn vị',
                message: 'Bản ghi đơn vị đã được loại khỏi hệ thống.',
            });

            if (selectedOrgId === organization.id) {
                setSelectedOrgId(null);
                setSelectedOrgDetail(null);
            }

            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể xóa đơn vị',
                message:
                    'Đơn vị này có thể đang được sử dụng trong các luồng nghiệp vụ khác.',
            });
        }
    };

    const handleResetFilters = () => {
        setFilterQ('');
        setFilterType('');
        setFilterStatus('');
        void loadData({
            q: '',
            type: '',
            status: '',
        });
    };

    const organizationReports = React.useMemo(
        () =>
            orgs.map((org) => ({
                organization: org,
                report: findOrganizationReport(org, overview),
            })),
        [orgs, overview],
    );

    const scoredOrganizations = React.useMemo(
        () =>
            organizationReports.map(({ organization, report }) => ({
                organization,
                report,
                impactScore: computeImpactScore(report),
            })),
        [organizationReports],
    );

    const averageImpactScore = React.useMemo(() => {
        if (scoredOrganizations.length === 0) {
            return 0;
        }

        return Math.round(
            scoredOrganizations.reduce(
                (total, item) => total + item.impactScore,
                0,
            ) / scoredOrganizations.length,
        );
    }, [scoredOrganizations]);

    const totalManagedFund = React.useMemo(
        () =>
            organizationReports.reduce(
                (total, item) =>
                    total + (item.report?.verified_money_amount ?? 0),
                0,
            ),
        [organizationReports],
    );

    const organizationsNeedingReview = React.useMemo(
        () =>
            orgs.filter(
                (org) =>
                    org.status !== 'ACTIVE' ||
                    !findOrganizationReport(org, overview) ||
                    findOrganizationReport(org, overview)?.campaign_count === 0,
            ).length,
        [orgs, overview],
    );

    const selectedOrgReport = React.useMemo(
        () => findOrganizationReport(selectedOrg, overview),
        [overview, selectedOrg],
    );

    const selectedImpactScore = React.useMemo(
        () => computeImpactScore(selectedOrgReport),
        [selectedOrgReport],
    );

    const selectedOrgRanking = React.useMemo(() => {
        if (!selectedOrg) {
            return null;
        }

        const sorted = [...scoredOrganizations].sort(
            (left, right) => right.impactScore - left.impactScore,
        );
        const index = sorted.findIndex(
            (item) => item.organization.id === selectedOrg.id,
        );
        return index >= 0 ? index + 1 : null;
    }, [scoredOrganizations, selectedOrg]);

    const sortedCampaigns = React.useMemo(
        () =>
            [...(selectedOrgDetail?.campaigns ?? [])].sort(
                (left, right) =>
                    new Date(right.start_at).getTime() -
                    new Date(left.start_at).getTime(),
            ),
        [selectedOrgDetail],
    );

    if (!user.data) {
        return null;
    }

    if (!canManageOrganizations) {
        return (
            <ContentLayout title="Quản lý đơn vị">
                <div className={`${panelClassName} p-5`}>
                    <p className="text-sm leading-6 text-[#424750]">
                        Vai trò hiện tại không có quyền quản lý đơn vị.
                    </p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <>
            <Head title="Quản lý đơn vị" />
            <div className="space-y-6 font-sans">
                <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-3">
                        <p className={cardLabelClassName}>Quản trị đơn vị</p>
                        <div className="space-y-2">
                            <h1 className="text-[40px] font-bold leading-[48px] text-[#002A58]">
                                Danh mục đơn vị và báo cáo vận hành
                            </h1>
                            <p className="max-w-3xl text-[16px] leading-6 text-[#424750]">
                                Quản lý các câu lạc bộ, đội, nhóm và theo dõi
                                tác động của từng đơn vị trên cùng một mặt phẳng
                                quản trị, bám theo ngôn ngữ giao diện học thuật
                                của Unity Academic.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to={paths.app.reports.getHref()}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#C3C6D2] bg-white px-5 py-3 text-[15px] font-semibold text-[#191C1D] transition hover:bg-[#F3F4F5]"
                        >
                            <FileBarChart2
                                className="size-4"
                                strokeWidth={1.5}
                            />
                            Mở báo cáo chi tiết
                        </Link>
                        <Button
                            type="button"
                            size="lg"
                            className="rounded-lg bg-[#002A58] px-6 normal-case tracking-normal text-white hover:bg-[#004080]"
                            onClick={openCreateDialog}
                        >
                            <Plus className="size-4" strokeWidth={1.5} />
                            Đăng ký đơn vị mới
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        icon={Building2}
                        label="Tổng đơn vị"
                        value={orgs.length.toLocaleString('vi-VN')}
                        note={`+${Math.max(0, Math.round(orgs.length * 0.12))}`}
                        tone="blue"
                    />
                    <SummaryCard
                        icon={Bolt}
                        label="Impact score trung bình"
                        value={`${averageImpactScore}/100`}
                        note="+5.4"
                        tone="green"
                    />
                    <SummaryCard
                        icon={CircleDollarSign}
                        label="Quỹ đang quản lý"
                        value={formatCompactCurrency(totalManagedFund)}
                        note={formatCurrency(totalManagedFund)}
                        tone="orange"
                    />
                    <SummaryCard
                        icon={FileBarChart2}
                        label="Đơn vị cần rà soát"
                        value={organizationsNeedingReview.toLocaleString(
                            'vi-VN',
                        )}
                        note="Cần duyệt"
                        tone="red"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
                    <div className="space-y-6">
                        <section className={`${panelClassName} p-5 sm:p-6`}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="text-[24px] font-semibold leading-8 text-[#002A58]">
                                        Bộ lọc danh mục
                                    </h2>
                                    <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                        Tìm theo mã, tên, loại hình và trạng
                                        thái hoạt động để gom đúng tập đơn vị
                                        cần quản trị.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {quickTypeTabs.map((tab) => (
                                        <button
                                            key={tab.value || 'all'}
                                            type="button"
                                            className={`rounded-lg border px-4 py-2 text-[14px] font-semibold transition ${
                                                filterType === tab.value
                                                    ? 'border-[#002A58] bg-[#002A58] text-white'
                                                    : 'border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#F3F4F5]'
                                            }`}
                                            onClick={() => {
                                                setFilterType(tab.value);
                                                void loadData({
                                                    q: filterQ,
                                                    type: tab.value,
                                                    status: filterStatus,
                                                });
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void loadData();
                                }}
                                className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_220px_220px_auto]"
                            >
                                <FilterField label="Từ khóa tìm kiếm">
                                    <div className="relative">
                                        <Search
                                            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#737781]"
                                            strokeWidth={1.5}
                                        />
                                        <Input
                                            data-testid="admin-org-filter-q"
                                            value={filterQ}
                                            onChange={(event) =>
                                                setFilterQ(event.target.value)
                                            }
                                            placeholder="Tìm mã đơn vị, câu lạc bộ hoặc tên hiển thị"
                                            className={`${inputClassName} pl-11`}
                                        />
                                    </div>
                                </FilterField>

                                <FilterField label="Loại đơn vị">
                                    <select
                                        data-testid="admin-org-filter-type"
                                        value={filterType}
                                        onChange={(event) =>
                                            setFilterType(
                                                event.target
                                                    .value as QuickTypeFilter,
                                            )
                                        }
                                        className={selectClassName}
                                    >
                                        <option value="">
                                            Tất cả loại hình
                                        </option>
                                        {orgTypeOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </FilterField>

                                <FilterField label="Trạng thái">
                                    <select
                                        data-testid="admin-org-filter-status"
                                        value={filterStatus}
                                        onChange={(event) =>
                                            setFilterStatus(event.target.value)
                                        }
                                        className={selectClassName}
                                    >
                                        <option value="">
                                            Tất cả trạng thái
                                        </option>
                                        <option value="ACTIVE">
                                            Đang hoạt động
                                        </option>
                                        <option value="INACTIVE">
                                            Ngừng hoạt động
                                        </option>
                                    </select>
                                </FilterField>

                                <div className="flex items-end gap-2">
                                    <Button
                                        type="submit"
                                        className="rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                    >
                                        Lọc dữ liệu
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-lg border-[#C3C6D2] normal-case tracking-normal"
                                        onClick={handleResetFilters}
                                    >
                                        Đặt lại
                                    </Button>
                                </div>
                            </form>
                        </section>

                        <section
                            className={`${panelClassName} overflow-hidden`}
                        >
                            <div className="flex flex-col gap-4 border-b border-[#E1E3E4] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div>
                                    <h2 className="text-[24px] font-semibold leading-8 text-[#002A58]">
                                        Danh sách đơn vị và câu lạc bộ
                                    </h2>
                                    <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                        Chọn một dòng để mở panel chi tiết và
                                        xem báo cáo vận hành của đơn vị đó.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-3 py-2 text-[13px] text-[#424750]">
                                    Hiển thị {orgs.length} đơn vị
                                </div>
                            </div>

                            {isLoading ? <LoadingState /> : null}
                            {error ? <ErrorState message={error} /> : null}
                            {!isLoading && !error && orgs.length === 0 ? (
                                <div className="p-6">
                                    <EmptyState
                                        title="Chưa có đơn vị nào"
                                        description="Hãy tạo đơn vị đầu tiên hoặc thay đổi bộ lọc để xem dữ liệu phù hợp."
                                    />
                                </div>
                            ) : null}

                            {!isLoading && !error && orgs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse">
                                        <thead className="bg-[#F3F4F5]">
                                            <tr className="border-b border-[#E1E3E4] text-left">
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750] sm:px-6">
                                                    Tên đơn vị
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Loại hình
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Trạng thái
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Impact score
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Tổng quỹ ghi nhận
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scoredOrganizations.map(
                                                ({
                                                    organization,
                                                    report,
                                                    impactScore,
                                                }) => {
                                                    const isSelected =
                                                        selectedOrgId ===
                                                        organization.id;
                                                    const fund =
                                                        report?.verified_money_amount ??
                                                        0;

                                                    return (
                                                        <tr
                                                            key={
                                                                organization.id
                                                            }
                                                            className={`border-b border-[#E1E3E4] transition ${
                                                                isSelected
                                                                    ? 'bg-[#EEF3FB]'
                                                                    : 'hover:bg-[#F8F9FA]'
                                                            }`}
                                                        >
                                                            <td className="px-5 py-5 sm:px-6">
                                                                <button
                                                                    type="button"
                                                                    className="flex w-full items-start gap-4 text-left"
                                                                    onClick={() =>
                                                                        setSelectedOrgId(
                                                                            organization.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#D6E3FF] text-[14px] font-semibold text-[#002A58]">
                                                                        {getOrganizationInitials(
                                                                            organization,
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                            {
                                                                                organization.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[14px] leading-5 text-[#424750]">
                                                                            {organization.description ||
                                                                                'Chưa có mô tả vận hành cho đơn vị này.'}
                                                                        </p>
                                                                        <p className="text-[13px] leading-5 text-[#737781]">
                                                                            Tạo
                                                                            ngày{' '}
                                                                            {formatDate(
                                                                                organization.created_at,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <span
                                                                    className={`inline-flex rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${getTypeBadgeClassName(
                                                                        organization.type,
                                                                    )}`}
                                                                >
                                                                    {getOrgTypeLabel(
                                                                        organization.type,
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="space-y-2">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getStatusBadgeClassName(
                                                                            organization.status,
                                                                        )}`}
                                                                    >
                                                                        {getStatusLabel(
                                                                            organization.status,
                                                                        )}
                                                                    </span>
                                                                    <p className="text-[13px] leading-5 text-[#737781]">
                                                                        {organization
                                                                            .faculty
                                                                            ?.name ??
                                                                            'Chưa gán khoa'}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="space-y-2">
                                                                    <div className="h-3 w-28 overflow-hidden rounded-full bg-[#E7E8E9]">
                                                                        <div
                                                                            className="h-full rounded-full bg-[#006D37]"
                                                                            style={{
                                                                                width: `${Math.max(
                                                                                    impactScore,
                                                                                    6,
                                                                                )}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[15px] font-semibold leading-6 text-[#006D37]">
                                                                        {
                                                                            impactScore
                                                                        }
                                                                        /100
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-5 align-top text-[15px] leading-6 text-[#191C1D]">
                                                                {formatCurrency(
                                                                    fund,
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-5 align-top">
                                                                <div className="flex flex-wrap gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        className="rounded-lg border border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
                                                                        title="Xem chi tiết"
                                                                        onClick={() =>
                                                                            setSelectedOrgId(
                                                                                organization.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye
                                                                            className="size-4"
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        className="rounded-lg border border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
                                                                        title="Chỉnh sửa"
                                                                        onClick={() =>
                                                                            openEditDialog(
                                                                                organization,
                                                                            )
                                                                        }
                                                                    >
                                                                        <PencilLine
                                                                            className="size-4"
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                        />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </section>
                    </div>

                    <aside className={`${panelClassName} overflow-hidden`}>
                        <div className="flex items-center justify-between border-b border-[#E1E3E4] px-5 py-5 sm:px-6">
                            <div>
                                <p className={cardLabelClassName}>
                                    Hồ sơ vận hành
                                </p>
                                <h2 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    Chi tiết đơn vị
                                </h2>
                            </div>
                            {selectedOrg ? (
                                <Link
                                    to={paths.app.reports.getHref()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#C3C6D2] bg-white px-4 py-2 text-[14px] font-semibold text-[#191C1D] transition hover:bg-[#F3F4F5]"
                                >
                                    <ArrowRight
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                    Báo cáo
                                </Link>
                            ) : null}
                        </div>

                        {!selectedOrg ? (
                            <div className="p-6">
                                <EmptyState
                                    title="Chưa chọn đơn vị"
                                    description="Hãy chọn một dòng trong danh sách để mở hồ sơ chi tiết và xem các chỉ số báo cáo."
                                />
                            </div>
                        ) : null}

                        {selectedOrg ? (
                            <div className="flex h-full flex-col">
                                <div className="space-y-6 px-5 py-5 sm:px-6">
                                    <div className="flex items-start gap-5">
                                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#D6E3FF] text-[20px] font-bold text-[#002A58]">
                                            {selectedOrgDetail?.logo_url ? (
                                                <img
                                                    src={
                                                        selectedOrgDetail.logo_url
                                                    }
                                                    alt={selectedOrg.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                getOrganizationInitials(
                                                    selectedOrg,
                                                )
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-[20px] font-semibold leading-8 text-[#191C1D]">
                                                        {selectedOrg.name}
                                                    </h3>
                                                    <p className="text-[14px] leading-6 text-[#424750]">
                                                        {selectedOrg.description ||
                                                            'Đơn vị chưa bổ sung mô tả sứ mệnh hoặc phạm vi hoạt động.'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getStatusBadgeClassName(
                                                        selectedOrg.status,
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        selectedOrg.status,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-3 pt-2">
                                                <div className="rounded-xl bg-[#F3F4F5] px-4 py-3">
                                                    <p
                                                        className={
                                                            cardLabelClassName
                                                        }
                                                    >
                                                        Impact score
                                                    </p>
                                                    <p className="mt-2 text-[18px] font-semibold leading-7 text-[#006D37]">
                                                        {selectedImpactScore}
                                                        /100
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-[#F3F4F5] px-4 py-3">
                                                    <p
                                                        className={
                                                            cardLabelClassName
                                                        }
                                                    >
                                                        Xếp hạng
                                                    </p>
                                                    <p className="mt-2 text-[18px] font-semibold leading-7 text-[#002A58]">
                                                        {selectedOrgRanking
                                                            ? `#${selectedOrgRanking}`
                                                            : 'Chưa có'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-[#F3F4F5] px-4 py-3">
                                                    <p
                                                        className={
                                                            cardLabelClassName
                                                        }
                                                    >
                                                        Campaigns
                                                    </p>
                                                    <p className="mt-2 text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                        {sortedCampaigns.length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {detailLoading ? <LoadingState /> : null}
                                    {detailError ? (
                                        <ErrorState message={detailError} />
                                    ) : null}

                                    <section className="space-y-4 border-t border-[#E1E3E4] pt-5">
                                        <div className="flex items-center justify-between">
                                            <h4 className={cardLabelClassName}>
                                                Minh bạch vận hành
                                            </h4>
                                            <p className="text-[12px] font-semibold text-[#006D37]">
                                                {selectedOrgReport
                                                    ? 'Đã có dữ liệu tổng hợp'
                                                    : 'Đang chờ dữ liệu báo cáo'}
                                            </p>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-xl border border-[#C3C6D2] bg-white p-4">
                                                <p className="text-[14px] leading-6 text-[#424750]">
                                                    Tổng quỹ ghi nhận
                                                </p>
                                                <p className="mt-2 text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                    {formatCurrency(
                                                        selectedOrgReport?.verified_money_amount ??
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-[#C3C6D2] bg-white p-4">
                                                <p className="text-[14px] leading-6 text-[#424750]">
                                                    Lượt tham gia hoàn thành
                                                </p>
                                                <p className="mt-2 text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                    {(
                                                        selectedOrgReport?.completed_event_registrations ??
                                                        0
                                                    ).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-[#C3C6D2] bg-white p-4">
                                            <div className="flex items-center justify-between gap-3 border-b border-[#E1E3E4] pb-3">
                                                <p className="text-[14px] font-semibold leading-6 text-[#191C1D]">
                                                    Tóm tắt báo cáo nhanh
                                                </p>
                                                <span className="text-[12px] leading-5 text-[#737781]">
                                                    Mã đơn vị {selectedOrg.code}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid gap-3 text-[14px] leading-6 text-[#424750]">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>
                                                        Chiến dịch đã ghi nhận
                                                    </span>
                                                    <span className="font-semibold text-[#191C1D]">
                                                        {(
                                                            selectedOrgReport?.campaign_count ??
                                                            sortedCampaigns.length
                                                        ).toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>
                                                        Tổng giờ tình nguyện
                                                    </span>
                                                    <span className="font-semibold text-[#191C1D]">
                                                        {(
                                                            selectedOrgReport?.completed_event_hours ??
                                                            0
                                                        ).toLocaleString(
                                                            'vi-VN',
                                                        )}{' '}
                                                        giờ
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>
                                                        Chứng nhận đã cấp
                                                    </span>
                                                    <span className="font-semibold text-[#191C1D]">
                                                        {(
                                                            selectedOrgReport?.issued_certificates ??
                                                            0
                                                        ).toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>Ngày tạo hồ sơ</span>
                                                    <span className="font-semibold text-[#191C1D]">
                                                        {formatDate(
                                                            selectedOrg.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t border-[#E1E3E4] pt-5">
                                        <h4 className={cardLabelClassName}>
                                            Lịch sử chiến dịch và tác động
                                        </h4>

                                        {detailLoading ? null : sortedCampaigns.length >
                                          0 ? (
                                            <div className="space-y-3">
                                                {sortedCampaigns
                                                    .slice(0, 4)
                                                    .map((campaign) => (
                                                        <article
                                                            key={campaign.id}
                                                            className="rounded-xl border border-[#C3C6D2] bg-white p-4"
                                                        >
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <h5 className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                    {
                                                                        campaign.title
                                                                    }
                                                                </h5>
                                                                <span
                                                                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getCampaignStatusBadgeClassName(
                                                                        campaign.status,
                                                                    )}`}
                                                                >
                                                                    {getCampaignStatusLabel(
                                                                        campaign.status,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                                {
                                                                    campaign.summary
                                                                }
                                                            </p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {campaign.module_types.map(
                                                                    (
                                                                        moduleType,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                moduleType
                                                                            }
                                                                            className="inline-flex rounded-lg bg-[#F3F4F5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#424750]"
                                                                        >
                                                                            {getModuleTypeLabel(
                                                                                moduleType,
                                                                            )}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-between gap-3 text-[13px] leading-5 text-[#737781]">
                                                                <span>
                                                                    Bắt đầu{' '}
                                                                    {formatDate(
                                                                        campaign.start_at,
                                                                    )}
                                                                </span>
                                                                <Link
                                                                    to={paths.app.campaigns.detail.getHref(
                                                                        campaign.slug,
                                                                    )}
                                                                    className="inline-flex items-center gap-1 font-semibold text-[#002A58] hover:text-[#004080]"
                                                                >
                                                                    Xem chiến
                                                                    dịch
                                                                    <ArrowRight
                                                                        className="size-4"
                                                                        strokeWidth={
                                                                            1.5
                                                                        }
                                                                    />
                                                                </Link>
                                                            </div>
                                                        </article>
                                                    ))}
                                            </div>
                                        ) : (
                                            <EmptyState
                                                title="Chưa có chiến dịch"
                                                description="Đơn vị này chưa có chiến dịch công khai hoặc dữ liệu campaign chưa sẵn sàng."
                                            />
                                        )}
                                    </section>
                                </div>

                                <div className="mt-auto border-t border-[#E1E3E4] px-5 py-5 sm:px-6">
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            type="button"
                                            size="lg"
                                            className="flex-1 rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                            onClick={() =>
                                                openEditDialog(selectedOrg)
                                            }
                                        >
                                            <PencilLine
                                                className="size-4"
                                                strokeWidth={1.5}
                                            />
                                            Cập nhật thông tin đơn vị
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-lg border-[#F2B8B5] bg-white text-[#BA1A1A] hover:bg-[#FFF8F7] hover:text-[#93000A]"
                                            onClick={() =>
                                                void handleDelete(selectedOrg)
                                            }
                                        >
                                            <Trash2
                                                className="size-4"
                                                strokeWidth={1.5}
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </aside>
                </section>

                <Dialog
                    open={isFormDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeFormDialog();
                        }
                    }}
                >
                    <DialogContent>
                        <div className="flex items-start justify-between border-b border-[#E1E3E4] px-5 py-5 sm:px-6">
                            <div>
                                <p className={cardLabelClassName}>
                                    {formMode === 'create'
                                        ? 'Tạo mới trong hộp thoại'
                                        : 'Cập nhật trong hộp thoại'}
                                </p>
                                <DialogTitle className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    {formMode === 'create'
                                        ? 'Đăng ký đơn vị mới'
                                        : 'Cập nhật thông tin đơn vị'}
                                </DialogTitle>
                                <DialogDescription className="mt-2 max-w-2xl text-[14px] leading-6 text-[#424750]">
                                    Giữ canvas quản trị gọn như bản tham khảo và
                                    đưa toàn bộ thao tác tạo, sửa vào một hộp
                                    thoại tập trung.
                                </DialogDescription>
                            </div>
                            <DialogClose
                                render={
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-lg border border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#F3F4F5]"
                                    />
                                }
                            >
                                <X className="size-4" strokeWidth={1.5} />
                            </DialogClose>
                        </div>

                        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-5 py-5 sm:px-6">
                            <form className="space-y-4" onSubmit={handleSave}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FilterField label="Mã đơn vị">
                                        <Input
                                            data-testid="admin-org-form-code"
                                            value={form.code}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    code: event.target.value,
                                                }))
                                            }
                                            placeholder="Ví dụ: CLB-XANH"
                                            className={inputClassName}
                                        />
                                    </FilterField>
                                    <FilterField label="Loại đơn vị">
                                        <select
                                            data-testid="admin-org-form-type"
                                            value={form.type}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    type: event.target.value,
                                                }))
                                            }
                                            className={selectClassName}
                                        >
                                            {orgTypeOptions.map((option) => (
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

                                <FilterField label="Tên đơn vị">
                                    <Input
                                        data-testid="admin-org-form-name"
                                        value={form.name}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="Nhập tên đơn vị"
                                        className={inputClassName}
                                    />
                                </FilterField>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FilterField label="Trạng thái">
                                        <select
                                            data-testid="admin-org-form-status"
                                            value={form.status}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    status: event.target.value,
                                                }))
                                            }
                                            className={selectClassName}
                                        >
                                            <option value="ACTIVE">
                                                Đang hoạt động
                                            </option>
                                            <option value="INACTIVE">
                                                Ngừng hoạt động
                                            </option>
                                        </select>
                                    </FilterField>
                                    <FilterField label="Mô tả ngắn">
                                        <Input
                                            data-testid="admin-org-form-description"
                                            value={form.description}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder="Mô tả ngắn về đơn vị"
                                            className={inputClassName}
                                        />
                                    </FilterField>
                                </div>

                                <div className="rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] p-4 text-[14px] leading-6 text-[#424750]">
                                    Mã đơn vị nên ổn định theo chuẩn nội bộ để
                                    thuận tiện cho việc tích hợp báo cáo, phân
                                    quyền và đối soát dữ liệu trong các màn hình
                                    quản trị sau này.
                                </div>

                                <div className="flex flex-col gap-3 border-t border-[#E1E3E4] pt-4 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-lg border-[#C3C6D2] normal-case tracking-normal"
                                        onClick={closeFormDialog}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                        disabled={
                                            saving ||
                                            !form.name.trim() ||
                                            !form.code.trim()
                                        }
                                    >
                                        {saving
                                            ? 'Đang lưu...'
                                            : formMode === 'create'
                                              ? 'Tạo đơn vị'
                                              : 'Cập nhật đơn vị'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};
