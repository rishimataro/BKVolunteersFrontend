import { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const orgTypeOptions = [
    { value: 'CLUB', label: 'CLB' },
    { value: 'TEAM', label: 'Đội' },
    { value: 'GROUP', label: 'Nhóm' },
    { value: 'CENTER', label: 'Trung tâm' },
];

export const AdminOrganizationsRoute = () => {
    const user = useUser();
    const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterQ, setFilterQ] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [form, setForm] = useState({
        code: '',
        name: '',
        type: 'CLUB',
        status: 'ACTIVE',
        description: '',
    });
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotifications();

    if (!user.data) return null;

    if (user.data.role !== ROLES.DOANTRUONG) {
        return (
            <ContentLayout title="Quản lý tổ chức">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền quản lý tổ chức.
                </div>
            </ContentLayout>
        );
    }

    const loadOrgs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAdminOrganizations({
                q: filterQ.trim() || undefined,
                type: filterType || undefined,
                status: filterStatus || undefined,
            });
            setOrgs(data);
        } catch {
            setError('Không thể tải danh sách tổ chức.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadOrgs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setForm({
            code: '',
            name: '',
            type: 'CLUB',
            status: 'ACTIVE',
            description: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (org: AdminOrganization) => {
        setForm({
            code: org.code,
            name: org.name,
            type: org.type,
            status: org.status,
            description: org.description ?? '',
        });
        setEditingId(org.id);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.code.trim()) return;

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
                    title: 'Đã cập nhật',
                    message: 'Thông tin tổ chức đã được cập nhật.',
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
                    title: 'Đã tạo',
                    message: 'Tổ chức mới đã được tạo.',
                });
            }
            resetForm();
            await loadOrgs();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể lưu tổ chức.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xác nhận xóa tổ chức này?')) return;

        try {
            await deleteAdminOrganization(id);
            addNotification({
                type: 'success',
                title: 'Đã xóa',
                message: 'Tổ chức đã được xóa.',
            });
            await loadOrgs();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể xóa tổ chức.',
            });
        }
    };

    return (
        <ContentLayout title="Quản lý tổ chức">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-[#2E5077]" />
                        <div>
                            <p className="text-sm text-slate-500">
                                Quản lý các CLB/Đội/Nhóm trong hệ thống
                            </p>
                        </div>
                    </div>
                    {!showForm ? (
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="mr-1 size-4" />
                            Thêm tổ chức
                        </Button>
                    ) : null}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void loadOrgs();
                    }}
                    className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                    <div>
                        <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                            Tìm kiếm
                        </Label>
                        <Input
                            data-testid="admin-org-filter-q"
                            value={filterQ}
                            onChange={(e) => setFilterQ(e.target.value)}
                            placeholder="Mã hoặc tên tổ chức"
                            className="w-64"
                        />
                    </div>
                    <div>
                        <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                            Loại
                        </Label>
                        <select
                            data-testid="admin-org-filter-type"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                        >
                            <option value="">Tất cả</option>
                            {orgTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                            Trạng thái
                        </Label>
                        <select
                            data-testid="admin-org-filter-status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                        >
                            <option value="">Tất cả</option>
                            <option value="ACTIVE">Đang hoạt động</option>
                            <option value="INACTIVE">Ngưng hoạt động</option>
                        </select>
                    </div>
                    <Button
                        type="submit"
                        variant="outline"
                        data-testid="admin-org-filter-submit"
                    >
                        Lọc
                    </Button>
                </form>

                {showForm ? (
                    <form
                        onSubmit={handleSave}
                        className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">
                            {editingId
                                ? 'Chỉnh sửa tổ chức'
                                : 'Thêm tổ chức mới'}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="org-code"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Mã tổ chức
                                </Label>
                                <Input
                                    id="org-code"
                                    data-testid="admin-org-form-code"
                                    value={form.code}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            code: e.target.value,
                                        }))
                                    }
                                    placeholder="VD: CLB-TN"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="org-type"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Loại
                                </Label>
                                <select
                                    id="org-type"
                                    data-testid="admin-org-form-type"
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: e.target.value,
                                        }))
                                    }
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                >
                                    {orgTypeOptions.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="org-status"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Trạng thái
                                </Label>
                                <select
                                    id="org-status"
                                    data-testid="admin-org-form-status"
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            status: e.target.value,
                                        }))
                                    }
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">
                                        Ngưng hoạt động
                                    </option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <Label
                                    htmlFor="org-name"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Tên tổ chức
                                </Label>
                                <Input
                                    id="org-name"
                                    data-testid="admin-org-form-name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Nhập tên tổ chức"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label
                                    htmlFor="org-desc"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Mô tả
                                </Label>
                                <Input
                                    id="org-desc"
                                    data-testid="admin-org-form-description"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Mô tả ngắn về tổ chức"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                type="submit"
                                data-testid="admin-org-form-submit"
                                disabled={
                                    saving ||
                                    !form.name.trim() ||
                                    !form.code.trim()
                                }
                            >
                                {saving
                                    ? 'Đang lưu...'
                                    : editingId
                                      ? 'Cập nhật'
                                      : 'Tạo mới'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                            >
                                Hủy
                            </Button>
                        </div>
                    </form>
                ) : null}

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}
                {!isLoading && !error && orgs.length === 0 ? (
                    <EmptyState title="Chưa có tổ chức nào" />
                ) : null}

                {!isLoading && !error && orgs.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-5 py-3">Mã</th>
                                    <th className="px-5 py-3">Tên</th>
                                    <th className="px-5 py-3">Loại</th>
                                    <th className="px-5 py-3">Khoa</th>
                                    <th className="px-5 py-3">Trạng thái</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orgs.map((org) => (
                                    <tr
                                        key={org.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4 font-mono text-sm text-slate-700">
                                            {org.code}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-slate-900">
                                            {org.name}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {orgTypeOptions.find(
                                                (o) => o.value === org.type,
                                            )?.label ?? org.type}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {org.faculty?.name ?? '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    org.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {org.status === 'ACTIVE'
                                                    ? 'Hoạt động'
                                                    : org.status === 'INACTIVE'
                                                      ? 'Ngưng hoạt động'
                                                      : org.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    title="Chỉnh sửa"
                                                    onClick={() =>
                                                        openEdit(org)
                                                    }
                                                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Xóa"
                                                    onClick={() =>
                                                        void handleDelete(
                                                            org.id,
                                                        )
                                                    }
                                                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};
