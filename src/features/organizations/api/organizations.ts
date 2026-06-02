import { api } from '@/lib/api-clients';

export type OrganizationCard = {
    id: string;
    code: string;
    name: string;
    type: string;
    slug: string;
    logo_url: string | null;
    description: string | null;
    faculty: { id: string; name: string } | null;
    status: string;
};

export type OrganizationDetail = OrganizationCard & {
    campaigns: Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        status: string;
        start_at: string;
        end_at: string;
        cover_image_url: string | null;
        module_types: string[];
    }>;
};

export const listOrganizations = async (): Promise<OrganizationCard[]> => {
    const data = (await api.get('/organizations')) as {
        items: OrganizationCard[];
    };
    return data.items ?? [];
};

export const getOrganizationBySlug = (slug: string) => {
    return api.get(
        `/organizations/${encodeURIComponent(slug)}`,
    ) as Promise<OrganizationDetail>;
};
