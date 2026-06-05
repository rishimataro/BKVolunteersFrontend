import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { UsersRoute } from '../users';

const addNotification = vi.fn();
const mockUseUser = vi.fn();
const getUsers = vi.fn();
const getUserOptions = vi.fn();
const updateUserStatus = vi.fn();

vi.mock('@/components/ui/notifications', () => ({
    useNotifications: () => ({
        addNotification,
    }),
}));

vi.mock('@/features/auth', () => ({
    ROLES: {
        SINHVIEN: 'SINHVIEN',
        CLB: 'CLB',
        LCD: 'LCD',
        DOANTRUONG: 'DOANTRUONG',
    },
    useUser: () => mockUseUser(),
    Authorization: ({
        allowedRoles,
        children,
        forbiddenFallback,
    }: {
        allowedRoles: string[];
        children: ReactNode;
        forbiddenFallback?: ReactNode;
    }) => {
        const user = mockUseUser();
        return allowedRoles.includes(user.data?.role)
            ? children
            : forbiddenFallback;
    },
}));

vi.mock('@/features/users/api/users', () => ({
    getUsers: (...args: unknown[]) => getUsers(...args),
    getUserOptions: () => getUserOptions(),
    updateUserStatus: (...args: unknown[]) => updateUserStatus(...args),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
}));

const buildQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

const renderRoute = () =>
    render(
        <QueryClientProvider client={buildQueryClient()}>
            <MemoryRouter>
                <UsersRoute />
            </MemoryRouter>
        </QueryClientProvider>,
    );

describe('UsersRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUserOptions.mockResolvedValue({
            faculties: [],
            clubs: [],
        });
        getUsers.mockResolvedValue({
            data: [
                {
                    id: 'admin-1',
                    username: 'doantruong',
                    email: 'doantruong@dut.udn.vn',
                    role: 'DOANTRUONG',
                    status: 'ACTIVE',
                    lastLoginAt: '2026-06-05T08:30:00.000Z',
                    createdAt: '2026-06-01T08:00:00.000Z',
                    updatedAt: '2026-06-05T08:30:00.000Z',
                    facultyId: null,
                    facultyName: null,
                    managedClubId: null,
                    managedClubName: null,
                    mssv: null,
                    fullName: 'Đoàn Trường',
                    className: null,
                    phone: null,
                },
                {
                    id: 'student-2',
                    username: '2021601002',
                    email: 'student2@sv.dut.udn.vn',
                    role: 'SINHVIEN',
                    status: 'ACTIVE',
                    lastLoginAt: '2026-06-04T12:00:00.000Z',
                    createdAt: '2026-06-01T08:00:00.000Z',
                    updatedAt: '2026-06-05T08:30:00.000Z',
                    facultyId: 1,
                    facultyName: 'Công nghệ thông tin',
                    managedClubId: null,
                    managedClubName: null,
                    mssv: '2021601002',
                    fullName: 'Nguyễn Sinh Viên',
                    className: '20TCLC',
                    phone: '0901234567',
                },
            ],
            meta: {
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            },
        });
        updateUserStatus.mockResolvedValue({
            id: 'student-2',
            status: 'LOCKED',
        });
    });

    it('renders forbidden fallback for non-school-board accounts', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: 'student-2',
                role: 'SINHVIEN',
            },
        });

        renderRoute();

        expect(
            await screen.findByText(
                /Chỉ tài khoản Đoàn trường mới được phép quản lý người dùng/i,
            ),
        ).toBeTruthy();
    });

    it('disables lock action for the current admin row', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: 'admin-1',
                role: 'DOANTRUONG',
            },
        });

        renderRoute();

        await screen.findByText('Nguyễn Sinh Viên');

        expect(
            (
                screen.getByRole('button', {
                    name: 'Không thể khóa chính bạn',
                }) as HTMLButtonElement
            ).disabled,
        ).toBe(true);
    });

    it('confirms and locks another account through the status API', async () => {
        mockUseUser.mockReturnValue({
            data: {
                id: 'admin-1',
                role: 'DOANTRUONG',
            },
        });

        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderRoute();

        await screen.findByText('Nguyễn Sinh Viên');

        fireEvent.click(screen.getByRole('button', { name: 'Khóa tài khoản' }));

        await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalled();
            expect(updateUserStatus).toHaveBeenCalledWith(
                'student-2',
                'LOCKED',
            );
        });

        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Đã cập nhật trạng thái',
            }),
        );

        confirmSpy.mockRestore();
    });
});
