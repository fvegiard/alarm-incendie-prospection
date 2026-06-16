#!/usr/bin/env node
/**
 * fetch-images.ts
 *
 * Google Street View Static image fetcher.
 *
 * Usage:
 *   npx tsx scripts/fetch-images.ts --dry-run
 *   npx tsx scripts/fetch-images.ts --download
 *   npx tsx scripts/fetch-images.ts --data /path/to/data.json --download
 *
 * Requires GOOGLE_STREET_VIEW_API_KEY in environment.
 */

import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PROJECT_ROOT, "data.json");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "buildings");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "public", "buildings", "manifest.json");

interface LatLng {
  lat: number;
  lng: number;
}

interface Building {
  id: number;
  immeuble?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ManifestEntry {
  building_id: number;
  address: string | null;
  lat: number;
  lng: number;
  image_path: string | null;
  status: "success" | "no_imagery" | "error";
  url: string;
  error?: string;
}

interface DataFile {
  inventory: Building[];
}

const IMAGE_WIDTH = 640;
const IMAGE_HEIGHT = 640;
const RATE_LIMIT_MS = 1000;

function loadBuildings(filePath: string): Building[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as DataFile;
  if (!Array.isArray(parsed.inventory)) {
    throw new Error(`Expected data.json to contain an "inventory" array`);
  }
  return parsed.inventory.filter((b) => {
    const lat = Number(b.latitude);
    const lng = Number(b.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  });
}

function getApiKey(): string {
  const key = process.env.GOOGLE_STREET_VIEW_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_STREET_VIEW_API_KEY environment variable is required. Set it before running this script.",
    );
  }
  return key;
}

function buildStreetViewUrl(coords: LatLng, apiKey: string): string {
  const params = new URLSearchParams({
    size: `${IMAGE_WIDTH}x${IMAGE_HEIGHT}`,
    location: `${coords.lat},${coords.lng}`,
    key: apiKey,
    source: "outdoor",
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

async function fetchImage(url: string): Promise<{ ok: boolean; buffer: Buffer | null; error?: string }> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      return { ok: false, buffer: null, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const buffer = Buffer.from(await res.arrayBuffer());

    // Google returns a uniform gray PNG (~8KB) when there is no Street View imagery.
    if (buffer.length < 12000) {
      return { ok: false, buffer, error: "no imagery (small/gray response)" };
    }

    return { ok: true, buffer };
  } catch (err) {
    return { ok: false, buffer: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function isGrayPlaceholder(_buffer: Buffer): boolean {
  // A pragmatic heuristic: Google's "no imagery" response is usually a tiny PNG.
  // We already short-circuit on file size, but we keep this extension point
  // for future pixel-level detection.
  return false;
}

async function downloadImage(building: Building, apiKey: string, dryRun: boolean): Promise<ManifestEntry> {
  const coords: LatLng = {
    lat: Number(building.latitude),
    lng: Number(building.longitude),
  };
  const address = building.immeuble ?? null;
  const url = buildStreetViewUrl(coords, apiKey);
  const fileName = `${building.id}.jpg`;

  if (dryRun) {
    return {
      building_id: building.id,
      address,
      lat: coords.lat,
      lng: coords.lng,
      image_path: path.join("public", "buildings", fileName),
      status: "success",
      url,
    };
  }

  const result = await fetchImage(url);

  if (!result.ok || !result.buffer || isGrayPlaceholder(result.buffer)) {
    return {
      building_id: building.id,
      address,
      lat: coords.lat,
      lng: coords.lng,
      image_path: null,
      status: result.error?.includes("no imagery") ? "no_imagery" : "error",
      url,
      error: result.error ?? "unknown error",
    };
  }

  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, result.buffer);

  return {
    building_id: building.id,
    address,
    lat: coords.lat,
    lng: coords.lng,
    image_path: path.join("public", "buildings", fileName),
    status: "success",
    url,
  };
}

function printProgress(index: number, total: number, entry: ManifestEntry) {
  const prefix = `Building ${index + 1}/${total}:`;
  const label = entry.address ?? `ID ${entry.building_id}`;
  if (entry.status === "success") {
    console.log(`${prefix} ${label} ✓`);
  } else {
    console.log(`${prefix} ${label} ✗ (${entry.error ?? entry.status})`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const download = args.includes("--download");
  const dataFile = args.find((arg, idx) => arg === "--data" && args[idx + 1]) ? args[args.indexOf("--data") + 1] : DATA_PATH;

  if (!dryRun && !download) {
    console.error("Usage: npx tsx scripts/fetch-images.ts --dry-run | --download [--data path/to/data.json]");
    process.exit(1);
  }

  if (!fs.existsSync(dataFile)) {
    console.error(`Error: data file not found at ${dataFile}`);
    process.exit(1);
  }

  const buildings = loadBuildings(dataFile);
  const apiKey = dryRun ? "" : getApiKey();

  if (!dryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: ManifestEntry[] = [];
  const total = buildings.length;

  for (let i = 0; i < buildings.length; i++) {
    const entry = await downloadImage(buildings[i], apiKey, dryRun);
    manifest.push(entry);
    printProgress(i, total, entry);

    if (i < buildings.length - 1) {
      await setTimeout(RATE_LIMIT_MS);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
  }

  const successCount = manifest.filter((m) => m.status === "success").length;
  const noImageryCount = manifest.filter((m) => m.status === "no_imagery").length;
  const errorCount = manifest.filter((m) => m.status === "error").length;

  console.log("");
  console.log(`Done. Processed ${total} buildings:`);
  console.log(`  ✓ ${successCount} downloaded`);
  console.log(`  ✗ ${noImageryCount} no imagery`);
  console.log(`  ✗ ${errorCount} errors`);

  if (!dryRun) {
    console.log(`Manifest written to ${MANIFEST_PATH}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
