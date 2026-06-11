import { api } from '@/lib/api-clients';
import type { LocationItem, LocationType } from '@/types/api';

export const locationTypeLabels: Record<LocationType, string> = {
    CAMPUS: 'Khuôn viên trường',
    COMMUNITY: 'Điểm cộng đồng',
    PARTNER: 'Đối tác phối hợp',
};

const normalizeLocation = (value: unknown): LocationItem | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    const latitude = Number(candidate.latitude);
    const longitude = Number(candidate.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return {
        id: String(candidate.id ?? ''),
        name: String(candidate.name ?? '').trim(),
        address: String(candidate.address ?? '').trim(),
        latitude,
        longitude,
        type: String(candidate.type ?? 'COMMUNITY')
            .trim()
            .toUpperCase() as LocationType,
        description: String(candidate.description ?? '').trim(),
    };
};

export const formatLocationValue = (
    location: Pick<LocationItem, 'name' | 'address'>,
) =>
    [location.name.trim(), location.address.trim()].filter(Boolean).join(' | ');

export const getLocations = async (): Promise<LocationItem[]> => {
    const data = (await api.get('/locations')) as unknown;

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map(normalizeLocation)
        .filter((location): location is LocationItem => location !== null);
};

export const searchLocations = async (query: string): Promise<LocationItem[]> => {
    const data = (await api.get('/locations/search', {
        params: {
            q: query,
        },
    })) as unknown;

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map(normalizeLocation)
        .filter((location): location is LocationItem => location !== null);
};

export const reverseGeocode = async (
    latitude: number,
    longitude: number,
): Promise<LocationItem | null> => {
    const data = (await api.get('/locations/reverse', {
        params: {
            latitude,
            longitude,
        },
    })) as unknown;

    return normalizeLocation(data);
};
