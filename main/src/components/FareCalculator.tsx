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
      setError('Please select at least one transit mode.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFareResult(null);

    try {
      const response = await fetch('http://localhost:8080/api/fares/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripModes: selectedModes, isReducedFare }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: FareResult = await response.json();
      setFareResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fare estimate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-64 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        background: 'rgba(15, 15, 25, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span className="text-lg">🎫</span>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Fare Estimator</p>
          <p className="text-xs" style={{ color: '#7c8db0' }}>MBTA Passenger</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Mode selection */}
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#7c8db0' }}>
            Trip Mode
          </p>
          <div className="space-y-1.5">
            {TRANSIT_MODES.map(({ label, value, icon }) => {
              const active = selectedModes.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleMode(value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.25) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? '1px solid rgba(139,92,246,0.6)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#c4b5fd' : '#9ca3af',
                    transform: active ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: active ? '0 0 12px rgba(139,92,246,0.2)' : 'none',
                  }}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto text-xs font-bold" style={{ color: '#a78bfa' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reduced fare toggle */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-xs font-medium text-white">Reduced Fare</p>
            <p className="text-xs" style={{ color: '#7c8db0' }}>Student / Senior / TAP</p>
          </div>
          <button
            onClick={() => setIsReducedFare((v) => !v)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
            style={{
              background: isReducedFare
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.12)',
            }}
            aria-label="Toggle reduced fare"
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200"
              style={{ transform: isReducedFare ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
            />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="px-3 py-2 rounded-xl text-xs"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {fareResult && (
          <div
            className="px-3 py-3 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            <p className="text-2xl font-black tracking-tight" style={{ color: '#34d399' }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fareResult.totalFare)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#6ee7b7' }}>
              {fareResult.fareBreakdown}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleEstimate}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: isLoading
              ? 'rgba(99,102,241,0.4)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            boxShadow: isLoading ? 'none' : '0 4px 15px rgba(99,102,241,0.4)',
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
    </div>
  );
}
