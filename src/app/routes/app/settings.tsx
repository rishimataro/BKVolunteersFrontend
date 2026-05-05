import { ContentLayout } from '@/components/layouts';
import { useUser } from '@/features/auth';

export const SettingsRoute = () => {
    const user = useUser();

    if (!user.data) return null;

    return (
        <ContentLayout title="Cài Đặt">
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                Trang cài đặt hệ thống hiện đang ở phạm vi nền tảng giai đoạn 1-2.
                Các cấu hình nâng cao sẽ mở rộng ở giai đoạn tiếp theo.
            </div>
        </ContentLayout>
    );
};
