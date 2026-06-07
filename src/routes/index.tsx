import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';

import { paths } from '@/constants/paths';
import { DashboardLayout } from '@/layouts';
import { ProtectedRoute } from '@/features/auth';
import { doanTruongRoutes } from './doantruong-routes';
import { guestRoutes } from './guest-routes';
import { organizationRoutes } from './organization-routes';
import { sharedAppRoutes } from './shared-routes';
import { studentRoutes } from './student-routes';

export const AppRouter = () => {
    const router = createBrowserRouter([
        ...guestRoutes,
        {
            path: paths.app.root.path,
            element: (
                <ProtectedRoute>
                    <DashboardLayout>
                        <Outlet />
                    </DashboardLayout>
                </ProtectedRoute>
            ),
            children: [
                ...sharedAppRoutes,
                ...studentRoutes,
                ...organizationRoutes,
                ...doanTruongRoutes,
            ],
        },
        {
            path: '*',
            element: <Navigate to="/" />,
        },
    ]);

    return <RouterProvider router={router} />;
};
