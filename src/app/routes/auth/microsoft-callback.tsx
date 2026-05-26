import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useAuthStore } from '@/store/auth-store';
import { getUser } from '@/features/auth/api/auth';

export const MicrosoftCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const accessToken = searchParams.get('access_token');
        const error = searchParams.get('error');

        if (error) {
            addNotification({
                type: 'error',
                title: 'Đăng nhập Microsoft thất bại',
                message: error,
            });
            navigate(paths.auth.login.getHref(), { replace: true });
            return;
        }

        if (!accessToken) {
            addNotification({
                type: 'error',
                title: 'Đăng nhập Microsoft thất bại',
                message: 'Không nhận được token từ Microsoft.',
            });
            navigate(paths.auth.login.getHref(), { replace: true });
            return;
        }

        useAuthStore.getState().setAuth(null, accessToken);

        getUser()
            .then((user) => {
                if (user) {
                    useAuthStore.getState().setAuth(user, accessToken);
                    navigate(paths.app.dashboard.getHref(), { replace: true });
                } else {
                    useAuthStore.getState().clearAuth();
                    addNotification({
                        type: 'error',
                        title: 'Đăng nhập Microsoft thất bại',
                        message: 'Không thể lấy thông tin tài khoản.',
                    });
                    navigate(paths.auth.login.getHref(), { replace: true });
                }
            })
            .catch(() => {
                useAuthStore.getState().clearAuth();
                addNotification({
                    type: 'error',
                    title: 'Đăng nhập Microsoft thất bại',
                    message: 'Lỗi khi lấy thông tin tài khoản.',
                });
                navigate(paths.auth.login.getHref(), { replace: true });
            });
    }, [searchParams, navigate, addNotification]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#58aab3] border-t-transparent" />
                <p className="text-lg text-slate-600">
                    Đang đăng nhập bằng Microsoft...
                </p>
            </div>
        </div>
    );
};
