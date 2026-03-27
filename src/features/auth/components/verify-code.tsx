import * as React from 'react';
import { Link, useNavigate } from 'react-router';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

import {
    PasswordRecoveryShell,
    authHelperLinkClass,
    authInputClass,
    authPrimaryButtonClass,
    authSecondaryButtonClass,
} from './password-recovery-shell';
import {
    RECOVERY_DEMO_CODE,
    getPasswordRecoveryState,
    markPasswordRecoveryVerified,
    resendPasswordRecoveryCode,
} from '../lib/password-recovery';

export const VerifyCodeForm = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const recoveryState = React.useMemo(() => getPasswordRecoveryState(), []);
    const [code, setCode] = React.useState('');
    const [error, setError] = React.useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!code.trim()) {
            setError('Vui lòng nhập mã xác thực.');
            return;
        }

        if (code.trim() !== recoveryState?.code) {
            setError('Mã xác thực chưa đúng. Vui lòng kiểm tra lại.');
            return;
        }

        markPasswordRecoveryVerified();
        addNotification({
            type: 'success',
            title: 'Xác thực thành công',
            message: 'Bạn có thể đặt mật khẩu mới ở bước tiếp theo.',
        });
        navigate(paths.auth.resetPassword.getHref());
    };

    const handleResendCode = () => {
        const nextState = resendPasswordRecoveryCode();

        if (!nextState) {
            navigate(paths.auth.forgotPassword.getHref(), { replace: true });
            return;
        }

        addNotification({
            type: 'info',
            title: 'Đã gửi lại mã',
            message: `Mã demo mới là ${RECOVERY_DEMO_CODE}. Vui lòng kiểm tra lại hộp thư của ${nextState.email}.`,
            duration: 8000,
        });
    };

    return (
        // Start section: Verify-code-form
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
            {/* Start: Form verify-code */}
            <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                {/* Verification code field */}
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

                {/* Helper message */}
                <div className="rounded-[1.35rem] border border-[#79D7BE]/35 bg-[#79D7BE]/10 px-5 py-4 text-sm leading-6 text-slate-500">
                    Đây là luồng giao diện mẫu. Mã xác thực hiện dùng cho demo
                    là{' '}
                    <span className="font-semibold text-[#2E5077]">
                        {RECOVERY_DEMO_CODE}
                    </span>
                    .
                </div>

                {/* Button verify */}
                <button type="submit" className={authPrimaryButtonClass}>
                    Xác nhận mã
                </button>

                {/* Button resend */}
                <button
                    type="button"
                    onClick={handleResendCode}
                    className={authSecondaryButtonClass}
                >
                    Gửi lại mã
                </button>
            </form>
            {/* End: Form verify-code */}

            {/* Footer link */}
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
        // End section: Verify-code-form
    );
};
