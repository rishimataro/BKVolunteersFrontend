import * as React from 'react';
import L from 'leaflet';
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
} from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

import {
    formatLocationValue,
    getLocations,
    locationTypeLabels,
} from '../api/locations';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const allTypeOption = 'ALL';

const emptyLocation = {
    id: '',
    name: '',
    address: '',
    latitude: 16.0544,
    longitude: 108.2022,
    type: 'COMMUNITY',
    description: '',
};

function MapViewportController({ locations, selectedLocation }) {
    const map = useMap();

    React.useEffect(() => {
        if (!locations.length) {
            map.setView([emptyLocation.latitude, emptyLocation.longitude], 12);
            return;
        }

        if (selectedLocation) {
            map.setView(
                [selectedLocation.latitude, selectedLocation.longitude],
                15,
                { animate: true },
            );
            return;
        }

        const bounds = L.latLngBounds(
            locations.map((location) => [location.latitude, location.longitude]),
        );

        map.fitBounds(bounds, {
            padding: [32, 32],
            maxZoom: 14,
        });
    }, [locations, map, selectedLocation]);

    return null;
}

export default function MapView({
    selectedLocationId = null,
    onSelectLocation,
    className = '',
    heightClassName = 'h-[320px] md:h-[420px]',
}) {
    const [locations, setLocations] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState(allTypeOption);
    const [activeLocationId, setActiveLocationId] = React.useState(
        selectedLocationId,
    );

    const loadLocations = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await getLocations();
            setLocations(data);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Khong the tai danh sach dia diem.',
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadLocations();
    }, [loadLocations]);

    React.useEffect(() => {
        setActiveLocationId(selectedLocationId);
    }, [selectedLocationId]);

    const availableTypes = React.useMemo(
        () =>
            Array.from(new Set(locations.map((location) => location.type))).sort(),
        [locations],
    );

    const filteredLocations = React.useMemo(() => {
        if (typeFilter === allTypeOption) {
            return locations;
        }

        return locations.filter((location) => location.type === typeFilter);
    }, [locations, typeFilter]);

    React.useEffect(() => {
        if (!filteredLocations.length) {
            setActiveLocationId(null);
            return;
        }

        const hasActiveLocation = filteredLocations.some(
            (location) => location.id === activeLocationId,
        );

        if (!hasActiveLocation) {
            setActiveLocationId(filteredLocations[0].id);
        }
    }, [activeLocationId, filteredLocations]);

    const selectedLocation =
        filteredLocations.find((location) => location.id === activeLocationId) ??
        null;

    const handleLocationFocus = React.useCallback((location) => {
        setActiveLocationId(location.id);
    }, []);

    const handleLocationSelect = React.useCallback(
        (location) => {
            setActiveLocationId(location.id);
            onSelectLocation?.(location);
        },
        [onSelectLocation],
    );

    return (
        <section
            className={`grid gap-4 rounded-xl border border-[#C3C6D2] bg-white p-4 ${className}`.trim()}
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Bản đồ địa điểm
                    </p>
                    <p className="mt-1 text-[14px] leading-6 text-[#424750]">
                        Chọn nhanh địa điểm có sẵn để điền vào cấu hình module sự kiện.
                    </p>
                </div>
                <label className="grid gap-2 text-left">
                    <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Lọc theo loại
                    </span>
                    <select
                        aria-label="Lọc địa điểm theo loại"
                        className="h-11 min-w-[220px] rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-3 text-[14px] text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value)}
                    >
                        <option value={allTypeOption}>Tất cả địa điểm</option>
                        {availableTypes.map((type) => (
                            <option key={type} value={type}>
                                {locationTypeLabels[type] ?? type}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {isLoading ? (
                <div
                    className={`flex items-center justify-center rounded-xl border border-dashed border-[#C3C6D2] bg-[#F8F9FA] text-[14px] text-[#424750] ${heightClassName}`}
                >
                    Đang tải bản đồ và danh sách địa điểm...
                </div>
            ) : null}

            {!isLoading && error ? (
                <div
                    className={`grid place-items-center gap-4 rounded-xl border border-dashed border-[#DC2626] bg-[#FFF4F4] px-6 text-center ${heightClassName}`}
                >
                    <div className="space-y-2">
                        <p className="text-[15px] font-semibold text-[#7F1D1D]">
                            Không thể tải danh sách địa điểm
                        </p>
                        <p className="text-[14px] leading-6 text-[#7F1D1D]">
                            {error}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            void loadLocations();
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-lg border border-[#7F1D1D] px-4 text-[14px] font-semibold text-[#7F1D1D] transition hover:bg-[#FEE2E2]"
                    >
                        Thử tải lại
                    </button>
                </div>
            ) : null}

            {!isLoading && !error ? (
                <>
                    <div className={`overflow-hidden rounded-xl border border-[#C3C6D2] ${heightClassName}`}>
                        <MapContainer
                            center={[emptyLocation.latitude, emptyLocation.longitude]}
                            zoom={12}
                            scrollWheelZoom
                            className="h-full w-full"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapViewportController
                                locations={filteredLocations}
                                selectedLocation={selectedLocation}
                            />
                            {filteredLocations.map((location) => (
                                <Marker
                                    key={location.id}
                                    position={[location.latitude, location.longitude]}
                                    eventHandlers={{
                                        click: () => handleLocationFocus(location),
                                    }}
                                >
                                    <Popup>
                                        <div className="min-w-[220px] space-y-3">
                                            <div>
                                                <p className="text-[15px] font-semibold text-[#191C1D]">
                                                    {location.name}
                                                </p>
                                                <p className="mt-1 text-[13px] leading-5 text-[#424750]">
                                                    {location.address}
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-[13px] leading-5 text-[#424750]">
                                                <p>
                                                    <strong>Loại:</strong>{' '}
                                                    {locationTypeLabels[location.type] ??
                                                        location.type}
                                                </p>
                                                <p>{location.description}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleLocationSelect(location)
                                                }
                                                className="inline-flex h-10 items-center justify-center rounded-md bg-[#002A58] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0E4686]"
                                            >
                                                Chọn địa điểm này
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    {filteredLocations.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#C3C6D2] bg-[#F8F9FA] px-4 py-6 text-[14px] leading-6 text-[#737781]">
                            Không có địa điểm nào phù hợp với bộ lọc đã chọn.
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filteredLocations.map((location) => {
                                const isActive = location.id === activeLocationId;

                                return (
                                    <article
                                        key={location.id}
                                        className={`rounded-xl border p-4 transition ${
                                            isActive
                                                ? 'border-[#0E4686] bg-[#EEF3FB]'
                                                : 'border-[#C3C6D2] bg-[#F8F9FA]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="text-[15px] font-semibold leading-6 text-[#191C1D]">
                                                    {location.name}
                                                </p>
                                                <p className="text-[13px] leading-5 text-[#424750]">
                                                    {locationTypeLabels[location.type] ??
                                                        location.type}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                {location.type}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-[14px] leading-6 text-[#424750]">
                                            {location.address}
                                        </p>
                                        <p className="mt-2 text-[13px] leading-5 text-[#737781]">
                                            {location.description}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleLocationFocus(location)}
                                                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#C3C6D2] bg-white px-4 text-[13px] font-semibold text-[#191C1D] transition hover:border-[#0E4686]"
                                            >
                                                Xem trên bản đồ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleLocationSelect(location)
                                                }
                                                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#002A58] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0E4686]"
                                                aria-label={`Chọn địa điểm ${formatLocationValue(location)}`}
                                            >
                                                Sử dụng địa điểm này
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : null}
        </section>
    );
}
