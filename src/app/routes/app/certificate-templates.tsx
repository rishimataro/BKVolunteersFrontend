import { useEffect, useState } from 'react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import {
    createTemplate,
    deleteTemplate,
    getTemplates,
    updateTemplate,
    type CertificateTemplate,
} from '@/features/certificates/api/templates';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

export const CertificateTemplatesRoute = () => {
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('CAMPAIGN');
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotifications();

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
        setFormType('CAMPAIGN');
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (tpl: CertificateTemplate) => {
        setFormName(tpl.name);
        setFormType(tpl.type);
        setEditingId(tpl.id);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;

        setSaving(true);
        try {
            if (editingId) {
                await updateTemplate(editingId, {
                    name: formName.trim(),
                    type: formType,
                });
                addNotification({
                    type: 'success',
                    title: 'Đã cập nhật',
                    message: 'Mẫu chứng nhận đã được cập nhật.',
                });
            } else {
                await createTemplate({
                    name: formName.trim(),
                    type: formType,
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
                message: 'Không thể lưu mẫu chứng nhận.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xác nhận xóa mẫu chứng nhận này?')) return;

        try {
            await deleteTemplate(id);
            addNotification({
                type: 'success',
                title: 'Đã xóa',
                message: 'Mẫu chứng nhận đã được xóa.',
            });
            await loadTemplates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể xóa mẫu chứng nhận.',
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
                                Quản lý các mẫu chứng nhận cho chiến dịch
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
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">
                            {editingId ? 'Chỉnh sửa mẫu' : 'Thêm mẫu mới'}
                        </h3>
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
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
                                    placeholder="Nhập tên mẫu"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="tpl-type"
                                    className="mb-1.5 block text-sm font-semibold text-slate-600"
                                >
                                    Loại
                                </Label>
                                <select
                                    id="tpl-type"
                                    value={formType}
                                    onChange={(e) =>
                                        setFormType(e.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                >
                                    <option value="CAMPAIGN">Chiến dịch</option>
                                    <option value="MODULE">Hạng mục</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                type="submit"
                                disabled={saving || !formName.trim()}
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
                                    <th className="px-5 py-3">Loại</th>
                                    <th className="px-5 py-3">Trạng thái</th>
                                    <th className="px-5 py-3">Ngày tạo</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {templates.map((tpl) => (
                                    <tr
                                        key={tpl.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4 font-medium text-slate-900">
                                            {tpl.name}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {tpl.type === 'CAMPAIGN'
                                                ? 'Chiến dịch'
                                                : 'Hạng mục'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    tpl.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {tpl.status === 'ACTIVE'
                                                    ? 'Hoạt động'
                                                    : tpl.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            }).format(new Date(tpl.createdAt))}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(tpl)
                                                    }
                                                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleDelete(
                                                            tpl.id,
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
