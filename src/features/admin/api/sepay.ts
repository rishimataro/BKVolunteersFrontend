import { api } from '@/lib/api-clients';

export type SepayBankAccount = {
    id: number;
    sepay_account_id: string;
    account_holder_name: string;
    account_number: string;
    accumulated: number | null;
    last_transaction: string | null;
    label: string | null;
    active: boolean;
    bank_short_name: string | null;
    bank_full_name: string | null;
    bank_code: string | null;
    api_mode: string;
    metadata_json: unknown;
    created_at: string;
    updated_at: string;
};

export type SepaySyncCursor = {
    type: string;
    sepay_bank_account_id: string | null;
    cursor_value: string | null;
    last_synced_at: string | null;
    last_error: string | null;
};

export type SepaySyncStatus = {
    enabled: boolean;
    api_mode: string;
    api_base_url: string;
    va_enabled: boolean;
    order_va_enabled: boolean;
    account_count: number;
    virtual_account_count: number;
    order_payment_count: number;
    cursors: SepaySyncCursor[];
};

export type SepaySyncResult = {
    synced_count: number;
    matched_count: number;
    unmatched_count: number;
    failed_count: number;
    items: unknown[];
    failed: Array<{
        id: string;
        error: string;
    }>;
};

export type SepayUnmatchedTransaction = {
    id: number;
    provider: string;
    provider_transaction_id: string;
    campaign_id: string | null;
    module_id: string | null;
    amount: number;
    content: string | null;
    account_no: string | null;
    transaction_time: string;
    ingest_source: string;
    sepay_account_id: string | null;
    sepay_va_id: string | null;
    sepay_order_code: string | null;
    reference_number: string | null;
    webhook_success: boolean | null;
    match_status: string;
    matched_donation_id: string | null;
    created_at: string;
    updated_at: string;
};

export type SyncSepayAccountsQuery = {
    q?: string;
    bank_short_name?: string;
    active?: '1' | '0';
    page?: number;
    per_page?: number;
};

export type SyncSepayTransactionsBody = {
    sepay_bank_account_id?: string;
    transaction_date_from?: string;
    transaction_date_to?: string;
    since_id?: string;
    q?: string;
    per_page?: number;
};

export type SyncSepayVirtualAccountsBody = {
    sepay_bank_account_id?: string;
    q?: string;
    active?: '1' | '0';
    official?: '1' | '0';
    static?: '1' | '0';
    per_page?: number;
};

export type SepayOperationRequest = {
    id: number;
    organization_id: number;
    requester_id: number;
    requester_role: string;
    request_type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    sepay_bank_account_id: string | null;
    campaign_id: number | null;
    module_id: number | null;
    donation_id: number | null;
    note: string | null;
    decision_note: string | null;
    decided_by: number | null;
    decided_at: string | null;
    created_at: string;
    updated_at: string;
};

export const getSepayAccounts = (query?: SyncSepayAccountsQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set('q', query.q);
    if (query?.bank_short_name) {
        params.set('bank_short_name', query.bank_short_name);
    }
    if (query?.active) params.set('active', query.active);
    if (query?.page) params.set('page', String(query.page));
    if (query?.per_page) params.set('per_page', String(query.per_page));
    const qs = params.toString();
    return api.get(`/fundraising/sepay/accounts${qs ? `?${qs}` : ''}`) as Promise<
        SepayBankAccount[]
    >;
};

export const syncSepayAccounts = (query?: SyncSepayAccountsQuery) => {
    const params = new URLSearchParams();
    if (query?.q) params.set('q', query.q);
    if (query?.bank_short_name) {
        params.set('bank_short_name', query.bank_short_name);
    }
    if (query?.active) params.set('active', query.active);
    if (query?.page) params.set('page', String(query.page));
    if (query?.per_page) params.set('per_page', String(query.per_page));
    const qs = params.toString();
    return api.post(
        `/fundraising/sepay/accounts/sync${qs ? `?${qs}` : ''}`,
    ) as Promise<SepaySyncResult>;
};

export const getSepaySyncStatus = () =>
    api.get('/fundraising/sepay/sync-status') as Promise<SepaySyncStatus>;

export const syncSepayTransactions = (payload: SyncSepayTransactionsBody) =>
    api.post(
        '/fundraising/sepay/transactions/sync',
        payload,
    ) as Promise<SepaySyncResult>;

export const getSepayUnmatchedTransactions = () =>
    api.get(
        '/fundraising/sepay/transactions/unmatched',
    ) as Promise<SepayUnmatchedTransaction[]>;

export const syncSepayVirtualAccounts = (
    payload: SyncSepayVirtualAccountsBody,
) =>
    api.post(
        '/fundraising/sepay/virtual-accounts/sync',
        payload,
    ) as Promise<SepaySyncResult>;

export const createSepayOrderVa = (donationId: string) =>
    api.post('/fundraising/sepay/order-va/create', {
        donation_id: donationId,
    }) as Promise<{
        donation_id: string;
        sepay_order_id: string;
        order_code: string;
        status: string;
        virtual_account: string;
        provider_qr_url: string | null;
    }>;

export const listSepayOperationRequests = (query?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return api.get(`/fundraising/sepay/requests${qs ? `?${qs}` : ''}`) as Promise<
        SepayOperationRequest[]
    >;
};

export const createSepayOperationRequest = (payload: {
    request_type:
        | 'SYNC_ACCOUNTS'
        | 'SYNC_TRANSACTIONS'
        | 'SYNC_VIRTUAL_ACCOUNTS'
        | 'CREATE_ORDER_VA'
        | 'MAP_ACCOUNT';
    sepay_bank_account_id?: string;
    campaign_id?: string;
    module_id?: string;
    donation_id?: string;
    note?: string;
}) =>
    api.post('/fundraising/sepay/requests', payload) as Promise<SepayOperationRequest>;

export const approveSepayOperationRequest = (
    requestId: string,
    payload?: { decision_note?: string },
) =>
    api.post(`/fundraising/sepay/requests/${requestId}/approve`, payload ?? {}) as Promise<SepayOperationRequest>;

export const rejectSepayOperationRequest = (
    requestId: string,
    payload?: { decision_note?: string },
) =>
    api.post(`/fundraising/sepay/requests/${requestId}/reject`, payload ?? {}) as Promise<SepayOperationRequest>;
