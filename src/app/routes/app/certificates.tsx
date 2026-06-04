import { Navigate } from 'react-router';

import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import { CertificateList } from '@/features/certificates/components/certificate-list';

export const CertificatesRoute = () => {
    const user = useUser();
    const isStudent = user.data?.role === ROLES.SINHVIEN;

    if (!isStudent) {
        return <Navigate to={paths.app.dashboard.getHref()} replace />;
    }

    return <CertificateList />;
};
