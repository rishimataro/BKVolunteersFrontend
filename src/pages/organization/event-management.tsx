import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    ArrowLeft,
    CalendarCheck,
    CalendarRange,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    Clock,
    Eye,
    FileText,
    MapPin,
    Search,
    UserCheck,
    UserX,
    Users,
    UsersRound,
    XCircle,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { useNotifications } from '@/components/ui/notifications';
import {
    approveEventRegistration,
    checkInEventRegistration,
    completeEventRegistration,
    getEventModule,
    getEventRegistrations,
    rejectEventRegistration,
    type EventModuleDetail,
    type EventRegistrationItem,
} from '@/features/campaign/api/events';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { EventRegistrationStatus } from '@/types/api';

const PAGE_SIZE = 10;
const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const statusConfig: Record<
    EventRegistrationStatus,
    {
        label: string;
        pillClassName: string;
        icon: typeof Clock;
    }
> = {
    PENDING: {
        label: 'Chờ duyệt',
        pillClassName:
            'border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C] [&_svg]:text-[#F97316]',
        icon: Clock,
    },
    APPROVED: {
        label: 'Đã duyệt',
        pillClassName:
            'border-[#86EFAC] bg-[#F0FDF4] text-[#166534] [&_svg]:text-[#16A34A]',
        icon: CheckCircle2,
    },
    REJECTED: {
        label: 'Từ chối',
        pillClassName:
            'border-input bg-[#F3F4F6] text-muted-foreground [&_svg]:text-[#6B7280]',
        icon: XCircle,
    },
    CHECKED_IN: {
        label: 'Đã điểm danh',
        pillClassName:
            'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] [&_svg]:text-[#2563EB]',
        icon: UserCheck,
    },
    COMPLETED: {
        label: 'Hoàn thành',
        pillClassName:
            'border-[#C7D2FE] bg-[#EEF2FF] text-[#1E3A8A] [&_svg]:text-[#1D4ED8]',
        icon: CalendarCheck,
    },
    CANCELLED: {
        label: 'Đã hủy',
        pillClassName:
            'border-border bg-muted text-muted-foreground [&_svg]:text-[#6B7280]',
        icon: XCircle,
    },
};

type VolunteerRow = {
    registration: EventRegistrationItem;
    faculty: string;
    note: string;
    skills: string[];
    skillsText: string;
    searchText: string;
};

type RejectDialogState = {
    registrationId: string;
    studentName: string;
};

type CompleteDialogState = {
    registrationId: string;
    studentName: string;
    hours: string;
    note: string;
};

const actionButtonClassName =
    'inline-flex h-10 w-10 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5] disabled:cursor-not-allowed disabled:opacity-40';

const surfaceClassName = 'border border-[#C3C6D2] bg-white';
const inputClassName =
    'h-12 border border-[#C3C6D2] bg-white px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'Chưa cập nhật';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Chưa cập nhật';
    }

    return dateTimeFormatter.format(date);
};

