import { z } from 'zod';

export const loginInputSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, 'Vui lòng nhập định danh.')
        .min(3, 'Định danh phải có ít nhất 3 ký tự')
        .max(80, 'Định danh không được quá 80 ký tự'),
    password: z
        .string()
        .min(1, 'Vui lòng nhập mật khẩu.')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(50, 'Mật khẩu không được quá 50 ký tự'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z
    .object({
        email: z
            .string()
            .min(1, 'Email là bắt buộc')
            .email('Email không hợp lệ')
            .endsWith(
                'dut.udn.vn',
                'Email phải kết thúc bằng @sv[so].dut.udn.vn',
            ),
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

export const resetPasswordInputSchema = z.object({
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const changePasswordInputSchema = z
    .object({
        oldPassword: z.string().min(8, 'Mật khẩu cũ phải có ít nhất 8 ký tự'),
        newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
        newPasswordConfirm: z
            .string()
            .min(8, 'Xác nhận mật khẩu phải có ít nhất 8 ký tự'),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
        message: 'Mật khẩu xác nhận không khớp',
        path: ['newPasswordConfirm'],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
