import { api } from '@/lib/api-clients';

export type AdminOrganizationType = 'CLUB' | 'FACULTY';
export type AdminOrganizationStatus = 'ACTIVE' | 'INACTIVE';

export type AdminOrganization = {
    id: string;
    code: string;
    name: string;
    type: AdminOrganizationType;
    status: AdminOrganizationStatus;
    faculty: { id: string; name: string } | null;
    slug: string;
    description: string | null;
    created_at: string;
};

export type AdminOrganizationsQuery = {
    q?: string;
    type?: AdminOrganizationType;
    status?: AdminOrganizationStatus;
};

export type CreateOrganizationInput = {
    code?: string;
    name: string;
    type: AdminOrganizationType;
    status?: AdminOrganizationStatus;
    faculty_id?: string;
};

export type UpdateOrganizationInput = {
    code?: string;
    name?: string;
    type?: AdminOrganizationType;
    status?: AdminOrganizationStatus;
    faculty_id?: string;
};

export const getAdminOrganizations = async (
    query?: AdminOrganizationsQuery,
) => {
    const params = new URLSearchParams();
    if (query?.q) params.set('q', query.q);
    if (query?.type) params.set('type', query.type);
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    const result = (await api.get(
        `/admin/organizations${qs ? `?${qs}` : ''}`,
    )) as {
        items: AdminOrganization[];
    };
    return result.items;
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
