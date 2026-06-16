#!/usr/bin/env tsx
/**
 * scripts/migrate-data.ts
 *
 * Phase 2 migration script for the alarm-refactor project.
 *
 * Reads data.json from the project root (legacy schema) and:
 *   1. Maps old fields to the new Supabase schema (buildings + building_images).
 *   2. Writes supabase/seed.sql with INSERT statements for 522 buildings and images.
 *   3. Supports --json to print the mapped JSON representation to stdout.
 *
 * Run with:
 *   npx tsx scripts/migrate-data.ts
 *   npx tsx scripts/migrate-data.ts --json
 *   npx tsx scripts/migrate-data.ts --data /path/to/data.json
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
  management_company?: string | null;
  coord?: [number, number] | null;
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

interface BuildingImage {
  building_id: number;
  image_url: string | null;
  type: "local" | "remote" | "placeholder" | "unknown";
  source: string | null;
  is_primary: boolean;
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

function inferCity(zone?: string | null): string | null {
  // The original dataset covers Montreal; no city field exists in the legacy schema.
  return "Montréal";
}

function deriveAddress(old: OldBuilding): string | null {
  // Legacy data has no separate address; use explicit address if present,
  // otherwise fall back to the building name (immeuble).
  return toString(old.adresse) ?? toString(old.immeuble);
}

function deriveCoordinates(old: OldBuilding): { latitude: number | null; longitude: number | null } {
  const lat = toNumber(old.latitude);
  const lng = toNumber(old.longitude);
  if (lat !== null && lng !== null) {
    return { latitude: lat, longitude: lng };
  }

  // Fallback to legacy coord array [lat, lng] if present.
  if (Array.isArray(old.coord) && old.coord.length >= 2) {
    const fallbackLat = toNumber(old.coord[0]);
    const fallbackLng = toNumber(old.coord[1]);
    if (fallbackLat !== null && fallbackLng !== null) {
      return { latitude: fallbackLat, longitude: fallbackLng };
    }
  }

  return { latitude: lat, longitude: lng };
}

function deriveNotes(old: OldBuilding): string | null {
  // website is mapped to notes per the task spec.
  const websiteNote = toString(old.website);
  return websiteNote;
}

function classifyImageUrl(imageUrl: string | null | undefined): Omit<BuildingImage, "building_id" | "is_primary"> {
  if (!imageUrl) {
    return { image_url: null, type: "placeholder", source: "missing" };
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
  const coords = deriveCoordinates(old);
  const image = classifyImageUrl(old.image_url);

  return {
    id: old.id,
    name: toString(old.immeuble),
    address: deriveAddress(old),
    city: toString(old.ville) ?? inferCity(old.zone),
    latitude: coords.latitude,
    longitude: coords.longitude,
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
    management_company: toString(old.management_company),
    notes: deriveNotes(old),
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

  // Ensure clean, idempotent seed. Use CASCADE to also clear building_images FKs.
  lines.push("TRUNCATE TABLE buildings CASCADE;");
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
      lines.push(
        `INSERT INTO building_images (building_id, image_url, image_type, source, is_primary) VALUES (` +
          `${img.building_id}, ` +
          `${escapeSql(img.image_url)}, ` +
          `${escapeSql(img.type)}, ` +
          `${escapeSql(img.source)}, ` +
          `${img.is_primary}` +
          `) ON CONFLICT DO NOTHING;`,
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}

function printUsage() {
  console.log("Usage: npx tsx scripts/migrate-data.ts [--json] [--data <path>]");
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const jsonMode = args.includes("--json");
  const dataIndex = args.indexOf("--data");
  const dataFile = dataIndex !== -1 && args[dataIndex + 1] ? path.resolve(args[dataIndex + 1]) : DATA_PATH;

  // Auto-fetch data.json if it is missing (task fallback).
  if (!fs.existsSync(dataFile)) {
    console.error(`data file not found at ${dataFile}`);
    console.error("Attempting to fetch data.json from the original repository...");
    try {
      const tmpDir = "/tmp/alarm-old";
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      const cloneCmd = `git clone --depth 1 https://github.com/fvegiard/alarm-incendie-prospection ${tmpDir}`;
      require("node:child_process").execSync(cloneCmd, { stdio: "inherit" });
      fs.copyFileSync(path.join(tmpDir, "data.json"), dataFile);
      console.error(`Copied data.json from ${tmpDir} to ${dataFile}`);
    } catch (err) {
      console.error("Failed to fetch data.json:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
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

  console.log(`Migrated ${buildings.length} buildings`);
  console.log(`Wrote seed SQL to ${SEED_PATH}`);
}

main();
