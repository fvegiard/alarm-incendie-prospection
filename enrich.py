#!/usr/bin/env python3
"""Enrich prospection-montreal data.json with images + contact + website/owner/manager.

Sources (all free):
  - OpenStreetMap Overpass (bbox)
  - Wikidata SPARQL (bbox)
  - Google Street View Static API (free under $200/mo credit)
  - ui-avatars.com placeholder fallback
"""

import os
import sys
import json
import time
import math
import urllib.parse
import concurrent.futures as cf
from pathlib import Path

import io
import requests
from dotenv import load_dotenv
from PIL import Image

PROJECT_DIR = Path(__file__).resolve().parent
DATA_JSON = PROJECT_DIR / "data.json"
IMAGES_DIR = PROJECT_DIR / "images" / "buildings"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

MONTREAL_BBOX = (45.3, -74.0, 45.8, -73.3)
RADIUS_METERS = 150
HTTP_TIMEOUT = 20
SV_WORKERS = 10
SV_SIZE = "640x400"
SV_FOV = 80
SV_PITCH = 8

MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024
MAX_STORED_BYTES = 800 * 1024
MAX_IMAGE_WIDTH = 1280
JPEG_QUALITY = 82

UA = "ProspectionMontrealEnricher/1.0 (+https://prospection-montreal.netlify.app)"

load_dotenv(PROJECT_DIR / ".env")
GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_API_KEY") or ""
if not GOOGLE_KEY:
    print("ERROR: GOOGLE_MAPS_API_KEY not found in .env", file=sys.stderr)
    sys.exit(1)


def log(msg):
    print(f"[enrich] {msg}", flush=True)


def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def placeholder_url(name: str, size: int = 640) -> str:
    return (
        f"https://ui-avatars.com/api/?name={urllib.parse.quote(name)}"
        f"&size={size}&background=0D6EFD&color=fff&bold=true&format=png"
    )


def download_capped(url: str, cap: int = MAX_DOWNLOAD_BYTES) -> bytes | None:
    try:
        with requests.get(url, headers={"User-Agent": UA}, timeout=HTTP_TIMEOUT, stream=True) as r:
            if r.status_code != 200:
                return None
            declared = r.headers.get("Content-Length")
            if declared and declared.isdigit() and int(declared) > cap:
                return None
            buf = bytearray()
            for chunk in r.iter_content(chunk_size=32 * 1024):
                if not chunk:
                    continue
                buf.extend(chunk)
                if len(buf) > cap:
                    return None
            return bytes(buf)
    except Exception:
        return None


def normalize_and_save(raw: bytes, out_path: Path) -> bool:
    if not raw or len(raw) < 4096:
        return False
    try:
        img = Image.open(io.BytesIO(raw))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        if img.width > MAX_IMAGE_WIDTH:
            new_h = int(img.height * MAX_IMAGE_WIDTH / img.width)
            img = img.resize((MAX_IMAGE_WIDTH, new_h), Image.LANCZOS)
        quality = JPEG_QUALITY
        while quality >= 55:
            tmp = io.BytesIO()
            img.save(tmp, format="JPEG", quality=quality, optimize=True, progressive=True)
            data = tmp.getvalue()
            if len(data) <= MAX_STORED_BYTES or quality == 55:
                out_path.write_bytes(data)
                return len(data) <= MAX_DOWNLOAD_BYTES
            quality -= 7
    except Exception:
        return False
    return False


OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def fetch_osm():
    s, w, n, e = MONTREAL_BBOX
    query = f"""
[out:json][timeout:120];
(
  way["building"]["website"]({s},{w},{n},{e});
  way["building"]["contact:website"]({s},{w},{n},{e});
  way["building"]["operator"]({s},{w},{n},{e});
  way["building"]["owner"]({s},{w},{n},{e});
  way["building"]["management"]({s},{w},{n},{e});
  way["building"]["image"]({s},{w},{n},{e});
  way["building"]["wikidata"]({s},{w},{n},{e});
  relation["building"]["website"]({s},{w},{n},{e});
  relation["building"]["operator"]({s},{w},{n},{e});
  relation["building"]["owner"]({s},{w},{n},{e});
  relation["building"]["image"]({s},{w},{n},{e});
  relation["building"]["wikidata"]({s},{w},{n},{e});
);
out center tags;
""".strip()
    log("Querying OpenStreetMap Overpass API (1 bbox call)…")
    for attempt in range(3):
        try:
            r = requests.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"User-Agent": UA},
                timeout=180,
            )
            if r.status_code == 200:
                els = r.json().get("elements", [])
                results = []
                for e_ in els:
                    tags = e_.get("tags", {}) or {}
                    c = e_.get("center") or {}
                    lat = c.get("lat")
                    lon = c.get("lon")
                    if lat is None or lon is None:
                        continue
                    results.append({
                        "lat": lat,
                        "lon": lon,
                        "website": tags.get("website") or tags.get("contact:website"),
                        "owner": tags.get("owner"),
                        "operator": tags.get("operator") or tags.get("management"),
                        "name": tags.get("name"),
                        "image": tags.get("image"),
                        "wikidata_id": tags.get("wikidata"),
                    })
                log(f"  → OSM returned {len(results)} tagged buildings")
                return results
            elif r.status_code == 429 or r.status_code >= 500:
                time.sleep(5 * (attempt + 1))
            else:
                log(f"  OSM HTTP {r.status_code}: {r.text[:160]}")
                return []
        except Exception as ex:
            log(f"  OSM error (attempt {attempt+1}): {ex}")
            time.sleep(5)
    log("  OSM failed after 3 attempts, continuing without OSM data")
    return []


WDQS_URL = "https://query.wikidata.org/sparql"


def fetch_wikidata():
    s, w, n, e = MONTREAL_BBOX
    center_lat = (s + n) / 2
    center_lon = (w + e) / 2
    radius_km = 30
    sparql = f"""
SELECT ?item ?itemLabel ?lat ?lon ?image WHERE {{
  SERVICE wikibase:around {{
    ?item wdt:P625 ?location .
    bd:serviceParam wikibase:center "Point({center_lon} {center_lat})"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "{radius_km}" .
  }}
  ?item wdt:P18 ?image .
  ?item p:P625/psv:P625 ?cn .
  ?cn wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en,fr". }}
}}
LIMIT 3000
""".strip()
    log("Querying Wikidata SPARQL (30km around Montréal, P18 images)…")
    for attempt in range(2):
        try:
            r = requests.get(
                WDQS_URL,
                params={"query": sparql, "format": "json"},
                headers={"User-Agent": UA, "Accept": "application/sparql-results+json"},
                timeout=60,
            )
            if r.status_code == 200:
                bindings = r.json().get("results", {}).get("bindings", [])
                results = []
                for b in bindings:
                    try:
                        results.append({
                            "lat": float(b["lat"]["value"]),
                            "lon": float(b["lon"]["value"]),
                            "name": b.get("itemLabel", {}).get("value"),
                            "image": b.get("image", {}).get("value"),
                        })
                    except (KeyError, ValueError):
                        continue
                log(f"  → Wikidata returned {len(results)} tagged items")
                return results
            elif r.status_code == 429 or r.status_code >= 500:
                time.sleep(5 * (attempt + 1))
            else:
                log(f"  Wikidata HTTP {r.status_code}: {r.text[:160]}")
                return []
        except Exception as ex:
            log(f"  Wikidata error (attempt {attempt+1}): {ex}")
            time.sleep(5)
    log("  Wikidata failed after 3 attempts, continuing without Wikidata data")
    return []


def find_nearest(lat, lon, candidates, max_m=RADIUS_METERS, predicate=None):
    best = None
    best_d = max_m + 1
    for c in candidates:
        if predicate and not predicate(c):
            continue
        d = haversine_m(lat, lon, c["lat"], c["lon"])
        if d < best_d:
            best_d = d
            best = c
    return best, best_d


COMMONS_API = "https://commons.wikimedia.org/w/api.php"
COMMONS_RADIUS = 150
BANNED_NAME_PARTS = ("wikimania", "portrait", "selfie", "meetup", "group", "party", "food", "cake", "découpe", "fromage", "wikimédien")


