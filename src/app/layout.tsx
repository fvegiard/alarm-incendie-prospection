import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Building2, MapPin } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DRÉlectrique — Prospection Alarme Incendie 2026",
  description: "Tableau de bord prospection alarmes incendie - DRÉlectrique 2026",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="antialiased bg-zinc-950 text-zinc-200 font-sans">
        <div className="flex h-screen overflow-hidden">
          {/* Dark Sidebar Nav */}
          <aside className="w-64 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">DR</span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-lg tracking-tight">DRÉlectrique</div>
                  <div className="text-[10px] text-zinc-500 -mt-0.5">PROSPECTION ALARME INCENDIE</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-auto">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-zinc-800 text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/buildings"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              >
                <Building2 className="h-4 w-4" />
                Buildings
              </Link>
              <Link
                href="/map"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Map
              </Link>
            </nav>

            <div className="p-4 border-t border-zinc-800 text-[10px] text-zinc-500">
              522 buildings • 2026
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur flex items-center px-6 text-sm text-zinc-400 flex-shrink-0">
              DRÉlectrique — Prospection Alarme Incendie 2026
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
