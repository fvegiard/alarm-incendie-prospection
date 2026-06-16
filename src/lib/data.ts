import rawData from "../../data.json"; // static import for build-time compatibility with output: 'export'

export interface Building {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  floors: number;
  year_built: number;
  height_m: number | null;
  usage_type: string | null;
  segment: string;
  zone: string;
  priority: string;
  score_anciennete: number | null;
  score_usage: number | null;
  score_hauteur: number | null;
  score_total: number | null;
  fire_system_type: string | null;
  fire_system_status: string | null;
  owner_name: string | null;
  management_company: string | null;
}

function getCityFromZone(zone?: string): string {
  if (!zone) return "Montréal";
  const z = zone.toLowerCase();
  if (z.includes("longueuil")) return "Longueuil";
  if (z.includes("laval")) return "Laval";
  if (z.includes("brossard")) return "Brossard";
  return "Montréal";
}

const data = rawData as { meta?: any; inventory: any[] };

export const buildings: Building[] = (data.inventory || []).map((item: any) => {
  const zone = item.zone || "";
  const city = getCityFromZone(zone);
  const name = item.immeuble || "";
  return {
    id: Number(item.id),
    name,
    address: `${name}, ${zone}`.replace(/,\s*$/, ""),
    city,
    latitude: Number(item.latitude) || 0,
    longitude: Number(item.longitude) || 0,
    floors: Number(item.etages) || 0,
    year_built: Number(item.annee) || 2000,
    height_m: item.hauteur_m != null ? Number(item.hauteur_m) : null,
    usage_type: item.usage ?? null,
    segment: item.segment || "Commercial / institutionnel",
    zone,
    priority: item.priorite || "Faible",
    score_anciennete: item.score_anciennete ?? null,
    score_usage: item.score_usage ?? null,
    score_hauteur: item.score_hauteur ?? null,
    score_total: item.score_total ?? null,
    fire_system_type: item.fire_system_type ?? null,
    fire_system_status: item.statut_public ?? null,
    owner_name: item.owner ?? null,
    management_company: item.management_company ?? null,
  };
});

export function getBuildingById(id: number | string): Building | undefined {
  const numId = Number(id);
  return buildings.find((b) => b.id === numId);
}

export function getBuildingsByCity(city: string): Building[] {
  const target = city.toLowerCase().trim();
  return buildings.filter((b) => b.city.toLowerCase() === target);
}

export function getBuildingsByPriority(priority: string): Building[] {
  return buildings.filter((b) => b.priority === priority);
}

// Keep some legacy helpers for existing components during transition (but prefer new fields)
export function getCity(zone?: string): string {
  return getCityFromZone(zone);
}

export function getAddress(building: { name?: string; zone?: string; address?: string; immeuble?: string }): string {
  if (building.address) return building.address;
  const n = (building as any).name || (building as any).immeuble || "";
  const z = building.zone || "";
  return `${n}, ${z}`.replace(/,\s*$/, "");
}

export type Priority = "Élevée" | "Moyenne" | "Faible" | "Très élevée";

export const priorityStyles: Record<string, string> = {
  "Élevée": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "Moyenne": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Faible": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Très élevée": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};
