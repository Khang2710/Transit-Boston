'use client';

import { useEffect, useState, useCallback } from 'react';
import Map from '@/components/Map';
import Navbar from '@/components/Navbar';
import FareCalculator from '@/components/FareCalculator';
import type { TransitLine } from '@/types/transit';

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, '0')} ${period}`;
}

function computeScore(distanceMi: number | null, routeCount: number): number {
  if (distanceMi === null) return Math.min(90, routeCount * 5);
  if (distanceMi < 0.5) return 90;
  if (distanceMi < 1.5) return 75;
  if (distanceMi < 3) return 55;
  if (distanceMi < 6) return 35;
  return 20;
}

function getScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Excellent', color: '#16a34a', bg: '#f0fdf4' };
  if (score >= 60) return { label: 'Good', color: '#d97706', bg: '#fffbeb' };
  if (score >= 40) return { label: 'Fair', color: '#ea580c', bg: '#fff7ed' };
  return { label: 'Poor', color: '#dc2626', bg: '#fef2f2' };
}

interface LatLng { lat: number; lng: number; }

export interface RouteSegment {
  lineId: string;
  lineName: string;
  mode: string;
  color: string;
  stops: { name: string; lat: number; lng: number }[];
}

export default function Home() {
  const [lines, setLines] = useState<TransitLine[]>([]);
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [activeMode, setActiveMode] = useState('Subway');

  // Origin = current GPS
  const [originCoords, setOriginCoords] = useState<LatLng | null>(null);
  const [originAddress, setOriginAddress] = useState<string | null>(null);
  const [isFetchingOrigin, setIsFetchingOrigin] = useState(false);

  // Destination = searched address
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string | null>(null);

  // Route state
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeDistanceMi, setRouteDistanceMi] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<string | null>(null);

  // Fetch transit lines
  useEffect(() => {
    fetch('/api/network?type=0,1,3')
      .then((r) => r.json())
      .then((data) => setLines(Array.isArray(data) ? data : (data.lines ?? [])))
      .catch((err) => console.error('Error fetching network:', err));
  }, []);

  // Detect origin GPS + reverse geocode
  useEffect(() => {
    const fallbackLocation = () => {
      setOriginCoords({ lat: 42.3551, lng: -71.0656 });
      setOriginAddress("Boston Common, Boston, MA (Fallback)");
      setIsFetchingOrigin(false);
    };

    if (!navigator.geolocation) {
      fallbackLocation();
      return;
    }
    
    setIsFetchingOrigin(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginCoords({ lat, lng });
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await r.json();
          setOriginAddress(data.display_name ?? "Current Location");
        } catch {
          setOriginAddress("Current Location");
        }
        finally { setIsFetchingOrigin(false); }
      },
      (error) => {
        console.warn("GPS Error:", error);
        fallbackLocation();
      },
      { timeout: 5000 }
    );
  }, []);

  // Fetch actual transit route from backend Dijkstra endpoint
  const fetchRoute = useCallback(async (origin: LatLng, dest: LatLng) => {
    setIsFetchingRoute(true);
    setRouteGeometry(null);
    setRouteDistanceMi(null);
    setRouteDurationMin(null);
    setRouteSegments(null);
    setRouteSummary(null);

    // Fallback Haversine estimate
    const R = 3958.8;
    const dLat = (dest.lat - origin.lat) * Math.PI / 180;
    const dLon = (dest.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(origin.lat*Math.PI/180)*Math.cos(dest.lat*Math.PI/180)*Math.sin(dLon/2)**2;
    const straightMi = R * 2 * Math.asin(Math.sqrt(a));
    const fallbackMi = straightMi * 1.4;
    const fallbackMin = Math.round((fallbackMi / 15) * 60 + 5);

    try {
      const res = await fetch('http://localhost:5777/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originLat: origin.lat, originLng: origin.lng, destLat: dest.lat, destLng: dest.lng }),
      });
      if (!res.ok) throw new Error(`Route API ${res.status}`);
      const data: { segments: RouteSegment[]; totalDistanceMi: number; totalStops: number; transfers: number; summary: string } = await res.json();

      if (data.segments && data.segments.length > 0) {
        setRouteSegments(data.segments);
        setRouteSummary(data.summary);
        // Build flat geometry for MapController bounds
        const coords: [number, number][] = data.segments.flatMap(seg =>
          seg.stops.map((s: { lat: number; lng: number }) => [s.lat, s.lng] as [number, number])
        );
        setRouteGeometry(coords);
        setRouteDistanceMi(data.totalDistanceMi > 0 ? data.totalDistanceMi : fallbackMi);
        // Estimate time: 30s per stop + 5 min wait
        setRouteDurationMin(Math.round(data.totalStops * 0.5 + 5));
      } else {
        // No backend path found → show straight line fallback
        console.warn('No transit route found, using straight-line estimate');
        setRouteGeometry([[origin.lat, origin.lng], [dest.lat, dest.lng]]);
        setRouteDistanceMi(fallbackMi);
        setRouteDurationMin(fallbackMin);
      }
    } catch (e) {
      console.error('Route fetch error', e);
      // Graceful fallback
      setRouteGeometry([[origin.lat, origin.lng], [dest.lat, dest.lng]]);
      setRouteDistanceMi(fallbackMi);
      setRouteDurationMin(fallbackMin);
    } finally {
      setIsFetchingRoute(false);
    }
  }, []);

  // Handle destination search from Navbar
  const handleSearch = useCallback(async (query: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.length > 0) {
        const dest: LatLng = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setDestinationCoords(dest);
        setDestinationAddress(data[0].display_name);
        if (originCoords) fetchRoute(originCoords, dest);
      }
    } catch (e) { console.error('Search error:', e); }
  }, [originCoords, fetchRoute]);

  // Non-subway lines for route count
  const relevantLineCount = lines.length;
  const score = computeScore(routeDistanceMi, relevantLineCount);
  const scoreInfo = getScoreLabel(score);

  const metrics = [
    {
      iconBg: 'bg-blue-50',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      ),
      label: 'Distance',
      value: routeDistanceMi !== null ? `${routeDistanceMi.toFixed(2)} mi` : (destinationCoords ? '—' : '0.32 mi'),
    },
    {
      iconBg: 'bg-green-50',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      ),
      label: 'Est. Travel Time',
      value: isFetchingRoute ? 'Calculating…' : (routeDurationMin !== null ? `~${routeDurationMin} min` : '5-8 min'),
    },
    {
      iconBg: 'bg-purple-50',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      ),
      label: 'Available Routes',
      value: relevantLineCount > 0 ? `${relevantLineCount}` : '—',
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar activeMode={activeMode} onModeChange={setActiveMode} onSearchText={handleSearch} />

      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '57px' }}>
        {/* ── Left Sidebar ── */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-3">

            {/* Transit Score */}
            <div className="rounded-xl p-4" style={{ background: scoreInfo.bg }}>
              <p className="text-xs font-semibold text-gray-500 mb-1">Transit Score</p>
              <p className="text-4xl font-black leading-none" style={{ color: scoreInfo.color }}>{score}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
            </div>

            {/* Your Location (GPS) */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Your Location</p>
              <div className="flex items-start gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                  className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
                <div className="min-w-0 flex-1">
                  {isFetchingOrigin ? (
                    <p className="text-xs text-green-600">Detecting...</p>
                  ) : originAddress ? (
                    <p className="text-xs text-green-700 font-medium truncate" title={originAddress}>{originAddress}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Location unavailable</p>
                  )}
                  {originCoords && (
                    <p className="text-[10px] text-green-400 font-mono mt-0.5">
                      {originCoords.lat.toFixed(4)}°N, {Math.abs(originCoords.lng).toFixed(4)}°W
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Destination */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Destination</p>
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${destinationCoords ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${destinationCoords ? 'text-blue-500' : 'text-gray-300'}`}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div className="min-w-0 flex-1">
                  {destinationAddress ? (
                    <p className="text-xs text-blue-700 font-medium truncate" title={destinationAddress}>{destinationAddress}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Search a destination above ↑</p>
                  )}
                  {destinationCoords && (
                    <p className="text-[10px] text-blue-400 font-mono mt-0.5">
                      {destinationCoords.lat.toFixed(4)}°N, {Math.abs(destinationCoords.lng).toFixed(4)}°W
                    </p>
                  )}
                  {isFetchingRoute && (
                    <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                      <svg className="animate-spin h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0" fill="currentColor"/></svg>
                      Calculating route…
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-3 h-0.5 bg-gray-300 rounded" />
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Key Metrics</span>
                <div className="flex-1 h-0.5 bg-gray-100 rounded" />
              </div>
              <div className="space-y-2">
                {metrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className={`w-7 h-7 ${m.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {m.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">{m.label}</p>
                      <p className="text-sm font-bold text-gray-900">{m.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sim Time */}
            <div className="px-3 py-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-widest">Sim Time</p>
              <p className="text-sm font-mono font-bold text-gray-800 mb-2">{formatTime(timeOfDay)}</p>
              <input type="range" min={0} max={1439} value={timeOfDay}
                onChange={(e) => setTimeOfDay(Number(e.target.value))}
                className="w-full cursor-pointer accent-blue-500" />
            </div>

            {/* Fare Estimator */}
            <div className="border-t border-gray-100 pt-3">
              <FareCalculator />
            </div>
          </div>
        </aside>

        {/* ── Map Area ── */}
        <main className="flex-1 relative">
          <Map
            lines={lines}
            originLocation={originCoords ? { lat: originCoords.lat, lng: originCoords.lng, address: originAddress || '' } : null}
            destinationLocation={destinationCoords ? { lat: destinationCoords.lat, lng: destinationCoords.lng, address: destinationAddress || '' } : null}
            routeGeometry={routeGeometry}
            filterMode={activeMode}
            routeSegments={routeSegments}
          />
        </main>
      </div>
    </div>
  );
}
