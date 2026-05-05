import { ContentLayout } from '@/components/layouts';
import { useUser } from '@/features/auth';

const roleLabel: Record<string, string> = {
    STUDENT: 'Sinh viên',
    ORG_ADMIN: 'Quản trị đơn vị',
    ORG_MEMBER: 'Thành viên đơn vị',
    SCHOOL_REVIEWER: 'Người duyệt cấp trường',
    SCHOOL_ADMIN: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

export const DashboardRoute = () => {
    const user = useUser();

    if (!user.data) return null;

    return (
        <ContentLayout title="Tổng Quan">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Xin chào {user.data.firstName} {user.data.lastName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">Vai trò hiện tại</p>
                <p className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                    {roleLabel[user.data.role] ?? user.data.role}
                </p>
            </div>
        </ContentLayout>
    );
};
