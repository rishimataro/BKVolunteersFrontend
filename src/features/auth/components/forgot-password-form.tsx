import * as React from 'react';
import { useNavigate } from 'react-router';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

import {
    PasswordRecoveryShell,
    authHelperLinkClass,
    authInputClass,
    authPrimaryButtonClass,
} from './password-recovery-shell';
import {
    RECOVERY_DEMO_CODE,
    startPasswordRecovery,
} from '../lib/password-recovery';

export const ForgotPasswordForm = () => {
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [error, setError] = React.useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Vui lòng nhập địa chỉ email.');
            return;
        }

        startPasswordRecovery(email.trim());
        setError('');

        addNotification({
            type: 'success',
            title: 'Đã gửi mã xác thực',
            message: `Mã demo đã được gửi tới ${email.trim()}. Dùng mã ${RECOVERY_DEMO_CODE} để tiếp tục.`,
            duration: 8000,
        });

        navigate(paths.auth.verifyCode.getHref());
    };

    return (
        // Start section: Forgot-password-form
        <PasswordRecoveryShell
            activeStep={1}
            pageTitle="Khôi phục mật khẩu"
            title="Tìm tài khoản"
            description="Nhập email đã đăng ký để nhận mã xác thực và bắt đầu quy trình khôi phục mật khẩu."
            assetSrc="/forgot-password.svg"
            assetAlt="Minh họa nhập email khôi phục mật khẩu"
        >
            {/* Start: Form forgot-password */}
            <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                {/* Email field */}
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

                {/* Helper message */}
                <div className="rounded-[1.35rem] border border-[#79D7BE]/35 bg-[#79D7BE]/10 px-5 py-4 text-sm leading-6 text-slate-500">
                    Mã xác thực sẽ được mô phỏng ở giao diện frontend để bạn
                    tiếp tục qua bước nhập mã trước khi đặt mật khẩu mới.
                </div>

                {/* Button continue */}
                <button type="submit" className={authPrimaryButtonClass}>
                    Tiếp tục
                </button>
            </form>
            {/* End: Form forgot-password */}

            {/* Footer link */}
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
        // End section: Forgot-password-form
    );
};
