'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400 text-lg">Loading map...</p>
    </div>
  )
});

const Map = () => {
  return (
    <div className="w-full h-full">
      <MapComponent />
    </div>
  );
};

export default Map;