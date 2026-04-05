'use client';

import { useState } from 'react';

interface FareResult {
  totalFare: number;
  fareBreakdown: string;
}

const TRANSIT_MODES = [
  { label: 'Local Bus', value: 'BUS', icon: '🚌' },
  { label: 'Subway', value: 'SUBWAY', icon: '🚇' },
  { label: 'Express Bus', value: 'EXPRESS', icon: '🚍' },
];

export default function FareCalculator() {
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [isReducedFare, setIsReducedFare] = useState(false);
  const [fareResult, setFareResult] = useState<FareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleEstimate = async () => {
    if (selectedModes.length === 0) {
      setError('Select at least one mode.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFareResult(null);

    try {
      const response = await fetch('http://localhost:5777/api/fares/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripModes: selectedModes, isReducedFare }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data: FareResult = await response.json();
      setFareResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch fare estimate.';
      console.error('Fetch error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
          className="w-3.5 h-3.5 text-green-500">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
        </svg>
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Fare Estimator</span>
      </div>

      {/* Transit mode buttons */}
      <div className="space-y-1.5 mb-3">
        {TRANSIT_MODES.map(({ label, value, icon }) => {
          const active = selectedModes.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleMode(value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 border ${
                active
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-medium'
              }`}
            >
              <span>{icon}</span>
              <span className="flex-1 text-left">{label}</span>
              {active && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                  className="w-4 h-4 text-blue-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Reduced fare toggle */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-700">Reduced Fare</p>
          <p className="text-xs text-gray-400">Student / Senior / TAP</p>
        </div>
        <button
          onClick={() => setIsReducedFare((v) => !v)}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none"
          style={{ background: isReducedFare ? '#3b82f6' : '#d1d5db' }}
          aria-label="Toggle reduced fare"
        >
          <span
            className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: isReducedFare ? 'translateX(1.15rem)' : 'translateX(0.2rem)' }}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 mb-2 rounded-lg text-xs text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      {/* Result card */}
      {fareResult && (
        <div className="px-3 py-3 mb-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">🚌</span>
            <div>
              <p className="text-xs font-semibold text-gray-500">Transit Fare</p>
              <p className="text-xl font-black text-red-500 leading-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fareResult.totalFare)}
                <span className="text-xs font-medium text-gray-400">/trip</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{fareResult.fareBreakdown}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estimate button */}
      <button
        onClick={handleEstimate}
        disabled={isLoading}
        className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: isLoading
            ? '#93c5fd'
            : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          boxShadow: isLoading ? 'none' : '0 2px 8px rgba(59,130,246,0.35)',
        }}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Estimating...
          </>
        ) : (
          'Estimate Fare'
        )}
      </button>
    </div>
  );
}
