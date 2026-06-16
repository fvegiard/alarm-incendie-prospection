"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { buildings, getCity } from "@/lib/data";
import BuildingCard from "@/components/BuildingCard";
import FilterBar from "@/components/FilterBar";
import {
  applyFilters,
  computeCounts,
  parseFilters,
} from "@/components/FilterBar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function BuildingsPage() {
  return (
    <Suspense fallback={<BuildingsSkeleton />}>
      <BuildingsInner />
    </Suspense>
  );
}

function BuildingsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mb-6 h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

function BuildingsInner() {
  const searchParams = useSearchParams();
  const filterState = parseFilters(searchParams);
  const counts = computeCounts(buildings);
  const filtered = applyFilters(buildings, filterState);

  // Pagination from URL or default 1
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);

  const start = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(Math.max(1, Math.min(totalPages, newPage))));
    // Use replace to keep history clean
    window.history.replaceState(null, "", `?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Immeubles
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {filtered.length} immeuble{filtered.length !== 1 ? "s" : ""} • Prospection alarme incendie
          </p>
        </div>

        {/* FilterBar at top */}
        <div className="mb-6">
          <FilterBar counts={counts} />
        </div>

        {/* Results summary */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {filtered.length} résultats • Page {page} / {totalPages}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} sur {filtered.length}
          </span>
        </div>

        {/* Grid of BuildingCard: 1 column mobile, 3 columns desktop */}
        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {paginated.map((building) => (
              <BuildingCard key={building.id} building={building} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-lg font-medium text-zinc-900 dark:text-white">Aucun immeuble trouvé</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Essayez d'ajuster les filtres ou la recherche.
            </p>
          </div>
        )}

        {/* Pagination: 20 buildings per page with prev/next buttons */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Affichage {start + 1} à {Math.min(start + PAGE_SIZE, filtered.length)} sur {filtered.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updatePage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>

              <div className="select-none rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {page} / {totalPages}
              </div>

              <button
                onClick={() => updatePage(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
