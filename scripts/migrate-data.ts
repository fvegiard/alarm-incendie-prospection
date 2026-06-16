#!/usr/bin/env node
/**
 * migrate-data.ts
 *
 * Phase 2 migration script.
 * Reads the old data.json from the original repo and produces:
 *   - a mapped JSON representation (--json)
 *   - a Supabase seed SQL file (supabase/seed.sql) with buildings + placeholder images.
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PROJECT_ROOT, "data.json");
const SEED_DIR = path.join(PROJECT_ROOT, "supabase");
const SEED_PATH = path.join(SEED_DIR, "seed.sql");

interface OldBuilding {
  id: number;
  rang?: number | null;
  immeuble?: string | null;
  adresse?: string | null;
  ville?: string | null;
  hauteur_m?: number | null;
  etages?: number | null;
  annee?: number | null;
  usage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  zone?: string | null;
  zone_lettre?: string | null;
  age_2026?: number | null;
  score_anciennete?: number | null;
  score_usage?: number | null;
  score_hauteur?: number | null;
  score_total?: number | null;
  priorite?: string | null;
  statut_public?: string | null;
  decideur_probable?: string | null;
  angle_commercial?: string | null;
  raison_priorisation?: string | null;
  mode_action?: string | null;
  segment?: string | null;
  top25_ordre?: number | null;
  condo_ordre?: number | null;
  source_inventaire?: string | null;
  source_rbq?: string | null;
  source_proprietaires?: string | null;
  image_url?: string | null;
  contact_info?: string | null;
  website?: string | null;
  owner?: string | null;
  management?: string | null;
  management_company?: string | null;
}

interface BuildingImage {
  building_id: number;
  image_url: string | null;
  type: "local" | "remote" | "placeholder" | "unknown";
  source: string | null;
  is_primary: boolean;
}

interface MappedBuilding {
  id: number;
  name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  height_m: number | null;
  floors: number | null;
  year_built: number | null;
  usage_type: string | null;
  segment: string | null;
  zone: string | null;
  priority: string | null;
  score_anciennete: number | null;
  score_usage: number | null;
  score_hauteur: number | null;
  score_total: number | null;
  owner_name: string | null;
  owner_contact: string | null;
  management_company: string | null;
  notes: string | null;
  images: BuildingImage[];
  raw: {
    rang: number | null;
    age_2026: number | null;
    statut_public: string | null;
    decideur_probable: string | null;
    angle_commercial: string | null;
    raison_priorisation: string | null;
    mode_action: string | null;
    top25_ordre: number | null;
    condo_ordre: number | null;
    source_inventaire: string | null;
    source_rbq: string | null;
    source_proprietaires: string | null;
    zone_lettre: string | null;
  };
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function inferCity(zone?: string | null, ville?: string | null): string | null {
  if (ville) return ville;
  if (zone && zone.toLowerCase().includes("laval")) return "Laval";
  return "Montréal";
}

function classifyImageUrl(imageUrl: string | null | undefined): Omit<BuildingImage, "building_id" | "is_primary"> {
  if (!imageUrl) {
    return { image_url: null, type: "placeholder", source: null };
  }
  const lower = imageUrl.toLowerCase();
  if (lower.includes("ui-avatars.com")) {
    return { image_url: imageUrl, type: "placeholder", source: "ui-avatars" };
  }
  if (/^https?:\/\//.test(imageUrl)) {
    return { image_url: imageUrl, type: "remote", source: "external" };
  }
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(imageUrl)) {
    return { image_url: imageUrl, type: "local", source: "legacy_path" };
  }
  return { image_url: imageUrl, type: "unknown", source: "legacy_path" };
}

function mapBuilding(old: OldBuilding): MappedBuilding {
  const image = classifyImageUrl(old.image_url);
  const lat = toNumber(old.lat ?? old.latitude);
  const lng = toNumber(old.lng ?? old.longitude);

  return {
    id: old.id,
    name: toString(old.immeuble),
    address: toString(old.adresse ?? old.immeuble),
    city: inferCity(old.zone, old.ville),
    latitude: lat,
    longitude: lng,
    height_m: toNumber(old.hauteur_m),
    floors: toNumber(old.etages),
    year_built: toNumber(old.annee),
    usage_type: toString(old.usage),
    segment: toString(old.segment),
    zone: toString(old.zone),
    priority: toString(old.priorite),
    score_anciennete: toNumber(old.score_anciennete),
    score_usage: toNumber(old.score_usage),
    score_hauteur: toNumber(old.score_hauteur),
    score_total: toNumber(old.score_total),
    owner_name: toString(old.owner),
    owner_contact: toString(old.contact_info),
    management_company: toString(old.management ?? old.management_company),
    notes: toString(old.website),
    images: [
      {
        building_id: old.id,
        image_url: image.image_url,
        type: image.type,
        source: image.source,
        is_primary: true,
      },
    ],
    raw: {
      rang: toNumber(old.rang),
      age_2026: toNumber(old.age_2026),
      statut_public: toString(old.statut_public),
      decideur_probable: toString(old.decideur_probable),
      angle_commercial: toString(old.angle_commercial),
      raison_priorisation: toString(old.raison_priorisation),
      mode_action: toString(old.mode_action),
      top25_ordre: toNumber(old.top25_ordre),
      condo_ordre: toNumber(old.condo_ordre),
      source_inventaire: toString(old.source_inventaire),
      source_rbq: toString(old.source_rbq),
      source_proprietaires: toString(old.source_proprietaires),
      zone_lettre: toString(old.zone_lettre),
    },
  };
}

function loadData(filePath: string): MappedBuilding[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as { inventory: OldBuilding[] };
  if (!Array.isArray(parsed.inventory)) {
    throw new Error(`Expected data.json to contain an "inventory" array, got ${typeof parsed.inventory}`);
  }
  return parsed.inventory.map(mapBuilding);
}

function escapeSql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  const str = String(value);
  return "'" + str.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function buildSeedSql(buildings: MappedBuilding[]): string {
  const lines: string[] = [];
  lines.push("-- Supabase seed file generated by scripts/migrate-data.ts");
  lines.push("-- Buildings: " + buildings.length);
  lines.push("");
  lines.push("TRUNCATE TABLE buildings CASCADE;");
  lines.push("TRUNCATE TABLE building_images CASCADE;");
  lines.push("");

  for (const b of buildings) {
    lines.push(
      [
        "INSERT INTO buildings (",
        "  id, name, address, city, latitude, longitude, height_m, floors, year_built,",
        "  usage_type, segment, zone, priority, score_anciennete, score_usage, score_hauteur, score_total,",
        "  owner_name, owner_contact, management_company, notes",
        ") VALUES (",
        `  ${b.id}, ${escapeSql(b.name)}, ${escapeSql(b.address)}, ${escapeSql(b.city)},`,
        `  ${b.latitude ?? "NULL"}, ${b.longitude ?? "NULL"}, ${b.height_m ?? "NULL"}, ${b.floors ?? "NULL"}, ${b.year_built ?? "NULL"},`,
        `  ${escapeSql(b.usage_type)}, ${escapeSql(b.segment)}, ${escapeSql(b.zone)}, ${escapeSql(b.priority)},`,
        `  ${b.score_anciennete ?? "NULL"}, ${b.score_usage ?? "NULL"}, ${b.score_hauteur ?? "NULL"}, ${b.score_total ?? "NULL"},`,
        `  ${escapeSql(b.owner_name)}, ${escapeSql(b.owner_contact)}, ${escapeSql(b.management_company)}, ${escapeSql(b.notes)}`,
        ") ON CONFLICT (id) DO UPDATE SET",
        "  name = EXCLUDED.name,",
        "  address = EXCLUDED.address,",
        "  city = EXCLUDED.city,",
        "  latitude = EXCLUDED.latitude,",
        "  longitude = EXCLUDED.longitude,",
        "  height_m = EXCLUDED.height_m,",
        "  floors = EXCLUDED.floors,",
        "  year_built = EXCLUDED.year_built,",
        "  usage_type = EXCLUDED.usage_type,",
        "  segment = EXCLUDED.segment,",
        "  zone = EXCLUDED.zone,",
        "  priority = EXCLUDED.priority,",
        "  score_anciennete = EXCLUDED.score_anciennete,",
        "  score_usage = EXCLUDED.score_usage,",
        "  score_hauteur = EXCLUDED.score_hauteur,",
        "  score_total = EXCLUDED.score_total,",
        "  owner_name = EXCLUDED.owner_name,",
        "  owner_contact = EXCLUDED.owner_contact,",
        "  management_company = EXCLUDED.management_company,",
        "  notes = EXCLUDED.notes;",
      ].join("\n"),
    );

    for (const img of b.images) {
      if (!img.image_url && img.type === "placeholder") {
        lines.push(
          `INSERT INTO building_images (building_id, image_url, type, source, is_primary) VALUES (${img.building_id}, NULL, 'placeholder', NULL, true) ON CONFLICT DO NOTHING;`,
        );
      } else {
        lines.push(
          `INSERT INTO building_images (building_id, image_url, type, source, is_primary) VALUES (${img.building_id}, ${escapeSql(img.image_url)}, '${img.type}', ${escapeSql(img.source)}, ${img.is_primary}) ON CONFLICT DO NOTHING;`,
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const dataFile = args.find((arg, idx) => arg === "--data" && args[idx + 1]) ? args[args.indexOf("--data") + 1] : DATA_PATH;

  if (!fs.existsSync(dataFile)) {
    console.error(`Error: data file not found at ${dataFile}`);
    process.exit(1);
  }

  const buildings = loadData(dataFile);

  if (jsonMode) {
    console.log(JSON.stringify(buildings, null, 2));
    return;
  }

  if (!fs.existsSync(SEED_DIR)) {
    fs.mkdirSync(SEED_DIR, { recursive: true });
  }

  const seedSql = buildSeedSql(buildings);
  fs.writeFileSync(SEED_PATH, seedSql, "utf-8");

  console.log(`✓ Migrated ${buildings.length} buildings`);
  console.log(`✓ Wrote seed SQL to ${SEED_PATH}`);
}

main();
