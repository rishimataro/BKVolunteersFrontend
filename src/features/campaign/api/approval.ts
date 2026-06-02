import { api } from '@/lib/api-clients';
import type { CampaignStatus, ModuleType } from '@/types/api';
import type { ApprovalQueueItem, ManagedCampaignDetail } from '../types';
export type { ApprovalQueueItem, ManagedCampaignDetail };

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

export const addApprovalComment = (
    campaignId: string,
    payload: {
        body: string;
        visibility?: 'INTERNAL' | 'PUBLIC';
        module_id?: string;
    },
) =>
    api.post(
        `/approvals/campaigns/${campaignId}/comments`,
        payload,
    ) as Promise<{
        id: string;
    }>;

export const approvalTransition = (
    campaignId: string,
    action: 'request-revision' | 'pre-approve' | 'approve' | 'reject',
    reason?: string,
) =>
    api.post(`/approvals/campaigns/${campaignId}/${action}`, {
        reason,
    }) as Promise<{
        campaign_id: string;
        from_status: CampaignStatus;
        to_status: CampaignStatus;
    }>;
