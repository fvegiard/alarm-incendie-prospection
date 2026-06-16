'use client';

import { Building } from '@/lib/data';
import BuildingCard from './BuildingCard';

interface Props {
  buildings: Building[];
  view?: 'grid' | 'list';
}

export default function BuildingGrid({ buildings, view = 'grid' }: Props) {
  if (buildings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-slate-500">
        <p className="text-lg font-medium">Aucun immeuble trouvé</p>
        <p className="text-sm">Essayez d'ajuster les filtres ou la recherche.</p>
      </div>
    );
  }

  return (
    <div
      className={
        view === 'list'
          ? 'flex flex-col gap-4'
          : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {buildings.map((b) => (
        <BuildingCard key={b.id} building={b} />
      ))}
    </div>
  );
}
