import { http, HttpResponse } from 'msw';
import { env } from '@/config/env';

const apiUrl = env.API_URL.replace(/\/$/, '');

const handlers = [
    // --- Auth ---
    http.get(`${apiUrl}/api/v1/auth/me`, ({ request }) => {
        const authToken = request.headers.get('Authorization');
        if (!authToken || authToken === 'Bearer null') {
            return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            createdAt: Date.now(),
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/login`, () => {
        return HttpResponse.json({
            user: {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                createdAt: Date.now(),
            },
            accessToken: 'mock-token',
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/signup`, () => {
        return HttpResponse.json({
            user: {
                id: '2',
                username: 'newuser',
                email: 'newuser@example.com',
                firstName: 'New',
                lastName: 'User',
                role: 'USER',
                createdAt: Date.now(),
            },
            accessToken: 'mock-new-token',
        });
    }),

    http.post(`${apiUrl}/api/v1/auth/logout`, () => {
        return new HttpResponse(null, { status: 200 });
    }),

    http.post(`${apiUrl}/api/v1/auth/refresh`, () => {
        return HttpResponse.json({
            accessToken: 'mock-refreshed-token',
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
