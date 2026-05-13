export const paths = {
    home: {
        path: '/',
        getHref: () => '/',
    },
    campaigns: {
        path: '/campaigns',
        getHref: () => '/campaigns',
        detail: {
            path: '/campaigns/:slug',
            getHref: (slug: string) => `/campaigns/${slug}`,
        },
    },

    certificates: {
        verify: {
            path: '/certificates/verify',
            getHref: () => '/certificates/verify',
        },
    },

    organizations: {
        path: '/organizations',
        getHref: () => '/organizations',
        detail: {
            path: '/organizations/:slug',
            getHref: (slug: string) => `/organizations/${slug}`,
        },
    },

    auth: {
        register: {
            path: '/auth/register',
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
        },
        login: {
            path: '/auth/login',
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
        },
        forgotPassword: {
            path: '/auth/forgot-password',
            getHref: () => '/auth/forgot-password',
        },
        verifyCode: {
            path: '/auth/verify-code',
            getHref: () => '/auth/verify-code',
        },
        resetPassword: {
            path: '/auth/reset-password',
            getHref: () => '/auth/reset-password',
        },
        microsoftCallback: {
            path: '/auth/microsoft/callback',
            getHref: () => '/auth/microsoft/callback',
        },
        microsoftMockLogin: {
            path: '/auth/microsoft/mock-login',
            getHref: () => '/auth/microsoft/mock-login',
        },
    },

    app: {
        root: {
            path: '/app',
            getHref: () => '/app',
        },

        dashboard: {
            path: '',
            getHref: () => '/app',
        },
        campaigns: {
            path: 'campaigns',
            getHref: () => '/app/campaigns',
            detail: {
                path: 'campaigns/:slug',
                getHref: (slug: string) => `/app/campaigns/${slug}`,
            },
        },
        users: {
            path: 'users',
            getHref: () => '/app/users',
        },
        profile: {
            path: 'profile',
            getHref: () => '/app/profile',
        },
        settings: {
            path: 'settings',
            getHref: () => '/app/settings',
        },
        changePassword: {
            path: 'change-password',
            getHref: () => '/app/change-password',
        },
        myDonations: {
            path: 'my-donations',
            getHref: () => '/app/my-donations',
        },
        donate: {
            path: 'donate/:moduleId',
            getHref: (moduleId: string) => `/app/donate/${moduleId}`,
        },
        eventManagement: {
            path: 'events/:moduleId',
            getHref: (moduleId: string) => `/app/events/${moduleId}`,
        },
        certificates: {
            path: 'certificates',
            getHref: () => '/app/certificates',
            campaigns: {
                path: 'certificates/campaigns/:campaignId',
                getHref: (campaignId: string) =>
                    `/app/certificates/campaigns/${campaignId}`,
            },
        },
        certificateTemplates: {
            path: 'certificate-templates',
            getHref: () => '/app/certificate-templates',
        },
        adminOrganizations: {
            path: 'organizations',
            getHref: () => '/app/organizations',
        },
        orgSettings: {
            path: 'org-settings',
            getHref: () => '/app/org-settings',
        },
        auditLogs: {
            path: 'audit-logs',
            getHref: () => '/app/audit-logs',
        },
        backgroundJobs: {
            path: 'background-jobs',
            getHref: () => '/app/background-jobs',
        },
        reports: {
            path: 'reports',
            getHref: () => '/app/reports',
        },
    },
} as const;
