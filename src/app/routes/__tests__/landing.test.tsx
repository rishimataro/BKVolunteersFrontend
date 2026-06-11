import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';

import { paths } from '@/config/paths';
import { getPublicHomeData } from '@/services/public/home';
import { LandingRoute } from '../landing';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@/services/public/home', () => ({
    getPublicHomeData: vi.fn(),
}));

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification: vi.fn(),
    }),
}));

const homeFixture = {
    metrics: {
        total_campaigns: 12,
        total_organizations: 8,
        total_students: 1200,
        total_certificates: 48,
        total_money_donations: 380000000,
        total_completed_event_hours: 9200,
    },
    featured_campaigns: [
        {
            id: 'campaign-1',
            slug: 'mua-he-xanh-so',
            title: 'Mùa hè xanh số',
            summary: 'Chiến dịch điều phối đội hình theo dữ liệu thật.',
            cover_image_url: null,
            organization: {
                id: 'org-1',
                code: 'CLB-1',
                name: 'CLB Công nghệ trẻ',
                type: 'CLUB',
                logo_url: null,
            },
            status: 'ONGOING' as const,
            start_at: '2026-06-01T00:00:00.000Z',
            end_at: '2026-07-01T00:00:00.000Z',
            module_types: ['event'] as const,
            progress: {
                percent: 72,
                modules: [],
            },
        },
        {
            id: 'campaign-2',
            slug: 'bien-xanh-cuoi-tuan',
            title: 'Biển xanh cuối tuần',
            summary: 'Làm sạch bờ biển với đăng ký và check-in thật.',
            cover_image_url: null,
            organization: {
                id: 'org-2',
                code: 'KHOA-2',
                name: 'Khoa Môi trường',
                type: 'FACULTY',
                logo_url: null,
            },
            status: 'PUBLISHED' as const,
            start_at: '2026-05-01T00:00:00.000Z',
            end_at: '2026-06-15T00:00:00.000Z',
            module_types: ['event', 'item_donation'] as const,
            progress: {
                percent: 44,
                modules: [],
            },
        },
        {
            id: 'campaign-3',
            slug: 'duong-que-tiep-suc',
            title: 'Đường quê tiếp sức',
            summary: 'Kết nối gây quỹ và báo cáo công trình nông thôn.',
            cover_image_url: null,
            organization: {
                id: 'org-3',
                code: 'LCD-3',
                name: 'Liên chi đoàn Xây dựng',
                type: 'FACULTY',
                logo_url: null,
            },
            status: 'ENDED' as const,
            start_at: '2026-03-01T00:00:00.000Z',
            end_at: '2026-04-01T00:00:00.000Z',
            module_types: ['fundraising'] as const,
            progress: {
                percent: 91,
                modules: [],
            },
        },
    ],
    organization_leaderboard: [
        {
            rank: 1,
            organization_id: 'org-1',
            organization_code: 'CNTT',
            organization_name: 'Khoa Khoa học và Kỹ thuật Máy tính',
            campaign_count: 4,
            completed_event_hours: 1200,
            verified_money_amount: 150000000,
            issued_certificates: 20,
        },
    ],
    spotlight_organizations: [
        {
            id: 'org-1',
            slug: 'khoa-khoa-hoc-va-ky-thuat-may-tinh',
            code: 'CNTT',
            name: 'Khoa Khoa học và Kỹ thuật Máy tính',
            type: 'FACULTY',
            campaign_count: 4,
            completed_event_hours: 1200,
        },
    ],
};

describe('LandingRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getPublicHomeData as Mock).mockResolvedValue(homeFixture);
    });

    it('renders correctly with logo and main titles', async () => {
        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        expect(screen.getByAltText(/BK Volunteers Logo/i)).toBeDefined();
        expect(screen.getAllByText(/BK Volunteers/i).length).toBeGreaterThan(0);
        expect(
            screen.getByText(/Số hóa điều phối tình nguyện trong nhà trường/i),
        ).toBeDefined();
        expect(
            screen.getByText(
                /Dữ liệu trên trang này được đồng bộ trực tiếp từ backend/i,
            ),
        ).toBeDefined();
        expect(await screen.findByText(/Mùa hè xanh số/i)).toBeDefined();
    });

    it('navigates to login when clicking Đăng nhập in header', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }));

        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('navigates to login when clicking Đăng nhập để vận hành in hero', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /đăng nhập để vận hành/i }),
        );

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

    it('navigates to login when clicking Đăng nhập để khởi tạo chiến dịch in sidebar CTA', () => {
        const navigate = vi.fn();
        (useNavigate as Mock).mockReturnValue(navigate);

        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: /đăng nhập để khởi tạo chiến dịch/i,
            }),
        );

        expect(navigate).toHaveBeenCalledWith(paths.auth.login.getHref());
    });

    it('renders highlighted campaign cards from backend data', async () => {
        render(
            <MemoryRouter>
                <LandingRoute />
            </MemoryRouter>,
        );

        expect(await screen.findByText(/Mùa hè xanh số/i)).toBeDefined();
        expect(screen.getByText(/Biển xanh cuối tuần/i)).toBeDefined();
        expect(screen.getByText(/Đường quê tiếp sức/i)).toBeDefined();
    });
});