def _commons_nearest_image(lat, lon):
    try:
        r = requests.get(
            COMMONS_API,
            params={
                "action": "query",
                "list": "geosearch",
                "gscoord": f"{lat}|{lon}",
                "gsradius": COMMONS_RADIUS,
                "gslimit": 10,
                "gsnamespace": 6,
                "format": "json",
            },
            headers={"User-Agent": UA},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return None
        items = r.json().get("query", {}).get("geosearch", []) or []
    except Exception:
        return None
    for it in items:
        title = (it.get("title") or "").lower()
        if not any(title.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")):
            continue
        if any(bad in title for bad in BANNED_NAME_PARTS):
            continue
        return it["title"]
    return None


def _wiki_page_image(name):
    if not name or len(name) < 3:
        return None
    for lang in ("fr", "en"):
        try:
            r = requests.get(
                f"https://{lang}.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": name,
                    "prop": "pageimages",
                    "pithumbsize": 640,
                    "format": "json",
                    "redirects": 1,
                },
                headers={"User-Agent": UA},
                timeout=HTTP_TIMEOUT,
            )
            if r.status_code != 200:
                continue
            pages = r.json().get("query", {}).get("pages", {}) or {}
            for _, p in pages.items():
                thumb = (p.get("thumbnail") or {}).get("source")
                if thumb and thumb.startswith("http"):
                    return thumb
        except Exception:
            continue
    return None


def _commons_file_to_thumb(title: str, width: int = 1024) -> str:
    file_part = title.replace("File:", "", 1)
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(file_part)}?width={width}"


def fetch_street_view(building, osm_matches=None, wd_matches=None):
    bid = building["id"]
    name = building.get("immeuble") or f"Building {bid}"
    out = IMAGES_DIR / f"{bid}.jpg"

    if out.exists() and out.stat().st_size > 4096:
        try:
            with Image.open(out) as im:
                if im.width > 300:
                    return bid, "cached", True
        except Exception:
            pass

    osm_match = (osm_matches or {}).get(bid)
    if osm_match and osm_match.get("image"):
        img_url = osm_match["image"]
        if img_url.startswith("File:") or "wikimedia" in img_url.lower():
            title = img_url.split("/")[-1] if "wikimedia" in img_url.lower() else img_url
            img_url = _commons_file_to_thumb(title)
        raw = download_capped(img_url)
        if raw and normalize_and_save(raw, out):
            return bid, "osm_image", True

    wd_match = (wd_matches or {}).get(bid)
    if wd_match and wd_match.get("image"):
        raw = download_capped(wd_match["image"])
        if raw and normalize_and_save(raw, out):
            return bid, "wikidata_p18", True

    lat = building.get("latitude")
    lon = building.get("longitude")

    if lat is not None and lon is not None:
        title = _commons_nearest_image(lat, lon)
        if title:
            raw = download_capped(_commons_file_to_thumb(title))
            if raw and normalize_and_save(raw, out):
                return bid, "commons", True

    wiki_thumb = _wiki_page_image(name)
    if wiki_thumb:
        raw = download_capped(wiki_thumb)
        if raw and normalize_and_save(raw, out):
            return bid, "wikipedia", True

    raw = download_capped(placeholder_url(name))
    if raw:
        out.write_bytes(raw)
        return bid, "placeholder" if (lat and lon) else "placeholder_nocoord", True

    return bid, "failed", False


def build_contact_info(b):
    parts = []
    for key, label in (
        ("decideur_probable", "Décideur"),
        ("segment", "Segment"),
        ("mode_action", "Mode d'action"),
        ("angle_commercial", "Angle"),
    ):
        v = b.get(key)
        if v:
            parts.append(f"{label}: {v}")
    return " · ".join(parts) if parts else "À valider"


