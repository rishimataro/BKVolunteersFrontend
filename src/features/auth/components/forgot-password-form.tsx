import * as React from 'react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/components/ui/link';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

import { forgotPassword } from '../api/auth';

export const ForgotPasswordForm = () => {
    const { addNotification } = useNotifications();
    const mutation = useMutation({
        mutationFn: forgotPassword,
        onSuccess: (data) => {
            addNotification({
                type: 'success',
                title: 'Success',
                message: data.message || 'Check your email for the reset link',
            });
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        mutation.mutate({ email });
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Label
                        className="block text-gray-700 text-sm font-bold mb-1.5"
                        htmlFor="email"
                    >
                        Địa chỉ email
                    </Label>
                    <div className="mt-1">
                        <Input
                            id="email"
                            className="w-full  pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-bk-blue focus:border-bk-blue transition-all"
                            placeholder="example@sv1.dut.udn.vn"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>

                <div>
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center bg-bk-blue hover:bg-bk-blue/90 text-white font-bold h-[50px] rounded-lg transition duration-200 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Đang gửi...' : 'Gửi liên kết'}
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <Link to={paths.auth.login.getHref()}>Back to login</Link>
            </div>
        </div>
    );
};
