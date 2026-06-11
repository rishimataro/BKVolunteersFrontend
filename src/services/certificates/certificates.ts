import { api } from '@/lib/api-clients';
import { env } from '@/config/env';

export type CertificateItem = {
    id: string;
    certificateNo: string;
    campaignId: string;
    campaignTitle: string;
    moduleTitle: string | null;
    templateName: string;
    status: string;
    previewImageUrl: string | null;
    backgroundFileUrl: string | null;
    generatedFileUrl: string | null;
    signedFileUrl: string | null;
    snapshotJson: Record<string, unknown>;
    fileUrl: string | null;
    issuedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
};

const toAbsoluteFileUrl = (value: string | null) => {
    if (!value) return null;
    if (/^(https?:\/\/|data:)/i.test(value)) return value;
    const apiBase = env.API_URL.replace(/\/$/, '');
    return `${apiBase}${value.startsWith('/') ? value : `/${value}`}`;
};

const normalizeCertificate = (item: CertificateItem): CertificateItem => ({
    ...item,
    previewImageUrl: toAbsoluteFileUrl(item.previewImageUrl),
    backgroundFileUrl: toAbsoluteFileUrl(item.backgroundFileUrl),
    generatedFileUrl: toAbsoluteFileUrl(item.generatedFileUrl),
    signedFileUrl: toAbsoluteFileUrl(item.signedFileUrl),
    fileUrl: toAbsoluteFileUrl(item.fileUrl),
});

export const getMyCertificates = () => {
    return (
        api.get('/students/me/certificates') as Promise<CertificateItem[]>
    ).then((items) => items.map(normalizeCertificate));
};
