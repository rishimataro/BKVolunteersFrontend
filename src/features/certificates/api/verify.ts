import { api } from '@/lib/api-clients';

export type CertificateVerificationResult = {
    valid: boolean;
    certificate: {
        id: number;
        certificate_no: string;
        status: string;
        student_name?: string;
        campaign_title?: string;
        organization?: string;
        issued_at: string | null;
    } | null;
};

export const verifyCertificate = (code: string) => {
    return api.get(
        `/public/certificates/verify/${encodeURIComponent(code)}`,
    ) as Promise<CertificateVerificationResult>;
};
