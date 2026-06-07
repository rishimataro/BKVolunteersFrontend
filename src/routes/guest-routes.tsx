import { Navigate, type RouteObject } from 'react-router';

import { env } from '@/config/env';
import { paths } from '@/constants/paths';

export const guestRoutes: RouteObject[] = [
    {
        path: paths.home.path,
        lazy: async () => {
            const { LandingRoute } = await import('@/pages/guest/landing');
            return { Component: LandingRoute };
        },
    },
    {
        path: paths.campaigns.path,
        lazy: async () => {
            const { PublicCampaignsRoute } =
                await import('@/pages/guest/campaigns');
            return { Component: PublicCampaignsRoute };
        },
    },
    {
        path: paths.campaigns.detail.path,
        lazy: async () => {
            const { PublicCampaignDetailRoute } =
                await import('@/pages/shared/campaign-detail');
            return { Component: PublicCampaignDetailRoute };
        },
    },
    {
        path: paths.certificates.verify.path,
        lazy: async () => {
            const { CertificateVerifyRoute } =
                await import('@/pages/guest/certificates/verify');
            return { Component: CertificateVerifyRoute };
        },
    },
    {
        path: paths.organizations.path,
        lazy: async () => {
            const { OrganizationsRoute } =
                await import('@/pages/guest/organizations');
            return { Component: OrganizationsRoute };
        },
    },
    {
        path: paths.organizations.detail.path,
        lazy: async () => {
            const { OrganizationDetailRoute } =
                await import('@/pages/guest/organizations/slug');
            return { Component: OrganizationDetailRoute };
        },
    },
    {
        path: paths.auth.register.path,
        element: <Navigate to={paths.campaigns.getHref()} replace />,
    },
    {
        path: paths.auth.login.path,
        lazy: async () => {
            const { LoginPage } = await import('@/pages/guest/auth/login');
            return { Component: LoginPage };
        },
    },
    {
        path: paths.auth.forgotPassword.path,
        lazy: async () => {
            const { ForgotPasswordPage } = await import(
                '@/pages/guest/auth/forgot-password'
            );
            return { Component: ForgotPasswordPage };
        },
    },
    {
        path: paths.auth.verifyCode.path,
        lazy: async () => {
            const { VerifyCodePage } = await import(
                '@/pages/guest/auth/verify-code'
            );
            return { Component: VerifyCodePage };
        },
    },
    {
        path: paths.auth.resetPassword.path,
        lazy: async () => {
            const { ResetPasswordPage } = await import(
                '@/pages/guest/auth/reset-password'
            );
            return { Component: ResetPasswordPage };
        },
    },
    {
        path: paths.auth.microsoftCallback.path,
        lazy: async () => {
            const { MicrosoftCallbackPage } = await import(
                '@/pages/guest/auth/microsoft-callback'
            );
            return { Component: MicrosoftCallbackPage };
        },
    },
    ...(env.ENABLE_API_MOCKING
        ? [
              {
                  path: paths.auth.microsoftMockLogin.path,
                  lazy: async () => {
                      const { MicrosoftMockLoginPage } = await import(
                          '@/pages/guest/auth/microsoft-mock-login'
                      );
                      return { Component: MicrosoftMockLoginPage };
                  },
              } satisfies RouteObject,
          ]
        : []),
];
