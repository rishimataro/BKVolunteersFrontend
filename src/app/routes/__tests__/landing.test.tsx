import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';
import { LandingRoute } from '../landing';
import { paths } from '@/config/paths';
import { useAuthStore } from '@/store/auth-store';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('LandingRoute', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ user: null, accessToken: null });
    });

    it('renders logo and headline content', () => {
        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        expect(screen.getByAltText(/Logo BK Volunteers/i)).toBeDefined();
        expect(screen.getAllByText(/BK Volunteers/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Kết nối trái tim/i)).toBeDefined();
        expect(screen.getByText(/lan tỏa yêu thương/i)).toBeDefined();
    });

    it('navigates to login when clicking Đăng nhập in header', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));
        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('navigates to login when clicking Bắt đầu ngay in hero', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /bắt đầu ngay/i }));
        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('navigates to register when clicking Đăng ký tình nguyện viên', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /đăng ký tình nguyện viên/i,
            }),
        );

        expect(navigate).toHaveBeenCalledWith(paths.auth.register.getHref());
    });

    it('navigates to login when clicking Tham gia ngay in CTA', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /tham gia ngay/i }));
        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('renders feature cards', () => {
        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Quản lý sự kiện/i)).toBeDefined();
        expect(screen.getByText(/Kết nối thành viên/i)).toBeDefined();
        expect(screen.getByText(/Ghi nhận đóng góp/i)).toBeDefined();
        expect(screen.getByText(/Lan tỏa giá trị/i)).toBeDefined();
    });

    it('shows bell and avatar instead of login button when user is logged in', () => {
        useAuthStore.setState({
            user: {
                id: 'u-1',
                createdAt: Date.now(),
                username: 'nguyenvana',
                email: 'nguyenvana@example.com',
                firstName: 'Nguyen',
                lastName: 'An',
                role: 'SINHVIEN',
            },
            accessToken: 'token-123',
        });

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        expect(screen.queryByRole('button', { name: /đăng nhập/i })).toBeNull();
        expect(
            screen.getByRole('button', {
                name: /thông báo/i,
            }),
        ).toBeDefined();
        expect(screen.getByText(/Nguyen An/i)).toBeDefined();
    });
});
