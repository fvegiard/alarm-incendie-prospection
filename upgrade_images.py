#!/usr/bin/env python3
"""Upgrade placeholder building photos using free sources (Nominatim+Wikipedia, Google Places, Gemini grounded search)."""

import os
import sys
import json
import time
import threading
import urllib.parse
import concurrent.futures as cf
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image

from enrich import (
    download_capped,
    normalize_and_save,
    MAX_DOWNLOAD_BYTES,
    IMAGES_DIR,
    UA,
    HTTP_TIMEOUT,
)

PROJECT_DIR = Path(__file__).resolve().parent
DATA_JSON = PROJECT_DIR / "data.json"

load_dotenv(PROJECT_DIR / ".env")
GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_API_KEY") or ""
GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or ""

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
PLACES_FIND_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
PLACES_PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

ALLOWED_HOST_HINTS = (
    "wikimedia.org",
    "wikipedia.org",
    "gouv.qc.ca",
    "quebec.ca",
    "montreal.ca",
    "ville.montreal.qc.ca",
)

_nominatim_lock = threading.Lock()
_nominatim_last = [0.0]
_gemini_lock = threading.Lock()
_gemini_last = [0.0]


def log(msg):
    print(f"[upgrade] {msg}", flush=True)


def is_placeholder(path: Path) -> bool:
    try:
        size = path.stat().st_size
        with Image.open(path) as im:
            fmt = im.format
            w, h = im.width, im.height
    except Exception:
        return False
    if fmt == "PNG":
        return True
    if size < 20_000:
        return True
    if w <= 700 and h <= 700:
        return True
    return False


def _nominatim_reverse(lat, lon):
    with _nominatim_lock:
        delta = time.time() - _nominatim_last[0]
        if delta < 1.1:
            time.sleep(1.1 - delta)
        _nominatim_last[0] = time.time()
        try:
            r = requests.get(
                NOMINATIM_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "zoom": 18,
                    "extratags": 1,
                    "namedetails": 1,
                },
                headers={"User-Agent": UA},
                timeout=HTTP_TIMEOUT,
            )
            if r.status_code != 200:
                return None
            return r.json()
        except Exception:
            return None


def _wiki_thumb_from_title(title: str, width: int = 1024):
    if ":" in title and not title.lower().startswith(("fr:", "en:")):
        lang = "fr"
        page = title
    else:
        if ":" in title:
            lang, _, page = title.partition(":")
        else:
            lang, page = "fr", title
    try:
        r = requests.get(
            f"https://{lang}.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "titles": page,
                "prop": "pageimages",
                "pithumbsize": width,
                "format": "json",
                "redirects": 1,
            },
            headers={"User-Agent": UA},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return None
        pages = r.json().get("query", {}).get("pages", {}) or {}
        for _, p in pages.items():
            thumb = (p.get("thumbnail") or {}).get("source")
            if thumb and thumb.startswith("http"):
                return thumb
    except Exception:
        return None
    return None


def try_nominatim_wikipedia(lat, lon):
    if lat is None or lon is None:
        return None
    data = _nominatim_reverse(lat, lon)
    if not data:
        return None
    extratags = (data.get("extratags") or {}) if isinstance(data, dict) else {}
    wiki = extratags.get("wikipedia")
    if not wiki:
        return None
    return _wiki_thumb_from_title(wiki, 1024)


