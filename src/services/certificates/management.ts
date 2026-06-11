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
    layout_json: unknown;
    background_file_url: string | null;
    preview_image_url: string | null;
    generated_file_url: string | null;
    signed_file_url: string | null;
    file_url: string | null;
    student_history_saved: boolean;
    file_hash: string | null;
    issued_at: string | null;
    revoked_at: string | null;
    revoked_by: string | null;
    revoke_reason: string | null;
    replacement_certificate_id: string | null;
    created_at: string;
    updated_at: string;
};

export type CertificateCandidate = CampaignCertificate & {
    student_email?: string | null;
    faculty_name?: string | null;
    class_name?: string | null;
    phone?: string | null;
    total_points?: number | null;
    titles?: string[];
    eligibility_source?: 'VOLUNTEER' | 'FUNDRAISING' | 'ITEM_DONATION';
    registration_id?: string | null;
    money_contribution_id?: string | null;
    item_contribution_id?: string | null;
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

const normalizeCertificate = <T extends { file_url: string | null }>(
    item: T,
): T => ({
    ...item,
    file_url: toAbsoluteFileUrl(item.file_url),
    preview_image_url: toAbsoluteFileUrl(
        (item as T & { preview_image_url?: string | null }).preview_image_url ??
            null,
    ),
    background_file_url: toAbsoluteFileUrl(
        (item as T & { background_file_url?: string | null })
            .background_file_url ?? null,
    ),
    generated_file_url: toAbsoluteFileUrl(
        (item as T & { generated_file_url?: string | null }).generated_file_url ??
            null,
    ),
    signed_file_url: toAbsoluteFileUrl(
        (item as T & { signed_file_url?: string | null }).signed_file_url ?? null,
    ),
});

export const listCampaignCertificates = (
    campaignId: string,
    params?: { module_id?: string },
) => {
    const query = new URLSearchParams();
    if (params?.module_id) {
        query.set('module_id', params.module_id);
    }
    const search = query.toString();
    return (
        api.get(
            search
                ? `/certificates/campaigns/${campaignId}?${search}`
                : `/certificates/campaigns/${campaignId}`,
        ) as Promise<
            CampaignCertificate[]
        >
    ).then((items) => items.map(normalizeCertificate));
};

export const previewCertificateCandidates = (
    campaignId: string,
    moduleId: string,
) => {
    const query = new URLSearchParams({
        module_id: moduleId,
    });
    return (
        api.get(
            `/certificates/campaigns/${campaignId}/candidates?${query.toString()}`,
        ) as Promise<CertificateCandidate[]>
    ).then((items) => items.map(normalizeCertificate));
};

export const generateCertificates = (
    campaignId: string,
    data: {
        template_id?: string;
        module_id?: string;
        dry_run?: boolean;
        student_ids?: string[];
    },
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

export const attachRenderedCertificateFiles = (
    id: string,
    data: {
        preview_image_file_id?: string;
        generated_file_id?: string;
        signed_file_id?: string;
        checksum_sha256?: string;
    },
) => {
    return (
        api.patch(
            `/certificates/${id}/rendered-files`,
            data,
        ) as Promise<CampaignCertificate>
    ).then(normalizeCertificate);
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
