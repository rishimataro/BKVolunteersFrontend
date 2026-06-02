import * as React from 'react';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
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
    { value: 'SINHVIEN', label: 'Sinh vien' },
    { value: 'LCD', label: 'Lien chi doan khoa' },
    { value: 'CLB', label: 'Chu nhiem cau lac bo' },
    { value: 'DOANTRUONG', label: 'Doan truong (Admin)' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'Tat ca trang thai' },
    { value: 'ACTIVE', label: 'Hoat dong' },
    { value: 'LOCKED', label: 'Tam khoa' },
];

const ROLE_FILTER_OPTIONS = [
    { value: '', label: 'Tat ca vai tro' },
    ...ROLE_OPTIONS,
];

const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

const formatDate = (value: string | null) => {
    if (!value) return 'Chua co';
    return new Date(value).toLocaleString('vi-VN');
};

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
    const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
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
                title: 'Thanh cong',
                message: 'Da tao tai khoan moi.',
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
                title: 'Thanh cong',
                message: 'Da cap nhat tai khoan.',
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
                title: 'Thanh cong',
                message: 'Da cap nhat trang thai tai khoan.',
            });
            await invalidateUsers();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: async () => {
            addNotification({
                type: 'success',
                title: 'Thanh cong',
                message: 'Da xoa mem tai khoan.',
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

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (formMode === 'create') {
            await createMutation.mutateAsync(buildCreatePayload(form));
            return;
        }

        if (!editingUserId) return;

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
        if (!window.confirm(`Xoa mem tai khoan ${user.email}?`)) {
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

    const currentUserId = authUser.data?.id;
    const faculties = optionsQuery.data?.faculties ?? [];
    const clubs = optionsQuery.data?.clubs ?? [];

    return (
        <Authorization
            allowedRoles={[ROLES.DOANTRUONG]}
            forbiddenFallback={
                <ContentLayout title="Quan ly nguoi dung">
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                        Chi tai khoan Doan truong moi duoc phep quan ly nguoi dung.
                    </div>
                </ContentLayout>
            }
        >
            <ContentLayout title="Quan ly nguoi dung">
                <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Tao, cap nhat, khoa tam thoi hoac xoa mem tai khoan tren DB that.
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Tong so tai khoan hien thi:{' '}
                                    <b>{usersQuery.data?.meta.total ?? 0}</b>
                                </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-4">
                                <Input
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Tim theo email, username, MSSV"
                                />
                                <select
                                    className={selectClassName}
                                    value={roleFilter}
                                    onChange={(event) => {
                                        setRoleFilter(event.target.value as UserRole | '');
                                        setPage(1);
                                    }}
                                >
                                    {ROLE_FILTER_OPTIONS.map((option) => (
                                        <option key={option.value || 'all-role'} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className={selectClassName}
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(
                                            event.target.value as '' | 'ACTIVE' | 'LOCKED',
                                        );
                                        setPage(1);
                                    }}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value || 'all-status'} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <Button type="button" onClick={onCreateNew}>
                                    Tao tai khoan moi
                                </Button>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.95fr)]">
                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-left text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Tai khoan</th>
                                            <th className="px-4 py-3 font-medium">Vai tro</th>
                                            <th className="px-4 py-3 font-medium">Khoa / CLB</th>
                                            <th className="px-4 py-3 font-medium">Trang thai</th>
                                            <th className="px-4 py-3 font-medium">Dang nhap cuoi</th>
                                            <th className="px-4 py-3 font-medium">Hanh dong</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {usersQuery.data?.data.map((user) => {
                                            const isSelf = user.id === currentUserId;
                                            return (
                                                <tr key={user.id} className="align-top">
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium text-slate-800">
                                                            {user.fullName || user.username}
                                                        </div>
                                                        <div className="text-slate-500">
                                                            {user.email}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {user.mssv
                                                                ? `MSSV: ${user.mssv}`
                                                                : `Username: ${user.username}`}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600">
                                                        <div>{user.facultyName || 'Khong gan khoa'}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {user.managedClubName || 'Khong gan CLB'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                                user.status === 'ACTIVE'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                            }`}
                                                        >
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600">
                                                        {formatDate(user.lastLoginAt)}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                onClick={() => onEdit(user)}
                                                            >
                                                                Sua
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                disabled={isSelf}
                                                                onClick={() => onToggleLock(user)}
                                                            >
                                                                {user.status === 'LOCKED'
                                                                    ? 'Mo khoa'
                                                                    : 'Tam khoa'}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                disabled={isSelf}
                                                                onClick={() => onDelete(user)}
                                                            >
                                                                Xoa
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!usersQuery.isLoading &&
                                            usersQuery.data?.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-4 py-10 text-center text-slate-500"
                                                    >
                                                        Khong co tai khoan phu hop bo loc hien tai.
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                                <p className="text-sm text-slate-500">
                                    Trang {usersQuery.data?.meta.page ?? page} /{' '}
                                    {usersQuery.data?.meta.totalPages ?? 1}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={page <= 1}
                                        onClick={() => setPage((current) => current - 1)}
                                    >
                                        Truoc
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={
                                            page >=
                                            (usersQuery.data?.meta.totalPages ?? 1)
                                        }
                                        onClick={() => setPage((current) => current + 1)}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {formMode === 'create'
                                            ? 'Tao tai khoan'
                                            : 'Cap nhat tai khoan'}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Role sinh vien dung MSSV lam username. Role quan ly dung username rieng.
                                    </p>
                                </div>
                                {formMode === 'edit' && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onCreateNew}
                                    >
                                        Huy sua
                                    </Button>
                                )}
                            </div>

                            <form className="space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Vai tro
                                    </label>
                                    <select
                                        className={selectClassName}
                                        value={form.role}
                                        disabled={formMode === 'edit'}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...DEFAULT_FORM,
                                                role: event.target.value as UserRole,
                                                email: current.email,
                                            }))
                                        }
                                    >
                                        {ROLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {form.role === 'SINHVIEN' ? (
                                    <>
                                        <Input
                                            placeholder="MSSV"
                                            value={form.mssv}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    mssv: event.target.value,
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="Ho ten"
                                            value={form.fullName}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    fullName: event.target.value,
                                                }))
                                            }
                                        />
                                        <select
                                            className={selectClassName}
                                            value={form.facultyId}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    facultyId: event.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Chon khoa</option>
                                            {faculties.map((faculty) => (
                                                <option
                                                    key={faculty.id}
                                                    value={String(faculty.id)}
                                                >
                                                    {faculty.code} - {faculty.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            placeholder="Lop (tuy chon)"
                                            value={form.className}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    className: event.target.value,
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="So dien thoai (tuy chon)"
                                            value={form.phone}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    phone: event.target.value,
                                                }))
                                            }
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Input
                                            placeholder="Username"
                                            value={form.username}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    username: event.target.value,
                                                }))
                                            }
                                        />
                                        {form.role === 'LCD' && (
                                            <select
                                                className={selectClassName}
                                                value={form.facultyId}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        facultyId: event.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="">Chon khoa</option>
                                                {faculties.map((faculty) => (
                                                    <option
                                                        key={faculty.id}
                                                        value={String(faculty.id)}
                                                    >
                                                        {faculty.code} - {faculty.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {form.role === 'CLB' && (
                                            <>
                                                <select
                                                    className={selectClassName}
                                                    value={form.facultyId}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            facultyId: event.target.value,
                                                        }))
                                                    }
                                                >
                                                    <option value="">Chon khoa (tuy chon)</option>
                                                    {faculties.map((faculty) => (
                                                        <option
                                                            key={faculty.id}
                                                            value={String(faculty.id)}
                                                        >
                                                            {faculty.code} - {faculty.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    className={selectClassName}
                                                    value={form.managedClubId}
                                                    onChange={(event) =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            managedClubId:
                                                                event.target.value,
                                                        }))
                                                    }
                                                >
                                                    <option value="">
                                                        {clubs.length === 0
                                                            ? 'Chua co CLB trong DB'
                                                            : 'Chon CLB (tuy chon)'}
                                                    </option>
                                                    {clubs.map((club) => (
                                                        <option key={club.id} value={club.id}>
                                                            {club.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </>
                                        )}
                                    </>
                                )}

                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            email: event.target.value,
                                        }))
                                    }
                                />

                                <Input
                                    type="password"
                                    placeholder={
                                        formMode === 'create'
                                            ? 'Mat khau'
                                            : 'Mat khau moi (bo trong neu giu nguyen)'
                                    }
                                    value={form.password}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            password: event.target.value,
                                        }))
                                    }
                                />

                                <Button
                                    type="submit"
                                    disabled={isSubmitting || usersQuery.isLoading}
                                >
                                    {formMode === 'create'
                                        ? 'Luu tai khoan'
                                        : 'Cap nhat tai khoan'}
                                </Button>
                            </form>
                        </section>
                    </div>
                </div>
            </ContentLayout>
        </Authorization>
    );
};
