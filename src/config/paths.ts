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
        verifyEmail: {
            path: '/auth/verify-email',
            getHref: (token: string) => `/auth/verify-email?token=${token}`,
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
    },
} as const;
