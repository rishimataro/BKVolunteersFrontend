import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';
import { LandingRoute } from '../landing';
import { paths } from '@/config/paths';

// Mock useNavigate
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('LandingRoute', () => {
    it('renders correctly with logo and main titles', () => {
        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        // Check for logo
        expect(screen.getByAltText(/BK Volunteers Logo/i)).toBeDefined();

        // Check for brand name
        expect(screen.getAllByText(/BK Volunteers/i).length).toBeGreaterThan(0);

        // Check for main headline
        expect(screen.getByText(/Kết nối trái tim/i)).toBeDefined();
        expect(screen.getByText(/lan tỏa yêu thương/i)).toBeDefined();
    });

    it('navigates to login when clicking Đăng nhập in header', () => {
        const navigate = vi.fn();
        (useNavigate as vi.Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        const loginButton = screen.getByRole('button', { name: /đăng nhập/i });
        fireEvent.click(loginButton);

        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('navigates to login when clicking Bắt đầu ngay in hero', () => {
        const navigate = vi.fn();
        (useNavigate as vi.Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        const startButton = screen.getByRole('button', {
            name: /bắt đầu ngay/i,
        });
        fireEvent.click(startButton);

        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('navigates to register when clicking Đăng ký tình nguyện viên in hero', () => {
        const navigate = vi.fn();
        (useNavigate as vi.Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        const registerButton = screen.getByRole('button', {
            name: /đăng ký tình nguyện viên/i,
        });
        fireEvent.click(registerButton);

        expect(navigate).toHaveBeenCalledWith(paths.auth.register.getHref());
    });

    it('navigates to login when clicking Tham gia ngay in CTA section', () => {
        const navigate = vi.fn();
        (useNavigate as vi.Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        const joinButton = screen.getByRole('button', {
            name: /tham gia ngay/i,
        });
        fireEvent.click(joinButton);

        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('renders feature section with correct items', () => {
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
});
