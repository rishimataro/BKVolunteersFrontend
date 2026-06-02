import { api } from '@/lib/api-clients';

export type TitleItem = {
    id: string;
    name: string;
    description: string | null;
    minPoints: number;
    iconUrl: string | null;
    createdAt: string;
    updatedAt: string;
};

export type TitlesListQuery = {
    page?: number;
    limit?: number;
};

export type TitlesListResponse = {
    items: TitleItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type TitlePayload = {
    name: string;
    description?: string;
    minPoints: number;
    iconUrl?: string;
};

export const getTitles = async (
    query?: TitlesListQuery,
): Promise<TitlesListResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    const result = (await api.get(`/titles${qs ? `?${qs}` : ''}`)) as {
        items: TitleItem[];
        meta?: {
            total: number;
            page: number;
            limit: number;
            totalPages?: number;
            total_pages?: number;
        };
    };

    return {
        items: result.items,
        pagination: {
            page: result.meta?.page ?? 1,
            limit: result.meta?.limit ?? query?.limit ?? 10,
            total: result.meta?.total ?? result.items.length,
            totalPages:
                result.meta?.totalPages ??
                result.meta?.total_pages ??
                1,
        },
    };
};

export const createTitle = (payload: TitlePayload) =>
    api.post('/titles', payload) as Promise<TitleItem>;

export const updateTitle = (id: string, payload: Partial<TitlePayload>) =>
    api.put(`/titles/${id}`, payload) as Promise<TitleItem>;

export const deleteTitle = (id: string) =>
    api.delete(`/titles/${id}`) as Promise<{ success: boolean }>;
