import { api } from '@/lib/api-clients';
import type { PledgeStatus } from '@/types/api';
import type { ItemPledgeItem, ItemTargetItem } from '../types';
export type { ItemPledgeItem, ItemTargetItem };

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
