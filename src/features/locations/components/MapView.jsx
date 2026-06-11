import * as React from 'react';
import L from 'leaflet';
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

import {
    formatLocationValue,
    reverseGeocode,
    searchLocations,
} from '../api/locations';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const defaultCenter = [16.0544, 108.2022];

function MapViewportController({ selectedLocation }) {
    const map = useMap();

    React.useEffect(() => {
        if (!selectedLocation) {
            map.setView(defaultCenter, 12);
            return;
        }

        map.setView(
            [selectedLocation.latitude, selectedLocation.longitude],
            15,
            { animate: true },
        );
    }, [map, selectedLocation]);

    return null;
}

function MapClickHandler({ onSelectLocation }) {
    useMapEvents({
        click: async (event) => {
            try {
                const nextLocation = await reverseGeocode(
                    event.latlng.lat,
                    event.latlng.lng,
                );

                if (nextLocation) {
                    onSelectLocation(nextLocation);
                }
            } catch {
                // The parent handles visible error state.
            }
        },
    });

    return null;
}

export default function MapView({
    selectedLocationId = null,
    onSelectLocation,
    className = '',
    heightClassName = 'h-[320px] md:h-[420px]',
}) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [locations, setLocations] = React.useState([]);
    const [selectedLocation, setSelectedLocation] = React.useState(null);
    const [isSearching, setIsSearching] = React.useState(false);
    const [error, setError] = React.useState('');
    const deferredSearchQuery = React.useDeferredValue(searchQuery);

    React.useEffect(() => {
        if (!deferredSearchQuery.trim()) {
            setLocations([]);
            return;
        }

        let mounted = true;
        setIsSearching(true);
        setError('');

        void searchLocations(deferredSearchQuery.trim())
            .then((items) => {
                if (!mounted) return;
                setLocations(items);
            })
            .catch((loadError) => {
                if (!mounted) return;
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Không thể tìm kiếm địa điểm.',
                );
                setLocations([]);
            })
            .finally(() => {
                if (mounted) {
                    setIsSearching(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [deferredSearchQuery]);

    React.useEffect(() => {
        if (!selectedLocationId) {
            return;
        }

        const matchedLocation =
            locations.find((location) => location.id === selectedLocationId) ??
            null;

        if (matchedLocation) {
            setSelectedLocation(matchedLocation);
        }
    }, [locations, selectedLocationId]);

    const handleSelectLocation = React.useCallback(
        (location) => {
            setSelectedLocation(location);
            setError('');
            onSelectLocation?.(location);
        },
        [onSelectLocation],
    );

    return (
        <section
            className={`grid gap-4 rounded-xl border border-[#C3C6D2] bg-white p-4 ${className}`.trim()}
        >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
                <label className="grid gap-2 text-left">
                    <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Tìm kiếm địa điểm
                    </span>
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-11 rounded-lg border border-[#C3C6D2] bg-[#F3F4F5] px-3 text-[14px] text-[#191C1D] outline-none transition focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                        placeholder="Nhập tên địa điểm hoặc địa chỉ"
                        type="text"
                    />
                </label>
                <div className="rounded-lg border border-dashed border-[#C3C6D2] bg-[#F8F9FA] px-4 py-3 text-[13px] leading-5 text-[#424750]">
                    Có thể tìm kiếm hoặc bấm trực tiếp lên bản đồ để chọn vị
                    trí.
                </div>
            </div>

            <div className={`overflow-hidden rounded-xl border border-[#C3C6D2] ${heightClassName}`}>
                <MapContainer
                    center={defaultCenter}
                    zoom={12}
                    scrollWheelZoom
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapViewportController selectedLocation={selectedLocation} />
                    <MapClickHandler onSelectLocation={handleSelectLocation} />
                    {selectedLocation ? (
                        <Marker
                            position={[
                                selectedLocation.latitude,
                                selectedLocation.longitude,
                            ]}
                        />
                    ) : null}
                    {locations
                        .filter(
                            (location) =>
                                !selectedLocation ||
                                location.id !== selectedLocation.id,
                        )
                        .map((location) => (
                            <Marker
                                key={location.id}
                                position={[location.latitude, location.longitude]}
                                eventHandlers={{
                                    click: () => handleSelectLocation(location),
                                }}
                            />
                        ))}
                </MapContainer>
            </div>

            {error ? (
                <div className="rounded-lg border border-[#F1B7B7] bg-[#FFF4F4] px-4 py-3 text-[14px] leading-6 text-[#7F1D1D]">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-xl border border-[#C3C6D2] bg-[#F8F9FA] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                            Kết quả tìm kiếm
                        </p>
                        <span className="text-[12px] text-[#737781]">
                            {isSearching
                                ? 'Đang tìm kiếm...'
                                : `${locations.length} vị trí`}
                        </span>
                    </div>
                    <div className="mt-3 space-y-3">
                        {locations.length === 0 && !isSearching ? (
                            <p className="text-[14px] leading-6 text-[#737781]">
                                Nhập từ khóa để tìm địa điểm phù hợp hoặc bấm
                                lên bản đồ để chọn nhanh.
                            </p>
                        ) : null}
                        {locations.map((location) => {
                            const isActive =
                                selectedLocation?.id === location.id;

                            return (
                                <button
                                    key={location.id}
                                    type="button"
                                    onClick={() => handleSelectLocation(location)}
                                    className={`w-full border p-3 text-left transition ${
                                        isActive
                                            ? 'border-[#0E4686] bg-[#EEF3FB]'
                                            : 'border-[#C3C6D2] bg-white hover:border-[#0E4686]'
                                    }`}
                                >
                                    <p className="text-[14px] font-semibold text-[#191C1D]">
                                        {location.name}
                                    </p>
                                    <p className="mt-1 text-[13px] leading-5 text-[#424750]">
                                        {location.address}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-[#C3C6D2] bg-white p-4">
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Địa điểm đã chọn
                    </p>
                    {selectedLocation ? (
                        <div className="mt-3 space-y-3">
                            <div>
                                <p className="text-[16px] font-semibold text-[#191C1D]">
                                    {selectedLocation.name}
                                </p>
                                <p className="mt-1 text-[14px] leading-6 text-[#424750]">
                                    {selectedLocation.address}
                                </p>
                            </div>
                            <div className="rounded-lg border border-[#C3C6D2] bg-[#F8F9FA] px-3 py-2 text-[13px] leading-5 text-[#424750]">
                                {formatLocationValue(selectedLocation)}
                                <br />
                                {selectedLocation.latitude.toFixed(6)},{' '}
                                {selectedLocation.longitude.toFixed(6)}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSelectLocation(selectedLocation)}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#002A58] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0E4686]"
                            >
                                Sử dụng địa điểm này
                            </button>
                        </div>
                    ) : (
                        <p className="mt-3 text-[14px] leading-6 text-[#737781]">
                            Chưa có địa điểm nào được chọn.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
