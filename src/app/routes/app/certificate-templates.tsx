import { useEffect, useMemo, useState } from 'react';
import { FileText, Pencil, Plus } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    createTemplate,
    deactivateTemplate,
    getTemplates,
    updateTemplate,
    type CertificateTemplate,
    type CertificateTemplateStatus,
} from '@/features/certificates/api/templates';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

const defaultLayoutJson = '{\n    "version": 1,\n    "fields": []\n}';

const statusLabel: Record<CertificateTemplateStatus, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Ngưng hoạt động',
};

const statusBadgeClass: Record<CertificateTemplateStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    INACTIVE: 'bg-slate-100 text-slate-600',
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

const stringifyLayoutJson = (value: Record<string, unknown> | null) => {
    if (!value || Object.keys(value).length === 0) {
        return defaultLayoutJson;
    }

    return JSON.stringify(value, null, 4);
};

const parseLayoutJson = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return {};
    }

    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('layout_json phải là JSON object');
    }

    return parsed as Record<string, unknown>;
};

export const CertificateTemplatesRoute = () => {
    const user = useUser();
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('VOLUNTEER');
    const [formFileUrl, setFormFileUrl] = useState('');
    const [formLayoutJson, setFormLayoutJson] = useState(defaultLayoutJson);
    const [formStatus, setFormStatus] =
        useState<CertificateTemplateStatus>('ACTIVE');
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotifications();

    if (!user.data) return null;

    if (user.data.role !== ROLES.DOANTRUONG) {
        return (
            <ContentLayout title="Mẫu chứng nhận">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền quản lý mẫu chứng nhận.
                </div>
            </ContentLayout>
        );
    }

    const editingTemplate = useMemo(
        () => templates.find((template) => template.id === editingId) ?? null,
        [editingId, templates],
    );

    const isStructureLocked = Boolean(editingTemplate?.is_locked);

    const loadTemplates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch {
            setError('Không thể tải danh sách mẫu chứng nhận.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadTemplates();
    }, []);

    const resetForm = () => {
        setFormName('');
        setFormType('VOLUNTEER');
        setFormFileUrl('');
        setFormLayoutJson(defaultLayoutJson);
        setFormStatus('ACTIVE');
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (template: CertificateTemplate) => {
        setFormName(template.name);
        setFormType(template.type);
        setFormFileUrl(template.file_url ?? '');
        setFormLayoutJson(stringifyLayoutJson(template.layout_json));
        setFormStatus(template.status);
        setEditingId(template.id);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;

        let layoutJson: Record<string, unknown>;
        try {
            layoutJson = parseLayoutJson(formLayoutJson);
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi dữ liệu',
                message: 'layout_json phải là JSON object hợp lệ.',
            });
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await updateTemplate(editingId, {
                    name: formName.trim(),
                    status: formStatus,
                    ...(isStructureLocked
                        ? {}
                        : {
                              type: formType.trim(),
                              file_url: formFileUrl.trim() || null,
                              layout_json: layoutJson,
                          }),
                });
                addNotification({
                    type: 'success',
                    title: 'Đã cập nhật',
                    message: 'Mẫu chứng nhận đã được cập nhật.',
                });
            } else {
                await createTemplate({
                    name: formName.trim(),
                    type: formType.trim(),
                    file_url: formFileUrl.trim() || null,
                    layout_json: layoutJson,
                });
                addNotification({
                    type: 'success',
                    title: 'Đã tạo',
                    message: 'Mẫu chứng nhận mới đã được tạo.',
                });
            }
            resetForm();
            await loadTemplates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message:
                    'Không thể lưu mẫu chứng nhận. Nếu template đã từng được dùng để sinh chứng nhận, bạn chỉ được phép sửa tên và trạng thái.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (template: CertificateTemplate) => {
        if (
            !window.confirm(`Xác nhận ngưng hoạt động mẫu "${template.name}"?`)
        ) {
            return;
        }

        try {
            await deactivateTemplate(template.id);
            addNotification({
                type: 'success',
                title: 'Đã ngưng hoạt động',
                message:
                    'Mẫu chứng nhận đã được chuyển sang trạng thái INACTIVE.',
            });
            await loadTemplates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể ngưng hoạt động mẫu chứng nhận.',
            });
        }
    };

    const handleReactivate = async (template: CertificateTemplate) => {
        try {
            await updateTemplate(template.id, { status: 'ACTIVE' });
            addNotification({
                type: 'success',
                title: 'Đã kích hoạt lại',
                message:
                    'Mẫu chứng nhận đã được chuyển sang trạng thái ACTIVE.',
            });
            await loadTemplates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể kích hoạt lại mẫu chứng nhận.',
            });
        }
    };

    return (
        <ContentLayout title="Mẫu chứng nhận">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-[#2E5077]" />
                        <div>
                            <p className="text-sm text-slate-500">
                                Quản lý mẫu chứng nhận theo soft policy.
                                Template đã từng dùng để generate chỉ được đổi
                                tên hoặc chuyển ACTIVE/INACTIVE.
                            </p>
                        </div>
                    </div>
                    {!showForm ? (
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="mr-1 size-4" />
                            Thêm mẫu
                        </Button>
                    ) : null}
                </div>

                {showForm ? (
                    <form
                        onSubmit={handleSave}
                        className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {editingId
                                        ? 'Chỉnh sửa mẫu'
                                        : 'Thêm mẫu mới'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Muốn thay layout, file mẫu hoặc type của
                                    template đã từng được dùng, hãy tạo template
                                    mới thay vì sửa template cũ.
                                </p>
                            </div>
                            {editingTemplate?.is_locked ? (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                    Đã khóa field cấu trúc
                                </span>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="tpl-name"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Tên mẫu
                                </Label>
                                <Input
                                    id="tpl-name"
                                    data-testid="certificate-template-form-name"
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
                                    placeholder="Nhập tên mẫu"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="tpl-status"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Trạng thái
                                </Label>
                                <select
                                    id="tpl-status"
                                    data-testid="certificate-template-form-status"
                                    value={formStatus}
                                    disabled={!editingId}
                                    onChange={(e) =>
                                        setFormStatus(
                                            e.target
                                                .value as CertificateTemplateStatus,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50"
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">
                                        Ngưng hoạt động
                                    </option>
                                </select>
                                {!editingId ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                        Template mới luôn được tạo ở trạng thái
                                        ACTIVE. Bạn có thể chuyển INACTIVE sau
                                        khi tạo.
                                    </p>
                                ) : null}
                            </div>
                            <div>
                                <Label
                                    htmlFor="tpl-type"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Type
                                </Label>
                                <Input
                                    id="tpl-type"
                                    data-testid="certificate-template-form-type"
                                    value={formType}
                                    disabled={isStructureLocked}
                                    onChange={(e) =>
                                        setFormType(e.target.value)
                                    }
                                    placeholder="VD: VOLUNTEER"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="tpl-file-url"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    File URL
                                </Label>
                                <Input
                                    id="tpl-file-url"
                                    data-testid="certificate-template-form-file-url"
                                    value={formFileUrl}
                                    disabled={isStructureLocked}
                                    onChange={(e) =>
                                        setFormFileUrl(e.target.value)
                                    }
                                    placeholder="https://cdn.example.com/template.pdf"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label
                                    htmlFor="tpl-layout-json"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    layout_json
                                </Label>
                                <textarea
                                    id="tpl-layout-json"
                                    data-testid="certificate-template-form-layout-json"
                                    value={formLayoutJson}
                                    disabled={isStructureLocked}
                                    onChange={(e) =>
                                        setFormLayoutJson(e.target.value)
                                    }
                                    rows={10}
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 disabled:bg-slate-50"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button
                                type="submit"
                                data-testid="certificate-template-form-submit"
                                disabled={
                                    saving ||
                                    !formName.trim() ||
                                    (!isStructureLocked && !formType.trim())
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
                {!isLoading && !error && templates.length === 0 ? (
                    <EmptyState title="Chưa có mẫu chứng nhận nào" />
                ) : null}

                {!isLoading && !error && templates.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-5 py-3">Tên mẫu</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Trạng thái</th>
                                    <th className="px-5 py-3">Policy</th>
                                    <th className="px-5 py-3">Cập nhật</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {templates.map((template) => (
                                    <tr
                                        key={template.id}
                                        className="align-top hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-900">
                                                {template.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {template.file_url ??
                                                    'Không có file_url'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {template.type}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass[template.status]}`}
                                            >
                                                {statusLabel[template.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {template.is_locked ? (
                                                <div className="space-y-1 text-xs text-amber-700">
                                                    <p className="font-medium">
                                                        Đã từng dùng để generate
                                                    </p>
                                                    <p>
                                                        Chỉ cho phép sửa tên và
                                                        trạng thái
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    Có thể sửa đầy đủ field
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                            {formatDate(template.updated_at)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    data-testid={`certificate-template-edit-${template.id}`}
                                                    onClick={() =>
                                                        openEdit(template)
                                                    }
                                                >
                                                    <Pencil className="mr-1 size-4" />
                                                    Chỉnh sửa
                                                </Button>
                                                {template.status ===
                                                'ACTIVE' ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-testid={`certificate-template-deactivate-${template.id}`}
                                                        onClick={() =>
                                                            void handleDeactivate(
                                                                template,
                                                            )
                                                        }
                                                    >
                                                        Ngưng hoạt động
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-testid={`certificate-template-reactivate-${template.id}`}
                                                        onClick={() =>
                                                            void handleReactivate(
                                                                template,
                                                            )
                                                        }
                                                    >
                                                        Kích hoạt lại
                                                    </Button>
                                                )}
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
