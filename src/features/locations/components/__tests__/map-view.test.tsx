import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MapView from '../MapView';

const { getLocations, fitBounds, setView, mergeOptions, latLngBounds } =
    vi.hoisted(() => ({
        getLocations: vi.fn(),
        fitBounds: vi.fn(),
        setView: vi.fn(),
        mergeOptions: vi.fn(),
        latLngBounds: vi.fn(() => ({ isMockBounds: true })),
    }));

vi.mock('@/features/locations/api/locations', () => ({
    getLocations: () => getLocations(),
    locationTypeLabels: {
        CAMPUS: 'Khuon vien truong',
        COMMUNITY: 'Diem cong dong',
        PARTNER: 'Doi tac phoi hop',
    },
    formatLocationValue: (location: { name: string; address: string }) =>
        `${location.name} | ${location.address}`,
}));

vi.mock('leaflet', () => {
    const Default = function Default() {};
    Default.prototype = {};
    Default.mergeOptions = mergeOptions;

    return {
        default: {
            Icon: {
                Default,
            },
            latLngBounds,
        },
        Icon: {
            Default,
        },
        latLngBounds,
    };
});

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="map-container">{children}</div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="marker">{children}</div>
    ),
    Popup: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popup">{children}</div>
    ),
    useMap: () => ({
        fitBounds,
        setView,
    }),
}));

describe('MapView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getLocations.mockResolvedValue([
            {
                id: 'dut-main-campus',
                name: 'Bach Khoa Da Nang - Co so chinh',
                address:
                    '54 Nguyen Luong Bang, Hoa Khanh Bac, Lien Chieu, Da Nang',
                latitude: 16.0749,
                longitude: 108.1504,
                type: 'CAMPUS',
                description: 'Diem hop va tap huan.',
            },
            {
                id: 'hoa-bac-community-house',
                name: 'Nha van hoa Hoa Bac',
                address: 'Thon Nam Yen, xa Hoa Bac, Hoa Vang, Da Nang',
                latitude: 16.1168,
                longitude: 107.9876,
                type: 'COMMUNITY',
                description: 'Diem to chuc hoat dong cong dong.',
            },
        ]);
    });

    it('loads locations, filters by type and returns the selected item', async () => {
        const onSelectLocation = vi.fn();

        render(<MapView onSelectLocation={onSelectLocation} />);

        await waitFor(() => {
            expect(
                screen.getAllByText('Bach Khoa Da Nang - Co so chinh').length,
            ).toBeGreaterThan(0);
        });

        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'COMMUNITY' },
        });

        await waitFor(() => {
            expect(screen.queryByText('Bach Khoa Da Nang - Co so chinh')).toBe(
                null,
            );
            expect(
                screen.getAllByText('Nha van hoa Hoa Bac').length,
            ).toBeGreaterThan(0);
        });

        const selectButton = screen
            .getAllByRole('button')
            .find((button) =>
                button
                    .getAttribute('aria-label')
                    ?.includes('Nha van hoa Hoa Bac'),
            );

        expect(selectButton).toBeTruthy();
        fireEvent.click(selectButton as HTMLButtonElement);

        expect(onSelectLocation).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'hoa-bac-community-house',
                type: 'COMMUNITY',
            }),
        );
        expect(setView).toHaveBeenCalled();
    });

    it('shows an inline error state and retries when the API fails', async () => {
        getLocations
            .mockRejectedValueOnce(new Error('Backend khong phan hoi'))
            .mockResolvedValueOnce([
                {
                    id: 'partner-center',
                    name: 'Trung tam doi tac',
                    address: '12 Tran Phu, Hai Chau, Da Nang',
                    latitude: 16.0678,
                    longitude: 108.2208,
                    type: 'PARTNER',
                    description: 'Diem tiep nhan va dieu phoi.',
                },
            ]);

        render(<MapView />);

        await waitFor(() => {
            expect(screen.getByText('Backend khong phan hoi')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(
                screen.getAllByText('Trung tam doi tac').length,
            ).toBeGreaterThan(0);
        });
    });
});
