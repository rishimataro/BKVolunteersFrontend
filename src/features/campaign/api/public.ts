import { api } from '@/lib/api-clients';
import type {
    ApiSuccessResponse,
    Meta,
    ModuleType,
    PublicCampaignCard,
    PublicCampaignDetail,
} from '@/types/api';

export type PublicCampaignFilters = {
    q?: string;
    module_type?: ModuleType | '';
    status?: 'PUBLISHED' | 'ONGOING' | '';
    page?: number;
    limit?: number;
};

export type PublicCampaignListResult = {
    items: PublicCampaignCard[];
    meta: Meta;
};

export const getPublicCampaigns = async (
    filters: PublicCampaignFilters = {},
): Promise<PublicCampaignListResult> => {
    const response = await api.get<ApiSuccessResponse<PublicCampaignCard[]>>(
        '/public/campaigns',
        {
            params: filters,
        },
    );
    const data = response as unknown as ApiSuccessResponse<
        PublicCampaignCard[]
    >;
    return {
        items: data.data,
        meta:
            data.meta ??
            ({
                page: filters.page ?? 1,
                total: data.data.length,
                total_pages: 1,
            } satisfies Meta),
    };
};

export const getPublicCampaignDetail = async (
    slug: string,
): Promise<PublicCampaignDetail> => {
    const response = await api.get<ApiSuccessResponse<PublicCampaignDetail>>(
        `/public/campaigns/${slug}`,
    );
    const data =
        response as unknown as ApiSuccessResponse<PublicCampaignDetail>;
    return data.data;
};
