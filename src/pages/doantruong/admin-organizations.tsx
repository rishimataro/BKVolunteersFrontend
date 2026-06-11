import * as React from 'react';
import { Link } from 'react-router';
import {
    ArrowRight,
    Eye,
    FileBarChart2,
    PencilLine,
    Plus,
    Search,
    Trash2,
    X,
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
    type AdminOrganizationStatus,
    type AdminOrganizationType,
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
    type: AdminOrganizationType;
    status: AdminOrganizationStatus;
    facultyId: string;
};

type QuickTypeFilter = '' | AdminOrganizationType;

const DEFAULT_FORM: OrgFormState = {
    code: '',
    name: '',
    type: 'CLUB',
    status: 'ACTIVE',
    facultyId: '',
};

const ORGANIZATIONS_PER_PAGE = 10;

const orgTypeOptions = [
    { value: 'CLUB', label: 'Câu lạc bộ' },
    { value: 'FACULTY', label: 'Khoa' },
] as const;

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

    if (type === 'FACULTY') {
        return 'bg-[#FFDBCB] text-[#6F2D00]';
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
    const [filterStatus, setFilterStatus] = React.useState<
        '' | AdminOrganizationStatus
    >('');
    const [currentPage, setCurrentPage] = React.useState(1);

    const [formMode, setFormMode] = React.useState<FormMode>('create');
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState<OrgFormState>(DEFAULT_FORM);
    const [saving, setSaving] = React.useState(false);
    const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);

    const loadData = React.useCallback(
        async (override?: {
            q?: string;
            type?: QuickTypeFilter;
            status?: '' | AdminOrganizationStatus;
        }) => {
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

        setSelectedOrgId(null);
    }, [orgs, selectedOrgId]);

    const selectedOrg = React.useMemo(
        () => orgs.find((org) => org.id === selectedOrgId) ?? null,
        [orgs, selectedOrgId],
    );
    const facultyOptions = React.useMemo(
        () =>
            orgs
                .filter((org) => org.type === 'FACULTY')
                .map((org) => ({
                    id: org.faculty?.id ?? org.id.replace('faculty-', ''),
                    name: org.name,
                    code: org.code,
                })),
        [orgs],
    );
    const isFacultyForm = form.type === 'FACULTY';
    const isClubForm = form.type === 'CLUB';

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

    const closeDetailDialog = () => {
        setSelectedOrgId(null);
        setSelectedOrgDetail(null);
        setDetailError(null);
    };

    const openEditDialog = (organization: AdminOrganization) => {
        closeDetailDialog();
        setFormMode('edit');
        setEditingId(organization.id);
        setForm({
            code: organization.code,
            name: organization.name,
            type: organization.type,
            status: organization.status,
            facultyId: organization.type === 'CLUB' ? (organization.faculty?.id ?? '') : '',
        });
        setIsFormDialogOpen(true);
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.name.trim() || (isFacultyForm && !form.code.trim())) {
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
                ...(isFacultyForm ? { code: form.code.trim() } : {}),
                ...(isClubForm ? { status: form.status } : {}),
                ...(isClubForm
                    ? {
                          faculty_id: form.facultyId.trim() || undefined,
                      }
                    : {}),
            };

            if (editingId) {
                await updateAdminOrganization(editingId, payload);
                addNotification({
                    type: 'success',
                    title: 'Cập nhật thành công',
                    message: 'Thông tin đơn vị đã được cập nhật.',
                });
            } else {
                await createAdminOrganization(payload);
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
        setCurrentPage(1);
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

    const totalPages = Math.max(
        1,
        Math.ceil(scoredOrganizations.length / ORGANIZATIONS_PER_PAGE),
    );

    React.useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const paginatedOrganizations = React.useMemo(() => {
        const startIndex = (currentPage - 1) * ORGANIZATIONS_PER_PAGE;

        return scoredOrganizations.slice(
            startIndex,
            startIndex + ORGANIZATIONS_PER_PAGE,
        );
    }, [currentPage, scoredOrganizations]);

    const currentPageStart = scoredOrganizations.length
        ? (currentPage - 1) * ORGANIZATIONS_PER_PAGE + 1
        : 0;
    const currentPageEnd = Math.min(
        currentPage * ORGANIZATIONS_PER_PAGE,
        scoredOrganizations.length,
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
            <div className="mx-auto max-w-[1680px] space-y-8 px-4 pb-10 font-sans sm:px-6 xl:px-8">
                <section className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
                    <div className="space-y-3">
                        <p className={cardLabelClassName}>Quản trị đơn vị</p>
                        <div className="space-y-2">
                            <h1 className="text-[40px] font-bold leading-[48px] text-[#002A58]">
                                Quản lý các đơn vị
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <Link
                            to={paths.app.reports.getHref()}
                            className="inline-flex min-h-12 min-w-[220px] items-center justify-center gap-2 rounded-lg border border-[#C3C6D2] bg-white px-5 py-3 text-[15px] font-semibold text-[#191C1D] transition hover:bg-[#F3F4F5]"
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
                            className="min-h-12 min-w-[240px] rounded-lg bg-[#002A58] px-6 normal-case tracking-normal text-white hover:bg-[#004080]"
                            onClick={openCreateDialog}
                        >
                            <Plus className="size-4" strokeWidth={1.5} />
                            Đăng ký đơn vị mới
                        </Button>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="space-y-6">
                        <section className={`${panelClassName} p-6 lg:p-7`}>
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
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    setCurrentPage(1);
                                    void loadData();
                                }}
                                className="mt-6"
                            >
                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_240px_240px]">
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
                                                placeholder="Tìm theo mã khoa, tên khoa hoặc tên câu lạc bộ"
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
                                                Tất cả loại đơn vị
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
                                                setFilterStatus(
                                                    event.target.value as
                                                        | ''
                                                        | AdminOrganizationStatus,
                                                )
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
                                </div>

                                <div className="mt-5 flex flex-col gap-3 border-t border-[#E1E3E4] pt-4 sm:flex-row sm:justify-end">
                                    <Button
                                        type="submit"
                                        className="min-h-11 min-w-[160px] rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                    >
                                        Lọc dữ liệu
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-11 min-w-[132px] rounded-lg border-[#C3C6D2] normal-case tracking-normal"
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
                                        Danh sách khoa và câu lạc bộ
                                    </h2>
                                    <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                        Chọn một dòng để mở hộp thoại hồ sơ vận hành
                                        và kiểm tra dữ liệu đúng theo từng đơn vị
                                        trong cơ sở dữ liệu.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-3 py-2 text-[13px] text-[#424750]">
                                    Hiển thị {currentPageStart}-{currentPageEnd} /{' '}
                                    {orgs.length} đơn vị
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
                                <>
                                    <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1120px] table-fixed border-collapse">
                                        <colgroup>
                                            <col className="w-[34%]" />
                                            <col className="w-[16%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[15%]" />
                                            <col className="w-[12%]" />
                                            <col className="w-[8%]" />
                                        </colgroup>
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
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750] whitespace-nowrap">
                                                    Impact score
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Tổng quỹ ghi nhận
                                                </th>
                                                <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750] whitespace-nowrap">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedOrganizations.map(
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
                                                                    className="flex items-start w-full min-w-0 gap-4 text-left"
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
                                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                                        <p className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                            {
                                                                                organization.name
                                                                            }
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
                                                                        {organization.type ===
                                                                        'FACULTY'
                                                                            ? 'Đơn vị gốc'
                                                                            : organization
                                                                                  .faculty
                                                                                  ?.name ??
                                                                              'Cấp trường'}
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
                                                                <div className="flex flex-col gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="h-10 rounded-lg border border-[#C3C6D2] bg-white px-3 text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
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
                                                                        className="h-10 rounded-lg border border-[#C3C6D2] bg-white px-3 text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
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
                                <div className="flex flex-col gap-4 border-t border-[#E1E3E4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <p className="text-[13px] leading-5 text-[#737781]">
                                        Trang {currentPage}/{totalPages} · Hiển thị tối đa{' '}
                                        {ORGANIZATIONS_PER_PAGE} đơn vị mỗi trang
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="min-h-10 rounded-lg border-[#C3C6D2] px-4 normal-case tracking-normal"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(1)}
                                        >
                                            Về trang đầu
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="min-h-10 rounded-lg border-[#C3C6D2] px-4 normal-case tracking-normal"
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(1, page - 1),
                                                )
                                            }
                                        >
                                            Trang trước
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="min-h-10 rounded-lg border-[#C3C6D2] px-4 normal-case tracking-normal"
                                            disabled={currentPage === totalPages}
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(totalPages, page + 1),
                                                )
                                            }
                                        >
                                            Trang sau
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="min-h-10 rounded-lg border-[#C3C6D2] px-4 normal-case tracking-normal"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(totalPages)}
                                        >
                                            Về trang cuối
                                        </Button>
                                    </div>
                                </div>
                                </>
                            ) : null}
                        </section>
                    </div>
                </section>

                <Dialog
                    open={Boolean(selectedOrg)}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDetailDialog();
                        }
                    }}
                >
                    <DialogContent className="max-w-[min(1120px,calc(100vw-2rem))] p-0">
                        {selectedOrg ? (
                            <>
                                <div className="flex flex-col gap-4 border-b border-[#E1E3E4] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                                    <div className="space-y-2">
                                        <p className={cardLabelClassName}>
                                            Hồ sơ vận hành
                                        </p>
                                        <DialogTitle className="text-[28px] font-semibold leading-9 text-[#002A58]">
                                            {selectedOrg.name}
                                        </DialogTitle>
                                        <DialogDescription className="max-w-3xl text-[14px] leading-6 text-[#424750]">
                                            Theo dõi dữ liệu vận hành, chiến dịch và
                                            báo cáo của đơn vị này trong một hộp
                                            thoại riêng để kiểm tra thuận tiện hơn.
                                        </DialogDescription>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link
                                            to={paths.app.reports.getHref()}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#C3C6D2] bg-white px-4 text-[14px] font-semibold text-[#191C1D] transition hover:bg-[#F3F4F5]"
                                        >
                                            <ArrowRight
                                                className="size-4"
                                                strokeWidth={1.5}
                                            />
                                            Mở báo cáo
                                        </Link>
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
                                            <X
                                                className="size-4"
                                                strokeWidth={1.5}
                                            />
                                        </DialogClose>
                                    </div>
                                </div>

                                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-5 py-5 sm:px-6">
                                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
                                        <div className="space-y-6">
                                            <section
                                                className={`${panelClassName} p-5`}
                                            >
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D6E3FF] text-[24px] font-semibold text-[#002A58]">
                                                        {getOrganizationInitials(
                                                            selectedOrg,
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-4">
                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span
                                                                        className={`inline-flex rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${getTypeBadgeClassName(
                                                                            selectedOrg.type,
                                                                        )}`}
                                                                    >
                                                                        {getOrgTypeLabel(
                                                                            selectedOrg.type,
                                                                        )}
                                                                    </span>
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
                                                                <p className="text-[15px] leading-6 text-[#424750]">
                                                                    {selectedOrg.description?.trim() ||
                                                                        (selectedOrg.type ===
                                                                        'FACULTY'
                                                                            ? 'Đơn vị cấp khoa được lưu trực tiếp trong bảng khoa của hệ thống.'
                                                                            : 'Câu lạc bộ được lưu trực tiếp trong bảng câu lạc bộ của hệ thống.')}
                                                                </p>
                                                            </div>
                                                            <div className="grid gap-2 text-[13px] leading-5 text-[#424750] sm:grid-cols-2">
                                                                <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                                    <p className={fieldLabelClassName}>
                                                                        Mã đơn vị
                                                                    </p>
                                                                    <p className="mt-1 text-[15px] font-semibold text-[#191C1D]">
                                                                        {
                                                                            selectedOrg.code
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                                    <p className={fieldLabelClassName}>
                                                                        Đơn vị gốc
                                                                    </p>
                                                                    <p className="mt-1 text-[15px] font-semibold text-[#191C1D]">
                                                                        {selectedOrg.type ===
                                                                        'FACULTY'
                                                                            ? 'Khoa'
                                                                            : selectedOrg
                                                                                  .faculty
                                                                                  ?.name ??
                                                                              'Cấp trường'}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                                    <p className={fieldLabelClassName}>
                                                                        Tạo ngày
                                                                    </p>
                                                                    <p className="mt-1 text-[15px] font-semibold text-[#191C1D]">
                                                                        {formatDate(
                                                                            selectedOrg.created_at,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                                    <p className={fieldLabelClassName}>
                                                                        Số chiến dịch
                                                                    </p>
                                                                    <p className="mt-1 text-[15px] font-semibold text-[#191C1D]">
                                                                        {
                                                                            sortedCampaigns.length
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                <div
                                                    className={`${panelClassName} p-5`}
                                                >
                                                    <p className={cardLabelClassName}>
                                                        Impact score
                                                    </p>
                                                    <p className="mt-3 text-[30px] font-semibold leading-9 text-[#006D37]">
                                                        {selectedImpactScore}/100
                                                    </p>
                                                </div>
                                                <div
                                                    className={`${panelClassName} p-5`}
                                                >
                                                    <p className={cardLabelClassName}>
                                                        Xếp hạng
                                                    </p>
                                                    <p className="mt-3 text-[30px] font-semibold leading-9 text-[#002A58]">
                                                        {selectedOrgRanking
                                                            ? `#${selectedOrgRanking}`
                                                            : 'Chưa xếp hạng'}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`${panelClassName} p-5`}
                                                >
                                                    <p className={cardLabelClassName}>
                                                        Tổng quỹ ghi nhận
                                                    </p>
                                                    <p className="mt-3 text-[30px] font-semibold leading-9 text-[#191C1D]">
                                                        {formatCurrency(
                                                            selectedOrgReport?.verified_money_amount ??
                                                                0,
                                                        )}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`${panelClassName} p-5`}
                                                >
                                                    <p className={cardLabelClassName}>
                                                        Lượt tham gia hoàn thành
                                                    </p>
                                                    <p className="mt-3 text-[30px] font-semibold leading-9 text-[#191C1D]">
                                                        {(
                                                            selectedOrgReport?.completed_event_registrations ??
                                                            0
                                                        ).toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                    </p>
                                                </div>
                                            </section>

                                            <section
                                                className={`${panelClassName} overflow-hidden`}
                                            >
                                                <div className="border-b border-[#E1E3E4] px-5 py-4 sm:px-6">
                                                    <h3 className="text-[20px] font-semibold leading-7 text-[#002A58]">
                                                        Danh sách chiến dịch
                                                    </h3>
                                                    <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                        Dữ liệu lấy trực tiếp từ API
                                                        chi tiết đơn vị để đối chiếu
                                                        hoạt động đang có.
                                                    </p>
                                                </div>

                                                <div className="p-5 sm:p-6">
                                                    {detailLoading ? (
                                                        <LoadingState />
                                                    ) : null}
                                                    {detailError ? (
                                                        <ErrorState
                                                            message={detailError}
                                                        />
                                                    ) : null}
                                                    {!detailLoading &&
                                                    !detailError &&
                                                    sortedCampaigns.length ===
                                                        0 ? (
                                                        <EmptyState
                                                            title="Chưa có chiến dịch"
                                                            description="Đơn vị này hiện chưa có chiến dịch nào để hiển thị trong hồ sơ vận hành."
                                                        />
                                                    ) : null}
                                                    {!detailLoading &&
                                                    !detailError &&
                                                    sortedCampaigns.length >
                                                        0 ? (
                                                        <div className="space-y-4">
                                                            {sortedCampaigns.map(
                                                                (campaign) => (
                                                                    <article
                                                                        key={
                                                                            campaign.id
                                                                        }
                                                                        className="rounded-xl border border-[#E1E3E4] bg-white p-4"
                                                                    >
                                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                                                    {
                                                                                        campaign.title
                                                                                    }
                                                                                </p>
                                                                                <p className="mt-2 text-[14px] leading-6 text-[#424750]">
                                                                                    {campaign.summary?.trim() ||
                                                                                        'Chưa có mô tả ngắn cho chiến dịch này.'}
                                                                                </p>
                                                                            </div>
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
                                                                        <div className="mt-4 flex flex-col gap-3 text-[13px] leading-5 text-[#424750] lg:flex-row lg:items-center lg:justify-between">
                                                                            <p>
                                                                                Thời gian:{' '}
                                                                                <span className="font-semibold text-[#191C1D]">
                                                                                    {formatDate(
                                                                                        campaign.start_at,
                                                                                    )}{' '}
                                                                                    -{' '}
                                                                                    {formatDate(
                                                                                        campaign.end_at,
                                                                                    )}
                                                                                </span>
                                                                            </p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {campaign.module_types.map(
                                                                                    (
                                                                                        moduleType,
                                                                                    ) => (
                                                                                        <span
                                                                                            key={`${campaign.id}-${moduleType}`}
                                                                                            className="inline-flex rounded-lg border border-[#C3C6D2] bg-[#F8F9FA] px-3 py-1 text-[12px] font-semibold text-[#424750]"
                                                                                        >
                                                                                            {getModuleTypeLabel(
                                                                                                moduleType,
                                                                                            )}
                                                                                        </span>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </article>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </section>
                                        </div>

                                        <div className="space-y-4">
                                            <section
                                                className={`${panelClassName} p-5`}
                                            >
                                                <h3 className="text-[18px] font-semibold leading-7 text-[#002A58]">
                                                    Minh bạch vận hành
                                                </h3>
                                                <div className="mt-4 space-y-3 text-[14px] leading-6 text-[#424750]">
                                                    <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                        <p className={fieldLabelClassName}>
                                                            Quyên góp hiện vật
                                                        </p>
                                                        <p className="mt-1 text-[18px] font-semibold text-[#191C1D]">
                                                            {(
                                                                selectedOrgReport?.received_item_quantity ??
                                                                0
                                                            ).toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                        <p className={fieldLabelClassName}>
                                                            Giờ hoạt động hoàn thành
                                                        </p>
                                                        <p className="mt-1 text-[18px] font-semibold text-[#191C1D]">
                                                            {(
                                                                selectedOrgReport?.completed_event_hours ??
                                                                0
                                                            ).toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                                        <p className={fieldLabelClassName}>
                                                            Chứng nhận đã cấp
                                                        </p>
                                                        <p className="mt-1 text-[18px] font-semibold text-[#191C1D]">
                                                            {(
                                                                selectedOrgReport?.issued_certificates ??
                                                                0
                                                            ).toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section
                                                className={`${panelClassName} p-5`}
                                            >
                                                <h3 className="text-[18px] font-semibold leading-7 text-[#002A58]">
                                                    Thao tác nhanh
                                                </h3>
                                                <div className="flex flex-col gap-3 mt-4">
                                                    <Button
                                                        type="button"
                                                        className="min-h-11 rounded-lg bg-[#002A58] normal-case tracking-normal text-white hover:bg-[#004080]"
                                                        onClick={() =>
                                                            openEditDialog(
                                                                selectedOrg,
                                                            )
                                                        }
                                                    >
                                                        <PencilLine
                                                            className="size-4"
                                                            strokeWidth={1.5}
                                                        />
                                                        Chỉnh sửa đơn vị
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="min-h-11 rounded-lg border-[#D44B2F] text-[#D44B2F] normal-case tracking-normal hover:bg-[#FFF4F0]"
                                                        onClick={() =>
                                                            void handleDelete(
                                                                selectedOrg,
                                                            )
                                                        }
                                                    >
                                                        <Trash2
                                                            className="size-4"
                                                            strokeWidth={1.5}
                                                        />
                                                        Xóa đơn vị
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="min-h-11 rounded-lg border-[#C3C6D2] normal-case tracking-normal"
                                                        onClick={closeDetailDialog}
                                                    >
                                                        Đóng hộp thoại
                                                    </Button>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </DialogContent>
                </Dialog>

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
                                    Chỉ quản lý hai loại đơn vị có thật trong cơ sở dữ liệu:
                                    khoa và câu lạc bộ. Các trường không tồn tại trong DB đã được loại bỏ khỏi biểu mẫu.
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
                                            placeholder={
                                                isFacultyForm
                                                    ? 'Ví dụ: 102'
                                                    : 'Mã CLB được sinh tự động sau khi tạo'
                                            }
                                            className={inputClassName}
                                            disabled={isClubForm}
                                        />
                                    </FilterField>
                                    <FilterField label="Loại đơn vị">
                                        <select
                                            data-testid="admin-org-form-type"
                                            value={form.type}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    type: event.target
                                                        .value as AdminOrganizationType,
                                                    code:
                                                        event.target.value ===
                                                        'FACULTY'
                                                            ? current.code
                                                            : '',
                                                    facultyId:
                                                        event.target.value ===
                                                        'CLUB'
                                                            ? current.facultyId
                                                            : '',
                                                    status:
                                                        event.target.value ===
                                                        'CLUB'
                                                            ? current.status
                                                            : 'ACTIVE',
                                                }))
                                            }
                                            className={selectClassName}
                                            disabled={formMode === 'edit'}
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
                                    {isClubForm ? (
                                        <FilterField
                                            label="Khoa phụ trách"
                                            hint="Để trống nếu đây là câu lạc bộ cấp trường."
                                        >
                                            <select
                                                value={form.facultyId}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        facultyId:
                                                            event.target.value,
                                                    }))
                                                }
                                                className={selectClassName}
                                            >
                                                <option value="">
                                                    Câu lạc bộ cấp trường
                                                </option>
                                                {facultyOptions.map((option) => (
                                                    <option
                                                        key={option.id}
                                                        value={option.id}
                                                    >
                                                        {option.code} -{' '}
                                                        {option.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </FilterField>
                                    ) : (
                                        <FilterField
                                            label="Trạng thái"
                                            hint="Theo schema hiện tại, khoa luôn ở trạng thái hoạt động."
                                        >
                                            <Input
                                                value="Đang hoạt động"
                                                className={inputClassName}
                                                disabled
                                            />
                                        </FilterField>
                                    )}
                                    {isClubForm ? (
                                        <FilterField label="Trạng thái">
                                            <select
                                                data-testid="admin-org-form-status"
                                                value={form.status}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        status: event.target
                                                            .value as AdminOrganizationStatus,
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
                                    ) : (
                                        <FilterField
                                            label="Liên kết dữ liệu"
                                            hint="Khoa có thể được dùng làm đơn vị gốc cho sinh viên, cán bộ quản lý và câu lạc bộ."
                                        >
                                            <Input
                                                value="Quản lý trực tiếp trong bảng khoa"
                                                className={inputClassName}
                                                disabled
                                            />
                                        </FilterField>
                                    )}
                                </div>

                                <div className="rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] p-4 text-[14px] leading-6 text-[#424750]">
                                    {isFacultyForm
                                        ? 'Khoa lưu trực tiếp mã và tên trong cơ sở dữ liệu. Hãy nhập đúng mã khoa chuẩn để đồng bộ với hồ sơ sinh viên và cán bộ.'
                                        : 'Câu lạc bộ không có cột mã riêng trong cơ sở dữ liệu. Hệ thống dùng mã hiển thị sinh tự động từ ID và lưu quan hệ với khoa nếu bạn chọn khoa phụ trách.'}
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
                                            (isFacultyForm && !form.code.trim())
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

