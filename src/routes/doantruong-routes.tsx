import type { RouteObject } from 'react-router';

import { paths } from '@/constants/paths';

export const doanTruongRoutes: RouteObject[] = [
    {
        path: paths.app.users.dataTransfer.path,
        lazy: () =>
            import('@/pages/doantruong/users-data-transfer').then((m) => ({
                Component: m.UserDataTransferRoute,
            })),
    },
    {
        path: paths.app.users.path,
        lazy: () =>
            import('@/pages/doantruong/users').then((m) => ({
                Component: m.UsersRoute,
            })),
    },
    {
        path: paths.app.auditLogs.path,
        lazy: () =>
            import('@/pages/doantruong/audit-logs').then((m) => ({
                Component: m.AuditLogsRoute,
            })),
    },
    {
        path: paths.app.backgroundJobs.path,
        lazy: () =>
            import('@/pages/doantruong/background-jobs').then((m) => ({
                Component: m.BackgroundJobsRoute,
            })),
    },
    {
        path: paths.app.certificateTemplates.path,
        lazy: () =>
            import('@/pages/doantruong/certificate-templates').then((m) => ({
                Component: m.CertificateTemplatesRoute,
            })),
    },
    {
        path: paths.app.adminOrganizations.path,
        lazy: () =>
            import('@/pages/doantruong/admin-organizations').then((m) => ({
                Component: m.AdminOrganizationsRoute,
            })),
    },
];
