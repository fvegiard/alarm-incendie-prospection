"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Map as MapIcon,
  Settings,
  Flame,
  ChevronRight,
} from "lucide-react";

const nav = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/buildings", label: "Immeubles", icon: Building2 },
  { href: "/map", label: "Carte", icon: MapIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-zinc-200 bg-zinc-950 lg:flex dark:border-zinc-800">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white">
            DRÉlectrique
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Alarme incendie 2026
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {nav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? "text-rose-400" : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                {item.label}
              </div>
              {isActive && (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-xl bg-zinc-900 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Campagne 2026
          </div>
          <p className="mb-3 text-sm text-zinc-300">
            522 immeubles ciblés dans la grande région de Montréal.
          </p>
          <Link
            href="/buildings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            Explorer
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="border-t border-zinc-800 px-4 py-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
          <Settings className="h-5 w-5" />
          Paramètres
        </button>
      </div>
    </aside>
  );
}
