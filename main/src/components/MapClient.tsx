'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { TransitLine, TransitStop } from '@/types/transit';

interface LocationPoint { lat: number; lng: number; address: string; }

interface MapClientProps {
  lines: TransitLine[];
  originLocation?: LocationPoint | null;
  destinationLocation?: LocationPoint | null;
  routeGeometry?: [number, number][] | null;
  searchedLocation?: LocationPoint | null; // back-compat
}

// ── Map updater: pan or fit bounds ──
function MapController({ origin, destination }: { origin: [number, number] | null; destination: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      map.fitBounds([origin, destination], { padding: [60, 60], maxZoom: 16 });
    } else if (origin) {
      map.setView(origin, Math.max(map.getZoom(), 14));
    } else if (destination) {
      map.setView(destination, Math.max(map.getZoom(), 14));
    }
  }, [origin, destination, map]);
  return null;
}

// ── Icons ──
const createStopIcon = (color: string, mode: string) => {
  const isTrainMode = mode !== 'bus';
  if (isTrainMode) {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/><circle cx="10" cy="10" r="3" fill="white"/></svg>`)}`,
      iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
    });
  } else {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><rect x="2" y="2" width="14" height="14" rx="2" fill="${color}" stroke="white" stroke-width="2"/><rect x="6" y="6" width="6" height="6" rx="1" fill="white"/></svg>`)}`,
      iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -9]
    });
  }
};

const createOriginIcon = () => L.icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><circle cx="14" cy="14" r="11" fill="#22c55e" stroke="white" stroke-width="3"/><circle cx="14" cy="14" r="4" fill="white"/></svg>`)}`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14]
});

const createDestinationIcon = () => L.icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42"><path d="M16 0C7.16 0 0 7.16 0 16c0 10 16 26 16 26S32 26 32 16C32 7.16 24.84 0 16 0z" fill="#ef4444"/><circle cx="16" cy="16" r="7" fill="white"/><circle cx="16" cy="16" r="4" fill="#ef4444"/></svg>`)}`,
  iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -42]
});

interface UserLocation { lat: number; lng: number; accuracy?: number; timestamp?: number; }

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

const MapClient = ({ lines, originLocation, destinationLocation, routeGeometry }: MapClientProps) => {
  const defaultCenter: [number, number] = [42.3601, -71.0589];
  const [currentStyle, setCurrentStyle] = useState('cartoVoyager');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  // Sync GPS from browser (only if no originLocation passed from parent)
  useEffect(() => {
    if (originLocation) {
      setUserLocation({ lat: originLocation.lat, lng: originLocation.lng });
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
    });
  }, [originLocation]);

  const originCoords: [number, number] | null = originLocation
    ? [originLocation.lat, originLocation.lng]
    : userLocation ? [userLocation.lat, userLocation.lng] : null;

  const destCoords: [number, number] | null = destinationLocation
    ? [destinationLocation.lat, destinationLocation.lng]
    : null;

  const edgePolylines = useMemo(() => {
    if (!Array.isArray(lines)) return [];
    const result: { positions: [number, number][]; color: string; lineName: string; isBus: boolean; lineId: number }[] = [];
    for (const line of lines) {
      const stopMap = new Map<number, TransitStop>();
      for (const stop of line.stops) stopMap.set(stop.stopId, stop);
      const isBus = line.mode === 'bus';
      const lineColor = isBus ? BUS_COLOR : (line.color.startsWith('#') ? line.color : `#${line.color}`);
      for (const edge of line.edges) {
        const from = stopMap.get(edge.fromStopId);
        const to = stopMap.get(edge.toStopId);
        if (from && to) result.push({ positions: [[from.lat, from.lng], [to.lat, to.lng]], color: lineColor, lineName: line.lineName, isBus, lineId: line.lineId });
      }
    }
    return result.sort((a, b) => (a.isBus === b.isBus ? 0 : a.isBus ? -1 : 1));
  }, [lines]);

  const stopMarkers = useMemo(() => {
    if (!Array.isArray(lines)) return [];
    const map = new Map<string, { stop: TransitStop; lines: { name: string; color: string; mode: string }[] }>();
    for (const line of lines) {
      const isBus = line.mode === 'bus';
      if (isBus && line.lineId !== selectedLineId) continue;
      const lineColor = isBus ? BUS_COLOR : (line.color.startsWith('#') ? line.color : `#${line.color}`);
      for (const stop of line.stops) {
        const existing = map.get(stop.mbtaStopId);
        if (existing) {
          existing.lines.push({ name: line.lineName, color: lineColor, mode: line.mode });
        } else {
          map.set(stop.mbtaStopId, { stop, lines: [{ name: line.lineName, color: lineColor, mode: line.mode }] });
        }
      }
    }
    return Array.from(map.values());
  }, [lines, selectedLineId]);

  return (
    <div className="relative w-full h-full">
      {/* Map style picker */}
      <div className="absolute top-3 right-3 z-50 bg-white rounded-lg shadow border border-gray-200 p-2">
        <select
          value={currentStyle}
          onChange={(e) => setCurrentStyle(e.target.value)}
          className="text-xs text-gray-700 bg-transparent outline-none cursor-pointer"
        >
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <option key={key} value={key}>{style.name}</option>
          ))}
        </select>
      </div>

      <MapContainer
        center={originCoords ?? defaultCenter}
        zoom={originCoords ? 14 : 13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapController origin={originCoords} destination={destCoords} />
        <TileLayer
          url={MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].url}
          attribution={MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].attribution}
        />

        {/* Route polyline */}
        {routeGeometry && routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            color="#3b82f6"
            weight={5}
            opacity={0.85}
            dashArray="10, 6"
          />
        )}

        {/* Origin marker (green) */}
        {originCoords && (
          <>
            <Marker position={originCoords} icon={createOriginIcon()}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <b style={{ fontSize: 13 }}>📍 Your Location</b>
                  {originLocation?.address && (
                    <div style={{ fontSize: 11, color: '#444', marginTop: 4, lineHeight: 1.4 }}>
                      {originLocation.address}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
                    {originCoords[0].toFixed(6)}, {originCoords[1].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
            {userLocation?.accuracy && (
              <Circle center={originCoords} radius={userLocation.accuracy} color="#22c55e" weight={1} fillColor="#22c55e" fillOpacity={0.08} />
            )}
          </>
        )}

        {/* Destination marker (red pin) */}
        {destCoords && (
          <Marker position={destCoords} icon={createDestinationIcon()}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <b style={{ fontSize: 13 }}>🎯 Destination</b>
                {destinationLocation?.address && (
                  <div style={{ fontSize: 11, color: '#444', marginTop: 4, lineHeight: 1.4 }}>
                    {destinationLocation.address}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
                  {destCoords[0].toFixed(6)}, {destCoords[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Transit route edges */}
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

        {/* Stop markers */}
        {stopMarkers.map(({ stop, lines: stopLines }) => {
          const primaryLine = stopLines[0];
          const icon = createStopIcon(primaryLine.color, primaryLine.mode);
          return (
            <Marker key={`stop-${stop.mbtaStopId}`} position={[stop.lat, stop.lng]} icon={icon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <b style={{ fontSize: 14 }}>{stop.name}</b>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{stop.mbtaStopId}</div>
                  <div style={{ marginTop: 6 }}>
                    {stopLines.map((l, i) => (
                      <span key={i} style={{ display: 'inline-block', backgroundColor: l.color, color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, marginRight: 4, marginBottom: 4 }}>
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
    </div>
  );
};

export default MapClient;
