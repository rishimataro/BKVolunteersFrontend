import { api } from '@/lib/api-clients';
import type { DonationStatus } from '@/types/api';
import type {
    FundraisingDonationItem,
    FundraisingModuleDetail,
    FundraisingTransactionItem,
} from '../types';
export type {
    FundraisingDonationItem,
    FundraisingModuleDetail,
    FundraisingTransactionItem,
};

type FundraisingModuleResponse = Omit<FundraisingModuleDetail, 'config'>;

export const getFundraisingModule = async (
    moduleId: string,
): Promise<FundraisingModuleDetail> => {
    const data = (await api.get(
        `/fundraising/modules/${moduleId}`,
    )) as FundraisingModuleResponse;

    return {
        ...data,
        config: data.settings_json ?? {},
    };
};

export const createMoneyDonation = (
    moduleId: string,
    payload: { amount: number; donor_name?: string; message?: string },
) =>
    api.post(`/fundraising/modules/${moduleId}/donations`, payload) as Promise<{
        id: string;
        status: string;
    }>;

export const getDonationById = (donationId: string) =>
    api.get(`/fundraising/donations/${donationId}`) as Promise<{
        id: string
        status: string
        payment_instruction?: {
            payment_code?: string | null
            transfer_content?: string | null
            expires_at?: string | null
            vietqr_url?: string | null
            amount?: number
            currency?: string
        }
        matched_transaction_id?: string | null
    }>

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
        status: string;
    }>;

export const getFundraisingDonations = (
    moduleId: string,
    params?: {
        status?: DonationStatus | '';
        q?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    },
) =>
    api.get(`/fundraising/modules/${moduleId}/donations`, {
        params,
    }) as Promise<{
        items: FundraisingDonationItem[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;

export const verifyFundraisingDonation = (
    donationId: string,
    payload?: { transaction_id?: string; note?: string },
) =>
    api.patch(
        `/fundraising/donations/${donationId}/verify`,
        payload
            ? {
                  ...payload,
                  transaction_id: payload.transaction_id
                      ? String(payload.transaction_id)
                      : undefined,
              }
            : {},
    ) as Promise<{
        id: string;
        status: DonationStatus;
    }>;

export const getFundraisingTransactions = (params?: {
    match_status?: 'MATCHED' | 'UNMATCHED';
    module_id?: string;
    campaign_id?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}) =>
    api.get('/fundraising/transactions', {
        params,
    }) as Promise<{
        items: FundraisingTransactionItem[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;

export const attachFundraisingTransaction = (
    transactionId: string,
    donationId: string,
) =>
    api.patch(`/fundraising/transactions/${transactionId}/attach-donation`, {
        donation_id: donationId,
    }) as Promise<FundraisingTransactionItem>;

export const unmatchFundraisingTransaction = (transactionId: string) =>
    api.patch(
        `/fundraising/transactions/${transactionId}/unmatch`,
    ) as Promise<FundraisingTransactionItem>;

export const rejectFundraisingDonation = (donationId: string, reason: string) =>
    api.patch(`/fundraising/donations/${donationId}/reject`, {
        reason,
    }) as Promise<{
        id: string;
        status: DonationStatus;
    }>;
