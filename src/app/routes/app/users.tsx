import * as React from 'react';
import {
    Filter,
    GraduationCap,
    KeyRound,
    Lock,
    LockKeyhole,
    LockOpen,
    PencilLine,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    UserCog,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

import { Head } from '@/components/seo';
import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { paths } from '@/config/paths';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { Authorization, ROLES, useUser } from '@/features/auth';
import {
    createUser,
    deleteUser,
    getUserOptions,
    getUsers,
    updateUser,
    updateUserStatus,
    type CreateUserPayload,
    type UpdateUserPayload,
    type UserManagementItem,
} from '@/features/users/api/users';
import type { UserRole } from '@/types/api';

type FormMode = 'create' | 'edit';

type UserFormState = {
    role: UserRole;
    username: string;
    email: string;
    password: string;
    mssv: string;
    fullName: string;
    facultyId: string;
    className: string;
    phone: string;
    managedClubId: string;
};

const DEFAULT_FORM: UserFormState = {
    role: 'SINHVIEN',
    username: '',
    email: '',
    password: '',
    mssv: '',
    fullName: '',
    facultyId: '',
    className: '',
    phone: '',
    managedClubId: '',
};

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
    { value: 'SINHVIEN', label: 'Sinh viên' },
    { value: 'LCD', label: 'Liên chi đoàn khoa' },
    { value: 'CLB', label: 'Chủ nhiệm câu lạc bộ' },
    { value: 'DOANTRUONG', label: 'Đoàn trường (Quản trị viên)' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'LOCKED', label: 'Tạm khóa' },
];

const ROLE_FILTER_OPTIONS = [
    { value: '', label: 'Tất cả vai trò' },
    ...ROLE_OPTIONS,
];

const selectClassName =
    'h-12 w-full rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-4 text-[15px] leading-5 text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20 disabled:cursor-not-allowed disabled:opacity-60';

const inputClassName =
    'h-12 rounded-lg border-[#C3C6D2] bg-[#F3F4F5] text-[#191C1D] placeholder:text-[#737781] focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20';

const panelClassName =
    'rounded-xl border border-[#C3C6D2] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]';

const cardLabelClassName =
    'text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]';

const fieldLabelClassName =
    'text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]';

