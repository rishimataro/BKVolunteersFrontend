import { api } from '@/lib/api-clients';

export type AuditLogItem = {
    id: number;
    actor_type: string;
    actor_id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    before_json: unknown;
    after_json: unknown;
    ip_address: string | null;
    created_at: string;
};

export type AuditLogQuery = {
    page?: number;
    limit?: number;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    actor_type?: string;
    actor_id?: string;
    from?: string;
    to?: string;
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

export const getAuditLogs = (query?: AuditLogQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.action) params.set('action', query.action);
    if (query?.entity_type) params.set('entity_type', query.entity_type);
    if (query?.entity_id) params.set('entity_id', query.entity_id);
    if (query?.actor_type) params.set('actor_type', query.actor_type);
    if (query?.actor_id) params.set('actor_id', query.actor_id);
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    const qs = params.toString();
    return api.get(`/admin/audit-logs${qs ? `?${qs}` : ''}`) as Promise<
        PaginatedResponse<AuditLogItem>
    >;
};
