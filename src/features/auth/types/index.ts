import { z } from 'zod';

export const loginInputSchema = z.object({
    username: z
        .string()
        .min(3, 'Dinh danh phai co it nhat 3 ky tu')
        .max(80, 'Dinh danh khong duoc qua 80 ky tu'),
    password: z.string().min(6, 'Mat khau phai co it nhat 6 ky tu'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z
    .object({
        email: z
            .string()
            .min(1, 'Email la bat buoc')
            .email('Email khong hop le')
            .endsWith('dut.udn.vn', 'Email phai ket thuc bang @sv[so].dut.udn.vn'),
        firstName: z.string().min(1, 'Ten la bat buoc'),
        lastName: z.string().min(1, 'Ho la bat buoc'),
        username: z.string().min(3, 'Ten dang nhap phai co it nhat 3 ky tu'),
        password: z.string().min(6, 'Mat khau phai co it nhat 6 ky tu'),
        passwordConfirmed: z.string().min(1, 'Xac nhan mat khau la bat buoc'),
    })
    .refine((data) => data.password === data.passwordConfirmed, {
        message: 'Mat khau khong khop',
        path: ['passwordConfirmed'],
    });

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const forgotPasswordInputSchema = z.object({
    email: z.string().min(1, 'Email la bat buoc').email('Email khong hop le'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
    newPassword: z.string().min(6, 'Mat khau moi phai co it nhat 6 ky tu'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const changePasswordInputSchema = z
    .object({
        oldPassword: z.string().min(8, 'Mat khau cu phai co it nhat 8 ky tu'),
        newPassword: z.string().min(8, 'Mat khau moi phai co it nhat 8 ky tu'),
        newPasswordConfirm: z
            .string()
            .min(8, 'Xac nhan mat khau phai co it nhat 8 ky tu'),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
        message: 'Mat khau xac nhan khong khop',
        path: ['newPasswordConfirm'],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