const formatDateTime = (value: string | null) => {
    if (!value) {
        return 'Chưa phát sinh';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const getRoleLabel = (role: UserRole) =>
    ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

const buildFormFromUser = (user: UserManagementItem): UserFormState => ({
    role: user.role,
    username: user.role === 'SINHVIEN' ? '' : user.username,
    email: user.email,
    password: '',
    mssv: user.mssv ?? '',
    fullName: user.fullName ?? '',
    facultyId: user.facultyId ? String(user.facultyId) : '',
    className: user.className ?? '',
    phone: user.phone ?? '',
    managedClubId: user.managedClubId ?? '',
});

const buildCreatePayload = (form: UserFormState): CreateUserPayload => {
    if (form.role === 'SINHVIEN') {
        return {
            role: 'SINHVIEN',
            email: form.email.trim(),
            password: form.password,
            mssv: form.mssv.trim(),
            fullName: form.fullName.trim(),
            facultyId: Number(form.facultyId),
            className: form.className.trim() || undefined,
            phone: form.phone.trim() || undefined,
        };
    }

    if (form.role === 'LCD') {
        return {
            role: 'LCD',
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            facultyId: Number(form.facultyId),
        };
    }

    if (form.role === 'CLB') {
        return {
            role: 'CLB',
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            facultyId: form.facultyId ? Number(form.facultyId) : undefined,
            managedClubId: form.managedClubId || undefined,
        };
    }

    return {
        role: 'DOANTRUONG',
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
    };
};

const buildUpdatePayload = (form: UserFormState): UpdateUserPayload => {
    if (form.role === 'SINHVIEN') {
        return {
            role: 'SINHVIEN',
            email: form.email.trim(),
            password: form.password.trim() || undefined,
            mssv: form.mssv.trim(),
            fullName: form.fullName.trim(),
            facultyId: Number(form.facultyId),
            className: form.className.trim() || undefined,
            phone: form.phone.trim() || undefined,
        };
    }

    if (form.role === 'LCD') {
        return {
            role: 'LCD',
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password.trim() || undefined,
            facultyId: Number(form.facultyId),
        };
    }

    if (form.role === 'CLB') {
        return {
            role: 'CLB',
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password.trim() || undefined,
            facultyId: form.facultyId ? Number(form.facultyId) : undefined,
            managedClubId: form.managedClubId || undefined,
        };
    }

    return {
        role: 'DOANTRUONG',
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim() || undefined,
    };
};

const getStatusLabel = (status: UserManagementItem['status']) => {
    if (status === 'ACTIVE') {
        return 'Hoạt động';
    }

    if (status === 'LOCKED') {
        return 'Bị khóa';
    }

    return 'Đã vô hiệu';
};

const getStatusBadgeClassName = (status: UserManagementItem['status']) => {
    if (status === 'ACTIVE') {
        return 'bg-[#006D37] text-white';
    }

    if (status === 'LOCKED') {
        return 'bg-[#BA1A1A] text-white';
    }

    return 'bg-[#737781] text-white';
};

const getRoleBadgeClassName = (role: UserRole) => {
    if (role === 'DOANTRUONG') {
        return 'bg-[#6F2D00] text-white';
    }

    if (role === 'LCD' || role === 'CLB') {
        return 'bg-[#D6E3FF] text-[#0E4686]';
    }

    return 'bg-[#E7E8E9] text-[#424750]';
};

const getAvatarToneClassName = (role: UserRole) => {
    if (role === 'DOANTRUONG') {
        return 'bg-[#FFDBCB] text-[#773305]';
    }

    if (role === 'LCD' || role === 'CLB') {
        return 'bg-[#D6E3FF] text-[#0E4686]';
    }

    return 'bg-[#E7E8E9] text-[#424750]';
};

const getUserInitials = (user: UserManagementItem) => {
    const source = user.fullName || user.username || user.email;
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
};

const getUserIdentifier = (user: UserManagementItem) =>
    user.mssv || user.username || user.id;

const getAssignmentLabel = (user: UserManagementItem) =>
    user.managedClubName || user.facultyName || 'Chưa gán đơn vị';

const getSecondaryAssignmentLabel = (user: UserManagementItem) => {
    if (user.managedClubName && user.facultyName) {
        return user.facultyName;
    }

    if (user.className) {
        return `Lớp ${user.className}`;
    }

    return user.phone || 'Chưa có thông tin bổ sung';
};

const editorialInsetNoteClassName =
    'rounded-xl border border-[#C3C6D2] bg-[#F3F4F5] p-4 text-[14px] leading-6 text-[#424750]';

type FilterFieldProps = {
    label: string;
    hint?: string;
    children: React.ReactNode;
};

const FilterField = ({ label, hint, children }: FilterFieldProps) => {
    return (
        <label className="grid gap-2 text-left">
            <span className={fieldLabelClassName}>{label}</span>
            {children}
            {hint ? (
                <span className="text-[12px] leading-4 text-[#737781]">
                    {hint}
                </span>
            ) : null}
        </label>
    );
};

const FilterToolbar = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <section className={`${panelClassName} p-5 sm:p-6 ${className ?? ''}`}>
            <div className="grid gap-5">{children}</div>
        </section>
    );
};