def main():
    log(f"Reading {DATA_JSON}")
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    inv = data["inventory"]
    log(f"Inventory: {len(inv)} buildings")

    log("Fetching OSM and Wikidata in parallel…")
    with cf.ThreadPoolExecutor(max_workers=2) as ex:
        f_osm = ex.submit(fetch_osm)
        f_wd = ex.submit(fetch_wikidata)
        osm = f_osm.result()
        wd = f_wd.result()

    osm_matches = {}
    wd_matches = {}
    for b in inv:
        lat = b.get("latitude")
        lon = b.get("longitude")
        if lat is None or lon is None:
            continue
        m, _ = find_nearest(lat, lon, osm, predicate=lambda c: bool(c.get("image")))
        if m:
            osm_matches[b["id"]] = m
        m, _ = find_nearest(lat, lon, wd, predicate=lambda c: bool(c.get("image")))
        if m:
            wd_matches[b["id"]] = m

    log(f"Matched image sources: OSM→{len(osm_matches)}, Wikidata→{len(wd_matches)}")

    log(f"Fetching {len(inv)} building photos (parallel {SV_WORKERS})…")
    sv_counts = {"osm_image": 0, "wikidata_p18": 0, "commons": 0, "wikipedia": 0, "placeholder": 0, "placeholder_nocoord": 0, "cached": 0, "failed": 0}
    done = 0

    def _wrap(b):
        return fetch_street_view(b, osm_matches, wd_matches)

    with cf.ThreadPoolExecutor(max_workers=SV_WORKERS) as ex:
        for bid, kind, ok in ex.map(_wrap, inv):
            sv_counts[kind] = sv_counts.get(kind, 0) + 1
            done += 1
            if done % 50 == 0:
                real = sv_counts.get("osm_image", 0) + sv_counts.get("wikidata_p18", 0) + sv_counts.get("commons", 0) + sv_counts.get("wikipedia", 0)
                placeholders = sv_counts.get("placeholder", 0) + sv_counts.get("placeholder_nocoord", 0)
                log(f"  images: {done}/{len(inv)} (real={real}, placeholder={placeholders}, cached={sv_counts.get('cached',0)})")
    log(f"Image phase done. {sv_counts}")

    log("Enriching each building record…")
    website_hits = owner_hits = operator_hits = 0
    for b in inv:
        bid = b["id"]
        b["image_url"] = f"images/buildings/{bid}.jpg"
        b["contact_info"] = build_contact_info(b)
        b.setdefault("website", None)
        b.setdefault("owner", None)
        b.setdefault("management_company", None)

        lat = b.get("latitude")
        lon = b.get("longitude")
        if lat is None or lon is None:
            continue

        if not b["website"]:
            m, _ = find_nearest(lat, lon, osm, predicate=lambda c: bool(c.get("website")))
            if m:
                b["website"] = m["website"]; website_hits += 1
        if not b["owner"]:
            m, _ = find_nearest(lat, lon, osm, predicate=lambda c: bool(c.get("owner")))
            if m:
                b["owner"] = m["owner"]; owner_hits += 1
        if not b["management_company"]:
            m, _ = find_nearest(lat, lon, osm, predicate=lambda c: bool(c.get("operator")))
            if m:
                b["management_company"] = m["operator"]; operator_hits += 1

        if not b["website"]:
            m, _ = find_nearest(lat, lon, wd, predicate=lambda c: bool(c.get("website")))
            if m:
                b["website"] = m["website"]; website_hits += 1
        if not b["owner"]:
            m, _ = find_nearest(lat, lon, wd, predicate=lambda c: bool(c.get("owner")))
            if m:
                b["owner"] = m["owner"]; owner_hits += 1
        if not b["management_company"]:
            m, _ = find_nearest(lat, lon, wd, predicate=lambda c: bool(c.get("operator")))
            if m:
                b["management_company"] = m["operator"]; operator_hits += 1

    log(f"Enrichment summary: website={website_hits}, owner={owner_hits}, manager={operator_hits}")

    data.setdefault("meta", {})
    data["meta"]["enriched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    data["meta"]["images_source"] = "streetview+placeholder"
    data["meta"]["metadata_sources"] = ["openstreetmap", "wikidata"]

    DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"Wrote {DATA_JSON}")

    assert len(data["inventory"]) == 522, "inventory length changed"
    oversized = []
    for b in data["inventory"]:
        assert b.get("image_url", "").startswith("images/buildings/"), f"bad image_url for id={b.get('id')}"
        assert b.get("contact_info"), f"empty contact_info for id={b.get('id')}"
        p = IMAGES_DIR / f"{b['id']}.jpg"
        if p.exists() and p.stat().st_size > MAX_DOWNLOAD_BYTES:
            oversized.append((b["id"], p.stat().st_size))
    assert not oversized, f"images over 5MB found: {oversized[:10]}"
    missing = [b["id"] for b in data["inventory"] if not (IMAGES_DIR / f"{b['id']}.jpg").exists()]
    assert not missing, f"missing image files: {missing[:10]}"

    total_bytes = sum((IMAGES_DIR / f"{b['id']}.jpg").stat().st_size for b in data["inventory"])
    real_sources = sv_counts.get("osm_image", 0) + sv_counts.get("wikidata_p18", 0) + sv_counts.get("commons", 0) + sv_counts.get("wikipedia", 0)
    placeholder_total = sv_counts.get("placeholder", 0) + sv_counts.get("placeholder_nocoord", 0)
    log(f"Enriched {len(inv)} buildings. Real photos: {real_sources}. Placeholders: {placeholder_total}. Cached: {sv_counts.get('cached',0)}. Failed: {sv_counts.get('failed',0)}. Images dir: {total_bytes/1024/1024:.1f} MB total. Website: {website_hits}, Owner: {owner_hits}, Manager: {operator_hits}.")
    log("VALIDATION PASSED (no image over 5MB, all 522 present)")


if __name__ == "__main__":
    main()
