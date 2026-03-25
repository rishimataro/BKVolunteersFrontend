import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

import { useRegister } from '../lib/auth-provider';
import { registerInputSchema, type RegisterInput } from '../types';

type RegisterFormProps = {
    onSuccess: () => void;
};

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
    const { addNotification } = useNotifications();
    const register = useRegister({
        onSuccess: () => {
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Account created successfully',
            });
            onSuccess();
        },
    });

    const {
        register: registerField,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerInputSchema),
    });

    const onSubmit = (data: RegisterInput) => {
        register.mutate(data);
    };

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="firstName"
                    >
                        Tên
                    </Label>
                    <div className="mt-1">
                        <Input
                            id="firstName"
                            type="text"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            {...registerField('firstName')}
                        />
                        {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.firstName.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="lastName"
                    >
                        Họ và tên đệm
                    </Label>
                    <div className="mt-1">
                        <Input
                            id="lastName"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            type="text"
                            {...registerField('lastName')}
                        />
                        {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.lastName.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="username"
                    >
                        Tên đăng nhập
                    </Label>
                    <div className="mt-1">
                        <Input
                            id="username"
                            type="text"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            autoComplete="username"
                            {...registerField('username')}
                        />
                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.username.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="email"
                    >
                        Địa chỉ Email
                    </Label>
                    <div className="mt-1">
                        <Input
                            id="email"
                            type="email"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            autoComplete="email"
                            {...registerField('email')}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="password"
                    >
                        Mật khẩu
                    </Label>

                    <div className="mt-1">
                        <Input
                            id="password"
                            type="password"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            autoComplete="new-password"
                            {...registerField('password')}
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.password.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="passwordConfirmed"
                    >
                        Xác nhận mật khẩu
                    </Label>
                    <div className="mt-1">
                        <Input
                            id="passwordConfirmed"
                            type="password"
                            autoComplete="new-password"
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            {...registerField('passwordConfirmed')}
                        />
                        {errors.passwordConfirmed && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.passwordConfirmed.message}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center bg-bk-blue hover:bg-bk-blue/90 text-white font-bold h-[56px] rounded-lg transition duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={register.isPending}
                    >
                        {register.isPending
                            ? 'Đang tạo tài khoản...'
                            : 'Đăng ký'}
                    </Button>
                </div>
            </form>

            <div className="mt-6">
                <div className="mt-8 relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <span className="relative z-10 bg-white px-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Bạn đã có tài khoản?
                    </span>
                </div>

                <div className="mt-8 text-center text-sm text-gray-600 font-medium">
                    <Link
                        className="font-bold text-bk-blue hover:underline"
                        to={paths.auth.login.getHref()}
                    >
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};
