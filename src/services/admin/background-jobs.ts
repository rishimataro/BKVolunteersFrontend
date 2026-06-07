import { api } from '@/lib/api-clients';

export type BackgroundJobItem = {
    id: number;
    type: string;
    status: string;
    payload_json: unknown;
    attempts: number;
    last_error: string | null;
    run_at: string;
    locked_at: string | null;
    created_at: string;
    updated_at: string;
};

export type BackgroundJobQuery = {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
};

export type RunBackgroundJobsResult = {
    queued: number;
    processed_count: number;
    failed_count: number;
    items: Array<{
        id: number;
        type: string;
        status: string;
        certificate_id: number;
    }>;
    failed: Array<{
        id: number;
        error: string;
    }>;
};

export type PaginatedResponse<T> = {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const getBackgroundJobs = (query?: BackgroundJobQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.type) params.set('type', query.type);
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return api.get(`/admin/background-jobs${qs ? `?${qs}` : ''}`) as Promise<
        PaginatedResponse<BackgroundJobItem>
    >;
};

export const runBackgroundJobs = (data?: { type?: string; limit?: number }) => {
    return api.post(
        '/admin/background-jobs/run',
        data ?? {},
    ) as Promise<RunBackgroundJobsResult>;
};

export const retryBackgroundJob = (id: number | string) => {
    return api.post(`/admin/background-jobs/${id}/retry`) as Promise<{
        id: number;
        type: string;
        status: string;
        certificate_id: number;
    }>;
};
