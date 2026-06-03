import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { UserDataTransferRoute } from '../users-data-transfer';

const getUserOptions = vi.fn();
const getUsers = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification: vi.fn(),
    }),
}));

vi.mock('@/features/auth', () => ({
    Authorization: ({ children }: { children: React.ReactNode }) => children,
    ROLES: {
        DOANTRUONG: 'DOANTRUONG',
    },
}));

vi.mock('@/features/users/api/users', () => ({
    getUserOptions: (...args: unknown[]) => getUserOptions(...args),
    getUsers: (...args: unknown[]) => getUsers(...args),
    createUser: vi.fn(),
}));

describe('UserDataTransferRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUserOptions.mockResolvedValue({
            faculties: [
                {
                    id: 1,
                    code: 'CNTT',
                    name: 'Khoa Công nghệ Thông tin',
                },
            ],
            clubs: [],
        });
        getUsers.mockResolvedValue({
            data: [
                {
                    id: 'user-1',
                    username: 'doantruong.admin',
                    email: 'doantruong@dut.udn.vn',
                    role: 'DOANTRUONG',
                    status: 'ACTIVE',
                    lastLoginAt: null,
                    createdAt: '2026-06-01T08:00:00.000Z',
                    updatedAt: '2026-06-01T08:00:00.000Z',
                    facultyId: null,
                    facultyName: null,
                    managedClubId: null,
                    managedClubName: null,
                    mssv: null,
                    fullName: 'Đoàn trường',
                    className: null,
                    phone: null,
                },
            ],
            meta: {
                total: 1,
                page: 1,
                limit: 8,
                totalPages: 1,
            },
        });
    });

    it('renders the import-export management screen', async () => {
        const queryClient = new QueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <UserDataTransferRoute />
                </MemoryRouter>
            </QueryClientProvider>,
        );

        await waitFor(() => {
            expect(
                screen.getByText('Nhập và xuất dữ liệu người dùng'),
            ).toBeTruthy();
        });

        expect(screen.getByText('Nhập dữ liệu')).toBeTruthy();
        expect(screen.getByText('Xuất dữ liệu')).toBeTruthy();
        expect(screen.getByText('Tải tệp dữ liệu người dùng')).toBeTruthy();
    });
});
