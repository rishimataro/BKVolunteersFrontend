import type {
    CampaignStatus,
    DonationStatus,
    EventRegistrationStatus,
    ModuleStatus,
    ModuleType,
    PledgeStatus,
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
    organization?: {
        id: string;
        code: string;
        name: string;
        type: string;
        faculty_id?: string | null;
    } | null;
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
        attachment_url?: string | null;
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
    id: string;
    campaign_id: string;
    type: 'FUNDRAISING' | 'fundraising';
    title: string;
    status: ModuleStatus;
    settings_json: Record<string, unknown>;
    total_raised: number;
    campaign: {
        id: string;
        title: string;
        slug: string;
        status: CampaignStatus;
    };
    config: Record<string, unknown>;
};

export type EventModuleDetail = {
    id: string;
    campaign_id: string;
    type: 'EVENT' | 'event';
    title: string;
    description?: string | null;
    status: ModuleStatus;
    start_at: string;
    end_at: string;
    settings_json: Record<string, unknown>;
    registration_count: number;
    approved_count: number;
    campaign: {
        id: string;
        title: string;
        slug: string;
        status: CampaignStatus;
    };
    config: {
        location: string;
        quota: number;
        registration_required: boolean;
        checkin_required: boolean;
        benefits: string[];
        benefits_text: string;
    };
};

export type FundraisingDonationItem = {
    id: string;
    module_id: string;
    student_id: string;
    donor_name: string;
    amount: number;
    status: DonationStatus;
    matched_transaction_id?: string | null;
    message?: string | null;
    evidence_url?: string | null;
    created_at: string;
    verified_at?: string | null;
    reject_reason?: string | null;
};

export type FundraisingTransactionItem = {
    id: string;
    provider: string;
    provider_transaction_id: string;
    campaign_id?: string | null;
    module_id?: string | null;
    amount: number;
    content?: string | null;
    account_no?: string | null;
    transaction_time: string;
    match_status: 'MATCHED' | 'UNMATCHED';
    matched_donation_id?: string | null;
    matched_donation?: {
        id: string;
        donor_name?: string | null;
        amount: number;
        status: DonationStatus;
        created_at: string;
    } | null;
};

export type ItemTargetItem = {
    id: string;
    module_id: string;
    campaign_id: string;
    name: string;
    unit: string;
    target_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    description?: string | null;
    status: 'ACTIVE' | 'CLOSED';
};

export type ItemPledgeItem = {
    id: string;
    module_id: string;
    campaign_id: string;
    item_target: {
        id: string;
        name: string;
        unit: string;
    };
    student: {
        id: string;
        full_name: string;
        student_code: string;
    };
    donor_name: string;
    quantity: number;
    status: PledgeStatus;
    note?: string | null;
    expected_handover_at?: string | null;
    received_quantity?: number | null;
    received_at?: string | null;
    created_at: string;
};

export type EventRegistrationItem = {
    id: string;
    campaign_id: string;
    module_id: string;
    student: {
        id: string;
        full_name: string;
        student_code: string;
        email: string;
    };
    status: EventRegistrationStatus;
    answers?: Record<string, unknown>;
    registered_at: string;
    reviewed_at?: string | null;
    review_note?: string | null;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    hours?: number | null;
};

export type StudentDashboardSummary = {
    campaigns_count: number;
    money_amount: number;
    money_donations_count: number;
    item_received_quantity: number;
    item_received_count: number;
    event_hours: number;
    event_completed_count: number;
    certificates_count: number;
    recent_activities: Array<{
        id: string;
        activity_type:
            | 'money_donation'
            | 'item_pledge'
            | 'event_registration'
            | 'certificate';
        campaign_id: string | null;
        campaign_title: string;
        campaign_slug: string;
        module_id: string | null;
        module_title: string;
        status: string;
        occurred_at: string;
        summary: string;
    }>;
};

export type StudentActivityItem = {
    id: string;
    activity_type:
        | 'money_donation'
        | 'item_pledge'
        | 'event_registration'
        | 'certificate';
    reference_id: string;
    campaign_id: string | null;
    campaign_title: string;
    campaign_slug: string;
    module_id: string | null;
    module_title: string;
    module_type: string | null;
    status: string;
    occurred_at: string;
    meta: Record<string, unknown>;
};

export type StudentDonationItem = {
    id: string;
    donation_type: 'money' | 'item';
    reference_id: string;
    campaign_id: string | null;
    campaign_title: string;
    campaign_slug: string;
    module_id: string | null;
    module_title: string;
    status: string;
    occurred_at: string;
    meta: Record<string, unknown>;
};

export type NotificationItem = {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    read_at?: string | null;
    created_at: string;
};
