import { z } from 'zod';

const mssvRegex = /^1\d{8}$/;

export const loginInputSchema = z.object({
    identifier: z
        .string()
        .min(1, 'Email hoặc MSSV là bắt buộc')
        .refine(
            (val) =>
                mssvRegex.test(val) ||
                z.string().email().safeParse(val).success,
            { message: 'Phải là email hợp lệ hoặc MSSV (9 số bắt đầu bằng 1)' },
        ),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z
    .object({
        email: z
            .string()
            .min(1, 'Email là bắt buộc')
            .email('Email không hợp lệ'),
        firstName: z.string().min(1, 'Tên là bắt buộc'),
        lastName: z.string().min(1, 'Họ là bắt buộc'),
        username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
        password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
        passwordConfirmed: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
    })
    .refine((data) => data.password === data.passwordConfirmed, {
        message: 'Mật khẩu không khớp',
        path: ['passwordConfirmed'],
    });

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const forgotPasswordInputSchema = z.object({
    email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z
    .object({
        resetToken: z.string().min(1, 'Token là bắt buộc'),
        newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
        newPasswordConfirm: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
        message: 'Mật khẩu không khớp',
        path: ['newPasswordConfirm'],
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
