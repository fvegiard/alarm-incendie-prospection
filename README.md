# alarm-incendie-prospection

Automated fire alarm prospection system that combines web scraping, database management, and intelligent workflow orchestration to identify and analyze fire alarm system prospects. The system uses headless browser automation, data enrichment pipelines, and multi-stage processing workflows to generate actionable sales intelligence.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fvegiard/alarm-incendie-prospection.git
cd alarm-incendie-prospection
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration (database credentials, API keys, etc.)
```

4. Initialize the database:
```bash
npm run setup-db
# or use the schema.sql file directly with your database client
```

## Usage

The system operates through multiple specialized workflows:

**Web Scraping & Data Collection**
```bash
node prospection_workflow_2026.ts
```
Initiates automated prospecting using Playwright for browser automation and data extraction from target websites.

**Data Enrichment Pipeline**
```bash
python enrich.py
```
Enriches collected prospect data with additional business intelligence and validation checks.

**Agent-Based Analysis**
```bash
python agent_tree_workflow.py
```
Runs multi-stage analysis using intelligent agent workflows to classify and score prospects.

**Request Analysis**
```bash
python analyze_requests.py
```
Analyzes and validates collected requests for data quality and completeness.

**Configuration Files**
- `.env` — Database connections, API credentials, and system settings
- `schema.sql` — Database schema for prospect and workflow data storage
- `biome.json` — Workspace and build configuration
- `tsconfig.json` — TypeScript compilation settings
- `package.json` — Node.js dependencies and scripts

**Database Support**
The system integrates with multiple database backends:
- PostgreSQL (via `pg`)
- SQLite3 (via `sqlite3`)
- Supabase (via `@supabase/supabase-js`)

**Output**
- Processed prospects stored in configured database
- Analysis results exported to `analysis_results.txt`
- Enriched data available in `data.json` format

## Requirements

- Node.js 18+
- Python 3.8+
- Playwright (for browser automation)
- PostgreSQL or SQLite3 instance

## License

[MIT](LICENSE)