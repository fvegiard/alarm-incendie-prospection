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
