import { api } from '@/lib/api-clients';

export type SchoolOverview = {
    total_campaigns: number;
    total_students: number;
    total_organizations: number;
    total_money_donations: number;
    organization_breakdown: Array<{
        organization_id: number;
        organization_name: string;
        organization_code: string;
        campaign_count: number;
        verified_money_amount: number;
        received_item_quantity: number;
        completed_event_registrations: number;
        completed_event_hours: number;
        issued_certificates: number;
    }>;
    module_breakdown: Array<{
        module_type: 'fundraising' | 'item_donation' | 'event';
        campaign_count: number;
    }>;
    status_breakdown: Array<{
        status: string;
        campaign_count: number;
    }>;
    filters_applied: {
        from?: string;
        to?: string;
        organization_id?: number;
        module_type?: string;
        status?: string;
    };
};

export type SchoolOverviewQuery = {
    from?: string;
    to?: string;
    organization_id?: string;
    module_type?: string;
    status?: string;
};

export type CampaignReport = {
    campaign: {
        id: number;
        title: string;
        slug: string;
        status: string;
    };
    modules: Array<{
        id: number;
        type: string;
        status: string;
    }>;
    fundraising: {
        total_verified_amount: number;
        total_donations: number;
        verified_donations: number;
    };
    item_donations: {
        received_quantity: number;
    };
    events: {
        registrations: number;
        completed_registrations: number;
        completed_hours: number;
    };
    certificates: {
        issued_total: number;
    };
};

export type CampaignReconciliationReport = {
    campaign: {
        id: number;
        title: string;
        slug: string;
        status: string;
        organization_id: number;
    };
    reconciliation: {
        matched_transactions: number;
        unmatched_transactions: number;
        total_transaction_amount: number;
        matched_transaction_amount: number;
        unmatched_transaction_amount: number;
        pending_donations: number;
        matched_donations: number;
        verified_donations: number;
        rejected_donations: number;
        verified_amount: number;
        amount_gap_vs_verified: number;
    };
};

export const getSchoolOverview = (query?: SchoolOverviewQuery) => {
    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.organization_id) {
        params.set('organization_id', query.organization_id);
    }
    if (query?.module_type) params.set('module_type', query.module_type);
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return api.get(
        `/reports/school/overview${qs ? `?${qs}` : ''}`,
    ) as Promise<SchoolOverview>;
};

export const getCampaignReport = (id: string | number) => {
    return api.get(`/reports/campaigns/${id}`) as Promise<CampaignReport>;
};

export const getCampaignReconciliationReport = (id: string | number) => {
    return api.get(
        `/reports/campaigns/${id}/reconciliation`,
    ) as Promise<CampaignReconciliationReport>;
};
