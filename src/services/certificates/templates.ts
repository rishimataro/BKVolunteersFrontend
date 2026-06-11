import { api } from '@/lib/api-clients';

export type CertificateTemplateStatus = 'ACTIVE' | 'INACTIVE';

export type CertificateTemplate = {
    id: string;
    name: string;
    type: string;
    file_url: string | null;
    background_file_id?: string | null;
    layout_json: Record<string, unknown> | null;
    digital_signature_enabled?: boolean;
    status: CertificateTemplateStatus;
    is_locked: boolean;
    created_by: string | null;
    policies?: Array<{
        id: string;
        campaign_id: string | null;
        module_id: string | null;
        certificate_type: string;
    }>;
    created_at: string;
    updated_at: string;
};

export type CreateTemplateInput = {
    name: string;
    type: string;
    file_url?: string | null;
    layout_json?: Record<string, unknown> | null;
    background_file_id?: string | null;
    module_id?: string | null;
    campaign_id?: string | null;
    digital_signature_enabled?: boolean;
};

export type UpdateTemplateInput = {
    name?: string;
    type?: string;
    file_url?: string | null;
    layout_json?: Record<string, unknown> | null;
    background_file_id?: string | null;
    digital_signature_enabled?: boolean;
    status?: CertificateTemplateStatus;
};

export const getTemplates = (params?: {
    module_id?: string;
    campaign_id?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.module_id) {
        query.set('module_id', params.module_id);
    }
    if (params?.campaign_id) {
        query.set('campaign_id', params.campaign_id);
    }
    const search = query.toString();
    const path = search
        ? `/certificates/templates?${search}`
        : '/certificates/templates';
    return api.get(path) as Promise<CertificateTemplate[]>;
};

export const createTemplate = (data: CreateTemplateInput) => {
    return api.post(
        '/certificates/templates',
        data,
    ) as Promise<CertificateTemplate>;
};

export const updateTemplate = (id: string, data: UpdateTemplateInput) => {
    return api.patch(
        `/certificates/templates/${id}`,
        data,
    ) as Promise<CertificateTemplate>;
};

export const deactivateTemplate = (id: string) => {
    return api.delete(`/certificates/templates/${id}`) as Promise<void>;
};
