---
name: playwright-prospection
description: Custom Playwright scraping pipeline for finding 2026 fire alarm prospection targets in Montreal, Laval, and surrounding areas.
---

# Playwright Prospection Pipeline

This skill enables the agent to autonomously scrape new building projects (commercial, residential, industrial, institutional) across Montreal, Laval, South Shore, and North Shore for the year 2026 using Playwright.

## Rules & Constraints

1. **Target Identification**:
   - Use Google search with strict `site:` operators when possible (e.g., `site:montreal.ca construction projets 2026`).
   - Target queries must span high-rises, hotels, condos, industrial parks, and commercial buildings.
2. **Scraping Strategy**:
   - Use `playwright` in headless mode.
   - Extract title nodes (e.g., `h3`). Limit to top 10 relevant results to prevent bot bans.
   - Filter out noise (e.g., Wikipedia, Video carousels, Image packs).
   - Generate approximate geographic bounds based on the target city (Lat: ~45.45 to 45.6, Lng: ~-73.7 to -73.45).
3. **Data Enrichment**:
   - Append fallback placeholder images via UI-Avatars if no real image is scraped.
   - Append default placeholder contact information for the prospect.
4. **Data Deduplication**:
   - ALWAYS verify against `data.json` (or the live Supabase table via MCP) to prevent duplicate entries before insertion.
   - Normalize names (lowercase, trim) when comparing.

To execute the manual script fallback, you can run:
`npx ts-node prospection_workflow_2026.ts`
