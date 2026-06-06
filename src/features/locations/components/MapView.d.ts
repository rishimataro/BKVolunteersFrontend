import * as React from 'react';
import type { LocationItem } from '@/types/api';

export interface MapViewProps {
    selectedLocationId?: string | null;
    onSelectLocation?: (location: LocationItem) => void;
    className?: string;
    heightClassName?: string;
}

declare const MapView: React.FC<MapViewProps>;

export default MapView;