const isSameLocalDay = (value?: string | null) => {
    if (!value) {
        return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const now = new Date();
    return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
};

const getInitials = (fullName: string) =>
    fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

const readTextAnswer = (
    answers: EventRegistrationItem['answers'],
    keys: string[],
) => {
    if (!answers) {
        return '';
    }

    for (const key of keys) {
        const value = answers[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return '';
};

const readListAnswer = (
    answers: EventRegistrationItem['answers'],
    keys: string[],
) => {
    if (!answers) {
        return [] as string[];
    }

    for (const key of keys) {
        const value = answers[key];
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }

        if (typeof value === 'string' && value.trim()) {
            return value
                .split(/[,;\n]/)
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }

    return [] as string[];
};

const getVolunteerRow = (registration: EventRegistrationItem): VolunteerRow => {
    const faculty =
        readTextAnswer(registration.answers, [
            'faculty',
            'faculty_name',
            'department',
            'khoa',
        ]) || 'Chưa cập nhật';
    const note = readTextAnswer(registration.answers, [
        'note',
        'message',
        'experience',
        'ghi_chu',
    ]);
    const skills = readListAnswer(registration.answers, [
        'skills',
        'skill',
        'required_skills',
        'ky_nang',
    ]);
    const skillsText = skills.length > 0 ? skills.join(', ') : 'Chưa cập nhật';
    const searchText = [
        registration.student.full_name,
        registration.student.student_code,
        registration.student.email,
        faculty,
        skillsText,
        note,
        registration.review_note ?? '',
    ]
        .join(' ')
        .toLowerCase();

    return {
        registration,
        faculty,
        note,
        skills,
        skillsText,
        searchText,
    };
};

const getStatusBadge = (status: EventRegistrationStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-2 border px-3 py-1 text-[13px] font-semibold leading-5 ${config.pillClassName}`}
        >
            <Icon className="size-3.5" strokeWidth={1.75} />
            {config.label}
        </span>
    );
};

export const EventManagementRoute = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [module, setModule] = useState<EventModuleDetail | null>(null);
    const [registrations, setRegistrations] = useState<EventRegistrationItem[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        EventRegistrationStatus | 'ALL'
    >('ALL');
    const [facultyFilter, setFacultyFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionId, setActionId] = useState<string | null>(null);
    const [bulkApproving, setBulkApproving] = useState(false);
    const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [rejectDialog, setRejectDialog] = useState<RejectDialogState | null>(
        null,
    );
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [completeDialog, setCompleteDialog] =
        useState<CompleteDialogState | null>(null);
    const [completing, setCompleting] = useState(false);

    const loadData = async () => {
        if (!moduleId) {
            setError('Không xác định được hạng mục tình nguyện viên.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [moduleDetail, registrationItems] = await Promise.all([
                getEventModule(moduleId),
                getEventRegistrations(moduleId),
            ]);
            setModule(moduleDetail);
            setRegistrations(registrationItems);
        } catch {
            setError('Không thể tải dữ liệu quản lý tình nguyện viên.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleId]);

    const volunteerRows = useMemo(
        () =>
            registrations.map((registration) => getVolunteerRow(registration)),
        [registrations],
    );

    const facultyOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    volunteerRows
                        .map((row) => row.faculty)
                        .filter((faculty) => faculty !== 'Chưa cập nhật'),
                ),
            ).sort((left, right) => left.localeCompare(right, 'vi')),
        [volunteerRows],
    );

    const filteredRows = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return volunteerRows.filter((row) => {
            const matchesStatus =
                statusFilter === 'ALL' ||
                row.registration.status === statusFilter;
            const matchesFaculty =
                facultyFilter === 'ALL' || row.faculty === facultyFilter;
            const matchesQuery =
                !normalizedQuery || row.searchText.includes(normalizedQuery);

            return matchesStatus && matchesFaculty && matchesQuery;
        });
    }, [facultyFilter, searchQuery, statusFilter, volunteerRows]);

    useEffect(() => {
        setCurrentPage(1);
    }, [facultyFilter, searchQuery, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pagedRows = filteredRows.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE,
    );
    const pageStartIndex =
        filteredRows.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
    const pageEndIndex = Math.min(
        safeCurrentPage * PAGE_SIZE,
        filteredRows.length,
    );

    const selectedPendingIds = selectedIds.filter((id) =>
        volunteerRows.some(
            (row) =>
                row.registration.id === id &&
                row.registration.status === 'PENDING',
        ),
    );

    const pageSelectableIds = pagedRows
        .filter((row) => row.registration.status === 'PENDING')
        .map((row) => row.registration.id);
    const isPageSelected =
        pageSelectableIds.length > 0 &&
        pageSelectableIds.every((id) => selectedIds.includes(id));

    const previewRow =
        volunteerRows.find((row) => row.registration.id === previewId) ?? null;

    const totalRegistrations = volunteerRows.length;
    const approvedPipelineCount = volunteerRows.filter((row) =>
        ['APPROVED', 'CHECKED_IN', 'COMPLETED'].includes(
            row.registration.status,
        ),
    ).length;
    const pendingCount = volunteerRows.filter(
        (row) => row.registration.status === 'PENDING',
    ).length;
    const todayCount = volunteerRows.filter((row) =>
        isSameLocalDay(row.registration.registered_at),
    ).length;
    const approvalRate =
        totalRegistrations > 0
            ? Math.round((approvedPipelineCount / totalRegistrations) * 100)
            : 0;

    const handleToggleSelection = (registrationId: string) => {
        setSelectedIds((current) =>
            current.includes(registrationId)
                ? current.filter((id) => id !== registrationId)
                : [...current, registrationId],
        );
    };

    const handleTogglePageSelection = () => {
        setSelectedIds((current) => {
            if (isPageSelected) {
                return current.filter((id) => !pageSelectableIds.includes(id));
            }

            const merged = new Set([...current, ...pageSelectableIds]);
            return Array.from(merged);
        });
    };

    const handleApprove = async (registrationId: string) => {
        setActionId(registrationId);

        try {
            await approveEventRegistration(registrationId);
            addNotification({
                type: 'success',
                title: 'Đã duyệt tình nguyện viên',
                message: 'Đơn đăng ký đã được duyệt thành công.',
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Duyệt không thành công',
                message: 'Không thể duyệt đơn đăng ký này.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedPendingIds.length === 0) {
            return;
        }

        setBulkApproving(true);

        try {
            await Promise.all(
                selectedPendingIds.map((registrationId) =>
                    approveEventRegistration(registrationId),
                ),
            );
            addNotification({
                type: 'success',
                title: 'Đã duyệt hàng loạt',
                message: `Đã duyệt ${selectedPendingIds.length} đơn đăng ký chờ xử lý.`,
            });
            setShowBulkApproveDialog(false);
            setSelectedIds([]);
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Duyệt hàng loạt thất bại',
                message:
                    'Một hoặc nhiều đơn đăng ký chưa được xử lý thành công.',
            });
        } finally {
            setBulkApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectDialog || !rejectReason.trim()) {
            return;
        }

        setRejecting(true);

        try {
            await rejectEventRegistration(
                rejectDialog.registrationId,
                rejectReason.trim(),
            );
            addNotification({
                type: 'success',
                title: 'Đã từ chối đơn đăng ký',
                message: 'Lý do từ chối đã được gửi cho tình nguyện viên.',
            });
            setRejectDialog(null);
            setRejectReason('');
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Từ chối không thành công',
                message: 'Không thể từ chối đơn đăng ký này.',
            });
        } finally {
            setRejecting(false);
        }
    };

    const handleCheckIn = async (registrationId: string) => {
        setActionId(registrationId);

        try {
            await checkInEventRegistration(registrationId);
            addNotification({
                type: 'success',
                title: 'Đã điểm danh',
                message: 'Tình nguyện viên đã được xác nhận có mặt.',
            });
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Điểm danh không thành công',
                message: 'Không thể cập nhật trạng thái điểm danh.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleComplete = async (registrationId: string) => {
        const hours = Number(completeDialog?.hours ?? 0);
        const note = completeDialog?.note.trim() ?? '';

        if (
            !completeDialog ||
            completeDialog.registrationId !== registrationId ||
            !Number.isFinite(hours) ||
            hours <= 0
        ) {
            addNotification({
                type: 'error',
                title: 'Thiếu dữ liệu hoàn thành',
                message: 'Vui lòng nhập số giờ tham gia lớn hơn 0.',
            });
            return;
        }

        setCompleting(true);
        setActionId(registrationId);

        try {
            await completeEventRegistration(registrationId, {
                hours,
                note: note || undefined,
            });
            addNotification({
                type: 'success',
                title: 'Đã ghi nhận hoàn thành',
                message:
                    'Tình nguyện viên đã được đánh dấu hoàn thành hoạt động.',
            });
            setCompleteDialog(null);
            await loadData();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể hoàn tất',
                message: 'Không thể cập nhật trạng thái hoàn thành.',
            });
        } finally {
            setCompleting(false);
            setActionId(null);
        }
    };

    return (
        <ContentLayout title="Quản Lý Tình Nguyện Viên">
            <div className="space-y-6">
                <section className={`${surfaceClassName} border-b px-5 py-5`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="inline-flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                    aria-label="Quay lại trang trước"
                                >
                                    <ArrowLeft
                                        className="size-5"
                                        strokeWidth={1.75}
                                    />
                                </button>
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                        Quản lý tình nguyện viên
                                    </p>
                                    <h2 className="mt-1 text-[32px] font-semibold leading-[40px] text-[#002A58]">
                                        {module?.campaign.title ??
                                            module?.title ??
                                            'Chiến dịch tình nguyện'}
                                    </h2>
                                </div>
                            </div>
                            <p className="max-w-3xl text-[15px] leading-6 text-[#424750]">
                                Theo dõi danh sách đăng ký, duyệt hồ sơ, điểm
                                danh và hoàn tất từng tình nguyện viên trong
                                hạng mục sự kiện của chiến dịch.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 border-t border-[#C3C6D2] pt-4 text-[15px] lg:border-t-0 lg:pt-0">
                            <button
                                type="button"
                                className="border-b-2 border-[#002A58] pb-1 font-semibold text-[#002A58]"
                            >
                                Tổng quan
                            </button>
                            <div className="h-6 w-px bg-[#C3C6D2]" />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowGuide((current) => !current)
                                }
                                className="inline-flex items-center gap-2 text-[#424750] transition hover:text-[#002A58]"
                            >
                                <CircleHelp
                                    className="size-4"
                                    strokeWidth={1.75}
                                />
                                Hướng dẫn
                            </button>
                        </div>
                    </div>
                </section>

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error ? (
                    <>
                        {module ? (
                            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
                                <article className={`${surfaceClassName} p-5`}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[#002A58]">
                                            <MapPin
                                                className="size-5"
                                                strokeWidth={1.75}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                Địa điểm điều phối
                                            </p>
                                            <p className="mt-2 text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                {module.config.location ||
                                                    'Chưa cập nhật địa điểm'}
                                            </p>
                                            <p className="mt-1 text-[14px] leading-5 text-[#424750]">
                                                Ban tổ chức dùng đầu mối này để
                                                chốt điểm danh và điều phối nhân
                                                sự hiện trường.
                                            </p>
                                        </div>
                                    </div>
                                </article>
                                <article className={`${surfaceClassName} p-5`}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[#006D37]">
                                            <UsersRound
                                                className="size-5"
                                                strokeWidth={1.75}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                Chỉ tiêu tham gia
                                            </p>
                                            <p className="mt-2 text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                {module.config.quota > 0
                                                    ? `${module.config.quota} tình nguyện viên`
                                                    : 'Không giới hạn'}
                                            </p>
                                            <p className="mt-1 text-[14px] leading-5 text-[#424750]">
                                                {module.approved_count} hồ sơ đã
                                                vào pipeline triển khai.
                                            </p>
                                        </div>
                                    </div>
                                </article>
                                <article className={`${surfaceClassName} p-5`}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[#773305]">
                                            <CalendarRange
                                                className="size-5"
                                                strokeWidth={1.75}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                                Thời gian triển khai
                                            </p>
                                            <p className="mt-2 text-[18px] font-semibold leading-7 text-[#191C1D]">
                                                {formatDateTime(
                                                    module.start_at,
                                                )}
                                            </p>
                                            <p className="mt-1 text-[14px] leading-5 text-[#424750]">
                                                Kết thúc lúc{' '}
                                                {formatDateTime(module.end_at)}.
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            </section>
                        ) : null}

                        {showGuide ? (
                            <section className={`${surfaceClassName} p-5`}>
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-3xl">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Hướng dẫn xử lý nhanh
                                        </p>
                                        <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                            Quy trình quản lý tình nguyện viên
                                        </h3>
                                        <p className="mt-2 text-[15px] leading-6 text-[#424750]">
                                            Ưu tiên duyệt hồ sơ phù hợp, điểm
                                            danh đúng thời điểm và chốt hoàn
                                            thành ngay sau khi hoạt động kết
                                            thúc để dữ liệu chứng nhận không bị
                                            lệch.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowGuide(false)}
                                        className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-4 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                    >
                                        Thu gọn hướng dẫn
                                    </button>
                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            1. Sàng lọc hồ sơ
                                        </p>
                                        <p className="mt-2 text-[15px] leading-6 text-[#191C1D]">
                                            Dùng tìm kiếm, khoa và trạng thái để
                                            gom các hồ sơ chờ duyệt theo từng
                                            nhóm triển khai.
                                        </p>
                                    </div>
                                    <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            2. Điều phối hiện trường
                                        </p>
                                        <p className="mt-2 text-[15px] leading-6 text-[#191C1D]">
                                            Khi tình nguyện viên đến điểm tập
                                            trung, chuyển trạng thái sang đã
                                            điểm danh để theo dõi nhân sự thực
                                            tế.
                                        </p>
                                    </div>
                                    <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            3. Chốt hoàn thành
                                        </p>
                                        <p className="mt-2 text-[15px] leading-6 text-[#191C1D]">
                                            Sau hoạt động, xác nhận hoàn thành
                                            để đồng bộ giờ công, báo cáo và dữ
                                            liệu chứng nhận.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        <section className="grid gap-4 md:grid-cols-3">
                            <article className={`${surfaceClassName} p-6`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Tổng đăng ký
                                        </p>
                                        <p className="mt-4 text-[40px] font-bold leading-[48px] text-[#002A58]">
                                            {totalRegistrations}
                                        </p>
                                        <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                            +{todayCount} hồ sơ mới trong hôm
                                            nay.
                                        </p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[#002A58]">
                                        <Users
                                            className="size-7"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                </div>
                            </article>
                            <article className={`${surfaceClassName} p-6`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Đã duyệt
                                        </p>
                                        <p className="mt-4 text-[40px] font-bold leading-[48px] text-[#006D37]">
                                            {approvedPipelineCount}
                                        </p>
                                        <p className="mt-2 text-[14px] leading-5 text-[#006D37]">
                                            {approvalRate}% tỷ lệ duyệt hiện
                                            tại.
                                        </p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[#006D37]">
                                        <CheckCircle2
                                            className="size-7"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                </div>
                            </article>
                            <article className={`${surfaceClassName} p-6`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Chờ duyệt
                                        </p>
                                        <p className="mt-4 text-[40px] font-bold leading-[48px] text-[#C2410C]">
                                            {pendingCount}
                                        </p>
                                        <p className="mt-2 text-[14px] leading-5 text-[#C2410C]">
                                            Cần xử lý để kịp tiến độ chiến dịch.
                                        </p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[#C2410C]">
                                        <Clock
                                            className="size-7"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                </div>
                            </article>
                        </section>

                        <section
                            className={`${surfaceClassName} flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between`}
                        >
                            <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                                <label className="relative block">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#737781]" />
                                    <input
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                        className={`${inputClassName} w-full pl-11`}
                                        placeholder="Tìm kiếm theo tên hoặc MSSV..."
                                    />
                                </label>
                                <select
                                    value={facultyFilter}
                                    onChange={(event) =>
                                        setFacultyFilter(event.target.value)
                                    }
                                    className={inputClassName}
                                >
                                    <option value="ALL">Khoa: Tất cả</option>
                                    {facultyOptions.map((faculty) => (
                                        <option key={faculty} value={faculty}>
                                            {faculty}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value as
                                                | EventRegistrationStatus
                                                | 'ALL',
                                        )
                                    }
                                    className={inputClassName}
                                >
                                    <option value="ALL">
                                        Trạng thái: Tất cả
                                    </option>
                                    {Object.entries(statusConfig).map(
                                        ([value, config]) => (
                                            <option key={value} value={value}>
                                                {config.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <button
                                type="button"
                                disabled={
                                    bulkApproving ||
                                    selectedPendingIds.length === 0
                                }
                                onClick={() => setShowBulkApproveDialog(true)}
                                className="inline-flex h-12 items-center justify-center gap-2 border border-[#006D37] bg-[#006D37] px-6 text-[15px] font-semibold text-white transition hover:bg-[#005228] disabled:cursor-not-allowed disabled:border-[#C3C6D2] disabled:bg-[#E7E8E9] disabled:text-[#737781]"
                            >
                                <Check className="size-4" strokeWidth={1.75} />
                                {bulkApproving
                                    ? 'Đang duyệt...'
                                    : 'Duyệt hàng loạt'}
                            </button>
                        </section>

                        {filteredRows.length === 0 ? (
                            <EmptyState title="Không có tình nguyện viên phù hợp với bộ lọc hiện tại" />
                        ) : (
                            <section
                                className={`${surfaceClassName} overflow-hidden`}
                            >
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#C3C6D2] bg-[#F3F4F5]">
                                                <th className="w-12 px-5 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isPageSelected}
                                                        onChange={
                                                            handleTogglePageSelection
                                                        }
                                                        className="h-5 w-5 border border-[#C3C6D2] bg-white text-[#002A58] focus:ring-[#A9C7FF]"
                                                        aria-label="Chọn tất cả hồ sơ chờ duyệt trên trang hiện tại"
                                                    />
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    MSSV
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Họ và tên
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Khoa
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Kỹ năng / ghi chú
                                                </th>
                                                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Trạng thái
                                                </th>
                                                <th className="px-5 py-4 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedRows.map((row) => {
                                                const registration =
                                                    row.registration;
                                                const isPending =
                                                    registration.status ===
                                                    'PENDING';

                                                return (
                                                    <tr
                                                        key={registration.id}
                                                        className="border-b border-[#E7E8E9] bg-white align-top transition hover:bg-[#F8F9FA]"
                                                    >
                                                        <td className="px-5 py-5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(
                                                                    registration.id,
                                                                )}
                                                                onChange={() =>
                                                                    handleToggleSelection(
                                                                        registration.id,
                                                                    )
                                                                }
                                                                className="h-5 w-5 border border-[#C3C6D2] bg-white text-[#002A58] focus:ring-[#A9C7FF]"
                                                                aria-label={`Chọn hồ sơ ${registration.student.full_name}`}
                                                            />
                                                        </td>
                                                        <td className="px-5 py-5 text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                            {
                                                                registration
                                                                    .student
                                                                    .student_code
                                                            }
                                                        </td>
                                                        <td className="px-5 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center border border-[#C3C6D2] bg-[#F3F4F5] text-[13px] font-bold uppercase text-[#002A58]">
                                                                    {getInitials(
                                                                        registration
                                                                            .student
                                                                            .full_name,
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                        {
                                                                            registration
                                                                                .student
                                                                                .full_name
                                                                        }
                                                                    </p>
                                                                    <p className="text-[14px] leading-5 text-[#737781]">
                                                                        {
                                                                            registration
                                                                                .student
                                                                                .email
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5 text-[15px] leading-6 text-[#191C1D]">
                                                            {row.faculty}
                                                        </td>
                                                        <td className="px-5 py-5">
                                                            <div className="space-y-2">
                                                                <p className="text-[15px] leading-6 text-[#191C1D]">
                                                                    {
                                                                        row.skillsText
                                                                    }
                                                                </p>
                                                                <p className="text-[14px] leading-5 text-[#737781]">
                                                                    {row.note ||
                                                                        'Không có ghi chú ứng tuyển.'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5">
                                                            <div className="space-y-2">
                                                                {getStatusBadge(
                                                                    registration.status,
                                                                )}
                                                                <p className="text-[13px] leading-5 text-[#737781]">
                                                                    Đăng ký lúc{' '}
                                                                    {formatDateTime(
                                                                        registration.registered_at,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5">
                                                            <div className="flex justify-end gap-2">
                                                                {isPending ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                actionId ===
                                                                                registration.id
                                                                            }
                                                                            onClick={() =>
                                                                                void handleApprove(
                                                                                    registration.id,
                                                                                )
                                                                            }
                                                                            className={`${actionButtonClassName} text-[#006D37] hover:border-[#86EFAC] hover:bg-[#F0FDF4]`}
                                                                            aria-label={`Duyệt ${registration.student.full_name}`}
                                                                            title="Duyệt tình nguyện viên"
                                                                        >
                                                                            <Check
                                                                                className="size-4"
                                                                                strokeWidth={
                                                                                    1.75
                                                                                }
                                                                            />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setRejectDialog(
                                                                                    {
                                                                                        registrationId:
                                                                                            registration.id,
                                                                                        studentName:
                                                                                            registration
                                                                                                .student
                                                                                                .full_name,
                                                                                    },
                                                                                )
                                                                            }
                                                                            className={`${actionButtonClassName} text-[#B91C1C] hover:border-[#FECACA] hover:bg-[#FEF2F2]`}
                                                                            aria-label={`Từ chối ${registration.student.full_name}`}
                                                                            title="Từ chối đăng ký"
                                                                        >
                                                                            <UserX
                                                                                className="size-4"
                                                                                strokeWidth={
                                                                                    1.75
                                                                                }
                                                                            />
                                                                        </button>
                                                                    </>
                                                                ) : null}
                                                                {registration.status ===
                                                                'APPROVED' ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            actionId ===
                                                                            registration.id
                                                                        }
                                                                        onClick={() =>
                                                                            void handleCheckIn(
                                                                                registration.id,
                                                                            )
                                                                        }
                                                                        className={
                                                                            actionButtonClassName
                                                                        }
                                                                        aria-label={`Điểm danh ${registration.student.full_name}`}
                                                                        title="Điểm danh tình nguyện viên"
                                                                    >
                                                                        <CalendarCheck
                                                                            className="size-4"
                                                                            strokeWidth={
                                                                                1.75
                                                                            }
                                                                        />
                                                                    </button>
                                                                ) : null}
                                                                {registration.status ===
                                                                'CHECKED_IN' ? (
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            actionId ===
                                                                            registration.id
                                                                        }
                                                                        onClick={() =>
                                                                            setCompleteDialog(
                                                                                {
                                                                                    registrationId:
                                                                                        registration.id,
                                                                                    studentName:
                                                                                        registration
                                                                                            .student
                                                                                            .full_name,
                                                                                    hours: String(
                                                                                        registration.hours ??
                                                                                            1,
                                                                                    ),
                                                                                    note:
                                                                                        registration.review_note ??
                                                                                        '',
                                                                                },
                                                                            )
                                                                        }
                                                                        className={
                                                                            actionButtonClassName
                                                                        }
                                                                        aria-label={`Hoàn tất ${registration.student.full_name}`}
                                                                        title="Ghi nhận hoàn thành"
                                                                    >
                                                                        <CheckCircle2
                                                                            className="size-4"
                                                                            strokeWidth={
                                                                                1.75
                                                                            }
                                                                        />
                                                                    </button>
                                                                ) : null}
                                                                {!isPending ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPreviewId(
                                                                                registration.id,
                                                                            )
                                                                        }
                                                                        className={
                                                                            actionButtonClassName
                                                                        }
                                                                        aria-label={`Xem chi tiết ${registration.student.full_name}`}
                                                                        title="Xem chi tiết hồ sơ"
                                                                    >
                                                                        <Eye
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-4 border-t border-[#C3C6D2] px-5 py-4 text-[15px] text-[#424750] sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        Hiển thị {pageStartIndex}-{pageEndIndex}{' '}
                                        của {filteredRows.length} đơn đăng ký
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={safeCurrentPage === 1}
                                            onClick={() =>
                                                setCurrentPage((current) =>
                                                    current > 1
                                                        ? current - 1
                                                        : current,
                                                )
                                            }
                                            className="inline-flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5] disabled:cursor-not-allowed disabled:text-[#A3A7B0]"
                                            aria-label="Trang trước"
                                        >
                                            <ChevronLeft
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                        {Array.from(
                                            { length: totalPages },
                                            (_, index) => index + 1,
                                        )
                                            .slice(
                                                Math.max(
                                                    0,
                                                    safeCurrentPage - 2,
                                                ),
                                                Math.max(
                                                    3,
                                                    safeCurrentPage + 1,
                                                ),
                                            )
                                            .map((pageNumber) => (
                                                <button
                                                    key={pageNumber}
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            pageNumber,
                                                        )
                                                    }
                                                    className={`inline-flex h-11 min-w-11 items-center justify-center border px-3 text-[15px] font-semibold transition ${
                                                        pageNumber ===
                                                        safeCurrentPage
                                                            ? 'border-[#002A58] bg-[#002A58] text-white'
                                                            : 'border-[#C3C6D2] bg-white text-[#002A58] hover:border-[#A9C7FF] hover:bg-[#F3F4F5]'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            ))}
                                        <button
                                            type="button"
                                            disabled={
                                                safeCurrentPage === totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage((current) =>
                                                    current < totalPages
                                                        ? current + 1
                                                        : current,
                                                )
                                            }
                                            className="inline-flex h-11 w-11 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5] disabled:cursor-not-allowed disabled:text-[#A3A7B0]"
                                            aria-label="Trang sau"
                                        >
                                            <ChevronRight
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                ) : null}

                {previewRow ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-2xl border border-[#C3C6D2] bg-white">
                            <div className="flex items-start justify-between gap-4 border-b border-[#C3C6D2] px-6 py-5">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                        Hồ sơ tình nguyện viên
                                    </p>
                                    <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                        {
                                            previewRow.registration.student
                                                .full_name
                                        }
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewId(null)}
                                    className="inline-flex h-10 w-10 items-center justify-center border border-[#C3C6D2] bg-white text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                    aria-label="Đóng chi tiết hồ sơ"
                                >
                                    <XCircle
                                        className="size-4"
                                        strokeWidth={1.75}
                                    />
                                </button>
                            </div>
                            <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Thông tin cơ bản
                                        </p>
                                        <div className="mt-3 space-y-2 text-[15px] leading-6 text-[#191C1D]">
                                            <p>
                                                MSSV:{' '}
                                                <span className="font-semibold">
                                                    {
                                                        previewRow.registration
                                                            .student
                                                            .student_code
                                                    }
                                                </span>
                                            </p>
                                            <p>
                                                Email:{' '}
                                                <span className="font-semibold">
                                                    {
                                                        previewRow.registration
                                                            .student.email
                                                    }
                                                </span>
                                            </p>
                                            <p>
                                                Khoa:{' '}
                                                <span className="font-semibold">
                                                    {previewRow.faculty}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Trạng thái hồ sơ
                                        </p>
                                        <div className="mt-3">
                                            {getStatusBadge(
                                                previewRow.registration.status,
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Kỹ năng
                                        </p>
                                        <p className="mt-3 text-[15px] leading-6 text-[#191C1D]">
                                            {previewRow.skillsText}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Ghi chú ứng tuyển
                                        </p>
                                        <p className="mt-3 text-[15px] leading-6 text-[#191C1D]">
                                            {previewRow.note ||
                                                'Không có ghi chú ứng tuyển.'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Ghi chú xét duyệt
                                        </p>
                                        <p className="mt-3 text-[15px] leading-6 text-[#191C1D]">
                                            {previewRow.registration
                                                .review_note ||
                                                'Chưa có nhận xét từ ban tổ chức.'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                            Mốc thời gian
                                        </p>
                                        <div className="mt-3 space-y-2 text-[15px] leading-6 text-[#191C1D]">
                                            <p>
                                                Đăng ký:{' '}
                                                <span className="font-semibold">
                                                    {formatDateTime(
                                                        previewRow.registration
                                                            .registered_at,
                                                    )}
                                                </span>
                                            </p>
                                            <p>
                                                Duyệt:{' '}
                                                <span className="font-semibold">
                                                    {formatDateTime(
                                                        previewRow.registration
                                                            .reviewed_at,
                                                    )}
                                                </span>
                                            </p>
                                            <p>
                                                Điểm danh:{' '}
                                                <span className="font-semibold">
                                                    {formatDateTime(
                                                        previewRow.registration
                                                            .checked_in_at,
                                                    )}
                                                </span>
                                            </p>
                                            <p>
                                                Hoàn thành:{' '}
                                                <span className="font-semibold">
                                                    {formatDateTime(
                                                        previewRow.registration
                                                            .checked_out_at,
                                                    )}
                                                </span>
                                            </p>
                                            <p>
                                                Giờ công:{' '}
                                                <span className="font-semibold">
                                                    {previewRow.registration
                                                        .hours ?? 0}{' '}
                                                    giờ
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#C3C6D2] px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => setPreviewId(null)}
                                    className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {showBulkApproveDialog ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-xl border border-[#C3C6D2] bg-white">
                            <div className="border-b border-[#C3C6D2] px-6 py-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Duyệt hàng loạt
                                </p>
                                <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    Xác nhận duyệt các hồ sơ chờ xử lý
                                </h3>
                            </div>
                            <div className="space-y-4 px-6 py-6">
                                <p className="text-[15px] leading-6 text-[#424750]">
                                    Bạn sắp duyệt{' '}
                                    <span className="font-semibold text-[#191C1D]">
                                        {selectedPendingIds.length}
                                    </span>{' '}
                                    hồ sơ tình nguyện viên đang ở trạng thái chờ
                                    xử lý.
                                </p>
                                <div className="border border-[#C3C6D2] bg-[#F8F9FA] p-4 text-[14px] leading-6 text-[#424750]">
                                    Chỉ các hồ sơ còn ở trạng thái `PENDING` mới
                                    được xử lý trong đợt duyệt này.
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#C3C6D2] px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowBulkApproveDialog(false)
                                    }
                                    className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        bulkApproving ||
                                        selectedPendingIds.length === 0
                                    }
                                    onClick={() => void handleBulkApprove()}
                                    className="inline-flex h-11 items-center justify-center border border-[#006D37] bg-[#006D37] px-5 text-[15px] font-semibold text-white transition hover:bg-[#005228] disabled:cursor-not-allowed disabled:border-[#C3C6D2] disabled:bg-[#E7E8E9] disabled:text-[#737781]"
                                >
                                    {bulkApproving
                                        ? 'Đang duyệt...'
                                        : 'Xác nhận duyệt'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {completeDialog ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-xl border border-[#C3C6D2] bg-white">
                            <div className="border-b border-[#C3C6D2] px-6 py-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Ghi nhận hoàn thành
                                </p>
                                <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    {completeDialog.studentName}
                                </h3>
                            </div>
                            <div className="space-y-4 px-6 py-6">
                                <label className="block">
                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                        Số giờ tham gia *
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.5"
                                        value={completeDialog.hours}
                                        onChange={(event) =>
                                            setCompleteDialog((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          hours: event.target
                                                              .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                        className={`${inputClassName} w-full`}
                                        placeholder="Ví dụ: 4"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                        Ghi chú hoàn thành
                                    </span>
                                    <textarea
                                        value={completeDialog.note}
                                        onChange={(event) =>
                                            setCompleteDialog((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          note: event.target
                                                              .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                        rows={4}
                                        className="w-full border border-[#C3C6D2] bg-white px-4 py-3 text-[15px] leading-6 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                        placeholder="Ví dụ: tham gia đầy đủ, hỗ trợ điều phối nhóm."
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#C3C6D2] px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => setCompleteDialog(null)}
                                    className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={completing}
                                    onClick={() =>
                                        void handleComplete(
                                            completeDialog.registrationId,
                                        )
                                    }
                                    className="inline-flex h-11 items-center justify-center border border-[#002A58] bg-[#002A58] px-5 text-[15px] font-semibold text-white transition hover:bg-[#0E4686] disabled:cursor-not-allowed disabled:border-[#C3C6D2] disabled:bg-[#E7E8E9] disabled:text-[#737781]"
                                >
                                    {completing
                                        ? 'Đang lưu...'
                                        : 'Lưu hoàn thành'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {rejectDialog ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-xl border border-[#C3C6D2] bg-white">
                            <div className="border-b border-[#C3C6D2] px-6 py-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#737781]">
                                    Từ chối đăng ký
                                </p>
                                <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                    {rejectDialog.studentName}
                                </h3>
                            </div>
                            <div className="space-y-4 px-6 py-6">
                                <div className="flex items-start gap-3 border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                                    <FileText
                                        className="mt-0.5 size-4 shrink-0 text-[#737781]"
                                        strokeWidth={1.75}
                                    />
                                    <p className="text-[15px] leading-6 text-[#424750]">
                                        Nêu rõ lý do để ban tổ chức và tình
                                        nguyện viên có thể theo dõi lại hồ sơ về
                                        sau.
                                    </p>
                                </div>
                                <label className="block">
                                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#191C1D]">
                                        Lý do từ chối *
                                    </span>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(event) =>
                                            setRejectReason(event.target.value)
                                        }
                                        rows={5}
                                        className="min-h-36 w-full border border-[#C3C6D2] bg-white px-4 py-3 text-[15px] leading-6 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                        placeholder="Ví dụ: Hồ sơ còn thiếu thông tin kỹ năng phù hợp hoặc thời gian tham gia chưa khớp với lịch trình chiến dịch."
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#C3C6D2] px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRejectDialog(null);
                                        setRejectReason('');
                                    }}
                                    className="inline-flex h-11 items-center justify-center border border-[#C3C6D2] bg-white px-5 text-[15px] font-semibold text-[#002A58] transition hover:border-[#A9C7FF] hover:bg-[#F3F4F5]"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={rejecting || !rejectReason.trim()}
                                    onClick={() => void handleReject()}
                                    className="inline-flex h-11 items-center justify-center border border-[#93000A] bg-[#93000A] px-5 text-[15px] font-semibold text-white transition hover:bg-[#7F0008] disabled:cursor-not-allowed disabled:border-[#C3C6D2] disabled:bg-[#E7E8E9] disabled:text-[#737781]"
                                >
                                    {rejecting
                                        ? 'Đang gửi phản hồi...'
                                        : 'Xác nhận từ chối'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};