def try_google_places(name, lat, lon):
    if not GOOGLE_KEY or not name:
        return None
    params = {
        "input": name,
        "inputtype": "textquery",
        "fields": "photos,name,geometry",
        "key": GOOGLE_KEY,
    }
    if lat is not None and lon is not None:
        params["locationbias"] = f"circle:200@{lat},{lon}"
    try:
        r = requests.get(
            PLACES_FIND_URL,
            params=params,
            headers={"User-Agent": UA},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return None
        js = r.json()
        cands = js.get("candidates") or []
        if not cands:
            return None
        photos = cands[0].get("photos") or []
        if not photos:
            return None
        ref = photos[0].get("photo_reference")
        if not ref:
            return None
    except Exception:
        return None
    return f"{PLACES_PHOTO_URL}?maxwidth=1024&photo_reference={urllib.parse.quote(ref)}&key={GOOGLE_KEY}"


def _gemini_rate_gate():
    with _gemini_lock:
        delta = time.time() - _gemini_last[0]
        if delta < 4.2:
            time.sleep(4.2 - delta)
        _gemini_last[0] = time.time()


def try_gemini_search(name, lat, lon):
    if not GEMINI_KEY or not name:
        return None
    prompt = (
        f"Find a public URL of a real photo of the building {name} at {lat},{lon} in Montreal. "
        "Return ONLY the raw image URL, nothing else. Must be a direct JPG/PNG/WEBP URL from "
        "Wikimedia, Wikipedia, government of Quebec, Ville de Montréal, or the building's own website."
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"googleSearch": {}}],
    }
    _gemini_rate_gate()
    try:
        r = requests.post(
            GEMINI_URL,
            params={"key": GEMINI_KEY},
            json=payload,
            headers={"User-Agent": UA, "Content-Type": "application/json"},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return None
        js = r.json()
        cands = js.get("candidates") or []
        if not cands:
            return None
        parts = (cands[0].get("content") or {}).get("parts") or []
        text = ""
        for p in parts:
            if isinstance(p, dict) and p.get("text"):
                text += p["text"]
        text = text.strip().strip("`").strip()
        for token in text.split():
            t = token.strip().strip(".,);]\"'<>")
            if t.lower().startswith("http") and any(t.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")):
                return t
        return None
    except Exception:
        return None


def validate_image_url(url):
    if not url or not url.lower().startswith("http"):
        return False
    try:
        r = requests.head(
            url,
            headers={"User-Agent": UA},
            timeout=HTTP_TIMEOUT,
            allow_redirects=True,
        )
        if r.status_code != 200:
            return False
        ctype = (r.headers.get("Content-Type") or "").lower()
        if not ctype.startswith("image/"):
            return False
        declared = r.headers.get("Content-Length")
        if declared and declared.isdigit() and int(declared) > MAX_DOWNLOAD_BYTES:
            return False
        return True
    except Exception:
        return False


def upgrade_one(building):
    bid = building["id"]
    name = building.get("immeuble") or f"Building {bid}"
    lat = building.get("latitude")
    lon = building.get("longitude")
    out = IMAGES_DIR / f"{bid}.jpg"

    if not out.exists():
        return bid, "missing", False
    if not is_placeholder(out):
        return bid, "kept", False

    url = try_nominatim_wikipedia(lat, lon)
    if url:
        raw = download_capped(url)
        if raw and normalize_and_save(raw, out):
            return bid, "nominatim_wikipedia", True

    url = try_google_places(name, lat, lon)
    if url:
        raw = download_capped(url)
        if raw and normalize_and_save(raw, out):
            return bid, "google_places", True

    url = try_gemini_search(name, lat, lon)
    if url and validate_image_url(url):
        raw = download_capped(url)
        if raw and normalize_and_save(raw, out):
            return bid, "gemini_search", True

    return bid, "still_placeholder", False


def main():
    if not DATA_JSON.exists():
        log(f"ERROR: {DATA_JSON} not found")
        sys.exit(1)
    if not GOOGLE_KEY:
        log("WARNING: GOOGLE_MAPS_API_KEY missing — Google Places step will be skipped")
    if not GEMINI_KEY:
        log("WARNING: GEMINI_API_KEY missing — Gemini step will be skipped")

    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    inv = data.get("inventory") or []
    log(f"Loaded {len(inv)} buildings")

    targets = []
    kept = 0
    for b in inv:
        p = IMAGES_DIR / f"{b['id']}.jpg"
        if not p.exists():
            continue
        if is_placeholder(p):
            targets.append(b)
        else:
            kept += 1
    log(f"Placeholders to upgrade: {len(targets)}. Real photos preserved: {kept}.")

    counts = {"nominatim_wikipedia": 0, "google_places": 0, "gemini_search": 0, "still_placeholder": 0, "kept": 0, "missing": 0}
    done = 0
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        for bid, kind, ok in ex.map(upgrade_one, targets):
            counts[kind] = counts.get(kind, 0) + 1
            done += 1
            if done % 25 == 0:
                upgraded = counts["nominatim_wikipedia"] + counts["google_places"] + counts["gemini_search"]
                log(f"  progress {done}/{len(targets)} — upgraded={upgraded}, still_placeholder={counts['still_placeholder']}")

    upgraded_total = counts["nominatim_wikipedia"] + counts["google_places"] + counts["gemini_search"]
    log(f"Upgrade phase done. Upgraded={upgraded_total} (nominatim={counts['nominatim_wikipedia']}, places={counts['google_places']}, gemini={counts['gemini_search']}). Still placeholder={counts['still_placeholder']}.")

    oversized = []
    total_bytes = 0
    for b in inv:
        p = IMAGES_DIR / f"{b['id']}.jpg"
        if p.exists():
            sz = p.stat().st_size
            total_bytes += sz
            if sz > MAX_DOWNLOAD_BYTES:
                oversized.append((b["id"], sz))
    assert not oversized, f"images over 5MB found: {oversized[:10]}"
    log(f"Validation passed. Images dir total: {total_bytes/1024/1024:.1f} MB across {len(inv)} buildings.")


if __name__ == "__main__":
    main()
