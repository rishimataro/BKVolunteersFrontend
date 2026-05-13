import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import { api } from '@/lib/api-clients';

const roleLabels: Record<string, string> = {
    [ROLES.SINHVIEN]: 'Sinh viên',
    [ROLES.CLB]: 'Quản lý CLB',
    [ROLES.LCD]: 'Phản biện',
    [ROLES.DOANTRUONG]: 'Quản trị trường',
};

export const SettingsRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    if (!user.data) return null;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsSaving(true);
        try {
            await api.patch('/auth/me/password', {
                oldPassword,
                newPassword,
                newPasswordConfirm: confirmPassword,
            });
            addNotification({
                type: 'success',
                title: 'Thành công',
                message: 'Mật khẩu đã được thay đổi.',
            });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            setError('Có lỗi xảy ra.');
        } finally {
            setIsSaving(false);
        }
    };

    const u = user.data;
    const roleLabel = roleLabels[u.role] ?? u.role;

    return (
        <ContentLayout title="Cài Đặt">
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Profile Info */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-bold text-[#2E5077]">
                        Thông tin tài khoản
                    </h2>
                    <div className="space-y-4 text-sm">
                        <div>
                            <span className="text-slate-400">Họ tên</span>
                            <p className="font-medium text-slate-700">
                                {u.fullName}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">Email</span>
                            <p className="font-medium text-slate-700">
                                {u.email}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">
                                Mã số sinh viên
                            </span>
                            <p className="font-medium text-slate-700">
                                {u.studentCode || '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">Vai trò</span>
                            <p className="font-medium text-slate-700">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-bold text-[#2E5077]">
                        Đổi mật khẩu
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <Label
                                htmlFor="oldPassword"
                                className="mb-1.5 block text-sm font-semibold text-slate-600"
                            >
                                Mật khẩu hiện tại
                            </Label>
                            <div className="relative">
                                <Input
                                    id="oldPassword"
                                    type={showOld ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={(e) =>
                                        setOldPassword(e.target.value)
                                    }
                                    className="pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showOld ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label
                                htmlFor="newPassword"
                                className="mb-1.5 block text-sm font-semibold text-slate-600"
                            >
                                Mật khẩu mới
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className="pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showNew ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label
                                htmlFor="confirmPassword"
                                className="mb-1.5 block text-sm font-semibold text-slate-600"
                            >
                                Xác nhận mật khẩu
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showConfirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm font-medium text-red-600">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#4DA1A9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2E5077] disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </form>
                </div>
            </div>
        </ContentLayout>
    );
};
