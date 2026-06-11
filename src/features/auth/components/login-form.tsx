import * as React from 'react';
import Axios from 'axios';
import { Eye, EyeOff, Globe, HandHeart, Heart, Sparkles } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { MicrosoftIcon } from '@/components/ui/icon';
import {
    normalizeVietnameseText,
    toVietnameseSearchKey,
} from '@/utils/vietnamese-text';
import { loginInputSchema } from '../types';
import { useLogin } from '../lib/auth-provider';

type LoginFormErrors = {
    username?: string;
    password?: string;
};

type LoginFormValues = {
    username: string;
    password: string;
};

const decorativeIcons = [
    {
        Icon: Heart,
        className:
            'right-[40%] top-[28%] text-[#4fa7b5] shadow-[0_24px_48px_-30px_rgba(79,167,181,0.9)]',
    },
    {
        Icon: Globe,
        className:
            'right-[150%] top-[44%] text-[#62a9b8] shadow-[0_18px_40px_-28px_rgba(98,169,184,0.85)]',
    },
    {
        Icon: HandHeart,
        className:
            'right-[140%] top-[66%] text-[#55a8a9] shadow-[0_24px_54px_-32px_rgba(85,168,169,0.9)]',
    },
    {
        Icon: Sparkles,
        className:
            'right-[30%] bottom-[30%] text-[#86d6d3] shadow-[0_24px_54px_-34px_rgba(134,214,211,0.8)]',
    },
];

