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
            path: paths.certificates.verify.path,
            lazy: async () => {
                const { CertificateVerifyRoute } =
                    await import('./routes/certificates/verify');
                return { Component: CertificateVerifyRoute };
            },
        },
        {
            path: paths.organizations.path,
            lazy: async () => {
                const { OrganizationsRoute } =
                    await import('./routes/organizations');
                return { Component: OrganizationsRoute };
            },
        },
        {
            path: paths.organizations.detail.path,
            lazy: async () => {
                const { OrganizationDetailRoute } =
                    await import('./routes/organizations/slug');
                return { Component: OrganizationDetailRoute };
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
            path: paths.auth.microsoftCallback.path,
            lazy: async () => {
                const { MicrosoftCallbackPage } =
                    await import('./routes/auth/microsoft-callback');
                return { Component: MicrosoftCallbackPage };
            },
        },
        {
            path: paths.auth.microsoftMockLogin.path,
            lazy: async () => {
                const { MicrosoftMockLoginPage } =
                    await import('./routes/auth/microsoft-mock-login');
                return { Component: MicrosoftMockLoginPage };
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
                {
                    path: paths.app.certificates.path,
                    lazy: () =>
                        import('@/app/routes/app/certificates.tsx').then(
                            (m) => ({
                                Component: m.CertificatesRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.myDonations.path,
                    lazy: () =>
                        import('@/app/routes/app/my-donations.tsx').then(
                            (m) => ({
                                Component: m.MyDonationsRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.donate.path,
                    lazy: () =>
                        import('@/app/routes/app/donate.tsx').then((m) => ({
                            Component: m.DonateRoute,
                        })),
                },
                {
                    path: paths.app.eventManagement.path,
                    lazy: () =>
                        import('@/app/routes/app/event-management.tsx').then(
                            (m) => ({
                                Component: m.EventManagementRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.certificates.campaigns.path,
                    lazy: () =>
                        import('@/app/routes/app/campaign-certificates.tsx').then(
                            (m) => ({
                                Component: m.CampaignCertificatesRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.auditLogs.path,
                    lazy: () =>
                        import('@/app/routes/app/audit-logs.tsx').then((m) => ({
                            Component: m.AuditLogsRoute,
                        })),
                },
                {
                    path: paths.app.backgroundJobs.path,
                    lazy: () =>
                        import('@/app/routes/app/background-jobs.tsx').then(
                            (m) => ({
                                Component: m.BackgroundJobsRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.reports.path,
                    lazy: () =>
                        import('@/app/routes/app/reports.tsx').then((m) => ({
                            Component: m.ReportsRoute,
                        })),
                },
                {
                    path: paths.app.certificateTemplates.path,
                    lazy: () =>
                        import('@/app/routes/app/certificate-templates.tsx').then(
                            (m) => ({
                                Component: m.CertificateTemplatesRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.adminOrganizations.path,
                    lazy: () =>
                        import('@/app/routes/app/admin-organizations.tsx').then(
                            (m) => ({
                                Component: m.AdminOrganizationsRoute,
                            }),
                        ),
                },
                {
                    path: paths.app.orgSettings.path,
                    lazy: () =>
                        import('@/app/routes/app/org-settings.tsx').then(
                            (m) => ({
                                Component: m.OrgSettingsRoute,
                            }),
                        ),
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
