import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { LandingRoute } from '../landing';

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

        expect(screen.getByAltText(/BK Volunteers Logo/i)).toBeDefined();
        expect(screen.getAllByText(/BK Volunteers/i).length).toBeGreaterThan(0);
        expect(
            screen.getByText(/Số hóa điều phối thiện nguyện trong nhà trường/i),
        ).toBeDefined();
        expect(
            screen.getByText(
                /Một mặt tiền số rõ ràng cho chiến dịch, đội nhóm và tác động cộng đồng./i,
            ),
        ).toBeDefined();
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

    it('navigates to public campaigns when clicking Xem chiến dịch in hero', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /xem chiến dịch/i }),
        );

        expect(navigate).toHaveBeenCalledWith(paths.campaigns.getHref());
    });

    it('navigates to login when clicking Khởi tạo chiến dịch in sidebar CTA', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /khởi tạo chiến dịch/i }),
        );

        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('renders highlighted campaign cards', () => {
        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Mùa hè xanh số/i)).toBeDefined();
        expect(screen.getByText(/Biển xanh cuối tuần/i)).toBeDefined();
        expect(screen.getByText(/Đường quê tiếp sức/i)).toBeDefined();
    });
});
