import { Building2, HeartHandshake, Shield } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { ROLES, useUser } from '@/features/auth';

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

    if (u.role !== ROLES.CLB) {
        return (
            <ContentLayout title="Thiết lập đơn vị">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền truy cập thiết lập đơn vị.
                </div>
            </ContentLayout>
        );
    }

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
                            <HeartHandshake className="h-5 w-5 text-[#2E5077]" />
                            <h2 className="text-lg font-bold text-[#2E5077]">
                                Phạm vi quản trị hiện tại
                            </h2>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                            <li>- Tạo và quản lý chiến dịch của đơn vị.</li>
                            <li>- Cấu hình gây quỹ, hiện vật và sự kiện.</li>
                            <li>- Theo dõi đóng góp, pledge và đăng ký sự kiện.</li>
                            <li>- Xem báo cáo thuộc phạm vi đơn vị.</li>
                        </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-[#2E5077]" />
                            <h2 className="text-lg font-bold text-[#2E5077]">
                                Hỗ trợ vận hành
                            </h2>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Nếu cần cập nhật cơ cấu thành viên, phân quyền nội
                            bộ hoặc thay đổi trạng thái đơn vị, hãy liên hệ quản
                            trị cấp trường để được hỗ trợ.
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-[#2E5077]" />
                            <h2 className="text-lg font-bold text-[#2E5077]">
                                Gợi ý cấu hình
                            </h2>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            Trước khi mở chiến dịch mới, hãy kiểm tra lại thông
                            tin đơn vị ở đây để bảo đảm tên, mã và khoa hiển thị
                            đúng trên trang công khai và báo cáo tổng hợp.
                        </p>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
};