const ManagementGrid = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${className ?? ''}`}
        >
            {children}
        </div>
    );
};

type ManagementStatCardProps = {
    label: string;
    value: string;
    note?: string;
    icon: LucideIcon;
    tone?: 'default' | 'success' | 'warning' | 'danger';
};

const managementStatToneMap: Record<
    NonNullable<ManagementStatCardProps['tone']>,
    { iconBox: string; iconColor: string }
> = {
    default: {
        iconBox: 'bg-[#EEF3FB]',
        iconColor: 'text-[#002A58]',
    },
    success: {
        iconBox: 'bg-[#E7F6EE]',
        iconColor: 'text-[#006D37]',
    },
    warning: {
        iconBox: 'bg-[#FFF0E5]',
        iconColor: 'text-[#6F2D00]',
    },
    danger: {
        iconBox: 'bg-[#FDE8E8]',
        iconColor: 'text-[#BA1A1A]',
    },
};

const ManagementStatCard = ({
    label,
    value,
    note,
    icon: Icon,
    tone = 'default',
}: ManagementStatCardProps) => {
    const toneClass = managementStatToneMap[tone];

    return (
        <section className={`${panelClassName} p-4`}>
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${toneClass.iconBox}`}
                >
                    <Icon
                        className={`size-6 ${toneClass.iconColor}`}
                        strokeWidth={1.5}
                    />
                </div>
                <div className="grid gap-1">
                    <p className={cardLabelClassName}>{label}</p>
                    <p className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                        {value}
                    </p>
                    {note ? (
                        <p className="text-[13px] leading-5 text-[#737781]">
                            {note}
                        </p>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

const ManagementPanel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <section className={`${panelClassName} ${className ?? ''}`}>
            {children}
        </section>
    );
};

const ManagementPanelHeader = ({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) => {
    return (
        <div className="flex flex-col gap-3 border-b border-[#E1E3E4] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                    {title}
                </h3>
                {description ? (
                    <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#424750]">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap gap-2">{actions}</div>
            ) : null}
        </div>
    );
};

type ManagementHeaderProps = {
    badge?: string;
    title: string;
    description: string;
    icon: LucideIcon;
    actions?: React.ReactNode;
};

const ManagementHeader = ({
    badge,
    title,
    description,
    icon: Icon,
    actions,
}: ManagementHeaderProps) => {
    return (
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
                {badge ? <p className={cardLabelClassName}>{badge}</p> : null}
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#002A58]">
                        <Icon className="size-7" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-[40px] font-bold leading-[48px] text-[#002A58]">
                            {title}
                        </h2>
                        <p className="max-w-3xl text-[16px] leading-6 text-[#424750]">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            ) : null}
        </section>
    );
};

