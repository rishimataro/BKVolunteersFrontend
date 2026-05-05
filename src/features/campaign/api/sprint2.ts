import { api } from '@/lib/api-clients';
import type {
    CampaignStatus,
    ModuleStatus,
    ModuleType,
    DonationStatus,
} from '@/types/api';

export type ManagedCampaignItem = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    status: CampaignStatus;
    organization_id: string;
    start_at: string;
    end_at: string;
    module_types?: ModuleType[];
};

export type ManagedCampaignDetail = {
    id: string;
    organization_id: string;
    slug: string;
    title: string;
    summary: string;
    description?: string | null;
    cover_image_url?: string | null;
    beneficiary?: string | null;
    scope_type: 'FACULTY' | 'SCHOOL' | 'PUBLIC';
    status: CampaignStatus;
    start_at: string;
    end_at: string;
    published_at?: string | null;
    modules: Array<{
        id: string;
        type: ModuleType;
        title: string;
        description?: string | null;
        status: ModuleStatus;
        start_at: string;
        end_at: string;
        settings: Record<string, unknown>;
    }>;
    reviews?: Array<{
        id: string;
        module_id?: string | null;
        body: string;
        visibility: string;
        created_at: string;
    }>;
};

export type ApprovalQueueItem = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    status: CampaignStatus;
    organization: {
        id: string;
        code: string;
        name: string;
        type: string;
    };
    module_types: ModuleType[];
    submitted_at: string;
};

export type FundraisingModuleDetail = {
    module_id: string;
    campaign_id: string;
    status: ModuleStatus;
    config: Record<string, unknown>;
    progress: {
        target_amount: number;
        verified_amount: number;
        pending_amount: number;
        percent: number;
    };
};

export type FundraisingDonationItem = {
    id: string;
    module_id: string;
    student_id: string;
    donor_name: string;
    amount: number;
    status: DonationStatus;
    message?: string | null;
    evidence_url?: string | null;
    created_at: string;
    verified_at?: string | null;
    reject_reason?: string | null;
};

export const getManagedCampaigns = (params?: {
    q?: string;
    status?: CampaignStatus | '';
    module_type?: ModuleType | '';
    page?: number;
    limit?: number;
}) => api.get('/campaigns', { params }) as Promise<ManagedCampaignItem[]>;

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
    api.post(`/campaigns/${campaignId}/modules`, payload) as Promise<{ id: string }>;

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

export const getApprovalQueue = (params?: {
    status?: CampaignStatus;
    module_type?: ModuleType | '';
    q?: string;
    page?: number;
    limit?: number;
}) =>
    api.get('/approvals/campaigns', { params }) as Promise<ApprovalQueueItem[]>;

export const getApprovalCampaignDetail = (id: string) =>
    api.get(`/approvals/campaigns/${id}`) as Promise<ManagedCampaignDetail>;

export const addApprovalComment = (campaignId: string, payload: {
    body: string;
    visibility?: 'INTERNAL' | 'PUBLIC';
    module_id?: string;
}) =>
    api.post(`/approvals/campaigns/${campaignId}/comments`, payload) as Promise<{
        id: string;
    }>;

export const approvalTransition = (
    campaignId: string,
    action: 'request-revision' | 'pre-approve' | 'approve' | 'reject',
    reason?: string,
) =>
    api.post(`/approvals/campaigns/${campaignId}/${action}`, { reason }) as Promise<{
        campaign_id: string;
        from_status: CampaignStatus;
        to_status: CampaignStatus;
    }>;

export const getFundraisingModule = (moduleId: string) =>
    api.get(`/fundraising/modules/${moduleId}`) as Promise<FundraisingModuleDetail>;

export const updateFundraisingConfig = (
    moduleId: string,
    payload: {
        target_amount: number;
        receiver_name: string;
        bank_name: string;
        bank_account_no: string;
        currency?: string;
        sepay_enabled?: boolean;
        sepay_account_id?: string | null;
    },
) =>
    api.patch(`/fundraising/modules/${moduleId}/config`, payload) as Promise<{
        module_id: string;
        config: Record<string, unknown>;
    }>;

export const getFundraisingDonations = (
    moduleId: string,
    params?: {
        status?: DonationStatus | '';
        q?: string;
        page?: number;
        limit?: number;
    },
) =>
    api.get(`/fundraising/modules/${moduleId}/donations`, {
        params,
    }) as Promise<FundraisingDonationItem[]>;

export const verifyFundraisingDonation = (
    donationId: string,
    payload?: { transaction_id?: string; note?: string },
) =>
    api.patch(`/fundraising/donations/${donationId}/verify`, payload ?? {}) as Promise<{
        id: string;
        status: DonationStatus;
    }>;

export const rejectFundraisingDonation = (donationId: string, reason: string) =>
    api.patch(`/fundraising/donations/${donationId}/reject`, { reason }) as Promise<{
        id: string;
        status: DonationStatus;
    }>;
