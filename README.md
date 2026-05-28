# alarm-incendie-prospection

Fire alarm prospection system that automates web scraping, data enrichment, and lead management for fire safety businesses. Combines browser automation with database workflows to identify and qualify prospects from online sources.

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

3. Configure environment variables:
```bash
cp .env.example .env
```
Update `.env` with your database credentials and API keys (Supabase, scraping targets, etc.).

4. Initialize the database:
```bash
node setup_db.js
```

## Usage

### Web Scraping & Prospection
Run the prospection workflow to collect fire alarm prospects:
```bash
npm run prospection
```

The system uses Playwright for browser automation to scrape business listings and contact information from configured sources.

### Data Enrichment
Enrich prospect data with additional details:
```bash
python3 enrich.py
```

This processes raw scraping results and validates contact information.

### Automated Workflows
Execute agent-based workflows for lead processing:
```bash
python3 agent_tree_workflow.py
```

TypeScript workflow orchestration:
```bash
npx ts-node prospection_workflow_2026.ts
```

### Database Management
The system uses SQLite for local caching and PostgreSQL/Supabase for persistent storage. Query the schema:
```bash
sqlite3 data.json ".schema"
```

## Configuration

- **Database**: Configure PostgreSQL or Supabase connection in `.env`
- **Scraping targets**: Update targets in configuration files
- **Workflow rules**: Modify agent logic in `agent_tree_workflow.py`
- **TypeScript config**: See `tsconfig.json` for compilation settings

## Architecture

- **Web scraping**: Playwright-based automation for prospect discovery
- **Data pipeline**: Enrich and validate leads through Python scripts
- **Workflow engine**: Tree-based agent system for automated lead qualification
- **Storage**: SQLite cache + PostgreSQL/Supabase sync
- **API**: WebSocket support for real-time updates

## License

[MIT](LICENSE)