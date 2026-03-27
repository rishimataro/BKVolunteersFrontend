import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { ForgotPasswordForm } from '../components/forgot-password-form';
import { ResetPasswordForm } from '../components/reset-password-form';
import { VerifyCodeForm } from '../components/verify-code';
import {
    RECOVERY_DEMO_CODE,
    clearPasswordRecoveryState,
    getPasswordRecoveryState,
    startPasswordRecovery,
} from '../lib/password-recovery';

const addNotification = vi.fn();
const navigate = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: vi.fn(() => ({
        addNotification,
    })),
}));

vi.mock('react-router', async () => {
    const actual =
        await vi.importActual<typeof import('react-router')>('react-router');

    return {
        ...actual,
        useNavigate: () => navigate,
    };
});

describe('Password recovery flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.sessionStorage.clear();
        clearPasswordRecoveryState();
    });

    it('starts recovery from the email step and navigates to verify code', () => {
        render(
            <MemoryRouter>
                <ForgotPasswordForm />
            </MemoryRouter>,
        );

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'tester@sv1.dut.udn.vn' },
        });
        fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }));

        expect(getPasswordRecoveryState()).toMatchObject({
            email: 'tester@sv1.dut.udn.vn',
            code: RECOVERY_DEMO_CODE,
            verified: false,
        });
        expect(navigate).toHaveBeenCalledWith('/auth/verify-code');
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã gửi mã xác thực',
            }),
        );
    });

    it('verifies the recovery code and unlocks the reset step', () => {
        startPasswordRecovery('tester@sv1.dut.udn.vn');

        render(
            <MemoryRouter>
                <VerifyCodeForm />
            </MemoryRouter>,
        );

        fireEvent.change(screen.getByLabelText(/mã xác thực/i), {
            target: { value: RECOVERY_DEMO_CODE },
        });
        fireEvent.click(screen.getByRole('button', { name: /xác nhận mã/i }));

        expect(getPasswordRecoveryState()).toMatchObject({
            verified: true,
        });
        expect(navigate).toHaveBeenCalledWith('/auth/reset-password');
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Xác thực thành công',
            }),
        );
    });

    it('completes password reset, clears recovery state, and returns to login', () => {
        startPasswordRecovery('tester@sv1.dut.udn.vn');
        const recoveryState = getPasswordRecoveryState();
        window.sessionStorage.setItem(
            'bk-password-recovery',
            JSON.stringify({
                ...recoveryState,
                verified: true,
            }),
        );

        render(
            <MemoryRouter>
                <ResetPasswordForm />
            </MemoryRouter>,
        );

        fireEvent.change(
            screen.getByLabelText(/mật khẩu mới/i, { selector: 'input' }),
            {
                target: { value: 'password123' },
            },
        );
        fireEvent.change(
            screen.getByLabelText(/xác nhận mật khẩu/i, {
                selector: 'input',
            }),
            {
                target: { value: 'password123' },
            },
        );
        fireEvent.click(
            screen.getByRole('button', { name: /cập nhật mật khẩu/i }),
        );

        expect(getPasswordRecoveryState()).toBeNull();
        expect(navigate).toHaveBeenCalledWith('/auth/login');
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đổi mật khẩu thành công',
            }),
        );
    });
});
