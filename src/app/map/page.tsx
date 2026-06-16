"use client";

import { buildings, getAddress } from "@/lib/data";
import MapView from "@/components/MapView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MapPage() {
  const mapBuildings = buildings.map((b) => ({
    id: b.id,
    name: b.immeuble,
    address: getAddress(b),
    priority: b.priorite,
    latitude: b.latitude,
    longitude: b.longitude,
  }));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Link
            href="/buildings"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Carte interactive
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {buildings.length} immeubles • Prospection alarme incendie
            </p>
          </div>
        </div>

        <Link
          href="/buildings"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          Voir la liste
        </Link>
      </div>

      {/* Full page map */}
      <div className="flex-1 overflow-hidden">
        <MapView
          buildings={mapBuildings}
          height="100%"
          zoom={11}
        />
      </div>

      {/* Bottom legend bar */}
      <div className="border-t border-zinc-200 bg-white px-4 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center gap-6 text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Légende :</span>
          <div className="flex items-center gap-4">
            <LegendDot color="#e11d48" label="Très élevée" />
            <LegendDot color="#f97316" label="Élevée" />
            <LegendDot color="#f59e0b" label="Moyenne" />
            <LegendDot color="#10b981" label="Faible" />
          </div>
          <span className="ml-auto hidden text-[10px] sm:block">
            Cliquez sur un marqueur pour voir les détails • Zoom pour désagréger
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white dark:ring-zinc-800"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}