export const LoginForm = () => {
    const { addNotification } = useNotifications();
    const login = useLogin();
    const [identifier, setIdentifier] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [errors, setErrors] = React.useState<LoginFormErrors>({});
    const [touchedFields, setTouchedFields] = React.useState<
        Record<keyof LoginFormErrors, boolean>
    >({
        username: false,
        password: false,
    });

    const validateValues = React.useCallback((values: LoginFormValues) => {
        const parsedValues = loginInputSchema.safeParse(values);

        if (parsedValues.success) {
            return {};
        }

        return parsedValues.error.issues.reduce<LoginFormErrors>(
            (nextErrors, issue) => {
                const field = issue.path[0];

                if (
                    (field === 'username' || field === 'password') &&
                    !nextErrors[field]
                ) {
                    nextErrors[field] = issue.message;
                }

                return nextErrors;
            },
            {},
        );
    }, []);

    const updateFieldState = React.useCallback(
        (
            field: keyof LoginFormErrors,
            value: string,
            nextValues?: Partial<LoginFormValues>,
        ) => {
            const values: LoginFormValues = {
                username:
                    nextValues?.username ??
                    (field === 'username' ? value : identifier),
                password:
                    nextValues?.password ??
                    (field === 'password' ? value : password),
            };

            if (field === 'username') {
                setIdentifier(value);
            } else {
                setPassword(value);
            }

            if (!touchedFields[field]) {
                if (errors[field]) {
                    setErrors((current) => ({
                        ...current,
                        [field]: undefined,
                    }));
                }
                return;
            }

            const nextErrors = validateValues(values);

            setErrors((current) => ({
                ...current,
                [field]: nextErrors[field],
            }));
        },
        [errors, identifier, password, touchedFields, validateValues],
    );

    const normalizeLoginError = React.useCallback((error: unknown) => {
        if (!Axios.isAxiosError(error)) {
            return 'Đăng nhập thất bại, vui lòng thử lại.';
        }

        const rawMessage =
            (error.response?.data as { message?: string } | undefined)
                ?.message ?? error.message;
        const normalizedMessage = toVietnameseSearchKey(rawMessage);

        if (
            normalizedMessage.includes('tai khoan da bi khoa hoac vo hieu hoa')
        ) {
            return 'Tài khoản đã bị khóa hoặc vô hiệu hóa.';
        }

        if (
            normalizedMessage.includes('identifier hoac mat khau khong hop le')
        ) {
            return 'Thông tin đăng nhập không hợp lệ.';
        }

        if (normalizedMessage.includes('identifier va mat khau la bat buoc')) {
            return 'Vui lòng nhập định danh và mật khẩu.';
        }

        return normalizeVietnameseText(rawMessage) || 'Đăng nhập thất bại, vui lòng thử lại.';
    }, []);

    const onFieldBlur = React.useCallback(
        (field: keyof LoginFormErrors) => {
            setTouchedFields((current) => ({
                ...current,
                [field]: true,
            }));

            const nextErrors = validateValues({
                username: identifier.trim(),
                password,
            });

            setErrors((current) => ({
                ...current,
                [field]: nextErrors[field],
            }));
        },
        [identifier, password, validateValues],
    );

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const values = {
            username: identifier.trim(),
            password,
        };
        const nextErrors = validateValues(values);

        setTouchedFields({
            username: true,
            password: true,
        });
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        try {
            await login.mutateAsync(values);
            addNotification({
                type: 'success',
                title: 'Đăng nhập thành công',
                message: 'Phiên đăng nhập đã được tạo.',
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Đăng nhập thất bại',
                message: normalizeLoginError(error),
            });
        }
    };

    const onMicrosoftClick = () => {
        addNotification({
            type: 'info',
            title: 'Microsoft SSO',
            message:
                'Nút đăng nhập Microsoft đang ở chế độ mô phỏng giao diện và chưa kết nối dịch vụ.',
        });
    };

    return (
        // Start section: Login-form
        <section className="relative mx-auto w-full max-w-[1376px] px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            {/* Start: Login-form*/}
            <div className="group relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white bg-white shadow-[0_30px_80px_-32px_rgba(28,74,97,0.55)] backdrop-blur-md transition-transform duration-500">
                {/* Start: Card left*/}
                <div className="grid min-h-[620px] md:min-h-[680px] lg:min-h-[720px] lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)]">
                    {/* Start: Form-container */}
                    <div className="relative z-10 flex items-center px-4 py-8 sm:px-8 sm:py-10 lg:px-0 lg:pl-20">
                        {/* Start: Form-content */}
                        <div className="w-full max-w-[26rem] sm:max-w-[30rem]">
                            <img
                                src="/logo_nobg.svg"
                                alt="BK Volunteers"
                                className="w-auto h-20 mb-7"
                            />

                            {/* Title login */}
                            <div className="mb-8">
                                <h1 className="text-4xl font-bold tracking-tight uppercase text-slate-700 sm:text-4xl lg:text-5xl">
                                    Đăng nhập
                                </h1>
                            </div>

                            {/* Form: username and password */}
                            <form
                                onSubmit={onSubmit}
                                className="space-y-7"
                                noValidate
                            >
                                <div>
                                    <Label
                                        htmlFor="username"
                                        className="block mb-2 text-base font-semibold sm:text-lg text-slate-600"
                                    >
                                        Email, tên đăng nhập hoặc MSSV
                                    </Label>
                                    <p className="mb-2 text-sm text-slate-500">
                                        Dùng thông tin đăng nhập đã được cấp để
                                        truy cập đúng vai trò.
                                    </p>
                                    <Input
                                        id="username"
                                        value={identifier}
                                        onChange={(e) => {
                                            updateFieldState(
                                                'username',
                                                e.target.value,
                                            );
                                        }}
                                        onBlur={() => onFieldBlur('username')}
                                        placeholder="Email, tên đăng nhập hoặc MSSV"
                                        autoComplete="username"
                                        error={errors.username}
                                        className="h-12 sm:h-14 rounded-[1rem] border border-slate-300 bg-white px-5 text-base text-slate-700 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.8)] transition-all duration-200 placeholder:text-slate-300 hover:border-[#71bfca] focus-visible:border-[#58aeb6] focus-visible:ring-4 focus-visible:ring-[#8fe5e2]/35"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <Label
                                            htmlFor="password"
                                            className="text-base font-semibold sm:text-lg text-slate-600"
                                        >
                                            Mật khẩu:
                                        </Label>
                                        <Link
                                            to={paths.auth.forgotPassword.getHref()}
                                            className="text-sm font-medium text-[#3a6da0] transition-colors duration-200 hover:text-[#235987] hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            value={password}
                                            onChange={(e) => {
                                                updateFieldState(
                                                    'password',
                                                    e.target.value,
                                                );
                                            }}
                                            onBlur={() =>
                                                onFieldBlur('password')
                                            }
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            placeholder="Mật khẩu"
                                            autoComplete="current-password"
                                            error={errors.password}
                                            className="h-12 sm:h-14 rounded-[1rem] border border-slate-300 bg-white px-5 pr-14 text-base text-slate-700 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.8)] transition-all duration-200 placeholder:text-slate-300 hover:border-[#71bfca] focus-visible:border-[#58aeb6] focus-visible:ring-4 focus-visible:ring-[#8fe5e2]/35"
                                        />
                                        <button
                                            type="button"
                                            aria-label={
                                                showPassword
                                                    ? 'Ẩn mật khẩu'
                                                    : 'Hiện mật khẩu'
                                            }
                                            aria-pressed={showPassword}
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) => !current,
                                                )
                                            }
                                            className="absolute right-4 top-[1.05rem] inline-flex h-6 w-6 items-center justify-center text-slate-300 transition-all duration-200 hover:scale-110 hover:text-[#59abb7] active:scale-95"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={login.isPending}
                                    className="inline-flex h-12 sm:h-14 w-full items-center justify-center rounded-full bg-[#58aab3] px-4 sm:px-6 text-[1.05rem] font-semibold text-white shadow-[5px_20px_20px_-24px_rgba(54,131,140,0.9)] transition-all duration-200 hover:bg-[#4a9ea9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8fe5e2]/50 active:translate-y-0 active:scale-[0.985]"
                                >
                                    {login.isPending
                                        ? 'Đang xử lý...'
                                        : 'Đăng nhập'}
                                </button>
                            </form>

                            <div className="mt-6 text-base text-center text-slate-400">
                                hoặc tiếp tục với
                            </div>

                            <button
                                type="button"
                                onClick={onMicrosoftClick}
                                className="mt-3 inline-flex h-12 sm:h-14 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white/95 px-4 sm:px-6 text-base font-medium text-slate-400 transition-all duration-200 hover:border-[#9ad7d8] hover:text-slate-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 active:translate-y-0 active:scale-[0.985]"
                            >
                                <MicrosoftIcon />
                                <span>Đăng nhập bằng Microsoft</span>
                            </button>
                        </div>
                        {/* End: Form-content */}
                    </div>
                    {/* End: Form-container */}

                    {/* Start: Side bar right */}
                    <div className="absolute inset-0 z-20 hidden pointer-events-none xl:block">
                        <div className="absolute right-0 top-0 h-full w-[32%] bg-[#e8f4fb]/88">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.95),rgba(232,244,251,0.58)_42%,rgba(185,223,236,0.8)_100%)]" />

                            {decorativeIcons.map(({ Icon, className }) => (
                                <div
                                    key={className}
                                    className={`absolute flex h-14 w-14 animate-float items-center justify-center rounded-full ${className}`}
                                >
                                    <Icon className="w-20 h-20" />
                                </div>
                            ))}

                            {/* <div className="absolute top-0 left-0 z-20 w-20 h-full bg-gradient-to-r from-white to-transparent" /> */}

                            <img
                                src="/linhvat.svg"
                                className="absolute bottom-0 -left-[50%] h-[95%] scale-150 max-h-[720px] w-auto z-30 drop-shadow-[0_30px_40px_rgba(0,0,0,0.15)]"
                            />
                        </div>
                    </div>
                    {/* End: Side bar right */}
                </div>
                {/* End: Card Left */}
            </div>
            {/* End: Login-form */}
        </section>
        // End section: Login-form
    );
};
