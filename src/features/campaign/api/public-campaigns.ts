import Axios from 'axios';

import { env } from '@/config/env';
import type {
    ApiSuccessResponse,
    Meta,
    ModuleType,
    PublicCampaignCard,
    PublicCampaignDetail,
} from '@/types/api';

const publicApi = Axios.create({
    baseURL: `${env.API_URL.replace(/\/$/, '')}/api/v1`,
});

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
    const response = await publicApi.get<
        ApiSuccessResponse<PublicCampaignCard[]>
    >('/public/campaigns', {
        params: filters,
    });

    return {
        items: response.data.data,
        meta:
            response.data.meta ??
            ({
                page: filters.page ?? 1,
                total: response.data.data.length,
                total_pages: 1,
            } satisfies Meta),
    };
};

export const getPublicCampaignDetail = async (
    slug: string,
): Promise<PublicCampaignDetail> => {
    const response = await publicApi.get<ApiSuccessResponse<PublicCampaignDetail>>(
        `/public/campaigns/${slug}`,
    );

    return response.data.data;
};
