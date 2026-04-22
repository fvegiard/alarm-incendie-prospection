# 2026 Prospection Integration Plan

This plan consolidates all your recent requests into a structured, autonomous workflow using Antigravity, sub-agents, and static data rendering without Supabase.

## User Review Required

> [!IMPORTANT]  
> Supabase is currently **turned off** per your request. The dashboard will consume and update `data.json` directly. Please confirm this is still your intention before we execute.
> 
> The OSM RTE map tiles (`openstreetmap.fr`) sometimes experience CORS or rate-limiting issues on free tiers, which is why it was previously showing the "can't be charged" error. We will implement it with a robust fallback to ensure it doesn't crash the UI.

## Proposed Changes

---

### Phase 1: Environment & Tooling Setup
*Configure the IDE and validation tools before running agentic code.*

#### [NEW] `biome.json` (or verify installation)
- Setup Biome to format and inspect our TypeScript workflow files (`prospection_workflow_2026.ts`) to ensure "0 invalid code" execution.

#### [MODIFY] `prospection_workflow_2026.ts`
- **Sub-Agent Fan-Out:** Implement the 8 sub-agent parallel execution pattern (Gemini Flash Headless).
- **2026 Data Restriction:** Enforce strict prompt barriers to only pull data for condos, commercial buildings, and hotels/motels (>50 rooms) scheduled for or active in **2026**.
- **Coverage:** Expand search functions to explicitly target **Laval** and the **South Shore (Rive-Sud)**.
- **Enrichment Node:** Auto-attach generated or scraped image URLs, exact Latitude/Longitude, and placeholder contact points.

---

### Phase 2: UI & Map Fixes
*Address the visual and layout issues on the dashboard.*

#### [MODIFY] `index.html`
- **Map Layer:** Revert the Leaflet tile layer from CartoDB back to **OpenStreetMap RTE** (`https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png`).
- **Map Error Handling:** Improve the error catch block so if OSM RTE fails to load, it cleanly falls back to the local SVG schematic map instead of throwing console errors.
- **Rank Logic (Laval):** Ensure the rendering function sorts items correctly by `rang` (Rank), so the tallest buildings (e.g., Sélection Panorama) always appear at the top of the Laval section.
- **UI Cleanup:** Remove the specific outdated UI fragments requested during the previous visual audit.

---

### Phase 3: Execution & Deployment Pipeline
*Run the workflow and sync the changes to production.*

#### [MODIFY] `data.json`
- The target output file for the `prospection_workflow_2026.ts` script. We will merge the new 2026 records with the existing inventory.

#### [NEW] `git_auto_commit.sh`
- A script to run immediately after the workflow finishes to auto-commit `data.json` and `index.html`, and push to the GitHub repository, triggering the Netlify deployment seamlessly.

## Verification Plan

### Automated Tests
- **Biome Check:** Run `npx @biomejs/biome check .` to validate the TypeScript codebase.
- **CDP DOM Verification:** Launch Chrome with debug port 9222 and verify the DOM tree confirms the map tile URL has changed and the new data rows are present in the table.

### Manual Verification
- **Visual Check:** Check the Netlify staging/production URL to ensure the OSM map loads and the new Laval/South Shore properties are visible and correctly ranked.
