import raw from "../../data.json";

export interface Building {
  id: number;
  rang: number | null;
  immeuble: string;
  hauteur_m: number;
  etages: number;
  annee: number;
  usage: string;
  latitude: number;
  longitude: number;
  zone: string;
  zone_lettre: string;
  age_2026: number;
  score_anciennete: number;
  score_usage: number;
  score_hauteur: number;
  score_total: number;
  priorite: Priority;
  statut_public: string;
  decideur_probable: string;
  angle_commercial: string;
  raison_priorisation: string;
  mode_action: ModeAction;
  segment: Segment;
  top25_ordre: number | null;
  condo_ordre: number | null;
  source_inventaire: string | null;
  source_rbq: string | null;
  source_proprietaires: string | null;
  image_url: string | null;
  contact_info: string;
  website: string | null;
  owner: string | null;
  management_company: string | null;
}

export type Priority = "Très élevée" | "Élevée" | "Moyenne" | "Faible";

export type Segment = "Commercial / institutionnel" | "Syndicat / condo";

export type ModeAction =
  | "Audit prioritaire"
  | "Veille légère"
  | "Validation documentaire"
  | "Audit + validation"
  | "Validation"
  | string;

export interface RawBuilding extends Record<string, unknown> {
  id?: number;
  coord?: [number, number];
}

function normalizeBuilding(rawItem: RawBuilding): Building {
  const latitude =
    typeof rawItem.latitude === "number"
      ? rawItem.latitude
      : Array.isArray(rawItem.coord)
      ? Number(rawItem.coord[0])
      : 0;

  const longitude =
    typeof rawItem.longitude === "number"
      ? rawItem.longitude
      : Array.isArray(rawItem.coord)
      ? Number(rawItem.coord[1])
      : 0;

  const priorite = String(rawItem.priorite || "Faible") as Priority;
  const segment = (rawItem.segment as Segment) || "Commercial / institutionnel";

  return {
    ...rawItem,
    id: Number(rawItem.id ?? 0),
    latitude,
    longitude,
    priorite,
    segment,
  } as Building;
}

export const data = raw as {
  meta: {
    total_tours: number;
    top_prioritaires: number;
    audit_ou_validation: number;
    commercial_institutionnel: number;
    condos_syndicats: number;
    date_generation: string;
    version_label: string;
    enriched_at: string;
    images_source: string;
    metadata_sources: string[];
  };
  inventory: RawBuilding[];
};

export const buildings: Building[] = data.inventory.map(normalizeBuilding);

export const meta = data.meta;

export function getBuildingById(id: number | string): Building | undefined {
  return buildings.find((b) => b.id === Number(id));
}

export function getCity(zone?: string): string {
  if (!zone) return "Montréal";
  if (/Longueuil/i.test(zone)) return "Longueuil";
  if (/Laval/i.test(zone)) return "Laval";
  if (/Brossard/i.test(zone)) return "Brossard";
  return "Montréal";
}

export function getAddress(building: Building): string {
  return `${building.immeuble}, ${getCity(building.zone)}, QC`;
}

export function getStreetViewUrl(
  building: Building,
  width = 800,
  height = 600
): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${building.latitude},${building.longitude}&key=YOUR_KEY`;
}

export function getImageUrl(building: Building): string | null {
  if (building.image_url && building.image_url.startsWith("http")) {
    return building.image_url;
  }
  if (building.image_url) {
    return `/${building.image_url}`;
  }
  return null;
}

export const priorityOrder: Record<Priority, number> = {
  "Très élevée": 1,
  Élevée: 2,
  Moyenne: 3,
  Faible: 4,
};

export const priorityStyles: Record<
  Priority,
  { badge: string; dot: string; marker: string }
> = {
  "Très élevée": {
    badge:
      "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800",
    dot: "bg-rose-600",
    marker: "#e11d48",
  },
  Élevée: {
    badge:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-800",
    dot: "bg-orange-500",
    marker: "#f97316",
  },
  Moyenne: {
    badge:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
    dot: "bg-amber-500",
    marker: "#f59e0b",
  },
  Faible: {
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
    dot: "bg-emerald-500",
    marker: "#10b981",
  },
};

export function cityStats(): { city: string; count: number; color: string }[] {
  const counts = new Map<string, number>();
  buildings.forEach((b) => {
    const city = getCity(b.zone);
    counts.set(city, (counts.get(city) || 0) + 1);
  });
  const colors = ["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500"];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([city, count], i) => ({ city, count, color: colors[i % colors.length] }));
}

export function priorityStats(): { priority: Priority; count: number }[] {
  const counts = new Map<Priority, number>();
  buildings.forEach((b) => {
    counts.set(b.priorite, (counts.get(b.priorite) || 0) + 1);
  });
  return (Object.keys(priorityOrder) as Priority[]).map((priority) => ({
    priority,
    count: counts.get(priority) || 0,
  }));
}

export function segmentStats(): { segment: Segment; count: number }[] {
  const counts = new Map<string, number>();
  buildings.forEach((b) => {
    counts.set(b.segment, (counts.get(b.segment) || 0) + 1);
  });
  return (["Commercial / institutionnel", "Syndicat / condo"] as Segment[]).map(
    (segment) => ({
      segment,
      count: counts.get(segment) || 0,
    })
  );
}

export function recentBuildings(limit = 8): Building[] {
  return [...buildings]
    .sort((a, b) => (b.rang ?? 9999) - (a.rang ?? 9999))
    .slice(0, limit);
}

export const filters = {
  cities: [...new Set(buildings.map((b) => getCity(b.zone)))].sort(),
  segments: [...new Set(buildings.map((b) => b.segment))].sort() as Segment[],
  priorities: [...new Set(buildings.map((b) => b.priorite))].sort(
    (a, b) => priorityOrder[a as Priority] - priorityOrder[b as Priority]
  ) as Priority[],
  zones: [...new Set(buildings.map((b) => b.zone))].sort(),
  fireSystemStatuses: ["À vérifier", "Inconnu", "Conforme", "Non conforme"],
};
