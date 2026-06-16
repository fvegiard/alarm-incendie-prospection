"use client";

import { Building2, MapPin, AlertTriangle, Layers, TrendingUp } from "lucide-react";

interface StatsPanelProps {
  total?: number;
  byCity?: Record<string, number>;
  byPriority?: Record<string, number>;
  bySegment?: Record<string, number>;
}

export default function StatsPanel({ 
  total = 0, 
  byCity = {}, 
  byPriority = {}, 
  bySegment = {} 
}: StatsPanelProps) {
  // Fallback simple cards if no data passed - will be overridden by parent usually
  const cities = Object.entries(byCity).length > 0 ? byCity : { Montréal: 0, Laval: 0, Longueuil: 0 };
  const priorities = Object.entries(byPriority).length > 0 ? byPriority : { "Très élevée": 0, "Élevée": 0, "Moyenne": 0, "Faible": 0 };
  const segments = Object.entries(bySegment).length > 0 ? bySegment : { "Commercial / institutionnel": 0, "Syndicat / condo": 0 };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</p>
            <p className="mt-1 text-4xl font-bold tracking-tighter text-zinc-900 dark:text-white">{total || Object.values(cities).reduce((a, b) => a + b, 0)}</p>
          </div>
          <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-950">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Buildings in inventory</p>
      </div>

      {/* By City */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">By City</p>
        </div>
        <div className="space-y-2">
          {Object.entries(cities).slice(0, 3).map(([city, count]) => (
            <div key={city} className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">{city}</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By Priority */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">By Priority</p>
        </div>
        <div className="space-y-2">
          {Object.entries(priorities).map(([prio, count]) => {
            const color = prio === "Très élevée" ? "text-red-600" : 
                          prio === "Élevée" ? "text-orange-600" : 
                          prio === "Moyenne" ? "text-yellow-600" : "text-green-600";
            return (
              <div key={prio} className="flex items-center justify-between text-sm">
                <span className={color}>{prio}</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Segment */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-violet-500" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">By Segment</p>
        </div>
        <div className="space-y-2">
          {Object.entries(segments).map(([seg, count]) => (
            <div key={seg} className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400 line-clamp-1">{seg}</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
