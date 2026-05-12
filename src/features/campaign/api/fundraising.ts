import { api } from '@/lib/api-clients';
import type { DonationStatus } from '@/types/api';
import type {
    FundraisingDonationItem,
    FundraisingModuleDetail,
} from '../types';
export type { FundraisingDonationItem, FundraisingModuleDetail };

export const getFundraisingModule = (moduleId: string) =>
    api.get(
        `/fundraising/modules/${moduleId}`,
    ) as Promise<FundraisingModuleDetail>;

export const createMoneyDonation = (
    moduleId: string,
    payload: { amount: number; donor_name?: string; message?: string },
) =>
    api.post(`/fundraising/modules/${moduleId}/donations`, payload) as Promise<{
        id: string;
        status: string;
    }>;

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
    api.patch(
        `/fundraising/donations/${donationId}/verify`,
        payload ?? {},
    ) as Promise<{
        id: string;
        status: DonationStatus;
    }>;

export const rejectFundraisingDonation = (donationId: string, reason: string) =>
    api.patch(`/fundraising/donations/${donationId}/reject`, {
        reason,
    }) as Promise<{
        id: string;
        status: DonationStatus;
    }>;
