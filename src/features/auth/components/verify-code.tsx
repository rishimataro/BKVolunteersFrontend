import * as React from 'react';
import { Link, useNavigate } from 'react-router';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { verifyCode, forgotPassword } from '@/features/auth/api/auth';

import {
    PasswordRecoveryShell,
    authHelperLinkClass,
    authInputClass,
    authPrimaryButtonClass,
    authSecondaryButtonClass,
} from './password-recovery-shell';
import {
    getPasswordRecoveryState,
    markPasswordRecoveryVerified,
} from '../lib/password-recovery';

export const VerifyCodeForm = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const recoveryState = React.useMemo(() => getPasswordRecoveryState(), []);
    const [code, setCode] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isResending, setIsResending] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!code.trim()) {
            setError('Vui lòng nhập mã xác thực.');
            return;
        }

        if (!recoveryState?.email) {
            navigate(paths.auth.forgotPassword.getHref(), { replace: true });
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await verifyCode({
                email: recoveryState.email,
                code: code.trim(),
            });
            markPasswordRecoveryVerified(result.resetToken);
            addNotification({
                type: 'success',
                title: 'Xác thực thành công',
                message: 'Bạn có thể đặt mật khẩu mới ở bước tiếp theo.',
            });
            navigate(paths.auth.resetPassword.getHref());
        } catch {
            setError('Mã xác thực không chính xác. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!recoveryState?.email) {
            navigate(paths.auth.forgotPassword.getHref(), { replace: true });
            return;
        }

        setIsResending(true);

        try {
            await forgotPassword({ email: recoveryState.email });
            addNotification({
                type: 'success',
                title: 'Đã gửi lại mã',
                message: `Mã xác thực mới đã được gửi tới ${recoveryState.email}.`,
                duration: 8000,
            });
        } catch {
            setError('Gửi lại mã thất bại.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <PasswordRecoveryShell
            activeStep={2}
            pageTitle="Xác thực mã khôi phục"
            title="Nhập mã xác thực"
            description={`Chúng tôi đã gửi một mã xác thực gồm 6 ký tự tới ${
                recoveryState?.email ?? 'email của bạn'
            }. Nhập mã để tiếp tục đặt lại mật khẩu.`}
            assetSrc="/verify.svg"
            assetAlt="Minh họa xác thực mã khôi phục"
        >
            <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                <div>
                    <Label
                        htmlFor="recovery-code"
                        className="block mb-2 text-base font-semibold sm:text-lg text-slate-600"
                    >
                        Mã xác thực:
                    </Label>
                    <Input
                        id="recovery-code"
                        value={code}
                        onChange={(event) => {
                            setCode(event.target.value.replace(/\s+/g, ''));
                            if (error) {
                                setError('');
                            }
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Nhập 6 ký tự"
                        className={`${authInputClass} text-center text-xl tracking-[0.35em]`}
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
                    {isLoading ? 'Đang xác thực...' : 'Xác nhận mã'}
                </button>

                <button
                    type="button"
                    onClick={handleResendCode}
                    className={authSecondaryButtonClass}
                    disabled={isResending}
                >
                    {isResending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
            </form>

            <div className="mt-7 text-center text-sm text-slate-500 sm:text-left">
                Sai email?{' '}
                <Link
                    to={paths.auth.forgotPassword.getHref()}
                    className={authHelperLinkClass}
                >
                    Quay lại bước trước
                </Link>
            </div>
        </PasswordRecoveryShell>
    );
};
