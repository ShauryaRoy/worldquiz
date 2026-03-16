import fs from 'node:fs/promises';
import process from 'node:process';
import { Client } from 'pg';

const [, , connectionStringArg, sqlFileArg] = process.argv;
const connectionString = connectionStringArg || process.env.DATABASE_URL;
const sqlFile = sqlFileArg || 'scripts/setup-leaderboard.sql';

if (!connectionString) {
  console.error('Missing connection string. Pass it as first argument or set DATABASE_URL.');
  process.exit(1);
}

try {
  const sql = await fs.readFile(sqlFile, 'utf8');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log(`Applied SQL successfully from ${sqlFile}`);
} catch (error) {
  console.error('Failed to apply SQL:', error.message);
  process.exit(1);
}
