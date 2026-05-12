import { api } from '@/lib/api-clients';
import type { EventRegistrationStatus } from '@/types/api';
import type { EventRegistrationItem } from '../types';
export type { EventRegistrationItem };

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
