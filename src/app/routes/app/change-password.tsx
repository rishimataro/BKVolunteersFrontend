import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import { api } from '@/lib/api-clients';

export const ChangePasswordRoute = () => {
    const { addNotification } = useNotifications();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!oldPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
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
            setError('Có lỗi xảy ra. Vui lòng kiểm tra lại mật khẩu hiện tại.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ContentLayout title="Đổi Mật Khẩu">
            <div className="mx-auto max-w-md">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#4DA1A9]/10">
                            <KeyRound className="size-5 text-[#4DA1A9]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#2E5077]">
                                Đổi mật khẩu
                            </h2>
                            <p className="text-sm text-slate-500">
                                Nhập mật khẩu hiện tại và mật khẩu mới
                            </p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                Xác nhận mật khẩu mới
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
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full"
                        >
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </form>
                </div>
            </div>
        </ContentLayout>
    );
};
