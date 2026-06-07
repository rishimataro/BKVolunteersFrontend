import type { RouteObject } from 'react-router';

import { paths } from '@/constants/paths';

export const organizationRoutes: RouteObject[] = [
    {
        path: paths.app.campaigns.preview.path,
        lazy: () =>
            import('@/pages/organization/campaign-preview').then((m) => ({
                Component: m.CampaignPreviewRoute,
            })),
    },
    {
        path: paths.app.eventManagement.path,
        lazy: () =>
            import('@/pages/organization/event-management').then((m) => ({
                Component: m.EventManagementRoute,
            })),
    },
    {
        path: paths.app.fundraisingManagement.path,
        lazy: () =>
            import('@/pages/organization/fundraising-management').then(
                (m) => ({
                    Component: m.FundraisingManagementRoute,
                }),
            ),
    },
    {
        path: paths.app.certificates.campaigns.path,
        lazy: () =>
            import('@/pages/organization/campaign-certificates').then((m) => ({
                Component: m.CampaignCertificatesRoute,
            })),
    },
    {
        path: paths.app.orgSettings.path,
        lazy: () =>
            import('@/pages/organization/org-settings').then((m) => ({
                Component: m.OrgSettingsRoute,
            })),
    },
];
