import { api } from '@/lib/api-clients';
import type {
    Meta,
    ModuleType,
    PublicCampaignCard,
    PublicCampaignDetail,
} from '@/types/api';

export type PublicCampaignFilters = {
    q?: string;
    organization_id?: string;
    module_type?: ModuleType | '';
    status?: 'PUBLISHED' | 'ONGOING' | '';
    page?: number;
    limit?: number;
};

type PaginatedResponse<T> = {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type PublicCampaignListResult = {
    items: PublicCampaignCard[];
    meta: Meta;
};

export const getPublicCampaigns = async (
    filters: PublicCampaignFilters = {},
): Promise<PublicCampaignListResult> => {
    const data = (await api.get('/public/campaigns', {
        params: filters,
    })) as PaginatedResponse<PublicCampaignCard>;
    return {
        items: data.items,
        meta: {
            page: data.pagination.page,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
            total_pages: data.pagination.totalPages,
        },
    };
};

export const getPublicCampaignDetail = async (
    slug: string,
): Promise<PublicCampaignDetail> => {
    const data = (await api.get(
        `/public/campaigns/${slug}`,
    )) as PublicCampaignDetail;
    return data;
};
