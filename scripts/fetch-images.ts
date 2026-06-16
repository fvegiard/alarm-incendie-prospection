#!/usr/bin/env node
/**
 * fetch-images.ts
 *
 * Google Street View Static image fetcher.
 *
 * Reads buildings from data.json (or via --file), generates Google Street View
 * Static API URLs, and either prints them (--dry-run) or downloads the images
 * to public/buildings/ (--download). Downloads are rate-limited to 1 per second.
 *
 * Usage:
 *   npx tsx scripts/fetch-images.ts --dry-run
 *   npx tsx scripts/fetch-images.ts --download
 *   npx tsx scripts/fetch-images.ts --file /path/to/data.json --download
 *
 * Requires GOOGLE_STREET_VIEW_API_KEY in environment when not using --dry-run.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const DATA_PATH = path.resolve(__dirname, "..", "data.json");
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "buildings");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 600;
const RATE_LIMIT_MS = 1000;

interface Building {
  id?: number;
  immeuble?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  address?: string | null;
}

interface ManifestEntry {
  name: string | null;
  address: string | null;
  image_path: string | null;
  lat: number;
  lng: number;
}

interface DataFile {
  inventory: Building[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): { file: string; dryRun: boolean; download: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const download = args.includes("--download");

  let file = DATA_PATH;
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    file = path.resolve(args[fileIndex + 1]);
  }

  if (!dryRun && !download) {
    console.error(
      "Usage: npx tsx scripts/fetch-images.ts --dry-run | --download [--file path/to/data.json]",
    );
    process.exit(1);
  }

  return { file, dryRun, download };
}

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
  return `https://maps.googleapis.com/maps/api/streetview?size=${IMAGE_WIDTH}x${IMAGE_HEIGHT}&location=${lat},${lng}&heading=0&pitch=0&key=${apiKey}`;
}

function downloadImage(url: string): Promise<{ ok: boolean; buffer: Buffer | null; error?: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        // Consume the response so the connection can close cleanly.
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

function buildingIndex(index: number, total: number): string {
  const digits = Math.max(String(total).length, 3);
  return String(index + 1).padStart(digits, "0");
}

function buildingName(b: Building): string | null {
  return b.immeuble ?? b.name ?? null;
}

function buildingAddress(b: Building): string | null {
  return b.address ?? b.immeuble ?? null;
}

async function main() {
  const { file, dryRun, download } = parseArgs();
  const buildings = loadBuildings(file);
  const apiKey = dryRun ? "" : getApiKey();
  const total = buildings.length;

  if (download) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: Record<string, ManifestEntry> = {};

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const lat = Number(b.latitude);
    const lng = Number(b.longitude);
    const idx = buildingIndex(i, total);
    const fileName = `building-${idx}.jpg`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const relativeImagePath = path.join("public", "buildings", fileName).replace(/\\/g, "/");
    const url = buildStreetViewUrl(lat, lng, apiKey);

    if (dryRun) {
      console.log(url);
      manifest[idx] = {
        name: buildingName(b),
        address: buildingAddress(b),
        image_path: relativeImagePath,
        lat,
        lng,
      };
      continue;
    }

    const result = await downloadImage(url);

    if (result.ok && result.buffer) {
      fs.writeFileSync(filePath, result.buffer);
      manifest[idx] = {
        name: buildingName(b),
        address: buildingAddress(b),
        image_path: relativeImagePath,
        lat,
        lng,
      };
      console.log(`Building ${idx}/${total}: ${buildingAddress(b) ?? "unknown address"} ✓`);
    } else {
      manifest[idx] = {
        name: buildingName(b),
        address: buildingAddress(b),
        image_path: null,
        lat,
        lng,
      };
      const reason = result.error === "no imagery" ? "no imagery" : result.error ?? "unknown error";
      console.log(`Building ${idx}/${total}: ${buildingAddress(b) ?? "unknown address"} ✗ (${reason})`);
    }

    if (i < buildings.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  if (download) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest written to ${MANIFEST_PATH}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
