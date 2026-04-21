const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.sojvecqkrhatnvspwaub:Supabase$Password2026!@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

async function init() {
  await client.connect();
  const sql = fs.readFileSync('schema.sql', 'utf8');
  await client.query(sql);
  console.log('Schema created successfully');
  await client.end();
}

init().catch(e => {
  console.error("Error setting up DB:", e);
  process.exit(1);
});
