import { api } from '@/lib/api-clients';

export type CertificateTemplate = {
    id: string;
    name: string;
    type: string;
    status: string;
    created_at: string;
};

export type CreateTemplateInput = {
    name: string;
    type: string;
};

export type UpdateTemplateInput = {
    name?: string;
    type?: string;
    status?: string;
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

export const deleteTemplate = (id: string) => {
    return api.delete(`/certificates/templates/${id}`) as Promise<void>;
};
