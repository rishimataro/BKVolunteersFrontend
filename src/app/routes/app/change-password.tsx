import { ContentLayout } from '@/components/layouts';
import { ChangePasswordPanel } from '@/features/auth/components/change-password-panel';

export const ChangePasswordRoute = () => {
    return (
        <ContentLayout title="Đổi mật khẩu">
            <div className="mx-auto max-w-3xl">
                <div className="border border-[#D1D5DB] bg-white p-6">
                    <ChangePasswordPanel />
                </div>
            </div>
        </ContentLayout>
    );
};
