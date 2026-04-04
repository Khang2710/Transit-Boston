'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';

// Location state interface
interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

// Create custom marker icons
const createCustomIcon = (color: string = '#3388ff', shape: string = 'default') => {
  if (shape === 'triangle') {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path d="M12 2 L22 20 L2 20 Z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="14" r="3" fill="white"/>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  if (shape === 'square') {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <rect x="4" y="4" width="16" height="16" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  if (shape === 'star') {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
                fill="${color}" stroke="white" stroke-width="1"/>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  // User location marker (special pulsing dot)
  if (shape === 'user') {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="8" fill="${color}" fill-opacity="0.3"/>
          <circle cx="12" cy="12" r="5" fill="${color}" fill-opacity="0.7"/>
          <circle cx="12" cy="12" r="2" fill="${color}"/>
        </svg>
      `)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const customIcons = {
  redTriangle: createCustomIcon('#ff0000', 'triangle'),
  blueSquare: createCustomIcon('#0066cc', 'square'),
  greenStar: createCustomIcon('#00aa00', 'star'),
  purpleCircle: createCustomIcon('#9900cc', 'default'),
  orangeTriangle: createCustomIcon('#ff6600', 'triangle'),
  userLocation: createCustomIcon('#4CAF50', 'user')
};

// Map styles
const MAP_STYLES = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cartoVoyager: {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartoLight: {
    name: 'CartoDB Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartoDark: {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  stamenToner: {
    name: 'Stamen Toner',
    url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  },
  stamenTerrain: {
    name: 'Stamen Terrain',
    url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
  },
  esriWorld: {
    name: 'Esri World Street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }
};

// Sample vector data for demonstration
const sampleVectors = {
  // Polyline - connects points in order (like a bus route)
  routeLine: [
    [42.3601, -71.0589] as [number, number],  // Boston Common
    [42.3584, -71.0638] as [number, number],  // Downtown Crossing
    [42.3550, -71.0605] as [number, number],  // South Station
    [42.3523, -71.0556] as [number, number]   // Chinatown
  ],

  // Polygon - closed shape (like a park boundary)
  parkArea: [
    [42.3665, -71.0711] as [number, number],
    [42.3655, -71.0685] as [number, number],
    [42.3635, -71.0695] as [number, number],
    [42.3645, -71.0721] as [number, number]
  ],

  // Points for markers
  transitPoints: [
    { position: [42.3584, -71.0638] as [number, number], name: "Downtown Crossing Station", type: "subway", icon: customIcons.redTriangle },
    { position: [42.3550, -71.0605] as [number, number], name: "South Station", type: "train", icon: customIcons.blueSquare },
    { position: [42.3665, -71.0711] as [number, number], name: "Boston Common", type: "park", icon: customIcons.greenStar },
    { position: [42.3523, -71.0556] as [number, number], name: "Chinatown", type: "neighborhood", icon: customIcons.purpleCircle },
    { position: [42.3635, -71.0695] as [number, number], name: "Transit Hub", type: "hub", icon: customIcons.orangeTriangle }
  ]
};


const MapClient = () => {
  const position: [number, number] = [42.3601, -71.0589];
  const [currentStyle, setCurrentStyle] = useState('cartoVoyager');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Get user location
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
        let errorMessage = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Unknown location error';
            break;
        }
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Auto-get location on mount
  useEffect(() => {
    getUserLocation();

  }, []);

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
              <div className="text-red-600 text-xs p-2 bg-red-50 rounded">
                {locationError}
              </div>
          )}

          {userLocation && (
              <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                <div>Lat: {userLocation.lat.toFixed(6)}</div>
                <div>Lng: {userLocation.lng.toFixed(6)}</div>
                <div>Accuracy: ±{Math.round(userLocation.accuracy || 0)}m</div>
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
              <option key={key} value={key}>
                {style.name}
              </option>
          ))}
        </select>
      </div>

      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : position}
        zoom={userLocation ? 15 : 13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url={MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].url}
          attribution={MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].attribution}
        />

        {/* User Location Marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={customIcons.userLocation}
            >
              <Popup>
                <b>Your Location</b><br/>
                Lat: {userLocation.lat.toFixed(6)}<br/>
                Lng: {userLocation.lng.toFixed(6)}<br/>
                Accuracy: ±{Math.round(userLocation.accuracy || 0)} meters<br/>
                {userLocation.timestamp && `Time: ${new Date(userLocation.timestamp).toLocaleTimeString()}`}
              </Popup>
            </Marker>

            {/* Accuracy circle */}
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

        {/* Default marker */}
        <Marker position={position}>
          <Popup>
            <b>Boston, MA</b><br/>
            Welcome to Transit Explorer<br/>
            Current Style: {MAP_STYLES[currentStyle as keyof typeof MAP_STYLES].name}<br/><br/>
            {!userLocation && <small>Click "My Location" to find your position</small>}
          </Popup>
        </Marker>
        
        {/* Vector examples */}
        <Polyline
          positions={sampleVectors.routeLine}
          color="#ff0000"
          weight={4}
          opacity={0.7}
        />
        
        <Polygon
          positions={sampleVectors.parkArea}
          color="#00aa00"
          weight={2}
          fillColor="#00ff00"
          fillOpacity={0.3}
        />
        
        <Circle
          center={[42.3601, -71.0589]}
          radius={500}
          color="#0066cc"
          weight={2}
          fillColor="#3399ff"
          fillOpacity={0.2}
        />
        
        {/* Custom styled markers */}
        {sampleVectors.transitPoints.map((point, index) => (
          <Marker 
            key={index} 
            position={point.position as [number, number]}
            icon={point.icon}
          >
            <Popup>
              <b>{point.name}</b><br/>
              Type: {point.type}<br/>
              Coordinates: {point.position[0].toFixed(4)}, {point.position[1].toFixed(4)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapClient;