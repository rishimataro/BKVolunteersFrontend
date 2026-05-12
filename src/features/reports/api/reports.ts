import { api } from '@/lib/api-clients';

export type SchoolOverview = {
    total_campaigns: number;
    total_students: number;
    total_organizations: number;
    total_money_donations: number;
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
        confirmed_quantity: number;
    };
    events: {
        registrations: number;
        approved_registrations: number;
    };
    certificates: {
        total: number;
    };
};

export const getSchoolOverview = () => {
    return api.get('/reports/school/overview') as Promise<SchoolOverview>;
};

export const getCampaignReport = (id: string | number) => {
    return api.get(`/reports/campaigns/${id}`) as Promise<CampaignReport>;
};
