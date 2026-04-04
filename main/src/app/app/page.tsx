'use client';

import {useEffect, useState} from 'react';
import Map from "@/components/Map";
import Navbar from "@/components/Navbar";
import {Circle, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer} from "react-leaflet";
import "./page.css"

interface RawRouteData {
  "id": string;
  "type": string;
  "name": string;
  "color": string;
  "text_color": string;
  "description": string;
  "direction_names": string;
  "direction_destinations": string;
}

interface RouteData {
  "id": string;
  "name": string;
}

interface StopsData {
  "id": string;
  "name": string;
}

function sampleApi() {
  fetch('/linklinklinklink')
      .then(response => {
        response.json().then((data)=>{

        });
      })
      .catch(error => console.error(error));
}

function getStations(line: string) {
  fetch('/api/mbta/route/'+line+'/stops')
      .then(response => {
        let body = response.json();
      })
      .catch(error => console.error(error));
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [stops, setStops] = useState<StopsData[]>([]);
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch('/api/mbta/routes')
        .then(response => response.json())
        .then(body => {
          const routes: RouteData[] = body.routes.map((route:RawRouteData) => {
            return {
              id: route.id,
              name:route.name
            }
          });
          setRoutes(routes)
        });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black relative">
      {/* Simulation Time Display - Top Right */}
      <div id="simTimeDisplay">{formatTime(timeOfDay)}</div>

      {/* Main Content - Full screen map */}
      <main className="h-screen">
        <div className="w-full h-full">
          <Map />
        </div>
      </main>

      {/* Score Display - Bottom Center */}
      <div id="scoreDisplay">
        <span className="score-label">Score</span>
        <span className="score-value">{score}</span>
      </div>

      <div id="bottomNavBar">
        <div className="settings-wrapper">
          <button>Settings</button>
          <div className="settings-popup">
            <div className="settings-popup-title">Settings</div>
            <div className="settings-section">
              <label className="settings-label">
                Time of Day
              </label>
              <input
                type="range"
                min={0}
                max={1439}
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(Number(e.target.value))}
                className="settings-slider"
              />
              <div className="settings-time-display">{formatTime(timeOfDay)}</div>
            </div>
          </div>
        </div>
        <button>Calculate</button>
        <button>Edit Stops</button>
        <button>Heatmap</button>
        <button>More Analysis</button>
      </div>
      <div id="bottomNavBar">
        <div className="settings-wrapper">
          <button>Settings</button>
          <div className="settings-popup">
            <div className="settings-popup-title">Settings</div>
            <div className="settings-section">
              <label className="settings-label">
                Time of Day
              </label>
              <input
                type="range"
                min={0}
                max={1439}
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(Number(e.target.value))}
                className="settings-slider"
              />
              <div className="settings-time-display">{formatTime(timeOfDay)}</div>
            </div>
          </div>
        </div>
        <button>Calculate</button>
        <button>Edit Stops</button>
        <button>Heatmap</button>
        <button>More Analysis</button>
      </div>
    </div>
  );
}