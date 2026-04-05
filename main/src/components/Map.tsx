'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import type { TransitLine } from '@/types/transit';

interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

interface MapProps {
  lines: TransitLine[];
  originLocation?: LocationPoint | null;
  destinationLocation?: LocationPoint | null;
  routeGeometry?: [number, number][] | null;
  searchedLocation?: LocationPoint | null; // kept for back-compat
}

const MapComponent = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading map...</p>
    </div>
  )
}) as React.ComponentType<MapProps>;

const Map = (props: MapProps) => (
  <div className="w-full h-full">
    <MapComponent {...props} />
  </div>
);

export default Map;
