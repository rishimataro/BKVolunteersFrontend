import { Navigate } from 'react-router';

import { paths } from '@/config/paths';
import { VerifyCodeForm } from '@/features/auth/components/verify-code';
import { hasPasswordRecoveryRequest } from '@/features/auth/lib/password-recovery';

export const VerifyCodePage = () => {
    if (!hasPasswordRecoveryRequest()) {
        return <Navigate to={paths.auth.forgotPassword.getHref()} replace />;
    }

    return <VerifyCodeForm />;
};
