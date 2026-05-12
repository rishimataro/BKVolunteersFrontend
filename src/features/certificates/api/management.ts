import { api } from '@/lib/api-clients';

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
    created_count: number;
    items: CampaignCertificate[];
};

export const listCampaignCertificates = (campaignId: string) => {
    return api.get(`/certificates/campaigns/${campaignId}`) as Promise<
        CampaignCertificate[]
    >;
};

export const generateCertificates = (
    campaignId: string,
    data: { template_id?: string; module_id?: string },
) => {
    return api.post(
        `/certificates/campaigns/${campaignId}/generate`,
        data,
    ) as Promise<GenerateResult>;
};

export const renderCertificate = (id: string) => {
    return api.post(`/certificates/${id}/render`) as Promise<{
        queued: boolean;
        certificate_id: string;
    }>;
};

export const getCertificateDownload = (id: string) => {
    return api.get(`/certificates/${id}/download`) as Promise<{
        id: string;
        certificate_no: string;
        file_url: string | null;
        status: string;
    }>;
};

export const revokeCertificate = (
    id: string,
    data?: { reason?: string; revoke_reason?: string },
) => {
    return api.post(
        `/certificates/${id}/revoke`,
        data,
    ) as Promise<CampaignCertificate>;
};

export const reissueCertificate = (id: string) => {
    return api.post(
        `/certificates/${id}/reissue`,
    ) as Promise<CampaignCertificate>;
};
