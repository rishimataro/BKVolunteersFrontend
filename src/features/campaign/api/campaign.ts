import { api } from '@/lib/api-clients';
import type { CampaignStatus, ModuleType } from '@/types/api';
import type { ManagedCampaignDetail, ManagedCampaignItem } from '../types';
export type { ManagedCampaignDetail, ManagedCampaignItem };

export const getManagedCampaigns = async (params?: {
    q?: string;
    status?: CampaignStatus | '';
    module_type?: ModuleType | '';
    page?: number;
    limit?: number;
}) => {
    const res = (await api.get('/campaigns', { params })) as {
        items: ManagedCampaignItem[];
    };
    return res.items;
};

export const getManagedCampaignDetail = (id: string) =>
    api.get(`/campaigns/${id}`) as Promise<ManagedCampaignDetail>;

export const createManagedCampaign = (payload: {
    title: string;
    summary: string;
    description?: string;
    scope_type: 'FACULTY' | 'SCHOOL' | 'PUBLIC';
    start_at: string;
    end_at: string;
}) => api.post('/campaigns', payload) as Promise<{ id: string }>;

export const createCampaignModule = (
    campaignId: string,
    payload: {
        type: ModuleType;
        title: string;
        description?: string;
        start_at: string;
        end_at: string;
        settings: Record<string, unknown>;
    },
) =>
    api.post(`/campaigns/${campaignId}/modules`, payload) as Promise<{
        id: string;
    }>;

export const submitCampaignReview = (campaignId: string, note?: string) =>
    api.post(`/campaigns/${campaignId}/submit-review`, { note }) as Promise<{
        id: string;
        from_status: CampaignStatus;
        to_status: CampaignStatus;
    }>;

export const publishCampaign = (campaignId: string) =>
    api.post(`/campaigns/${campaignId}/publish`) as Promise<{
        id: string;
        status: CampaignStatus;
    }>;
