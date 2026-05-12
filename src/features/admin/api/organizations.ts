import { api } from '@/lib/api-clients';

export type AdminOrganization = {
    id: string;
    code: string;
    name: string;
    type: string;
    status: string;
    faculty: { id: string; name: string } | null;
    slug: string;
    description: string | null;
    createdAt: string;
};

export type CreateOrganizationInput = {
    code: string;
    name: string;
    type: string;
    faculty_id?: string;
    description?: string;
};

export type UpdateOrganizationInput = {
    code?: string;
    name?: string;
    type?: string;
    status?: string;
    faculty_id?: string;
    description?: string;
};

export const getAdminOrganizations = () => {
    return api.get('/admin/organizations') as Promise<AdminOrganization[]>;
};

export const createAdminOrganization = (data: CreateOrganizationInput) => {
    return api.post('/admin/organizations', data) as Promise<AdminOrganization>;
};

export const updateAdminOrganization = (
    id: string,
    data: UpdateOrganizationInput,
) => {
    return api.patch(
        `/admin/organizations/${id}`,
        data,
    ) as Promise<AdminOrganization>;
};

export const deleteAdminOrganization = (id: string) => {
    return api.delete(`/admin/organizations/${id}`) as Promise<void>;
};
