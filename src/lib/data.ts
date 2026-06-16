import rawData from "../../data.json";

export interface Building {
  id: number;
  immeuble: string;
  zone: string;
  priorite: string;
  segment: string;
  etages: number;
  annee: number;
  latitude: number;
  longitude: number;
  hauteur_m?: number | null;
  usage?: string | null;
  statut_public?: string | null;
  owner?: string | null;
  management_company?: string | null;
  score_anciennete?: number | null;
  score_usage?: number | null;
  score_hauteur?: number | null;
  score_total?: number | null;
  raison_priorisation?: string | null;
  mode_action?: string | null;
  fire_system_type?: string | null;
  fire_system_status?: string | null;
}

const data = rawData as {
  meta?: any;
  inventory: any[];
};

export const buildings: Building[] = data.inventory.map((item: any) => ({
  id: Number(item.id),
  immeuble: item.immeuble || "",
  zone: item.zone || "",
  priorite: item.priorite || "Faible",
  segment: item.segment || "Commercial / institutionnel",
  etages: Number(item.etages) || 0,
  annee: Number(item.annee) || 2000,
  latitude: Number(item.latitude) || 0,
  longitude: Number(item.longitude) || 0,
}));

export function getBuildingById(id: number | string): Building | undefined {
  const numId = Number(id);
  return buildings.find((b) => b.id === numId);
}

export function getBuildingsByCity(city: string): Building[] {
  const target = city.toLowerCase();
  return buildings.filter((b) => {
    const c = getCity(b.zone);
    return c.toLowerCase() === target;
  });
}

export function getBuildingsByPriority(priority: string): Building[] {
  return buildings.filter((b) => b.priorite === priority);
}

export function getCity(zone?: string): string {
  if (!zone) return "Montréal";
  const z = zone.toLowerCase();
  if (z.includes("longueuil")) return "Longueuil";
  if (z.includes("laval")) return "Laval";
  if (z.includes("brossard")) return "Brossard";
  return "Montréal";
}

export function getAddress(building: Building): string {
  return `${building.immeuble}, ${building.zone}`;
}

export type Priority = "Élevée" | "Moyenne" | "Faible";

export const priorityStyles: Record<Priority, string> = {
  "Élevée": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "Moyenne": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Faible": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};
