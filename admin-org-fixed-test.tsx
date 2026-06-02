import { useEffect, useState } from 'react';
import {
    Building2,
    FolderTree,
    Pencil,
    Plus,
    Trash2,
    Waypoints,
} from 'lucide-react';

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
    { value: 'CLUB', label: 'Câu lạc bộ' },
    { value: 'TEAM', label: 'Đội' },
    { value: 'GROUP', label: 'Nhóm' },
    { value: 'CENTER', label: 'Trung tâm' },
];

const selectClassName = editorialSelectClassName;

export const AdminOrganizationsRoute = () => {
    const user = useUser();
    const canManageOrganizations = user.data?.role === ROLES.DOANTRUONG;
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

    const loadOrgs = async () => {
        if (!canManageOrganizations) {
            setIsLoading(false);
            return;
        }

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
    }, [canManageOrganizations]);

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

    const handleSave = async (event: React.FormEvent) => {
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
                    title: 'Tạo tổ chức thành công',
                    message: 'Tổ chức mới đã được thêm vào hệ thống.',
                });
            }

            resetForm();
            await loadOrgs();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể lưu tổ chức',
                message: 'Vui lòng kiểm tra lại dữ liệu và thử lại.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa tổ chức này?')) {
            return;
        }

        try {
            await deleteAdminOrganization(id);
            addNotification({
                type: 'success',
                title: 'Đã xóa tổ chức',
                message: 'Bản ghi tổ chức đã được loại khỏi hệ thống.',
            });
            await loadOrgs();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể xóa tổ chức',
                message: 'Tổ chức này có thể đang được sử dụng ở nơi khác.',
            });
        }
    };

    const columns: Column<AdminOrganization>[] = [
        {
            key: 'code',
            header: 'Mã',
            className: 'min-w-[140px]',
            render: (org) => (
                <span className="font-mono text-sm font-semibold text-[#4B5563]">
                    {org.code}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Tên tổ chức',
            className: 'min-w-[240px]',
            render: (org) => (
                <div className="space-y-1">
                    <p className="font-semibold text-[#0A0A0A]">{org.name}</p>
                    <p className="text-sm text-[#4B5563]">
                        {org.description || 'Chưa có mô tả'}
                    </p>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Loại',
            className: 'min-w-[180px]',
            render: (org) => (
                <Badge variant="secondary">
                    {orgTypeOptions.find((option) => option.value === org.type)
                        ?.label ?? org.type}
                </Badge>
            ),
        },
        {
            key: 'faculty',
            header: 'Khoa phụ trách',
            className: 'min-w-[180px]',
            render: (org) => org.faculty?.name ?? 'Chưa gán khoa',
        },
        {
            key: 'status',
            header: 'Trạng thái',
            className: 'min-w-[150px]',
            render: (org) => (
                <Badge
                    variant={org.status === 'ACTIVE' ? 'default' : 'outline'}
                >
                    {org.status === 'ACTIVE'
                        ? 'Đang hoạt động'
                        : 'Ngừng hoạt động'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Thao tác',
            className: 'min-w-[170px]',
            render: (org) => (
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(org)}
                    >
                        <Pencil className="size-4" />
                        Sửa
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(org.id)}
                    >
                        <Trash2 className="size-4" />
                        Xóa
                    </Button>
                </div>
            ),
        },
    ];

    if (!user.data) {
        return null;
    }

    if (!canManageOrganizations) {
        return (
            <ContentLayout title="Quản lý tổ chức">
                <ManagementPanel>
                    <p className="text-sm leading-6 text-[#4B5563]">
                        Vai trò hiện tại không có quyền quản lý tổ chức.
                    </p>
                </ManagementPanel>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Quản lý tổ chức">
            <div className="space-y-6">
                <ManagementHeader
                    badge="Quản trị đơn vị"
                    icon={Building2}
                    title="Quản lý tổ chức trong hệ thống"
                    description="Theo dõi danh mục câu lạc bộ, đội, nhóm và trung tâm. Tất cả thao tác tạo, sửa, xóa đều sử dụng API thật và không làm thay đổi cấu trúc dữ liệu nghiệp vụ."
                    actions={
                        !showForm ? (
                            <Button
                                type="button"
                                size="lg"
                                onClick={() => setShowForm(true)}
                            >
                                <Plus className="size-4" />
                                Thêm tổ chức
                            </Button>
                        ) : undefined
                    }
                />

                <ManagementGrid>
                    <ManagementStatCard
                        icon={Building2}
                        label="Tổng tổ chức"
                        value={orgs.length.toLocaleString('vi-VN')}
                        note="Theo bộ lọc đang áp dụng"
                    />
                    <ManagementStatCard
                        icon={Waypoints}
                        label="Đang hoạt động"
                        value={orgs
                            .filter((org) => org.status === 'ACTIVE')
                            .length.toLocaleString('vi-VN')}
                        note="Sẵn sàng tham gia luồng nghiệp vụ"
                        tone="success"
                    />
                    <ManagementStatCard
                        icon={FolderTree}
                        label="Có gán khoa"
                        value={orgs
                            .filter((org) => org.faculty)
                            .length.toLocaleString('vi-VN')}
                        note="Tổ chức đã liên kết đơn vị khoa"
                    />
                    <ManagementStatCard
                        icon={Building2}
                        label="Ngừng hoạt động"
                        value={orgs
                            .filter((org) => org.status !== 'ACTIVE')
                            .length.toLocaleString('vi-VN')}
                        note="Cần rà soát trước khi tái sử dụng"
                        tone="warning"
                    />
                </ManagementGrid>

                <FilterToolbar>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-[#0A0A0A]">
                                Bộ lọc và tìm kiếm
                            </h3>
                            <p className="text-sm text-[#4B5563]">
                                Tìm theo mã, tên, loại tổ chức hoặc trạng thái
                                hoạt động.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void loadOrgs();
                        }}
                        className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_220px_220px_auto]"
                    >
                        <FilterField label="Từ khóa">
                            <Input
                                data-testid="admin-org-filter-q"
                                value={filterQ}
                                onChange={(event) =>
                                    setFilterQ(event.target.value)
                                }
                                placeholder="Nhập mã hoặc tên tổ chức"
                                className="h-10"
                            />
                        </FilterField>
                        <FilterField label="Loại tổ chức">
                            <select
                                data-testid="admin-org-filter-type"
                                value={filterType}
                                onChange={(event) =>
                                    setFilterType(event.target.value)
                                }
                                className={selectClassName}
                            >
                                <option value="">Tất cả</option>
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
                                <option value="">Tất cả</option>
                                <option value="ACTIVE">Đang hoạt động</option>
                                <option value="INACTIVE">
                                    Ngừng hoạt động
                                </option>
                            </select>
                        </FilterField>
                        <div className="flex items-end gap-2">
                            <Button
                                type="submit"
                                data-testid="admin-org-filter-submit"
                            >
                                Lọc dữ liệu
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFilterQ('');
                                    setFilterType('');
                                    setFilterStatus('');
                                    void loadOrgs();
                                }}
                            >
                                Đặt lại
                            </Button>
                        </div>
                    </form>
                </FilterToolbar>

                {showForm ? (
                    <ManagementPanel>
                        <ManagementPanelHeader
                            title={
                                editingId
                                    ? 'Chỉnh sửa thông tin tổ chức'
                                    : 'Tạo tổ chức mới'
                            }
                            description="Điền đúng mã, tên và loại để hệ thống có thể dùng lại thống nhất ở các màn hình quản trị."
                            actions={
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Hủy
                                </Button>
                            }
                        />

                        <form onSubmit={handleSave} className="mt-5 grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FilterField label="Mã tổ chức">
                                    <Input
                                        data-testid="admin-org-form-code"
                                        value={form.code}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                code: event.target.value,
                                            }))
                                        }
                                        placeholder="Ví dụ: CLB-TN"
                                        className="h-10"
                                    />
                                </FilterField>
                                <FilterField label="Loại tổ chức">
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

                            <FilterField label="Tên tổ chức">
                                <Input
                                    data-testid="admin-org-form-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    placeholder="Nhập tên tổ chức"
                                    className="h-10"
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
                                                description: event.target.value,
                                            }))
                                        }
                                        placeholder="Mô tả ngắn về đơn vị"
                                        className="h-10"
                                    />
                                </FilterField>
                            </div>

                            <div className={editorialInsetNoteClassName}>
                                Mã tổ chức nên ổn định theo chuẩn nội bộ để
                                thuận tiện cho việc tích hợp báo cáo, phân quyền
                                và đối soát dữ liệu sau này.
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    data-testid="admin-org-form-submit"
                                    size="lg"
                                    disabled={
                                        saving ||
                                        !form.name.trim() ||
                                        !form.code.trim()
                                    }
                                >
                                    {saving
                                        ? 'Đang lưu...'
                                        : editingId
                                          ? 'Cập nhật tổ chức'
                                          : 'Tạo tổ chức'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Hủy thao tác
                                </Button>
                            </div>
                        </form>
                    </ManagementPanel>
                ) : null}

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}
                {!isLoading && !error && orgs.length === 0 ? (
                    <EmptyState
                        title="Chưa có tổ chức nào"
                        description="Hãy tạo tổ chức đầu tiên hoặc thay đổi bộ lọc để xem dữ liệu phù hợp."
                    />
                ) : null}

                {!isLoading && !error && orgs.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={orgs}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Không có tổ chức phù hợp với bộ lọc hiện tại."
                    />
                ) : null}
            </div>
        </ContentLayout>
    );
};
