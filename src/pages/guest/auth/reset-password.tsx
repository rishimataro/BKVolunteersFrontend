import { Navigate } from 'react-router';

import { paths } from '@/config/paths';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { canAccessPasswordReset } from '@/features/auth/lib/password-recovery';

export const ResetPasswordPage = () => {
    if (!canAccessPasswordReset()) {
        return <Navigate to={paths.auth.forgotPassword.getHref()} replace />;
    }

    return <ResetPasswordForm />;
};
