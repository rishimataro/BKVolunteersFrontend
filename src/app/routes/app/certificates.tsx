import { ContentLayout } from '@/components/layouts';
import { CertificateList } from '@/features/certificates/components/certificate-list';

export const CertificatesRoute = () => {
    return (
        <ContentLayout title="Chứng nhận">
            <CertificateList />
        </ContentLayout>
    );
};