export const UsersRoute = () => {
    const authUser = useUser();
    const queryClient = useQueryClient();
    const { addNotification } = useNotifications();
    const [search, setSearch] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<UserRole | ''>('');
    const [statusFilter, setStatusFilter] = React.useState<
        '' | 'ACTIVE' | 'LOCKED'
    >('');
    const [page, setPage] = React.useState(1);
    const [formMode, setFormMode] = React.useState<FormMode>('create');
    const [editingUserId, setEditingUserId] = React.useState<string | null>(
        null,
    );
    const [form, setForm] = React.useState<UserFormState>(DEFAULT_FORM);
    const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);

    const usersQuery = useQuery({
        queryKey: ['users', page, search, roleFilter, statusFilter],
        queryFn: () =>
            getUsers({
                page,
                limit: 10,
                search: search || undefined,
                role: roleFilter,
                status: statusFilter,
            }),
    });

    const optionsQuery = useQuery({
        queryKey: ['users-options'],
        queryFn: getUserOptions,
    });

    const closeFormDialog = React.useCallback(() => {
        setIsFormDialogOpen(false);
        setFormMode('create');
        setEditingUserId(null);
        setForm(DEFAULT_FORM);
    }, []);

    const invalidateUsers = async () => {
        await queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: async () => {
            addNotification({
                type: 'success',
                title: 'Tạo tài khoản thành công',
                message: 'Tài khoản mới đã được lưu vào hệ thống.',
            });
            closeFormDialog();
            await invalidateUsers();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            userId,
            payload,
        }: {
            userId: string;
            payload: UpdateUserPayload;
        }) => updateUser(userId, payload),
        onSuccess: async () => {
            addNotification({
                type: 'success',
                title: 'Cập nhật thành công',
                message: 'Thông tin tài khoản đã được cập nhật.',
            });
            closeFormDialog();
            await invalidateUsers();
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({
            userId,
            status,
        }: {
            userId: string;
            status: 'ACTIVE' | 'LOCKED';
        }) => updateUserStatus(userId, status),
        onSuccess: async (_data, variables) => {
            addNotification({
                type: 'success',
                title: 'Đã cập nhật trạng thái',
                message:
                    variables.status === 'LOCKED'
                        ? 'Tài khoản đã bị khóa và các phiên đăng nhập sẽ phải xác thực lại.'
                        : 'Tài khoản đã được mở khóa và có thể đăng nhập lại bình thường.',
            });
            await invalidateUsers();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: async () => {
            addNotification({
                type: 'success',
                title: 'Đã xóa tài khoản',
                message: 'Tài khoản đã được xóa mềm khỏi danh sách hoạt động.',
            });
            if (editingUserId) {
                closeFormDialog();
            }
            await invalidateUsers();
        },
    });

    const isSubmitting =
        createMutation.isPending ||
        updateMutation.isPending ||
        statusMutation.isPending ||
        deleteMutation.isPending;

    const currentUserId = authUser.data?.id;
    const faculties = optionsQuery.data?.faculties ?? [];
    const clubs = optionsQuery.data?.clubs ?? [];
    const users = usersQuery.data?.data ?? [];
    const meta = usersQuery.data?.meta;

    const statTotal = meta?.total ?? 0;
    const statActive = users.filter((user) => user.status === 'ACTIVE').length;
    const statLocked = users.filter((user) => user.status === 'LOCKED').length;
    const statStudents = users.filter(
        (user) => user.role === 'SINHVIEN',
    ).length;

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (formMode === 'create') {
            await createMutation.mutateAsync(buildCreatePayload(form));
            return;
        }

        if (!editingUserId) {
            return;
        }

        await updateMutation.mutateAsync({
            userId: editingUserId,
            payload: buildUpdatePayload(form),
        });
    };

    const onEdit = (user: UserManagementItem) => {
        setFormMode('edit');
        setEditingUserId(user.id);
        setForm(buildFormFromUser(user));
        setIsFormDialogOpen(true);
    };

    const onCreateNew = () => {
        setFormMode('create');
        setEditingUserId(null);
        setForm(DEFAULT_FORM);
        setIsFormDialogOpen(true);
    };

    const onDelete = async (user: UserManagementItem) => {
        if (
            !window.confirm(`Bạn có chắc muốn xóa mềm tài khoản ${user.email}?`)
        ) {
            return;
        }

        await deleteMutation.mutateAsync(user.id);
    };

    const onToggleLock = async (user: UserManagementItem) => {
        const confirmed = window.confirm(
            user.status === 'LOCKED'
                ? `Bạn có chắc muốn mở khóa tài khoản ${user.email}?`
                : `Bạn có chắc muốn khóa tài khoản ${user.email}? Người dùng sẽ bị chặn truy cập ngay ở các phiên hiện tại.`,
        );

        if (!confirmed) {
            return;
        }

        await statusMutation.mutateAsync({
            userId: user.id,
            status: user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED',
        });
    };

    const columns: Column<UserManagementItem>[] = [
        {
            key: 'user',
            header: 'Họ tên & avatar',
            className: 'min-w-[320px]',
            render: (user) => (
                <div className="flex items-center gap-4">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${getAvatarToneClassName(user.role)}`}
                    >
                        {getUserInitials(user)}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                {user.fullName || user.username}
                            </p>
                            {user.id === currentUserId ? (
                                <span className="rounded-md bg-[#D6E3FF] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0E4686]">
                                    Bạn
                                </span>
                            ) : null}
                        </div>
                        <p className="text-[14px] leading-5 text-[#424750]">
                            {user.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'identifier',
            header: 'MSSV / ID',
            className: 'min-w-[140px] text-[#191C1D]',
            render: (user) => (
                <span className="text-[15px] leading-6 text-[#191C1D]">
                    {getUserIdentifier(user)}
                </span>
            ),
        },
        {
            key: 'role',
            header: 'Vai trò',
            className: 'min-w-[170px]',
            render: (user) => (
                <span
                    className={`inline-flex rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${getRoleBadgeClassName(user.role)}`}
                >
                    {getRoleLabel(user.role)}
                </span>
            ),
        },
        {
            key: 'assignment',
            header: 'Đơn vị',
            className: 'min-w-[220px]',
            render: (user) => (
                <div className="space-y-1">
                    <p className="text-[15px] font-medium leading-6 text-[#191C1D]">
                        {getAssignmentLabel(user)}
                    </p>
                    <p className="text-[13px] leading-5 text-[#737781]">
                        {getSecondaryAssignmentLabel(user)}
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            className: 'min-w-[140px]',
            render: (user) => (
                <div className="space-y-1">
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getStatusBadgeClassName(user.status)}`}
                    >
                        {getStatusLabel(user.status)}
                    </span>
                    <p className="text-[12px] leading-4 text-[#737781]">
                        {formatDateTime(user.lastLoginAt)}
                    </p>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Thao tác',
            className: 'min-w-[200px]',
            render: (user) => {
                const isSelf = user.id === currentUserId;

                return (
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button
                            aria-label="Chỉnh sửa tài khoản"
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg border border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
                            onClick={() => onEdit(user)}
                            title="Chỉnh sửa"
                        >
                            <PencilLine className="size-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                            aria-label={
                                user.status === 'LOCKED'
                                    ? 'Mở khóa tài khoản'
                                    : isSelf
                                      ? 'Không thể khóa chính bạn'
                                      : 'Khóa tài khoản'
                            }
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg border border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
                            onClick={() => onToggleLock(user)}
                            disabled={isSelf}
                            title={
                                user.status === 'LOCKED'
                                    ? 'Mở khóa tài khoản'
                                    : isSelf
                                      ? 'Không thể khóa chính bạn'
                                      : 'Khóa tài khoản'
                            }
                        >
                            {user.status === 'LOCKED' ? (
                                <LockOpen
                                    className="size-4"
                                    strokeWidth={1.5}
                                />
                            ) : (
                                <Lock className="size-4" strokeWidth={1.5} />
                            )}
                        </Button>
                        <Button
                            aria-label="Đặt lại mật khẩu"
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg border border-[#C3C6D2] bg-white text-[#424750] hover:bg-[#EEF3FB] hover:text-[#002A58]"
                            onClick={() => onEdit(user)}
                            title="Đặt lại mật khẩu"
                        >
                            <KeyRound className="size-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                            aria-label={
                                isSelf
                                    ? 'Không thể xóa chính bạn'
                                    : 'Xóa tài khoản'
                            }
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg border border-[#F2B8B5] bg-white text-[#BA1A1A] hover:bg-[#FDE8E8] hover:text-[#93000A]"
                            disabled={isSelf}
                            onClick={() => onDelete(user)}
                            title="Xóa tài khoản"
                        >
                            <Trash2 className="size-4" strokeWidth={1.5} />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <Authorization
            allowedRoles={[ROLES.DOANTRUONG]}
            forbiddenFallback={
                <ContentLayout title="Quản lý người dùng">
                    <ManagementPanel className="p-5 sm:p-6">
                        <p className="text-sm leading-6 text-[#D97706]">
                            Chỉ tài khoản Đoàn trường mới được phép quản lý
                            người dùng.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#737781]">
                            Hãy dùng đúng tài khoản quản trị để khóa, mở khóa
                            hoặc chỉnh sửa quyền truy cập hệ thống.
                        </p>
                    </ManagementPanel>
                </ContentLayout>
            }
        >
            <>
                <Head title="Quản lý người dùng" />
                <div className="space-y-6 font-sans">
                    <ManagementHeader
                        badge="Quản trị hệ thống"
                        icon={UserCog}
                        title="Quản lý người dùng"
                        description="Theo dõi tài khoản trên toàn hệ thống, khóa hoặc mở khóa đúng phạm vi Đoàn trường, và đảm bảo thay đổi bảo mật phản ánh ngay ở phiên đăng nhập thực tế."
                        actions={
                            <>
                                <Link
                                    to={paths.app.users.dataTransfer.getHref()}
                                    className={buttonVariants({
                                        variant: 'outline',
                                        size: 'lg',
                                        className:
                                            'rounded-lg border-[#C3C6D2] bg-white px-6 normal-case tracking-normal text-[#424750] hover:bg-[#F3F4F5]',
                                    })}
                                >
                                    <Upload
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                    Nhập và xuất dữ liệu
                                </Link>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="rounded-lg bg-[#002A58] px-6 normal-case tracking-normal text-white hover:bg-[#004080]"
                                    onClick={onCreateNew}
                                >
                                    <Plus
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                    Tạo tài khoản mới
                                </Button>
                            </>
                        }
                    />

                    <ManagementGrid>
                        <ManagementStatCard
                            icon={Users}
                            label="Tổng tài khoản"
                            value={statTotal.toLocaleString('vi-VN')}
                            note="Theo kết quả bộ lọc hiện tại"
                        />
                        <ManagementStatCard
                            icon={ShieldCheck}
                            label="Đang hoạt động"
                            value={statActive.toLocaleString('vi-VN')}
                            note="Số tài khoản hiển thị trong trang này"
                            tone="success"
                        />
                        <ManagementStatCard
                            icon={LockKeyhole}
                            label="Tạm khóa"
                            value={statLocked.toLocaleString('vi-VN')}
                            note="Theo dữ liệu đang hiển thị"
                            tone="danger"
                        />
                        <ManagementStatCard
                            icon={GraduationCap}
                            label="Sinh viên"
                            value={statStudents.toLocaleString('vi-VN')}
                            note="Vai trò sinh viên trong trang hiện tại"
                        />
                    </ManagementGrid>

                    <FilterToolbar>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                    Bộ lọc danh sách
                                </h3>
                                <p className="text-[14px] leading-6 text-[#424750]">
                                    Tìm nhanh theo email, MSSV hoặc tên đăng
                                    nhập. Khóa tài khoản sẽ có hiệu lực ngay
                                    trên backend và không cho phép tiếp tục truy
                                    cập bằng phiên cũ.
                                </p>
                            </div>
                            <p className="text-[14px] leading-6 text-[#737781]">
                                Trang {meta?.page ?? page} /{' '}
                                {meta?.totalPages ?? 1}
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
                            <FilterField
                                label="Tìm kiếm"
                                hint="Hỗ trợ email, tên đăng nhập và MSSV"
                            >
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#737781]"
                                        strokeWidth={1.5}
                                    />
                                    <Input
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Nhập từ khóa cần tìm"
                                        className={`${inputClassName} pl-11`}
                                    />
                                </div>
                            </FilterField>
                            <FilterField label="Vai trò">
                                <select
                                    className={selectClassName}
                                    value={roleFilter}
                                    onChange={(event) => {
                                        setRoleFilter(
                                            event.target.value as UserRole | '',
                                        );
                                        setPage(1);
                                    }}
                                >
                                    {ROLE_FILTER_OPTIONS.map((option) => (
                                        <option
                                            key={option.value || 'all-role'}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>
                            <FilterField label="Trạng thái">
                                <select
                                    className={selectClassName}
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(
                                            event.target.value as
                                                | ''
                                                | 'ACTIVE'
                                                | 'LOCKED',
                                        );
                                        setPage(1);
                                    }}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option
                                            key={option.value || 'all-status'}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 w-full rounded-lg border-[#C3C6D2] bg-[#E7E8E9] normal-case tracking-normal text-[#424750] hover:bg-[#E1E3E4]"
                                    onClick={() => {
                                        setSearch('');
                                        setRoleFilter('');
                                        setStatusFilter('');
                                        setPage(1);
                                    }}
                                >
                                    <Filter
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                    Đặt lại bộ lọc
                                </Button>
                            </div>
                        </div>
                    </FilterToolbar>

                    <ManagementPanel className="overflow-hidden p-0">
                        <div className="px-5 pt-5 sm:px-6">
                            <ManagementPanelHeader
                                title="Danh sách tài khoản"
                                description="Theo dõi vai trò, trạng thái, đơn vị phụ trách và lịch sử đăng nhập gần nhất."
                            />
                        </div>
                        <div className="px-2 pb-2 pt-4 sm:px-3">
                            <DataTable
                                columns={columns}
                                data={users}
                                keyExtractor={(item) => item.id}
                                isLoading={usersQuery.isLoading}
                                emptyMessage="Không có tài khoản phù hợp với bộ lọc hiện tại."
                                className="overflow-hidden rounded-xl border-[#C3C6D2]"
                                pagination={
                                    meta
                                        ? {
                                              page: meta.page,
                                              totalPages: meta.totalPages,
                                              total: meta.total,
                                              onPageChange: setPage,
                                          }
                                        : undefined
                                }
                            />
                        </div>
                    </ManagementPanel>

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
                                            ? 'Tạo tài khoản mới'
                                            : 'Cập nhật tài khoản'}
                                    </DialogTitle>
                                    <DialogDescription className="mt-2 max-w-2xl text-[14px] leading-6 text-[#424750]">
                                        {formMode === 'create'
                                            ? 'Điền thông tin trong hộp thoại để giữ màn hình quản lý gọn như bản tham khảo.'
                                            : 'Chỉnh sửa tài khoản trong hộp thoại để không đẩy toàn bộ biểu mẫu lên trang chính.'}
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
                                <form className="space-y-4" onSubmit={onSubmit}>
                                    <FilterField
                                        label="Vai trò"
                                        hint="Vai trò quyết định loại trường dữ liệu cần nhập."
                                    >
                                        <select
                                            className={selectClassName}
                                            value={form.role}
                                            disabled={formMode === 'edit'}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...DEFAULT_FORM,
                                                    role: event.target
                                                        .value as UserRole,
                                                    email: current.email,
                                                }))
                                            }
                                        >
                                            {ROLE_OPTIONS.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </FilterField>

                                    {form.role === 'SINHVIEN' ? (
                                        <>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <FilterField label="MSSV">
                                                    <Input
                                                        placeholder="Nhập mã số sinh viên"
                                                        value={form.mssv}
                                                        onChange={(event) =>
                                                            setForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    mssv: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        className={
                                                            inputClassName
                                                        }
                                                    />
                                                </FilterField>
                                                <FilterField label="Họ và tên">
                                                    <Input
                                                        placeholder="Nhập họ và tên"
                                                        value={form.fullName}
                                                        onChange={(event) =>
                                                            setForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    fullName:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className={
                                                            inputClassName
                                                        }
                                                    />
                                                </FilterField>
                                            </div>

                                            <FilterField label="Khoa">
                                                <select
                                                    className={selectClassName}
                                                    value={form.facultyId}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            facultyId:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                >
                                                    <option value="">
                                                        Chọn khoa
                                                    </option>
                                                    {faculties.map(
                                                        (faculty) => (
                                                            <option
                                                                key={faculty.id}
                                                                value={String(
                                                                    faculty.id,
                                                                )}
                                                            >
                                                                {faculty.code} -{' '}
                                                                {faculty.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </FilterField>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <FilterField label="Lớp">
                                                    <Input
                                                        placeholder="Ví dụ: 23TCLC_DT3"
                                                        value={form.className}
                                                        onChange={(event) =>
                                                            setForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    className:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        className={
                                                            inputClassName
                                                        }
                                                    />
                                                </FilterField>
                                                <FilterField label="Số điện thoại">
                                                    <Input
                                                        placeholder="Nhập số điện thoại"
                                                        value={form.phone}
                                                        onChange={(event) =>
                                                            setForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    phone: event
                                                                        .target
                                                                        .value,
                                                                }),
                                                            )
                                                        }
                                                        className={
                                                            inputClassName
                                                        }
                                                    />
                                                </FilterField>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <FilterField label="Tên đăng nhập">
                                                <Input
                                                    placeholder="Nhập tên đăng nhập"
                                                    value={form.username}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            username:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    className={inputClassName}
                                                />
                                            </FilterField>

                                            {form.role === 'LCD' ? (
                                                <FilterField label="Khoa quản lý">
                                                    <select
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={form.facultyId}
                                                        onChange={(event) =>
                                                            setForm(
                                                                (current) => ({
                                                                    ...current,
                                                                    facultyId:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Chọn khoa
                                                        </option>
                                                        {faculties.map(
                                                            (faculty) => (
                                                                <option
                                                                    key={
                                                                        faculty.id
                                                                    }
                                                                    value={String(
                                                                        faculty.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        faculty.code
                                                                    }{' '}
                                                                    -{' '}
                                                                    {
                                                                        faculty.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </FilterField>
                                            ) : null}

                                            {form.role === 'CLB' ? (
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FilterField label="Khoa phụ trách">
                                                        <select
                                                            className={
                                                                selectClassName
                                                            }
                                                            value={
                                                                form.facultyId
                                                            }
                                                            onChange={(event) =>
                                                                setForm(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        facultyId:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Chọn khoa (nếu
                                                                có)
                                                            </option>
                                                            {faculties.map(
                                                                (faculty) => (
                                                                    <option
                                                                        key={
                                                                            faculty.id
                                                                        }
                                                                        value={String(
                                                                            faculty.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            faculty.code
                                                                        }{' '}
                                                                        -{' '}
                                                                        {
                                                                            faculty.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </FilterField>
                                                    <FilterField
                                                        label="Câu lạc bộ quản lý"
                                                        hint={
                                                            clubs.length === 0
                                                                ? 'Hiện chưa có câu lạc bộ trong cơ sở dữ liệu.'
                                                                : undefined
                                                        }
                                                    >
                                                        <select
                                                            className={
                                                                selectClassName
                                                            }
                                                            value={
                                                                form.managedClubId
                                                            }
                                                            onChange={(event) =>
                                                                setForm(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        managedClubId:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                {clubs.length ===
                                                                0
                                                                    ? 'Chưa có dữ liệu câu lạc bộ'
                                                                    : 'Chọn câu lạc bộ'}
                                                            </option>
                                                            {clubs.map(
                                                                (club) => (
                                                                    <option
                                                                        key={
                                                                            club.id
                                                                        }
                                                                        value={
                                                                            club.id
                                                                        }
                                                                    >
                                                                        {
                                                                            club.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </FilterField>
                                                </div>
                                            ) : null}
                                        </>
                                    )}

                                    <FilterField label="Email">
                                        <Input
                                            type="email"
                                            placeholder="Nhập địa chỉ email"
                                            value={form.email}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    email: event.target.value,
                                                }))
                                            }
                                            className={inputClassName}
                                        />
                                    </FilterField>

                                    <FilterField
                                        label="Mật khẩu"
                                        hint={
                                            formMode === 'create'
                                                ? 'Cần nhập mật khẩu cho tài khoản mới.'
                                                : 'Để trống nếu muốn giữ nguyên mật khẩu hiện tại.'
                                        }
                                    >
                                        <Input
                                            type="password"
                                            placeholder={
                                                formMode === 'create'
                                                    ? 'Nhập mật khẩu'
                                                    : 'Nhập mật khẩu mới nếu cần'
                                            }
                                            value={form.password}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    password:
                                                        event.target.value,
                                                }))
                                            }
                                            className={inputClassName}
                                        />
                                    </FilterField>

                                    <div
                                        className={editorialInsetNoteClassName}
                                    >
                                        <p className="font-medium text-[#0A0A0A]">
                                            Lưu ý triển khai
                                        </p>
                                        <ul className="mt-2 space-y-1">
                                            <li>
                                                • Vai trò sinh viên sử dụng MSSV
                                                làm định danh chính.
                                            </li>
                                            <li>
                                                • Vai trò quản lý sử dụng tên
                                                đăng nhập riêng và giữ nguyên
                                                logic phân quyền hiện tại.
                                            </li>
                                        </ul>
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
                                                isSubmitting ||
                                                usersQuery.isLoading
                                            }
                                        >
                                            {formMode === 'create'
                                                ? 'Lưu tài khoản'
                                                : 'Cập nhật tài khoản'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </>
        </Authorization>
    );
};
