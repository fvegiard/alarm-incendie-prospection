"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

export interface FilterState {
  city: string;
  segment: string;
  priority: string;
  fireSystemStatus: string;
  search: string;
  sort: string;
}

interface FilterBarProps {
  counts: {
    city: Record<string, number>;
    segment: Record<string, number>;
    priority: Record<string, number>;
    fireSystemStatus: Record<string, number>;
  };
}

export const sortOptions = [
  { value: "priority", label: "Priority" },
  { value: "name", label: "Name" },
  { value: "year", label: "Year Built" },
  { value: "city", label: "City" },
];

export function parseFilters(searchParams: URLSearchParams): FilterState {
  return {
    city: searchParams.get("city") || "",
    segment: searchParams.get("segment") || "",
    priority: searchParams.get("priority") || "",
    fireSystemStatus: searchParams.get("fire_system_status") || "",
    search: searchParams.get("q") || "",
    sort: searchParams.get("sort") || "priority",
  };
}

export function applyFilters(buildings: any[], state: FilterState): any[] {
  let result = [...buildings];

  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    result = result.filter((b: any) =>
      (b.immeuble || "").toLowerCase().includes(q) ||
      (b.zone || "").toLowerCase().includes(q)
    );
  }

  if (state.city) {
    result = result.filter((b: any) => {
      const city = (b.zone || "").includes("Longueuil") ? "Longueuil" :
                   (b.zone || "").includes("Laval") ? "Laval" : "Montréal";
      return city === state.city;
    });
  }

  if (state.segment) {
    result = result.filter((b: any) => b.segment === state.segment);
  }

  if (state.priority) {
    result = result.filter((b: any) => b.priorite === state.priority);
  }

  if (state.fireSystemStatus) {
    result = result.filter((b: any) => (b.statut_public || "Inconnu") === state.fireSystemStatus);
  }

  // Simple sort
  if (state.sort === "name") {
    result.sort((a: any, b: any) => (a.immeuble || "").localeCompare(b.immeuble || ""));
  } else if (state.sort === "year") {
    result.sort((a: any, b: any) => (a.annee || 0) - (b.annee || 0));
  } else if (state.sort === "city") {
    result.sort((a: any, b: any) => (a.zone || "").localeCompare(b.zone || ""));
  } else {
    // priority default
    const pOrder: Record<string, number> = { "Très élevée": 1, "Élevée": 2, "Moyenne": 3, "Faible": 4 };
    result.sort((a: any, b: any) => (pOrder[a.priorite] || 5) - (pOrder[b.priorite] || 5));
  }

  return result;
}

export function computeCounts(buildings: any[]): FilterBarProps["counts"] {
  const city: Record<string, number> = {};
  const segment: Record<string, number> = {};
  const priority: Record<string, number> = {};
  const fireSystemStatus: Record<string, number> = {};

  buildings.forEach((b: any) => {
    const c = (b.zone || "").includes("Longueuil") ? "Longueuil" :
              (b.zone || "").includes("Laval") ? "Laval" : "Montréal";
    city[c] = (city[c] || 0) + 1;
    segment[b.segment] = (segment[b.segment] || 0) + 1;
    priority[b.priorite] = (priority[b.priorite] || 0) + 1;
    const fs = b.statut_public || "Inconnu";
    fireSystemStatus[fs] = (fireSystemStatus[fs] || 0) + 1;
  });

  return { city, segment, priority, fireSystemStatus };
}

export default function FilterBar({ counts }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = parseFilters(searchParams);

  const createQueryString = useCallback((updates: Partial<FilterState>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key === "fireSystemStatus" ? "fire_system_status" : key;
      if (value) {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
    });
    if (!updates.hasOwnProperty("page")) params.set("page", "1");
    return params.toString();
  }, [searchParams]);

  const update = (updates: Partial<FilterState>) => {
    router.push(`${pathname}?${createQueryString(updates)}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const activeFilters = [state.city, state.segment, state.priority, state.fireSystemStatus, state.search].filter(Boolean).length;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      {/* Horizontal bar layout */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search buildings..."
            className="w-full rounded-xl border-0 bg-zinc-100 py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-zinc-300 dark:bg-zinc-800 dark:focus:bg-zinc-900"
          />
        </div>

        {/* Filters - horizontal selects */}
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <select
            value={state.city}
            onChange={(e) => update({ city: e.target.value })}
            className="min-w-[120px] rounded-xl border-0 bg-zinc-100 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-zinc-300 dark:bg-zinc-800"
          >
            <option value="">City</option>
            {Object.keys(counts.city).sort().map((c) => (
              <option key={c} value={c}>{c} ({counts.city[c]})</option>
            ))}
          </select>

          <select
            value={state.segment}
            onChange={(e) => update({ segment: e.target.value })}
            className="min-w-[160px] rounded-xl border-0 bg-zinc-100 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-zinc-300 dark:bg-zinc-800"
          >
            <option value="">Segment</option>
            {Object.keys(counts.segment).sort().map((s) => (
              <option key={s} value={s}>{s} ({counts.segment[s]})</option>
            ))}
          </select>

          <select
            value={state.priority}
            onChange={(e) => update({ priority: e.target.value })}
            className="min-w-[110px] rounded-xl border-0 bg-zinc-100 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-zinc-300 dark:bg-zinc-800"
          >
            <option value="">Priority</option>
            {Object.keys(counts.priority).sort().map((p) => (
              <option key={p} value={p}>{p} ({counts.priority[p]})</option>
            ))}
          </select>

          <select
            value={state.fireSystemStatus}
            onChange={(e) => update({ fireSystemStatus: e.target.value })}
            className="min-w-[140px] rounded-xl border-0 bg-zinc-100 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-zinc-300 dark:bg-zinc-800"
          >
            <option value="">Fire Status</option>
            {Object.keys(counts.fireSystemStatus).sort().map((f) => (
              <option key={f} value={f}>{f} ({counts.fireSystemStatus[f]})</option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={state.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="rounded-xl border-0 bg-zinc-100 px-3 py-2.5 text-sm font-medium outline-none ring-1 ring-transparent focus:ring-zinc-300 dark:bg-zinc-800"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
