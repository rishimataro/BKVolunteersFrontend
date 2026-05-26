import { api } from '@/lib/api-clients';
import { env } from '@/config/env';

export type CampaignCertificate = {
    id: string;
    certificate_no: string;
    campaign_id: string;
    module_id: string | null;
    module_title: string | null;
    student_id: string;
    student_name: string;
    student_code: string;
    template_id: string;
    template_name: string;
    status: string;
    snapshot_json: unknown;
    file_url: string | null;
    file_hash: string | null;
    issued_at: string | null;
    revoked_at: string | null;
    revoked_by: string | null;
    revoke_reason: string | null;
    replacement_certificate_id: string | null;
    created_at: string;
    updated_at: string;
};

export type GenerateResult = {
    dry_run?: boolean;
    candidate_count?: number;
    created_count: number;
    items: CampaignCertificate[];
};

const toAbsoluteFileUrl = (value: string | null) => {
    if (!value) return null;
    if (/^(https?:\/\/|data:)/i.test(value)) return value;
    const apiBase = env.API_URL.replace(/\/$/, '');
    return `${apiBase}${value.startsWith('/') ? value : `/${value}`}`;
};

const normalizeCertificate = (
    item: CampaignCertificate,
): CampaignCertificate => ({
    ...item,
    file_url: toAbsoluteFileUrl(item.file_url),
});

export const listCampaignCertificates = (campaignId: string) => {
    return (
        api.get(`/certificates/campaigns/${campaignId}`) as Promise<
            CampaignCertificate[]
        >
    ).then((items) => items.map(normalizeCertificate));
};

export const generateCertificates = (
    campaignId: string,
    data: { template_id?: string; module_id?: string; dry_run?: boolean },
) => {
    return (
        api.post(
            `/certificates/campaigns/${campaignId}/generate`,
            data,
        ) as Promise<GenerateResult>
    ).then((result) => ({
        ...result,
        items: result.items.map(normalizeCertificate),
    }));
};

export const renderCertificate = (id: string) => {
    return api.post(`/certificates/${id}/render`) as Promise<{
        queued: boolean;
        certificate_id: string;
    }>;
};

export const getCertificateDownload = (id: string) => {
    return (
        api.get(`/certificates/${id}/download`) as Promise<{
            id: string;
            certificate_no: string;
            file_url: string | null;
            status: string;
        }>
    ).then((item) => ({
        ...item,
        file_url: toAbsoluteFileUrl(item.file_url),
    }));
};

export const revokeCertificate = (
    id: string,
    data?: { reason?: string; revoke_reason?: string },
) => {
    return (
        api.post(
            `/certificates/${id}/revoke`,
            data,
        ) as Promise<CampaignCertificate>
    ).then(normalizeCertificate);
};

export const reissueCertificate = (id: string) => {
    return (
        api.post(`/certificates/${id}/reissue`) as Promise<CampaignCertificate>
    ).then(normalizeCertificate);
};
