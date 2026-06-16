"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import Link from "next/link";
import Image from "next/image";
import { Building, getAddress, getStreetViewUrl, priorityStyles } from "@/lib/data";
import { ArrowRight } from "lucide-react";

interface MapViewProps {
  buildings: Building[];
  height?: string;
  zoom?: number;
  center?: [number, number];
  showClustering?: boolean;
}

// Montreal area default center
const DEFAULT_CENTER: [number, number] = [45.5017, -73.5673];
const DEFAULT_ZOOM = 12;

function createCustomIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function ClusterLayer({
  buildings,
  groupRef,
}: {
  buildings: Building[];
  groupRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // @ts-expect-error leaflet.markercluster adds this constructor
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        let color = "#10b981";
        if (count > 50) color = "#e11d48";
        else if (count > 20) color = "#f97316";
        else if (count > 5) color = "#f59e0b";
        return L.divIcon({
          html: `<div style="
              background-color: ${color};
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 3px solid white;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 12px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            ">${count}</div>`,
          className: "marker-cluster-custom",
          iconSize: [36, 36],
        });
      },
    });

    groupRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map, groupRef]);

  useEffect(() => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    group.clearLayers();

    buildings.forEach((building) => {
      const marker = L.marker(
        [building.latitude, building.longitude],
        {
          icon: createCustomIcon(
            priorityStyles[building.priorite]?.marker || "#10b981"
          ),
        }
      );

      marker.bindPopup(getPopupContent(building));
      group.addLayer(marker);
    });
  }, [buildings, groupRef]);

  return null;
}

function getPopupContent(building: Building): HTMLElement {
  const div = document.createElement("div");
  div.className = "w-64";

  const imageUrl = getStreetViewUrl(building, 280, 160);
  const address = getAddress(building);
  const priority = building.priorite;

  div.innerHTML = `
    <div class="overflow-hidden rounded-xl bg-white shadow-sm">
      <div class="relative h-28 w-full overflow-hidden bg-zinc-100">
        <img
          src="${imageUrl}"
          alt="${building.immeuble}"
          class="h-full w-full object-cover"
          onerror="this.style.display='none'; this.parentElement.classList.add('bg-gradient-to-br','from-zinc-200','to-zinc-300')"
        />
      </div>
      <div class="p-3">
        <h4 class="text-sm font-semibold text-zinc-900">${building.immeuble}</h4>
        <p class="mb-2 text-xs text-zinc-500">${address}</p>
        <div class="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <span class="h-1.5 w-1.5 rounded-full"></span>
          ${priority}
        </div>
        <a href="/buildings/${building.id}"
          class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          Voir fiche →
        </a>
      </div>
    </div>
  `;

  return div;
}

export default function MapView({
  buildings,
  height = "600px",
  zoom = DEFAULT_ZOOM,
  center = DEFAULT_CENTER,
  showClustering = true,
}: MapViewProps) {
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  // Fix default marker icon paths (Leaflet expects them in public/)
  useEffect(() => {
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    });
  }, []);

  if (buildings.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        style={{ height }}
      >
        Aucun immeuble à afficher.
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {showClustering ? (
          <ClusterLayer buildings={buildings} groupRef={groupRef} />
        ) : (
          buildings.map((building) => (
            <Marker
              key={building.id}
              position={[building.latitude, building.longitude]}
              icon={createCustomIcon(
                priorityStyles[building.priorite]?.marker || "#10b981"
              )}
            >
              <Popup className="min-w-[260px]">
                <BuildingPopup building={building} />
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
  );
}

function BuildingPopup({ building }: { building: Building }) {
  const imageUrl = getStreetViewUrl(building, 280, 160);
  const priorityStyle = priorityStyles[building.priorite];

  return (
    <div className="w-64">
      <div className="relative h-28 w-full overflow-hidden rounded-t-xl bg-zinc-100">
        <Image
          src={imageUrl}
          alt={building.immeuble}
          fill
          className="object-cover"
          unoptimized
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
            target.parentElement?.classList.add(
              "bg-gradient-to-br",
              "from-zinc-200",
              "to-zinc-300"
            );
          }}
        />
      </div>
      <div className="rounded-b-xl bg-white p-3 dark:bg-zinc-900">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {building.immeuble}
        </h4>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          {getAddress(building)}
        </p>
        <span
          className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyle.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
          {building.priorite}
        </span>
        <div className="mt-1">
          <Link
            href={`/buildings/${building.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Voir fiche
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
