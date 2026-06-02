import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';

import { SettingsRoute } from '../settings';
import { paths } from '@/config/paths';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@/features/auth', () => ({
    ROLES: {
        SINHVIEN: 'SINHVIEN',
        CLB: 'CLB',
        LCD: 'LCD',
        DOANTRUONG: 'DOANTRUONG',
    },
    useUser: vi.fn(() => ({
        data: {
            fullName: 'Nguyen Van A',
            email: 'student@example.com',
            studentCode: '102210001',
            role: 'SINHVIEN',
        },
    })),
}));

describe('SettingsRoute', () => {
    it('renders account summary and navigates to change password screen', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <SettingsRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText('Thông tin tài khoản')).toBeDefined();
        expect(screen.getByText('student@example.com')).toBeDefined();

        fireEvent.click(
            screen.getByRole('button', { name: /đi tới màn đổi mật khẩu/i }),
        );

        expect(navigate).toHaveBeenCalledWith(
            paths.app.changePassword.getHref(),
        );
    });
});
