import { useEffect, useState } from 'react';
import { Award, Pencil, Plus, Trash2 } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import {
    createTitle,
    deleteTitle,
    getTitles,
    updateTitle,
    type TitleItem,
} from '@/features/admin/api/titles';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

export const TitlesRoute = () => {
    const { addNotification } = useNotifications();
    const [items, setItems] = useState<TitleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        minPoints: '0',
        iconUrl: '',
    });

    const loadTitles = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTitles({ page: 1, limit: 50 });
            setItems(result.items);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Không thể tải danh sách danh hiệu.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTitles();
    }, []);

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            minPoints: '0',
            iconUrl: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (item: TitleItem) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            description: item.description ?? '',
            minPoints: String(item.minPoints),
            iconUrl: item.iconUrl ?? '',
        });
        setShowForm(true);
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const minPoints = Number(form.minPoints);
        if (!form.name.trim() || Number.isNaN(minPoints)) {
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                minPoints,
                iconUrl: form.iconUrl.trim() || undefined,
            };
            if (editingId) {
                await updateTitle(editingId, payload);
                addNotification({
                    type: 'success',
                    title: 'Đã cập nhật danh hiệu',
                    message: 'Thông tin danh hiệu đã được lưu.',
                });
            } else {
                await createTitle(payload);
                addNotification({
                    type: 'success',
                    title: 'Đã tạo danh hiệu',
                    message: 'Danh hiệu mới đã được thêm vào hệ thống.',
                });
            }
            resetForm();
            await loadTitles();
        } catch (saveError) {
            addNotification({
                type: 'error',
                title: 'Lưu danh hiệu thất bại',
                message:
                    saveError instanceof Error
                        ? saveError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xác nhận xóa danh hiệu này?')) {
            return;
        }
        try {
            await deleteTitle(id);
            addNotification({
                type: 'success',
                title: 'Đã xóa danh hiệu',
                message: 'Danh hiệu đã được gỡ khỏi hệ thống.',
            });
            await loadTitles();
        } catch (deleteError) {
            addNotification({
                type: 'error',
                title: 'Xóa danh hiệu thất bại',
                message:
                    deleteError instanceof Error
                        ? deleteError.message
                        : 'Lỗi hệ thống',
            });
        }
    };

    return (
        <ContentLayout title="Danh hiệu">
            <div className="space-y-6">
                <section className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <Award className="size-6 text-[#2E5077]" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Danh hiệu sinh viên
                            </h2>
                            <p className="text-sm text-slate-500">
                                Quản trị các mốc danh hiệu theo điểm tích lũy đã xác minh.
                            </p>
                        </div>
                    </div>
                    {!showForm ? (
                        <Button
                            onClick={() => setShowForm(true)}
                            data-testid="titles-open-create"
                        >
                            <Plus className="mr-1 size-4" />
                            Thêm danh hiệu
                        </Button>
                    ) : null}
                </section>

                {showForm ? (
                    <form
                        onSubmit={handleSave}
                        className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">
                            {editingId ? 'Chỉnh sửa danh hiệu' : 'Tạo danh hiệu mới'}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Tên danh hiệu
                                </Label>
                                <Input
                                    data-testid="titles-form-name"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    placeholder="VD: Sinh viên tích cực"
                                />
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Điểm tối thiểu
                                </Label>
                                <Input
                                    data-testid="titles-form-min-points"
                                    type="number"
                                    min="0"
                                    value={form.minPoints}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            minPoints: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Icon URL
                                </Label>
                                <Input
                                    data-testid="titles-form-icon-url"
                                    value={form.iconUrl}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            iconUrl: event.target.value,
                                        }))
                                    }
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Mô tả
                                </Label>
                                <textarea
                                    data-testid="titles-form-description"
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    placeholder="Mô tả tiêu chí hoặc ý nghĩa của danh hiệu"
                                    className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-blue-400"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                type="submit"
                                disabled={saving || !form.name.trim()}
                                data-testid="titles-form-submit"
                            >
                                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                data-testid="titles-form-cancel"
                            >
                                Hủy
                            </Button>
                        </div>
                    </form>
                ) : null}

                {loading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}
                {!loading && !error && items.length === 0 ? (
                    <EmptyState title="Chưa có danh hiệu nào" />
                ) : null}

                {!loading && !error && items.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-5 py-3">Danh hiệu</th>
                                    <th className="px-5 py-3">Điểm tối thiểu</th>
                                    <th className="px-5 py-3">Icon</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-slate-900">
                                                {item.name}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {item.description ?? 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-900">
                                            {item.minPoints}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {item.iconUrl ? (
                                                <a
                                                    className="text-blue-600 hover:underline"
                                                    href={item.iconUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Mở icon
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    title="Chỉnh sửa"
                                                    onClick={() => openEdit(item)}
                                                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Xóa"
                                                    onClick={() =>
                                                        void handleDelete(item.id)
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
