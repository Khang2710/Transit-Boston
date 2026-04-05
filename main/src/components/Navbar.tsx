'use client';

import { useState, useRef, useEffect } from 'react';

interface NavbarProps {
  activeMode?: string;
  onModeChange?: (mode: string) => void;
  onSearchText?: (search: string) => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function Navbar({ activeMode, onModeChange, onSearchText }: NavbarProps) {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(activeMode || 'Subway');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=us`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch { /* silent */ }
      finally { setIsSearching(false); }
    }, 350);
  };

  const selectSuggestion = (s: Suggestion) => {
    setSearch(s.display_name.split(',').slice(0, 2).join(','));
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchText?.(s.display_name);
  };

  const handleMode = (mode: string) => {
    setActive(mode);
    onModeChange?.(mode);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 px-5 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-max">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="font-bold text-gray-900 text-sm leading-none">Transit Shark</p>
            <p className="text-xs text-gray-400">Accessibility Insights</p>
          </div>
        </div>

        {/* Destination Search */}
        <div className="flex-1 max-w-sm" ref={wrapperRef}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            {isSearching && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <input
              type="text"
              placeholder="Enter destination..."
              value={search}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' && search.trim()) { setShowSuggestions(false); onSearchText?.(search.trim()); } }}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder-gray-400 text-gray-800"
            />
            {/* Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-[999] overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => selectSuggestion(s)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                      className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    <span className="text-xs text-gray-700 leading-snug line-clamp-2">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mode toggle buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => handleMode('Bus')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${active === 'Bus' ? 'bg-gray-700 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
            Bus
          </button>
          <button onClick={() => handleMode('Subway')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 shadow ${active === 'Subway' ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={active === 'Subway' ? { background: 'linear-gradient(135deg, #a855f7, #8b5cf6)' } : {}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 5.4.46 5.87 1H6.13C6.6 4.46 8.49 4 12 4zM6 7h5v5H6V7zm7 0h5v5h-5V7zM8.5 17c-.83 0-1.5-.67-1.5-1.5S7.67 14 8.5 14s1.5.67 1.5 1.5S9.33 17 8.5 17zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            Subway
          </button>
          <button onClick={() => handleMode('Heatmap')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 shadow ${active === 'Heatmap' ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={active === 'Heatmap' ? { background: 'linear-gradient(135deg, #f97316, #ef4444)' } : {}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z"/>
            </svg>
            Heatmap
          </button>
        </div>
      </div>
    </header>
  );
}