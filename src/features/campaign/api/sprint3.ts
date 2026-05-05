import { api } from '@/lib/api-clients';
import type { EventRegistrationStatus, PledgeStatus } from '@/types/api';

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

export const updateItemDonationConfig = (
    moduleId: string,
    payload: {
        receiver_address: string;
        receiver_contact: string;
        allow_over_target: boolean;
        handover_note?: string | null;
    },
) =>
    api.patch(
        `/item-donations/modules/${moduleId}/config`,
        payload,
    ) as Promise<{
        module_id: string;
        config: Record<string, unknown>;
    }>;

export const createItemTarget = (
    moduleId: string,
    payload: {
        name: string;
        unit: string;
        target_quantity: number;
        description?: string;
    },
) =>
    api.post(
        `/item-donations/modules/${moduleId}/targets`,
        payload,
    ) as Promise<{
        id: string;
    }>;

export const getItemTargets = (
    moduleId: string,
    status?: 'ACTIVE' | 'CLOSED',
) =>
    api.get(`/item-donations/modules/${moduleId}/targets`, {
        params: status ? { status } : undefined,
    }) as Promise<ItemTargetItem[]>;

export const createItemPledge = (
    moduleId: string,
    payload: {
        item_target_id: string;
        quantity: number;
        donor_name: string;
        expected_handover_at?: string;
        note?: string;
    },
) =>
    api.post(
        `/item-donations/modules/${moduleId}/pledges`,
        payload,
    ) as Promise<{
        id: string;
        status: PledgeStatus;
    }>;

export const getItemPledges = (
    moduleId: string,
    params?: {
        status?: PledgeStatus | '';
        q?: string;
        page?: number;
        limit?: number;
    },
) =>
    api.get(`/item-donations/modules/${moduleId}/pledges`, {
        params,
    }) as Promise<ItemPledgeItem[]>;

export const confirmItemPledge = (pledgeId: string) =>
    api.patch(`/item-donations/pledges/${pledgeId}/confirm`) as Promise<{
        id: string;
        status: PledgeStatus;
    }>;

export const rejectItemPledge = (pledgeId: string, reason: string) =>
    api.patch(`/item-donations/pledges/${pledgeId}/reject`, {
        reason,
    }) as Promise<{
        id: string;
        status: PledgeStatus;
    }>;

export const handoverItemPledge = (
    pledgeId: string,
    payload: {
        received_quantity: number;
        received_at?: string;
        location?: string;
        note?: string;
        evidence_url?: string;
    },
) =>
    api.post(
        `/item-donations/pledges/${pledgeId}/handover`,
        payload,
    ) as Promise<{
        pledge_id: string;
        handover_id: string;
        status: PledgeStatus;
    }>;

export const updateEventConfig = (
    moduleId: string,
    payload: {
        location: string;
        quota: number;
        registration_required: boolean;
        checkin_required: boolean;
        benefits: string[];
    },
) =>
    api.patch(`/events/modules/${moduleId}/config`, payload) as Promise<{
        module_id: string;
        config: Record<string, unknown>;
    }>;

export const createEventRegistration = (
    moduleId: string,
    payload: {
        answers?: Record<string, unknown>;
    },
) =>
    api.post(`/events/modules/${moduleId}/registrations`, payload) as Promise<{
        id: string;
        status: EventRegistrationStatus;
    }>;

export const getEventRegistrations = (
    moduleId: string,
    params?: {
        status?: EventRegistrationStatus | '';
        q?: string;
        page?: number;
        limit?: number;
    },
) =>
    api.get(`/events/modules/${moduleId}/registrations`, {
        params,
    }) as Promise<EventRegistrationItem[]>;

export const approveEventRegistration = (
    registrationId: string,
    reviewNote?: string,
) =>
    api.patch(`/events/registrations/${registrationId}/approve`, {
        review_note: reviewNote,
    }) as Promise<{
        id: string;
        status: EventRegistrationStatus;
    }>;

export const rejectEventRegistration = (
    registrationId: string,
    reviewNote: string,
) =>
    api.patch(`/events/registrations/${registrationId}/reject`, {
        review_note: reviewNote,
    }) as Promise<{
        id: string;
        status: EventRegistrationStatus;
    }>;

export const checkInEventRegistration = (
    registrationId: string,
    checkedInAt?: string,
) =>
    api.post(`/events/registrations/${registrationId}/check-in`, {
        checked_in_at: checkedInAt,
    }) as Promise<{
        id: string;
        status: EventRegistrationStatus;
    }>;

export const completeEventRegistration = (
    registrationId: string,
    payload?: {
        checked_out_at?: string;
        hours?: number;
        note?: string;
    },
) =>
    api.post(
        `/events/registrations/${registrationId}/complete`,
        payload ?? {},
    ) as Promise<{
        id: string;
        status: EventRegistrationStatus;
    }>;

export const getStudentDashboard = () =>
    api.get('/students/me/dashboard') as Promise<StudentDashboardSummary>;

export const getStudentActivities = (params?: {
    type?:
        | 'money_donation'
        | 'item_pledge'
        | 'event_registration'
        | 'certificate'
        | '';
    status?: string;
    page?: number;
    limit?: number;
}) =>
    api.get('/students/me/activities', { params }) as Promise<
        StudentActivityItem[]
    >;

export const getStudentDonations = (params?: {
    type?: 'money' | 'item' | '';
    status?: string;
    page?: number;
    limit?: number;
}) =>
    api.get('/students/me/donations', { params }) as Promise<
        StudentDonationItem[]
    >;

export const getNotifications = (params?: {
    read?: 'true' | 'false' | '';
    page?: number;
    limit?: number;
}) => api.get('/notifications', { params }) as Promise<NotificationItem[]>;

export const markNotificationRead = (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`) as Promise<{
        id: string;
        read_at: string;
    }>;

export const markAllNotificationsRead = () =>
    api.patch('/notifications/read-all') as Promise<{
        updated_count: number;
    }>;
