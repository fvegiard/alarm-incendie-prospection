'use client';

// IMPORTANT: This component must be dynamically imported to avoid SSR issues with Leaflet.
// Usage example in parent:
// import dynamic from 'next/dynamic';
// const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

interface MapBuilding {
  id: number | string;
  name: string;
  address?: string | null;
  priority?: 'critical' | 'high' | 'medium' | 'low' | string | null;
  latitude: number | null;
  longitude: number | null;
}

interface MapViewProps {
  buildings: MapBuilding[];
  height?: string;
  zoom?: number;
  center?: [number, number];
}

const LAVAL_CENTER: [number, number] = [45.57, -73.65];
const DEFAULT_ZOOM = 11;

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444', // red
  high: '#f97316',     // orange
  medium: '#eab308',   // yellow
  low: '#22c55e',      // green
};

function getPriorityColor(priority: string | null | undefined): string {
  const p = (priority || 'low').toLowerCase();
  return PRIORITY_COLORS[p] || '#6b7280';
}

function createMarkerIcon(priority: string | null | undefined) {
  const color = getPriorityColor(priority);
  return L.divIcon({
    className: 'custom-priority-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        border: 3px solid #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

export default function MapView({
  buildings,
  height = '600px',
  zoom = DEFAULT_ZOOM,
  center = LAVAL_CENTER,
}: MapViewProps) {
  // Fix Leaflet default icon paths for Next.js (avoids 404s in client bundles)
  useEffect(() => {
    // @ts-expect-error - Leaflet icon url patching
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  const validBuildings = buildings.filter(
    (b) => typeof b.latitude === 'number' && typeof b.longitude === 'number'
  );

  if (validBuildings.length === 0) {
    return (
      <div
        className="flex h-[600px] w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
        style={{ height }}
      >
        No buildings to display on map.
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-hidden rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="z-0 bg-zinc-100"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validBuildings.map((building) => (
          <Marker
            key={building.id}
            position={[building.latitude!, building.longitude!]}
            icon={createMarkerIcon(building.priority)}
          >
            <Popup className="leaflet-popup">
              <div className="min-w-[220px] text-sm">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {building.name}
                </div>
                <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {building.address || 'Laval, QC'}
                </div>

                <div className="mt-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: getPriorityColor(building.priority) + '15',
                      color: getPriorityColor(building.priority),
                    }}
                  >
                    {building.priority || 'low'}
                  </span>
                </div>

                <div className="mt-2">
                  <Link
                    href={`/buildings/${building.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View building details →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
