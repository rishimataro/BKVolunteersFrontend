import { ContentLayout } from '@/components/layouts';
import { useUser } from '@/features/auth';

const roleLabel: Record<string, string> = {
    SINHVIEN: 'Sinh viên',
    CLB: 'Quản trị đơn vị',
    LCD: 'Người duyệt cấp trường',
    DOANTRUONG: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

export const ProfileRoute = () => {
    const user = useUser();

    if (!user.data) return null;

    return (
        <ContentLayout title="Hồ Sơ Cá Nhân">
            <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
                <p>
                    <b>Họ tên:</b> {user.data.firstName} {user.data.lastName}
                </p>
                <p>
                    <b>Email:</b> {user.data.email}
                </p>
                <p>
                    <b>Vai trò:</b>{' '}
                    {roleLabel[user.data.role] ?? user.data.role}
                </p>
            </div>
        </ContentLayout>
    );
};
