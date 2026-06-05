import * as React from 'react';
import { CheckCircle2, Circle, Eye, EyeOff, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import { changePassword } from '@/features/auth/api/auth';

type ChangePasswordPanelProps = {
    className?: string;
    description?: string;
    submitLabel?: string;
    title?: string;
};

const requirementIconClassName = 'size-4';

const requirementLabelClassName =
    'text-[14px] leading-6 text-[#4B5563] sm:text-[15px]';

const getPasswordRequirementState = (
    oldPassword: string,
    newPassword: string,
) => ({
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    isDifferent:
        oldPassword.trim().length > 0 &&
        newPassword.trim().length > 0 &&
        oldPassword !== newPassword,
});

const validatePasswords = ({
    confirmPassword,
    newPassword,
    oldPassword,
}: {
    confirmPassword: string;
    newPassword: string;
    oldPassword: string;
}) => {
    if (!oldPassword.trim()) {
        return 'Vui lòng nhập mật khẩu hiện tại.';
    }

    if (newPassword.length < 8) {
        return 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    }

    if (!/[A-Z]/.test(newPassword)) {
        return 'Mật khẩu mới cần có ít nhất 1 chữ hoa.';
    }

    if (!/\d/.test(newPassword)) {
        return 'Mật khẩu mới cần có ít nhất 1 chữ số.';
    }

    if (oldPassword === newPassword) {
        return 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
    }

    if (newPassword !== confirmPassword) {
        return 'Mật khẩu xác nhận không khớp.';
    }

    return '';
};

export const ChangePasswordPanel = ({
    className,
    description = 'Cập nhật mật khẩu đăng nhập và giữ tài khoản của bạn an toàn trên mọi thiết bị.',
    submitLabel = 'Lưu thay đổi',
    title = 'Đổi mật khẩu',
}: ChangePasswordPanelProps) => {
    const { addNotification } = useNotifications();
    const [oldPassword, setOldPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showOld, setShowOld] = React.useState(false);
    const [showNew, setShowNew] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState('');

    const requirements = getPasswordRequirementState(oldPassword, newPassword);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const nextError = validatePasswords({
            confirmPassword,
            newPassword,
            oldPassword,
        });

        setError(nextError);

        if (nextError) {
            return;
        }

        setIsSaving(true);

        try {
            await changePassword({
                oldPassword,
                newPassword,
                newPasswordConfirm: confirmPassword,
            });

            addNotification({
                type: 'success',
                title: 'Đã cập nhật mật khẩu',
                message: 'Thông tin bảo mật của bạn đã được lưu.',
            });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Không thể cập nhật mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={className}>
            <div className="flex items-start gap-4 border-b border-[#E5E7EB] pb-5">
                <div className="flex h-12 w-12 items-center justify-center border border-[#0A0A0A] bg-[#F9FAFB] text-[#0A0A0A]">
                    <KeyRound className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                    <p className="broadsheet-kicker">Bảo vệ truy cập</p>
                    <h2 className="mt-2 text-[30px] font-semibold leading-[1.15] text-[#0A0A0A]">
                        {title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[#4B5563]">
                        {description}
                    </p>
                </div>
            </div>

            <form className="space-y-5 pt-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label
                        className="broadsheet-kicker text-[#0A0A0A]"
                        htmlFor="oldPassword"
                    >
                        Mật khẩu hiện tại
                    </Label>
                    <PasswordField
                        id="oldPassword"
                        onToggle={() => setShowOld((current) => !current)}
                        onValueChange={setOldPassword}
                        placeholder="Nhập mật khẩu hiện tại"
                        showPassword={showOld}
                        value={oldPassword}
                    />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label
                            className="broadsheet-kicker text-[#0A0A0A]"
                            htmlFor="newPassword"
                        >
                            Mật khẩu mới
                        </Label>
                        <PasswordField
                            id="newPassword"
                            onToggle={() => setShowNew((current) => !current)}
                            onValueChange={setNewPassword}
                            placeholder="Tối thiểu 8 ký tự"
                            showPassword={showNew}
                            value={newPassword}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            className="broadsheet-kicker text-[#0A0A0A]"
                            htmlFor="confirmPassword"
                        >
                            Xác nhận mật khẩu mới
                        </Label>
                        <PasswordField
                            id="confirmPassword"
                            onToggle={() =>
                                setShowConfirm((current) => !current)
                            }
                            onValueChange={setConfirmPassword}
                            placeholder="Nhập lại mật khẩu mới"
                            showPassword={showConfirm}
                            value={confirmPassword}
                        />
                    </div>
                </div>

                <div className="border border-[#D1D5DB] bg-[#F9FAFB] p-4">
                    <p className="broadsheet-kicker text-[#0A0A0A]">
                        Yêu cầu mật khẩu
                    </p>
                    <div className="mt-3 space-y-2">
                        <RequirementRow
                            isMet={requirements.minLength}
                            label="Tối thiểu 8 ký tự"
                        />
                        <RequirementRow
                            isMet={requirements.hasUppercase}
                            label="Có ít nhất 1 chữ hoa"
                        />
                        <RequirementRow
                            isMet={requirements.hasNumber}
                            label="Có ít nhất 1 chữ số"
                        />
                        <RequirementRow
                            isMet={requirements.isDifferent}
                            label="Không trùng với mật khẩu hiện tại"
                        />
                    </div>
                </div>

                {error ? (
                    <p
                        aria-live="polite"
                        className="border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[14px] leading-6 text-[#991B1B]"
                    >
                        {error}
                    </p>
                ) : null}

                <div className="flex justify-end">
                    <Button
                        className="h-12 border border-[#0A0A0A] bg-[#0A0A0A] px-6 text-[16px] font-semibold text-white hover:bg-[#1F2937]"
                        disabled={isSaving}
                        type="submit"
                    >
                        {isSaving ? 'Đang cập nhật...' : submitLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
};

const PasswordField = ({
    id,
    onToggle,
    onValueChange,
    placeholder,
    showPassword,
    value,
}: {
    id: string;
    onToggle: () => void;
    onValueChange: (value: string) => void;
    placeholder: string;
    showPassword: boolean;
    value: string;
}) => (
    <div className="relative">
        <Input
            className="h-12 pr-12"
            id={id}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            type={showPassword ? 'text' : 'password'}
            value={value}
        />
        <button
            aria-label={
                showPassword ? 'Ẩn nội dung mật khẩu' : 'Hiện nội dung mật khẩu'
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] transition hover:text-[#0A0A0A]"
            onClick={onToggle}
            type="button"
        >
            {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.75} />
            ) : (
                <Eye className="size-4" strokeWidth={1.75} />
            )}
        </button>
    </div>
);

const RequirementRow = ({
    isMet,
    label,
}: {
    isMet: boolean;
    label: string;
}) => (
    <div className="flex items-center gap-2">
        {isMet ? (
            <CheckCircle2
                className={`${requirementIconClassName} text-[#166534]`}
                strokeWidth={1.75}
            />
        ) : (
            <Circle
                className={`${requirementIconClassName} text-[#9CA3AF]`}
                strokeWidth={1.75}
            />
        )}
        <span className={requirementLabelClassName}>{label}</span>
    </div>
);
