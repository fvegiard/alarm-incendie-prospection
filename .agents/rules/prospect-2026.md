---
name: prospect-2026
description: End-to-end workflow to search, extract, enrich, and merge 2026 building prospects into the database and deploy.
---

# Prospect 2026 Workflow

When the user types `/prospect-2026`, the agent must execute the following sequential steps to enrich the prospection database and synchronize it with the live environment:

## Step 1: Execute Playwright Scraping
Run the specialized prospection script to scrape, parse, and structure Google Search results for 2026 construction projects using the `playwright-prospection` skill.
**Command**: `npx ts-node prospection_workflow_2026.ts`
**Verification**: Check that the script executes cleanly and that `data.json` updates successfully.

## Step 2: Database Synchronization
Verify the newly merged JSON data structure against the live environment.
*(Note: Once the Supabase MCP integration is enabled, this step should shift from merging into `data.json` to directly pushing rows to the Supabase table via the MCP tools).*

## Step 3: Source Control & Deployment
Trigger the automated commit and Netlify push to ensure the frontend reflects the new data on the live dashboard.
**Command**: `bash ./git_auto_commit.sh`

## Step 4: Final Reporting
Summarize the results to the user. State exactly how many new records were discovered and successfully pushed to the live deployment.
