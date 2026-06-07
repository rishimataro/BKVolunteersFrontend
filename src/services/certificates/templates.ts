import { api } from '@/lib/api-clients';

export type CertificateTemplateStatus = 'ACTIVE' | 'INACTIVE';

export type CertificateTemplate = {
    id: string;
    name: string;
    type: string;
    file_url: string | null;
    layout_json: Record<string, unknown> | null;
    status: CertificateTemplateStatus;
    is_locked: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateTemplateInput = {
    name: string;
    type: string;
    file_url?: string | null;
    layout_json?: Record<string, unknown> | null;
};

export type UpdateTemplateInput = {
    name?: string;
    type?: string;
    file_url?: string | null;
    layout_json?: Record<string, unknown> | null;
    status?: CertificateTemplateStatus;
};

export const getTemplates = () => {
    return api.get('/certificates/templates') as Promise<CertificateTemplate[]>;
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
