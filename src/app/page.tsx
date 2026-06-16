"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildings,
  cityStats,
  getAddress,
  getImageUrl,
  getStreetViewUrl,
  priorityStyles,
  recentBuildings,
} from "@/lib/data";
import StatsPanel from "@/components/StatsPanel";
import { Building2, MapPin, Search, ArrowRight, Flame, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const recent = recentBuildings(8);
  const cities = cityStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/buildings?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <Flame className="h-3.5 w-3.5" />
            Campagne de prospection 2026
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Tableau de bord
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Suivez les immeubles prioritaires pour les alarmes incendie dans la grande région de Montréal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/buildings"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Building2 className="h-4 w-4" />
            Voir les immeubles
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
          >
            <MapPin className="h-4 w-4" />
            Carte
          </Link>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un immeuble, une adresse, une zone..."
          className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-32 text-base text-zinc-900 shadow-sm ring-1 ring-zinc-200 outline-none transition-all placeholder:text-zinc-500 focus:ring-2 focus:ring-rose-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
        >
          Rechercher
        </button>
      </form>

      {/* Stats */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Vue d'ensemble
          </h2>
        </div>
        <StatsPanel />
      </section>

      {/* Cities */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Territoires
            </h2>
          </div>
          <Link
            href="/map"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Voir sur la carte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cities.map((c) => (
            <Link
              key={c.city}
              href={`/buildings?city=${encodeURIComponent(c.city)}`}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-zinc-200 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-zinc-900 dark:ring-zinc-800"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.color} text-white shadow-sm`}>
                <MapPin className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {c.count}
              </div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {c.city}
              </div>
              <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-zinc-300 opacity-0 transition-all group-hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-700 dark:group-hover:text-zinc-300" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent buildings */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Immeubles récents
            </h2>
          </div>
          <Link
            href="/buildings"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Tout voir
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((building) => (
            <RecentCard key={building.id} building={building} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RecentCard({ building }: { building: import("@/lib/data").Building }) {
  const priorityStyle = priorityStyles[building.priorite];
  const imageUrl = getImageUrl(building) || getStreetViewUrl(building, 600, 400);

  return (
    <Link
      href={`/buildings/${building.id}`}
      className="group flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-zinc-200 transition-all hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800"
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={imageUrl}
          alt={building.immeuble}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
            target.parentElement?.classList.add(
              "bg-gradient-to-br",
              "from-zinc-200",
              "to-zinc-300",
              "dark:from-zinc-700",
              "dark:to-zinc-800"
            );
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className={`mb-1.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyle.badge}`}>
          {building.priorite}
        </span>
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {building.immeuble}
        </h3>
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {getAddress(building)}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {building.etages} étages · {building.annee}
        </p>
      </div>
    </Link>
  );
}
