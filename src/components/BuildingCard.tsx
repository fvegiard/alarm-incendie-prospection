"use client";

import Link from "next/link";
import { Building } from "@/lib/data";
import { generateStreetViewUrl } from "@/lib/google-streetview";
import { MapPin, Layers, Calendar, Flame, Tag } from "lucide-react";

interface BuildingCardProps {
  building: Building;
}

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  "Très élevée": { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  "Élevée": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  "Moyenne": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  "Faible": { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
};

const defaultPriority = { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };

export default function BuildingCard({ building }: BuildingCardProps) {
  const address = `${building.name}, ${building.zone || "Montréal"}, QC`;
  let streetViewUrl: string;
  try {
    streetViewUrl = generateStreetViewUrl(building.latitude, building.longitude);
  } catch {
    streetViewUrl = `https://placehold.co/600x400?text=${encodeURIComponent(building.name)}`;
  }
  const priority = building.priority || "Faible";
  const colors = priorityColors[priority] || defaultPriority;
  const fireStatus = building.fire_system_status || "Inconnu";

  return (
    <Link
      href={`/buildings/${building.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-zinc-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900 dark:ring-zinc-800"
    >
      {/* Street View Image */}
      <div className="relative h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={streetViewUrl}
          alt={`Street view of ${building.name}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = "https://placehold.co/600x400?text=No+Image";
          }}
        />
        
        {/* Priority Badge */}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {priority}
          </span>
        </div>

        {/* Segment Tag */}
        {building.segment && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-900/90 dark:text-zinc-200">
              <Tag className="h-3 w-3" />
              {building.segment}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100">
          {building.name}
        </h3>
        
        <div className="mb-3 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>

        {/* Meta row: floors, year, fire_system_status */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <Layers className="h-4 w-4 text-zinc-400" />
            <span className="font-medium">{building.floors}</span>
            <span className="text-xs text-zinc-500">floors</span>
          </div>

          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span className="font-medium">{building.year_built}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {fireStatus}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
