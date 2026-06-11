import { api } from '@/lib/api-clients';
import type { CampaignStatus, ModuleType } from '@/types/api';
import type {
    ManagedCampaignDetail,
    ManagedCampaignItem,
} from '@/features/campaign/types';
export type { ManagedCampaignDetail, ManagedCampaignItem };

export const getManagedCampaigns = async (params?: {
    q?: string;
    status?: CampaignStatus | '';
    review_status?: string;
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

export const updateManagedCampaign = (
    campaignId: string,
    payload: {
        title?: string;
        summary?: string;
        slogan?: string | null;
        description?: string | null;
        beneficiary?: string | null;
        start_at?: string;
        end_at?: string;
        cover_file_id?: string | null;
        logo_file_id?: string | null;
    },
) =>
    api.patch(`/campaigns/${campaignId}`, payload) as Promise<ManagedCampaignDetail>;

export const getManagedCampaignPreview = (id: string) =>
    api.get(`/campaigns/${id}/preview`) as Promise<ManagedCampaignDetail>;

export const deleteManagedCampaign = (id: string) =>
    api.delete(`/campaigns/${id}`) as Promise<void>;

export const createManagedCampaign = (payload: {
    title: string;
    summary: string;
    slogan?: string;
    description?: string;
    beneficiary?: string;
    cover_file_id: string;
    logo_file_id?: string;
    start_at: string;
    end_at: string;
    modules?: Array<{
        type: ModuleType | 'volunteer';
        title: string;
        description?: string;
        start_at: string;
        end_at: string;
        registration_start_at?: string;
        registration_end_at?: string;
        settings: Record<string, unknown>;
    }>;
    documents?: Array<{
        file_id: string;
        type: 'MASTER_PLAN' | 'BUDGET' | 'REGULATION' | 'OTHER';
        is_public?: boolean;
    }>;
    submit_for_review?: boolean;
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

export const extendManagedCampaign = (
    campaignId: string,
    payload: {
        module_id?: string;
        end_at: string;
        reason?: string;
        notify_participants?: boolean;
    },
) =>
    api.patch(`/campaigns/${campaignId}/extend`, payload) as Promise<ManagedCampaignDetail>;

export const endManagedCampaignEarly = (
    campaignId: string,
    payload: {
        module_id?: string;
        end_at?: string;
        reason?: string;
        note?: string;
        notify_participants?: boolean;
    },
) =>
    api.patch(`/campaigns/${campaignId}/end-early`, payload) as Promise<ManagedCampaignDetail>;

export const getCampaignCompletionReport = (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/completion-report`) as Promise<
        ManagedCampaignDetail['completion_report']
    >;

export const saveCampaignCompletionReport = (
    campaignId: string,
    payload: {
        title?: string;
        content: string;
        result_summary?: string;
        completed_tasks?: string[];
        volunteer_count?: number | null;
        verified_money_amount?: number | null;
        received_item_quantity?: number | null;
        challenges?: string | null;
        conclusion?: string | null;
        image_file_ids?: string[];
        submit?: boolean;
    },
) =>
    api.post(`/campaigns/${campaignId}/completion-report`, payload) as Promise<ManagedCampaignDetail>;

export const getOrganizerPaymentAccounts = () =>
    api.get('/campaigns/payment-accounts') as Promise<
        Array<{
            id: string;
            display_name: string;
            bank_name: string;
            account_number: string;
            account_holder_name: string;
            is_default: boolean;
        }>
    >;

export const getCampaignDocuments = (campaignId: string) =>
    api.get(`/campaigns/${campaignId}/documents`) as Promise<
        Array<{
            id: string;
            type: string;
            is_public: boolean;
            file_id: string;
            file_name: string;
            mime_type: string;
            size_bytes: number;
        }>
    >;

export const deleteCampaignDocument = (campaignId: string, documentId: string) =>
    api.delete(`/campaigns/${campaignId}/documents/${documentId}`) as Promise<void>;
