import { api } from '@/lib/api-clients';
import type { EventRegistrationStatus } from '@/types/api';
import type { EventModuleDetail, EventRegistrationItem } from '../types';
export type { EventModuleDetail, EventRegistrationItem };

type EventModuleResponse = Omit<EventModuleDetail, 'config'>;

const normalizeBenefits = (benefits: unknown): string[] => {
    if (!Array.isArray(benefits)) {
        return [];
    }

    const deduped = new Set<string>();

    benefits.forEach((item) => {
        const normalized = String(item).trim();
        if (normalized) {
            deduped.add(normalized);
        }
    });

    return Array.from(deduped);
};

const normalizeEventConfig = (config: Record<string, unknown>) => {
    const benefits = normalizeBenefits(config.benefits);

    return {
        location: String(config.location ?? ''),
        quota: Number(config.quota ?? 0),
        registration_required: config.registration_required !== false,
        checkin_required: config.checkin_required !== false,
        benefits,
        benefits_text: benefits.join('\n'),
    };
};

export const getEventModule = async (
    moduleId: string,
): Promise<EventModuleDetail> => {
    const data = (await api.get(
        `/events/modules/${moduleId}`,
    )) as EventModuleResponse;

    return {
        ...data,
        config: normalizeEventConfig(
            (data.settings_json ?? {}) as Record<string, unknown>,
        ),
    };
};

export const updateEventConfig = async (
    moduleId: string,
    payload: {
        location: string;
        quota: number;
        registration_required: boolean;
        checkin_required: boolean;
        benefits: string[];
    },
): Promise<{
    module_id: string;
    config: EventModuleDetail['config'];
}> => {
    const data = (await api.patch(
        `/events/modules/${moduleId}/config`,
        payload,
    )) as {
        module_id: string;
        config: Record<string, unknown>;
    };

    return {
        module_id: data.module_id,
        config: normalizeEventConfig(data.config),
    };
};

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
    reason: string,
) =>
    api.patch(`/events/registrations/${registrationId}/reject`, {
        reason,
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
