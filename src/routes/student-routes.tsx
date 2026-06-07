import type { RouteObject } from 'react-router';

import { paths } from '@/constants/paths';

export const studentRoutes: RouteObject[] = [
    {
        path: paths.app.campaigns.registration.path,
        lazy: () =>
            import('@/pages/student/campaign-registration').then((m) => ({
                Component: m.CampaignRegistrationRoute,
            })),
    },
    {
        path: paths.app.certificates.path,
        lazy: () =>
            import('@/pages/student/certificates').then((m) => ({
                Component: m.CertificatesRoute,
            })),
    },
    {
        path: paths.app.myImpact.path,
        lazy: () =>
            import('@/pages/student/my-impact').then((m) => ({
                Component: m.MyImpactRoute,
            })),
    },
    {
        path: paths.app.myDonations.path,
        lazy: () =>
            import('@/pages/student/my-donations').then((m) => ({
                Component: m.MyDonationsRoute,
            })),
    },
    {
        path: paths.app.donate.path,
        lazy: () =>
            import('@/pages/student/donate').then((m) => ({
                Component: m.DonateRoute,
            })),
    },
    {
        path: paths.app.donationPayment.path,
        lazy: () =>
            import('@/pages/student/donation-payment').then((m) => ({
                Component: m.DonationPaymentRoute,
            })),
    },
];
