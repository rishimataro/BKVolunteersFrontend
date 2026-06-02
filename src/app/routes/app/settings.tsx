import { ArrowRight, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { ROLES, useUser } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';

const roleLabels: Record<string, string> = {
    [ROLES.SINHVIEN]: 'Sinh viên',
    [ROLES.CLB]: 'Quản lý CLB',
    [ROLES.LCD]: 'Phản biện',
    [ROLES.DOANTRUONG]: 'Quản trị trường',
};

export const SettingsRoute = () => {
    const navigate = useNavigate();
    const user = useUser();

    if (!user.data) return null;

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

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-full bg-[#4DA1A9]/10">
                            <UserCog className="size-5 text-[#4DA1A9]" />
                        </div>
                        <div className="space-y-3">
                            <div>
                                <h2 className="text-lg font-bold text-[#2E5077]">
                                    Bảo mật tài khoản
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Quản lý mật khẩu ở màn riêng để thao tác
                                    tập trung và dễ kiểm soát hơn.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        paths.app.changePassword.getHref(),
                                    )
                                }
                                className="inline-flex items-center gap-2"
                            >
                                Đi tới màn đổi mật khẩu
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
};
