import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
    Outlet,
} from 'react-router';

import { DashboardLayout } from '@/components/layouts';
import { paths } from '@/config/paths';
import { ProtectedRoute } from '@/features/auth';

export const AppRouter = () => {
    const router = createBrowserRouter([
        {
            path: '/',
            lazy: async () => {
                const { LandingRoute } = await import('./routes/landing');
                return { Component: LandingRoute };
            },
        },
        {
            path: paths.campaigns.path,
            lazy: async () => {
                const { PublicCampaignsRoute } =
                    await import('./routes/campaigns');
                return { Component: PublicCampaignsRoute };
            },
        },
        {
            path: paths.campaigns.detail.path,
            lazy: async () => {
                const { PublicCampaignDetailRoute } =
                    await import('./routes/campaign-detail');
                return { Component: PublicCampaignDetailRoute };
            },
        },
        {
            path: paths.auth.login.path,
            lazy: async () => {
                const { LoginPage } = await import('./routes/auth/login');
                return { Component: LoginPage };
            },
        },
        {
            path: paths.auth.forgotPassword.path,
            lazy: async () => {
                const { ForgotPasswordPage } =
                    await import('./routes/auth/forgot-password');
                return { Component: ForgotPasswordPage };
            },
        },
        {
            path: paths.auth.verifyCode.path,
            lazy: async () => {
                const { VerifyCodePage } =
                    await import('./routes/auth/verify-code');
                return { Component: VerifyCodePage };
            },
        },
        {
            path: paths.auth.resetPassword.path,
            lazy: async () => {
                const { ResetPasswordPage } =
                    await import('./routes/auth/reset-password');
                return { Component: ResetPasswordPage };
            },
        },
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
                {
                    index: true,
                    lazy: () =>
                        import('@/app/routes/app/dashboard.tsx').then((m) => ({
                            Component: m.DashboardRoute,
                        })),
                },
                {
                    path: paths.app.users.path,
                    lazy: () =>
                        import('@/app/routes/app/users.tsx').then((m) => ({
                            Component: m.UsersRoute,
                        })),
                },
                {
                    path: paths.app.profile.path,
                    lazy: () =>
                        import('@/app/routes/app/profile.tsx').then((m) => ({
                            Component: m.ProfileRoute,
                        })),
                },
                {
                    path: paths.app.campaigns.path,
                    lazy: () =>
                        import('@/app/routes/app/campaigns.tsx').then((m) => ({
                            Component: m.CampaignsRoute,
                        })),
                },
                {
                    path: paths.app.campaigns.detail.path,
                    lazy: () =>
                        import('@/app/routes/app/campaign-detail.tsx').then(
                            (m) => ({
                                Component: m.AppCampaignDetailRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.settings.path,
                    lazy: () =>
                        import('@/app/routes/app/settings.tsx').then((m) => ({
                            Component: m.SettingsRoute,
                        })),
                },
            ],
        },
        {
            path: '*',
            element: <Navigate to="/" />,
        },
    ]);

    return <RouterProvider router={router} />;
};
