import * as React from 'react';
import { useNavigate } from 'react-router';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { forgotPassword } from '@/features/auth/api/auth';

import {
    PasswordRecoveryShell,
    authHelperLinkClass,
    authInputClass,
    authPrimaryButtonClass,
} from './password-recovery-shell';
import { startPasswordRecovery } from '../lib/password-recovery';

export const ForgotPasswordForm = () => {
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Vui lòng nhập địa chỉ email.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await forgotPassword({ email: email.trim() });
            startPasswordRecovery(email.trim());

            addNotification({
                type: 'success',
                title: 'Đã gửi mã xác thực',
                message: `Mã xác thực đã được gửi tới ${email.trim()}. Vui lòng kiểm tra hộp thư.`,
                duration: 8000,
            });

            navigate(paths.auth.verifyCode.getHref());
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PasswordRecoveryShell
            activeStep={1}
            pageTitle="Khôi phục mật khẩu"
            title="Tìm tài khoản"
            description="Nhập email đã đăng ký để nhận mã xác thực và bắt đầu quy trình khôi phục mật khẩu."
            assetSrc="/forgot-password.svg"
            assetAlt="Minh họa nhập email khôi phục mật khẩu"
        >
            <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                <div>
                    <Label
                        className="block mb-2 text-base font-semibold sm:text-lg text-slate-600"
                        htmlFor="email"
                    >
                        Email:
                    </Label>
                    <Input
                        id="email"
                        className={authInputClass}
                        placeholder="example@sv1.dut.udn.vn"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            if (error) {
                                setError('');
                            }
                        }}
                    />
                    {error && (
                        <p className="mt-2 text-sm font-medium text-bk-red">
                            {error}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className={authPrimaryButtonClass}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang gửi...' : 'Tiếp tục'}
                </button>
            </form>

            <div className="mt-7 text-center text-sm text-slate-500 sm:text-left">
                Đã nhớ mật khẩu?{' '}
                <Link
                    to={paths.auth.login.getHref()}
                    className={authHelperLinkClass}
                >
                    Quay lại đăng nhập
                </Link>
            </div>
        </PasswordRecoveryShell>
    );
};
