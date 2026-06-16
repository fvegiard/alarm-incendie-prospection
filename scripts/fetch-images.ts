#!/usr/bin/env node
/**
 * fetch-images.ts
 *
 * Google Street View Static image fetcher.
 *
 * Usage:
 *   npx tsx scripts/fetch-images.ts --dry-run
 *   npx tsx scripts/fetch-images.ts --download
 *   npx tsx scripts/fetch-images.ts --data path/to/data.json --download
 *
 * Requires GOOGLE_STREET_VIEW_API_KEY in environment when not using --dry-run.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { setTimeout } from "node:timers/promises";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PROJECT_ROOT, "data.json");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "buildings");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

interface Building {
  id: number;
  immeuble?: string | null;
  adresse?: string | null;
  address?: string | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ManifestEntry {
  building_id: number;
  name: string | null;
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
  if (!fs.existsSync(filePath)) {
    console.error(`Error: data file not found at ${filePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as DataFile;
  if (!Array.isArray(parsed.inventory)) {
    throw new Error(`Expected data file to contain an "inventory" array`);
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

function buildStreetViewUrl(lat: number, lng: number, apiKey: string): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=${IMAGE_WIDTH}x${IMAGE_HEIGHT}&location=${lat},${lng}&source=outdoor&key=${apiKey}`;
}

function downloadImage(url: string): Promise<{ ok: boolean; buffer: Buffer | null; error?: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve({ ok: false, buffer: null, error: `HTTP ${res.statusCode}` });
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 12000) {
          resolve({ ok: false, buffer, error: "no imagery" });
          return;
        }
        resolve({ ok: true, buffer });
      });
      res.on("error", (err) => {
        resolve({ ok: false, buffer: null, error: err.message });
      });
    });

    req.on("error", (err) => {
      resolve({ ok: false, buffer: null, error: err.message });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      resolve({ ok: false, buffer: null, error: "request timeout" });
    });
  });
}

function buildingName(b: Building): string | null {
  return b.immeuble ?? b.name ?? b.adresse ?? null;
}

function buildingAddress(b: Building): string | null {
  return b.adresse ?? b.immeuble ?? null;
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

  const buildings = loadBuildings(dataFile);
  const apiKey = dryRun ? "" : getApiKey();
  const total = buildings.length;

  if (download) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: ManifestEntry[] = [];

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const lat = Number(b.latitude);
    const lng = Number(b.longitude);
    const fileName = `${b.id}.jpg`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const relativeImagePath = path.join("public", "buildings", fileName).replace(/\\/g, "/");
    const url = buildStreetViewUrl(lat, lng, apiKey);

    if (dryRun) {
      manifest.push({
        building_id: b.id,
        name: buildingName(b),
        address: buildingAddress(b),
        lat,
        lng,
        image_path: relativeImagePath,
        status: "success",
        url,
      });
      console.log(`Building ${i + 1}/${total}: ${buildingAddress(b) ?? "unknown address"} ✓ (dry-run: ${url})`);
      continue;
    }

    const result = await downloadImage(url);

    if (result.ok && result.buffer) {
      fs.writeFileSync(filePath, result.buffer);
      manifest.push({
        building_id: b.id,
        name: buildingName(b),
        address: buildingAddress(b),
        lat,
        lng,
        image_path: relativeImagePath,
        status: "success",
        url,
      });
      console.log(`Building ${i + 1}/${total}: ${buildingAddress(b) ?? "unknown address"} ✓`);
    } else {
      const reason = result.error === "no imagery" ? "no imagery" : result.error ?? "unknown error";
      manifest.push({
        building_id: b.id,
        name: buildingName(b),
        address: buildingAddress(b),
        lat,
        lng,
        image_path: null,
        status: result.error === "no imagery" ? "no_imagery" : "error",
        url,
        error: reason,
      });
      console.log(`Building ${i + 1}/${total}: ${buildingAddress(b) ?? "unknown address"} ✗ (${reason})`);
    }

    if (i < buildings.length - 1) {
      await setTimeout(RATE_LIMIT_MS);
    }
  }

  if (download) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest written to ${MANIFEST_PATH}`);
  }

  const successCount = manifest.filter((m) => m.status === "success").length;
  const noImageryCount = manifest.filter((m) => m.status === "no_imagery").length;
  const errorCount = manifest.filter((m) => m.status === "error").length;

  console.log("");
  console.log(`Done. Processed ${total} buildings:`);
  console.log(`  ✓ ${successCount} downloaded`);
  console.log(`  ✗ ${noImageryCount} no imagery`);
  console.log(`  ✗ ${errorCount} errors`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
