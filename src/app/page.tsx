"use client";

import { useState } from "react";
import Link from "next/link";
import { buildings, getCity } from "@/lib/data";
import { Search, Building2, MapPin, AlertTriangle, Users, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [query, setQuery] = useState("");

  // Hardcoded stats (as specified)
  const total = 522;

  const cityBreakdown = [
    { name: "Montréal", count: 217 },
    { name: "Longueuil", count: 168 },
    { name: "Laval", count: 124 },
    { name: "Brossard", count: 13 },
  ];

  const priorityBreakdown = [
    { name: "Très élevée", count: 5, color: "text-rose-400" },
    { name: "Élevée", count: 32, color: "text-orange-400" },
    { name: "Moyenne", count: 143, color: "text-amber-400" },
    { name: "Faible", count: 342, color: "text-emerald-400" },
  ];

  const segmentBreakdown = [
    { name: "Commercial / institutionnel", count: 279 },
    { name: "Syndicat / condo", count: 243 },
  ];

  // Recent buildings (from data, filtered by search)
  const baseRecent = [...buildings].slice(0, 8);
  const filteredRecent = query
    ? baseRecent.filter(
        (b) =>
          b.immeuble.toLowerCase().includes(query.toLowerCase()) ||
          b.zone.toLowerCase().includes(query.toLowerCase()) ||
          getCity(b.zone).toLowerCase().includes(query.toLowerCase())
      )
    : baseRecent;

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-950 px-3 py-1 text-xs font-medium text-rose-400 ring-1 ring-rose-900/50">
            CAMPAGNE 2026
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tighter">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Prospection alarmes incendie — région de Montréal
          </p>
        </div>
        <Link
          href="/buildings"
          className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          View all buildings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Building2 className="h-4 w-4" />
            TOTAL BUILDINGS
          </div>
          <div className="mt-3 text-6xl font-semibold tracking-[-2.5px] text-white">
            {total}
          </div>
          <div className="mt-1 text-xs text-emerald-400">All territories • up to date</div>
        </div>

        {/* 2. City Breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <MapPin className="h-4 w-4" />
            CITY BREAKDOWN
          </div>
          <div className="space-y-2 text-sm">
            {cityBreakdown.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-zinc-300">{c.name}</span>
                <span className="font-mono text-base text-zinc-100 tabular-nums">{c.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500">4 cities • 522 total</div>
        </div>

        {/* 3. Priority Breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <AlertTriangle className="h-4 w-4" />
            PRIORITY BREAKDOWN
          </div>
          <div className="space-y-2 text-sm">
            {priorityBreakdown.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <span className={p.color}>{p.name}</span>
                <span className="font-mono text-base text-zinc-100 tabular-nums">{p.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500">37 high priority</div>
        </div>

        {/* 4. Segment Breakdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
            <Users className="h-4 w-4" />
            SEGMENT BREAKDOWN
          </div>
          <div className="space-y-3 text-sm">
            {segmentBreakdown.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-zinc-300">{s.name}</span>
                <span className="font-semibold text-lg tabular-nums text-white">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-500">
            <span>Commercial</span>
            <span>Condo/Syndic</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buildings, zones or addresses..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-3 pl-11 pr-4 text-sm placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
        </div>
        {query && (
          <div className="mt-1 text-xs text-zinc-500 pl-1">
            Filtering recent buildings • {filteredRecent.length} matches
          </div>
        )}
      </div>

      {/* Recent Buildings Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent Buildings</h2>
          <Link
            href="/buildings"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecent.length > 0 ? (
            filteredRecent.map((building) => {
              const city = getCity(building.zone);
              return (
                <Link
                  key={building.id}
                  href={`/buildings/${building.id}`}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-block rounded px-2 py-0.5 font-medium ${
                        building.priorite.includes("Élevée") || building.priorite.includes("Très")
                          ? "bg-orange-950 text-orange-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {building.priorite}
                    </span>
                    <span className="text-zinc-500">#{building.id}</span>
                  </div>

                  <div className="mt-3 text-[15px] font-medium leading-snug text-white group-hover:text-rose-300 line-clamp-2 transition-colors">
                    {building.immeuble}
                  </div>

                  <div className="mt-2 text-xs text-zinc-400">
                    {city} • {building.etages} étages • {building.annee}
                  </div>

                  <div className="mt-2 truncate text-[10px] text-zinc-500">
                    {building.zone}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
              No buildings match your search.
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 text-center text-[10px] text-zinc-600">
        Data snapshot • 522 tours • DRÉlectrique 2026
      </div>
    </div>
  );
}
