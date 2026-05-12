import { api } from '@/lib/api-clients';

export type CertificateVerificationResult = {
    valid: boolean;
    certificate: {
        id: string;
        certificateNo: string;
        studentName: string;
        campaignTitle: string;
        organizationName: string;
        issuedAt: string;
        status: string;
    } | null;
};

export const verifyCertificate = (code: string) => {
    return api.get(
        `/public/certificates/verify/${encodeURIComponent(code)}`,
    ) as Promise<CertificateVerificationResult>;
};
