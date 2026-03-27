import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
} from './password-recovery-shell';
import {
    clearPasswordRecoveryState,
    getPasswordRecoveryState,
} from '../lib/password-recovery';

export const ResetPasswordForm = () => {
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const recoveryState = React.useMemo(() => getPasswordRecoveryState(), []);
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [errors, setErrors] = React.useState<{
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors: {
            newPassword?: string;
            confirmPassword?: string;
        } = {};

        if (newPassword.trim().length < 6) {
            nextErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
        }

        if (confirmPassword.trim().length < 6) {
            nextErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu mới.';
        } else if (newPassword !== confirmPassword) {
            nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        clearPasswordRecoveryState();
        addNotification({
            type: 'success',
            title: 'Đổi mật khẩu thành công',
            message: 'Mật khẩu mới đã được lưu trên luồng giao diện mẫu.',
        });
        navigate(paths.auth.login.getHref());
    };

    return (
        // Start section: Reset-password-form
        <PasswordRecoveryShell
            activeStep={3}
            pageTitle="Đặt lại mật khẩu"
            title="Tạo mật khẩu mới"
            description={`Tài khoản ${
                recoveryState?.email ?? ''
            } đã xác minh thành công. Hãy nhập mật khẩu mới để hoàn tất.`}
            assetSrc="/set-password.svg"
            assetAlt="Minh họa tạo mật khẩu mới"
        >
            {/* Start: Form reset-password */}
            <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                {/* New password field */}
                <div>
                    <Label
                        htmlFor="newPassword"
                        className="block mb-2 text-base font-semibold sm:text-lg text-slate-600"
                    >
                        Mật khẩu mới:
                    </Label>
                    <div className="relative mt-1">
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(event) => {
                                setNewPassword(event.target.value);
                                setErrors((current) => ({
                                    ...current,
                                    newPassword: undefined,
                                }));
                            }}
                            className={`${authInputClass} pr-14`}
                            placeholder="Nhập mật khẩu mới"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowNewPassword((current) => !current)
                            }
                            aria-label={
                                showNewPassword
                                    ? 'Ẩn mật khẩu mới'
                                    : 'Hiện mật khẩu mới'
                            }
                            className="absolute right-4 top-[1.05rem] inline-flex h-6 w-6 items-center justify-center text-slate-300 transition-all duration-200 hover:scale-110 hover:text-[#4DA1A9] active:scale-95"
                        >
                            {showNewPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.newPassword && (
                        <p className="mt-2 text-sm font-medium text-bk-red">
                            {errors.newPassword}
                        </p>
                    )}
                </div>

                {/* Confirm password field */}
                <div>
                    <Label
                        htmlFor="confirmPassword"
                        className="block mb-2 text-base font-semibold sm:text-lg text-slate-600"
                    >
                        Xác nhận mật khẩu:
                    </Label>
                    <div className="relative mt-1">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                setErrors((current) => ({
                                    ...current,
                                    confirmPassword: undefined,
                                }));
                            }}
                            className={`${authInputClass} pr-14`}
                            placeholder="Nhập lại mật khẩu mới"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword((current) => !current)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? 'Ẩn xác nhận mật khẩu'
                                    : 'Hiện xác nhận mật khẩu'
                            }
                            className="absolute right-4 top-[1.05rem] inline-flex h-6 w-6 items-center justify-center text-slate-300 transition-all duration-200 hover:scale-110 hover:text-[#4DA1A9] active:scale-95"
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-2 text-sm font-medium text-bk-red">
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                {/* Helper message */}
                <div className="rounded-[1.35rem] border border-[#79D7BE]/35 bg-[#79D7BE]/10 px-5 py-4 text-sm leading-6 text-slate-500">
                    Sau khi hoàn tất, phiên khôi phục hiện tại sẽ được đóng và
                    bạn sẽ được đưa về màn hình đăng nhập.
                </div>

                {/* Button update password */}
                <button type="submit" className={authPrimaryButtonClass}>
                    Cập nhật mật khẩu
                </button>
            </form>
            {/* End: Form reset-password */}

            {/* Footer link */}
            <div className="mt-7 text-center text-sm text-slate-500 sm:text-left">
                Muốn bắt đầu lại?{' '}
                <Link
                    to={paths.auth.forgotPassword.getHref()}
                    className={authHelperLinkClass}
                >
                    Quay lại bước nhập email
                </Link>
            </div>
        </PasswordRecoveryShell>
        // End section: Reset-password-form
    );
};
