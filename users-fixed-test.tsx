import * as React from 'react';
import {
    GraduationCap,
    LockKeyhole,
    ShieldCheck,
    UserCog,
    Users,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    FilterField,
    FilterToolbar,
    ManagementGrid,
    ManagementHeader,
    ManagementPanel,
    ManagementPanelHeader,
    ManagementStatCard,
    editorialInsetNoteClassName,
    editorialSelectClassName,
} from '@/components/ui/management-shell';
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

const selectClassName = editorialSelectClassName;

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
            setForm(DEFAULT_FORM);
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
            setFormMode('create');
            setEditingUserId(null);
            setForm(DEFAULT_FORM);
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
        onSuccess: async () => {
            addNotification({
                type: 'success',
                title: 'Đã cập nhật trạng thái',
                message: 'Tình trạng tài khoản đã được thay đổi.',
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
                setFormMode('create');
                setEditingUserId(null);
                setForm(DEFAULT_FORM);
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
    };

    const onCreateNew = () => {
        setFormMode('create');
        setEditingUserId(null);
        setForm(DEFAULT_FORM);
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
        await statusMutation.mutateAsync({
            userId: user.id,
            status: user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED',
        });
    };

    const columns: Column<UserManagementItem>[] = [
        {
            key: 'account',
            header: 'Tài khoản',
            className: 'min-w-[260px]',
            render: (user) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0A0A0A]">
                            {user.fullName || user.username}
                        </span>
                        {user.id === currentUserId ? (
                            <Badge variant="outline">Bạn</Badge>
                        ) : null}
                    </div>
                    <p className="text-sm text-[#4B5563]">{user.email}</p>
                    <p className="text-xs text-[#4B5563]">
                        {user.mssv
                            ? `MSSV: ${user.mssv}`
                            : `Tên đăng nhập: ${user.username}`}
                    </p>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Vai trò',
            className: 'min-w-[180px]',
            render: (user) => (
                <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
            ),
        },
        {
            key: 'assignment',
            header: 'Khoa / câu lạc bộ',
            className: 'min-w-[220px]',
            render: (user) => (
                <div className="space-y-1">
                    <p className="font-medium text-[#0A0A0A]">
                        {user.facultyName || 'Chưa gán khoa'}
                    </p>
                    <p className="text-sm text-[#4B5563]">
                        {user.managedClubName || 'Chưa gán câu lạc bộ'}
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            className: 'min-w-[160px]',
            render: (user) => (
                <Badge
                    variant={
                        user.status === 'ACTIVE'
                            ? 'default'
                            : user.status === 'LOCKED'
                              ? 'outline'
                              : 'destructive'
                    }
                >
                    {user.status === 'ACTIVE'
                        ? 'Đang hoạt động'
                        : user.status === 'LOCKED'
                          ? 'Tạm khóa'
                          : 'Đã vô hiệu hóa'}
                </Badge>
            ),
        },
        {
            key: 'lastLogin',
            header: 'Đăng nhập gần nhất',
            className: 'min-w-[180px] text-[#4B5563]',
            render: (user) => formatDateTime(user.lastLoginAt),
        },
        {
            key: 'actions',
            header: 'Thao tác',
            className: 'min-w-[220px]',
            render: (user) => {
                const isSelf = user.id === currentUserId;

                return (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(user)}
                        >
                            Chỉnh sửa
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => onToggleLock(user)}
                        >
                            {user.status === 'LOCKED' ? 'Mở khóa' : 'Tạm khóa'}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => onDelete(user)}
                        >
                            Xóa
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
                    <ManagementPanel>
                        <p className="text-sm leading-6 text-[#D97706]">
                            Chỉ tài khoản Đoàn trường mới được phép quản lý
                            người dùng.
                        </p>
                    </ManagementPanel>
                </ContentLayout>
            }
        >
            <ContentLayout title="Quản lý người dùng">
                <div className="space-y-6">
                    <ManagementHeader
                        badge="Quản trị hệ thống"
                        icon={UserCog}
                        title="Quản lý tài khoản người dùng"
                        description="Tạo mới, cập nhật, tạm khóa hoặc xóa mềm tài khoản trên cơ sở dữ liệu thật. Tất cả thay đổi đều đi qua API hiện tại và giữ nguyên phân quyền hệ thống."
                        actions={
                            <Button
                                type="button"
                                size="lg"
                                onClick={onCreateNew}
                            >
                                Tạo tài khoản mới
                            </Button>
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
                            tone="warning"
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
                                <h3 className="text-base font-semibold text-[#0A0A0A]">
                                    Bộ lọc danh sách
                                </h3>
                                <p className="text-sm text-[#4B5563]">
                                    Tìm nhanh theo email, MSSV hoặc tên đăng
                                    nhập.
                                </p>
                            </div>
                            <p className="text-sm text-[#4B5563]">
                                Trang {meta?.page ?? page} /{' '}
                                {meta?.totalPages ?? 1}
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
                            <FilterField
                                label="Tìm kiếm"
                                hint="Hỗ trợ email, tên đăng nhập và MSSV"
                            >
                                <Input
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Nhập từ khóa cần tìm"
                                    className="h-10"
                                />
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
                                    className="w-full"
                                    onClick={() => {
                                        setSearch('');
                                        setRoleFilter('');
                                        setStatusFilter('');
                                        setPage(1);
                                    }}
                                >
                                    Đặt lại bộ lọc
                                </Button>
                            </div>
                        </div>
                    </FilterToolbar>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
                        <ManagementPanel className="p-0">
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

                        <ManagementPanel>
                            <ManagementPanelHeader
                                title={
                                    formMode === 'create'
                                        ? 'Tạo tài khoản mới'
                                        : 'Cập nhật tài khoản'
                                }
                                description={
                                    formMode === 'create'
                                        ? 'Thiết lập thông tin đúng theo từng vai trò và lưu trực tiếp qua API.'
                                        : 'Chỉnh sửa đúng phạm vi cho phép mà không làm thay đổi logic phân quyền.'
                                }
                                actions={
                                    formMode === 'edit' ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onCreateNew}
                                        >
                                            Hủy chỉnh sửa
                                        </Button>
                                    ) : undefined
                                }
                            />

                            <form
                                className="mt-5 space-y-4"
                                onSubmit={onSubmit}
                            >
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
                                                        setForm((current) => ({
                                                            ...current,
                                                            mssv: event.target
                                                                .value,
                                                        }))
                                                    }
                                                    className="h-10"
                                                />
                                            </FilterField>
                                            <FilterField label="Họ và tên">
                                                <Input
                                                    placeholder="Nhập họ và tên"
                                                    value={form.fullName}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            fullName:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    className="h-10"
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
                                                            event.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="">
                                                    Chọn khoa
                                                </option>
                                                {faculties.map((faculty) => (
                                                    <option
                                                        key={faculty.id}
                                                        value={String(
                                                            faculty.id,
                                                        )}
                                                    >
                                                        {faculty.code} -{' '}
                                                        {faculty.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </FilterField>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FilterField label="Lớp">
                                                <Input
                                                    placeholder="Ví dụ: 23TCLC_DT3"
                                                    value={form.className}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            className:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    className="h-10"
                                                />
                                            </FilterField>
                                            <FilterField label="Số điện thoại">
                                                <Input
                                                    placeholder="Nhập số điện thoại"
                                                    value={form.phone}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            phone: event.target
                                                                .value,
                                                        }))
                                                    }
                                                    className="h-10"
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
                                                            event.target.value,
                                                    }))
                                                }
                                                className="h-10"
                                            />
                                        </FilterField>

                                        {form.role === 'LCD' ? (
                                            <FilterField label="Khoa quản lý">
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
                                        ) : null}

                                        {form.role === 'CLB' ? (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <FilterField label="Khoa phụ trách">
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
                                                            Chọn khoa (nếu có)
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
                                                                (current) => ({
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
                                                            {clubs.length === 0
                                                                ? 'Chưa có dữ liệu câu lạc bộ'
                                                                : 'Chọn câu lạc bộ'}
                                                        </option>
                                                        {clubs.map((club) => (
                                                            <option
                                                                key={club.id}
                                                                value={club.id}
                                                            >
                                                                {club.name}
                                                            </option>
                                                        ))}
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
                                        className="h-10"
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
                                                password: event.target.value,
                                            }))
                                        }
                                        className="h-10"
                                    />
                                </FilterField>

                                <div className={editorialInsetNoteClassName}>
                                    <p className="font-medium text-[#0A0A0A]">
                                        Lưu ý triển khai
                                    </p>
                                    <ul className="mt-2 space-y-1">
                                        <li>
                                            • Vai trò sinh viên sử dụng MSSV làm
                                            định danh chính.
                                        </li>
                                        <li>
                                            • Vai trò quản lý sử dụng tên đăng
                                            nhập riêng và giữ nguyên logic phân
                                            quyền hiện tại.
                                        </li>
                                    </ul>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={
                                        isSubmitting || usersQuery.isLoading
                                    }
                                >
                                    {formMode === 'create'
                                        ? 'Lưu tài khoản'
                                        : 'Cập nhật tài khoản'}
                                </Button>
                            </form>
                        </ManagementPanel>
                    </div>
                </div>
            </ContentLayout>
        </Authorization>
    );
};
