import { Shield, Users } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { useUser } from '@/features/auth';

const orgTypeLabel: Record<string, string> = {
    CLUB: 'CLB',
    TEAM: 'Đội',
    GROUP: 'Nhóm',
    CENTER: 'Trung tâm',
};

export const OrgSettingsRoute = () => {
    const user = useUser();
    const u = user.data;

    if (!u) return null;

    return (
        <ContentLayout title="Thiết lập đơn vị">
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-bold text-[#2E5077]">
                        Thông tin đơn vị
                    </h2>
                    <div className="space-y-4 text-sm">
                        <div>
                            <span className="text-slate-400">Tên đơn vị</span>
                            <p className="font-medium text-slate-700">
                                {u.organization?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">Mã đơn vị</span>
                            <p className="font-medium text-slate-700">
                                {u.organization?.code ?? '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">Loại</span>
                            <p className="font-medium text-slate-700">
                                {orgTypeLabel[u.organization?.type as string] ??
                                    u.organization?.type ??
                                    '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">Khoa</span>
                            <p className="font-medium text-slate-700">
                                {u.organization?.faculty?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">
                                Vai trò của bạn
                            </span>
                            <p className="font-medium text-slate-700">
                                {u.role === 'CLB' ? 'Quản trị đơn vị' : u.role}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-[#2E5077]" />
                            <h2 className="text-lg font-bold text-[#2E5077]">
                                Quản lý thành viên
                            </h2>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Tính năng quản lý thành viên đơn vị sẽ được phát
                            triển trong giai đoạn tiếp theo.
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-[#2E5077]" />
                            <h2 className="text-lg font-bold text-[#2E5077]">
                                Phân quyền
                            </h2>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Tính năng phân quyền cho thành viên sẽ được phát
                            triển trong giai đoạn tiếp theo.
                        </p>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
};
