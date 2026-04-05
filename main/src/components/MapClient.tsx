'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { TransitLine, TransitStop } from '@/types/transit';
import FareCalculator from '@/components/FareCalculator';

interface MapClientProps {
  lines: TransitLine[];
}

const createStopIcon = (color: string, mode: string) => {
  const isTrainMode = mode !== 'bus';
  if (isTrainMode) {
    // Circle for train/rail stops
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
          <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="10" cy="10" r="3" fill="white"/>
        </svg>
      `)}`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  } else {
    // Square for bus stops
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
          <rect x="2" y="2" width="14" height="14" rx="2" fill="${color}" stroke="white" stroke-width="2"/>
          <rect x="6" y="6" width="6" height="6" rx="1" fill="white"/>
        </svg>
      `)}`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9]
    });
  }
};

const createUserIcon = () => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="8" fill="#4CAF50" fill-opacity="0.3"/>
        <circle cx="12" cy="12" r="5" fill="#4CAF50" fill-opacity="0.7"/>
        <circle cx="12" cy="12" r="2" fill="#4CAF50"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

const MAP_STYLES = {
  cartoVoyager: {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartoDark: {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cartoLight: {
    name: 'CartoDB Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
};

const BUS_COLOR = '#e6a5b1';

const MapClient = ({ lines }: MapClientProps) => {
  const defaultCenter: [number, number] = [42.3601, -71.0589];
  const [currentStyle, setCurrentStyle] = useState('cartoVoyager');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setIsLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]: 'Location access denied by user',
          [error.POSITION_UNAVAILABLE]: 'Location information unavailable',
          [error.TIMEOUT]: 'Location request timed out',
        };
        setLocationError(messages[error.code] || 'Unknown location error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Build edge polylines from the network data
  const edgePolylines = useMemo(() => {
    if (!Array.isArray(lines)) return [];
    const result: { positions: [number, number][]; color: string; lineName: string; isBus: boolean; lineId: number }[] = [];
    for (const line of lines) {
      const stopMap = new Map<number, TransitStop>();
      for (const stop of line.stops) {
        stopMap.set(stop.stopId, stop);
      }
      const isBus = line.mode === 'bus';
      const lineColor = isBus ? BUS_COLOR : (line.color.startsWith('#') ? line.color : `#${line.color}`);
      for (const edge of line.edges) {
        const from = stopMap.get(edge.fromStopId);
        const to = stopMap.get(edge.toStopId);
        if (from && to) {
          result.push({
            positions: [[from.lat, from.lng], [to.lat, to.lng]],
            color: lineColor,
            lineName: line.lineName,
            isBus,
            lineId: line.lineId,
          });
        }
      }
    }
    // Render bus edges first so train edges draw on top
    return result.sort((a, b) => (a.isBus === b.isBus ? 0 : a.isBus ? -1 : 1));
  }, [lines]);

  // Build stop markers: always show train stops, only show bus stops for selected line
  const stopMarkers = useMemo(() => {
    if (!Array.isArray(lines)) return [];
    const map = new Map<string, { stop: TransitStop; lines: { name: string; color: string; mode: string }[] }>();
    for (const line of lines) {
      const isBus = line.mode === 'bus';
      // Skip bus stops unless this line is selected
      if (isBus && line.lineId !== selectedLineId) continue;
      const lineColor = isBus ? BUS_COLOR : (line.color.startsWith('#') ? line.color : `#${line.color}`);
      for (const stop of line.stops) {
        const existing = map.get(stop.mbtaStopId);
        if (existing) {
          existing.lines.push({ name: line.lineName, color: lineColor, mode: line.mode });
        } else {
          map.set(stop.mbtaStopId, {
            stop,
            lines: [{ name: line.lineName, color: lineColor, mode: line.mode }],
          });
        }
      }
    }
    return Array.from(map.values());
  }, [lines, selectedLineId]);

  return (
    <div className="relative w-full h-full">
      {/* Location Controls */}
      <div className="absolute top-30 left-4 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-3">
        <div className="space-y-2">
          <button
            onClick={getUserLocation}
            disabled={isLocating}
            className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center"
          >
            {isLocating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Locating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                My Location
              </>
            )}
          </button>
          {locationError && (
            <div className="text-red-600 text-xs p-2 bg-red-50 rounded">{locationError}</div>
          )}
          {userLocation && (
            <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-zinc-700 rounded">
              <div>Lat: {userLocation.lat.toFixed(6)}</div>
              <div>Lng: {userLocation.lng.toFixed(6)}</div>
              <div>Accuracy: &plusmn;{Math.round(userLocation.accuracy || 0)}m</div>
            </div>
          )}
        </div>
      </div>

      {/* Map Style Selector */}
      <div className="absolute top-30 right-4 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Map Style
        </label>
        <select
          value={currentStyle}
          onChange={(e) => setCurrentStyle(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
        >
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <option key={key} value={key}>{style.name}</option>
          ))}
        </select>
      </div>

      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
        zoom={userLocation ? 15 : 13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url={MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].url}
          attribution={MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].attribution}
        />

        {/* User Location */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
              <Popup>
                <b>Your Location</b><br/>
                Lat: {userLocation.lat.toFixed(6)}<br/>
                Lng: {userLocation.lng.toFixed(6)}<br/>
                Accuracy: &plusmn;{Math.round(userLocation.accuracy || 0)} meters
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy || 10}
              color="#4CAF50"
              weight={1}
              fillColor="#4CAF50"
              fillOpacity={0.1}
            />
          </>
        )}

        {/* Route edges - colored polylines */}
        {edgePolylines.map((edge, i) => (
          <Polyline
            key={`edge-${i}`}
            positions={edge.positions}
            color={edge.lineId === selectedLineId ? '#e06080' : edge.color}
            weight={edge.lineId === selectedLineId ? 12 : (edge.isBus ? 6 : 5)}
            opacity={edge.isBus ? 0.6 : 1}
            eventHandlers={edge.isBus ? {
              click: () => setSelectedLineId(selectedLineId === edge.lineId ? null : edge.lineId),
            } : {}}
          />
        ))}

        {/* Stop markers - circles for train, squares for bus */}
        {stopMarkers.map(({ stop, lines: stopLines }) => {
          const primaryLine = stopLines[0];
          const icon = createStopIcon(primaryLine.color, primaryLine.mode);
          return (
            <Marker
              key={`stop-${stop.mbtaStopId}`}
              position={[stop.lat, stop.lng]}
              icon={icon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <b style={{ fontSize: 14 }}>{stop.name}</b>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    {stop.mbtaStopId}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {stopLines.map((l, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-block',
                          backgroundColor: l.color,
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          marginRight: 4,
                          marginBottom: 4,
                        }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    {stopLines[0].mode === 'bus' ? 'Bus Stop' : 'Train Station'}
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                    {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {/* Fare Calculator - floating bottom-left */}
      <div className="absolute bottom-6 left-4 z-50">
        <FareCalculator />
      </div>
    </div>
  );
};

export default MapClient;
