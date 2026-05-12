import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';

const apiUrl = env.API_URL.replace(/\/$/, '');

const mockAccount = {
    id: '1',
    account_type: 'OPERATOR',
    email: 'admin@dut.udn.vn',
    full_name: 'School Admin',
    role: 'SCHOOL_ADMIN',
    createdAt: Date.now(),
};

const mockCampaign = {
    id: '1',
    slug: 'xuan-tinh-nguyen-2026',
    title: 'Xuan tinh nguyen 2026',
    summary:
        'Chuong trinh ho tro sinh vien va cong dong co hoan canh kho khan.',
    description:
        'Chuong trinh ket hop gay quy, quyen gop hien vat va tuyen tinh nguyen vien.',
    cover_image_url: null,
    organization: {
        id: '2',
        code: 'LCD-CNTT',
        name: 'Lien chi Doan Khoa CNTT',
        type: 'faculty_union',
        logo_url: null,
    },
    module_types: ['fundraising', 'item_donation', 'event'],
    status: 'ONGOING',
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    progress: {
        percent: 25,
        modules: [
            {
                type: 'fundraising',
                current: 2500000,
                target: 10000000,
                percent: 25,
            },
            { type: 'item_donation', current: 10, target: 50, percent: 20 },
            { type: 'event', current: 12, target: 40, percent: 30 },
        ],
    },
};

const handlers = [
    // --- Auth ---
    http.get(`${apiUrl}/api/v1/auth/me`, ({ request }) => {
        const authToken = request.headers.get('Authorization');
        if (!authToken || authToken === 'Bearer null') {
            return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({
            success: true,
            message: 'OK',
            data: mockAccount,
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/login`, () => {
        return HttpResponse.json({
            success: true,
            message: 'OK',
            data: {
                account: mockAccount,
                access_token: 'mock-token',
                refresh_token: 'mock-refresh-token',
            },
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/signup`, () => {
        return HttpResponse.json({
            user: {
                id: '2',
                account_type: 'STUDENT',
                email: '102220001@sv1.dut.udn.vn',
                full_name: 'Nguyen Van An',
                role: 'STUDENT',
                createdAt: Date.now(),
            },
            accessToken: 'mock-new-token',
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/logout`, () => {
        return HttpResponse.json({
            success: true,
            message: 'OK',
            data: null,
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/refresh`, () => {
        return HttpResponse.json({
            success: true,
            message: 'OK',
            data: {
                access_token: 'mock-refreshed-token',
                refresh_token: 'mock-refresh-token',
            },
        });
    }),

    // --- Public campaigns ---
    http.get(`${apiUrl}/api/v1/public/campaigns`, () => {
        return HttpResponse.json({
            success: true,
            message: 'OK',
            data: [mockCampaign],
            meta: {
                page: 1,
                limit: 9,
                total: 1,
                total_pages: 1,
            },
        });
    }),

    http.get(`${apiUrl}/api/v1/public/campaigns/:slug`, () => {
        return HttpResponse.json({
            success: true,
            message: 'OK',
            data: {
                ...mockCampaign,
                beneficiary: 'Sinh vien va cong dong',
                scope_type: 'public',
                published_at: new Date().toISOString(),
                modules: [
                    {
                        id: 'm1',
                        type: 'fundraising',
                        title: 'Gay quy hien kim',
                        description: 'Nhan ung ho qua chuyen khoan.',
                        status: 'OPEN',
                        start_at: mockCampaign.start_at,
                        end_at: mockCampaign.end_at,
                        settings: { target_amount: 10000000 },
                        progress: mockCampaign.progress.modules[0],
                        cta: {
                            enabled: true,
                            label: 'Ung ho hien kim',
                            action: 'fundraising.donate',
                        },
                    },
                    {
                        id: 'm2',
                        type: 'item_donation',
                        title: 'Quyen gop hien vat',
                        description: 'Nhan sach vo va nhu yeu pham.',
                        status: 'OPEN',
                        start_at: mockCampaign.start_at,
                        end_at: mockCampaign.end_at,
                        settings: {},
                        progress: mockCampaign.progress.modules[1],
                        cta: {
                            enabled: true,
                            label: 'Dang ky dong gop hien vat',
                            action: 'item_donation.pledge',
                        },
                    },
                    {
                        id: 'm3',
                        type: 'event',
                        title: 'Tuyen tinh nguyen vien',
                        description: 'Dang ky tham gia ho tro chuong trinh.',
                        status: 'OPEN',
                        start_at: mockCampaign.start_at,
                        end_at: mockCampaign.end_at,
                        settings: {},
                        progress: mockCampaign.progress.modules[2],
                        cta: {
                            enabled: true,
                            label: 'Dang ky tinh nguyen',
                            action: 'event.register',
                        },
                    },
                ],
            },
        });
    }),

    // --- Password ---
    http.post(`${apiUrl}/api/v1/password/forgot-password`, () => {
        return HttpResponse.json({
            message: 'Email khôi phục mật khẩu đã được gửi.',
        });
    }),

    http.post(`${apiUrl}/api/v1/password/reset-password/:token`, () => {
        return HttpResponse.json({
            message: 'Mật khẩu đã được đặt lại thành công.',
        });
    }),

    // --- Email Verification ---
    http.post(`${apiUrl}/api/v1/verify-email/send-verification-email`, () => {
        return HttpResponse.json({
            message: 'Email xác minh đã được gửi.',
        });
    }),

    http.get(`${apiUrl}/api/v1/verify-email/:token`, () => {
        return HttpResponse.json({
            message: 'Email đã được xác minh thành công.',
        });
    }),
];

export const enableMocking = async () => {
    if (!env.ENABLE_API_MOCKING || typeof window === 'undefined') {
        return;
    }
    const { setupWorker } = await import('msw/browser');
    const worker = setupWorker(...handlers);
    return worker.start({
        onUnhandledRequest: 'bypass',
    });
};
