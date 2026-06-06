import type { RouteObject } from 'react-router';

import { paths } from '@/constants/paths';

export const sharedAppRoutes: RouteObject[] = [
    {
        index: true,
        lazy: () =>
            import('@/pages/shared/dashboard').then((m) => ({
                Component: m.DashboardRoute,
            })),
    },
    {
        path: paths.app.profile.path,
        lazy: () =>
            import('@/pages/shared/profile').then((m) => ({
                Component: m.ProfileRoute,
            })),
    },
    {
        path: paths.app.storageTest.path,
        lazy: () =>
            import('@/pages/shared/storage-test').then((m) => ({
                Component: m.StorageTestRoute,
            })),
    },
    {
        path: paths.app.campaigns.path,
        lazy: () =>
            import('@/pages/shared/campaigns').then((m) => ({
                Component: m.CampaignsRoute,
            })),
    },
    {
        path: paths.app.campaigns.create.path,
        lazy: () =>
            import('@/pages/shared/campaigns').then((m) => ({
                Component: m.CampaignCreateRoute,
            })),
    },
    {
        path: paths.app.campaigns.detail.path,
        lazy: () =>
            import('@/pages/shared/campaign-detail').then((m) => ({
                Component: m.AppCampaignDetailRoute,
            })),
    },
    {
        path: paths.app.settings.path,
        lazy: () =>
            import('@/pages/shared/settings').then((m) => ({
                Component: m.SettingsRoute,
            })),
    },
    {
        path: paths.app.changePassword.path,
        lazy: () =>
            import('@/pages/shared/change-password').then((m) => ({
                Component: m.ChangePasswordRoute,
            })),
    },
    {
        path: paths.app.notifications.path,
        lazy: () =>
            import('@/pages/shared/notifications').then((m) => ({
                Component: m.NotificationsRoute,
            })),
    },
    {
        path: paths.app.reports.path,
        lazy: () =>
            import('@/pages/shared/reports').then((m) => ({
                Component: m.ReportsRoute,
            })),
    },
];
