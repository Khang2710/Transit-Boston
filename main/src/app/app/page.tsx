'use client';

import {useEffect, useState} from 'react';
import Map from "@/components/Map";
import Navbar from "@/components/Navbar";
import {Circle, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer} from "react-leaflet";

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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [stops, setStops] = useState<StopsData[]>([]);

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
          setRoutes(routes);
        });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black relative">
      {/* Navbar Component */}
      <Navbar onMenuToggle={setSidebarOpen} />

      {/* Routes Selector */}
      <div className="absolute top-70 left-4 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-3">
        <h1 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Stations
        </h1>
        <div className="flex flex-col">
          <div id="routes-list">
            {stops.length > 0 ? (
              // Show stops when available
              <>
                <button
                    className="mb-1 text-blue-500 underline cursor-pointer hover:text-blue-700"
                    onClick={() => setStops([])}
                >
                  ← Back to routes
                </button>
                <h3 className="font-semibold mb-2">Stops for selected route:</h3>
                {stops.map((stop, index) => (
                  <div key={index} className="ml-4 text-gray-400">
                    {stop.name}
                  </div>
                ))}
              </>
            ) : (
              // Show routes when no stops are selected
              <>
                <p>Routes count: {routes?.length || 0}</p>
                {routes.map((route, index) => (
                  <div 
                    key={index} 
                    data-id={route.id}
                    className="text-blue-400 underline cursor-pointer hover:text-blue-500"
                    onClick={async (elem) => {
                      const id = elem.currentTarget.dataset.id;
                      if (id) {
                        try {
                          const response = await fetch(`/api/mbta/route/${id}/stops`);
                          const body = await response.json();
                          
                          // Parse stops data
                          const stopsData: StopsData[] = body.stops?.map((stop: any) => ({
                            id: stop.id,
                            name: stop.name
                          })) || [];
                          
                          setStops(stopsData);
                        } catch (error) {
                          console.error('Error fetching stops:', error);
                        }
                      }
                    }}
                  >
                    {route.name}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 pt-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-black dark:text-white">Map Options</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Layers</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 rounded" defaultChecked />
                  <span className="text-gray-700 dark:text-gray-300">Train Routes</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 rounded" defaultChecked />
                  <span className="text-gray-700 dark:text-gray-300">Bus Routes</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 rounded" />
                  <span className="text-gray-700 dark:text-gray-300">Stops</span>
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Display Options</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Map Style</label>
                  <select className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white">
                    <option>Standard</option>
                    <option>Satellite</option>
                    <option>Terrain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Zoom Level</label>
                  <input type="range" min="1" max="18" defaultValue="13" className="w-full" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Data Sources</h3>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Refresh Data
                </button>
                <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  Load MBTA Routes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content - Full screen map */}
      <main className="h-screen">
        <div className="w-full h-full">
          <Map />
        </div>
      </main>
    </div>
  );
}