import { api } from '@/lib/api-clients';

export type CertificateItem = {
    id: string;
    certificateNo: string;
    campaignId: string;
    campaignTitle: string;
    moduleTitle: string | null;
    templateName: string;
    status: string;
    fileUrl: string | null;
    issuedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
};

export const getMyCertificates = () => {
    return api.get('/students/me/certificates') as Promise<CertificateItem[]>;
};
