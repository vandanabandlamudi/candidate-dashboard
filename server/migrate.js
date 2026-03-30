import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    // Additive migrations — safe to run multiple times
    await client.query(`
      ALTER TABLE screening_results
        ADD COLUMN IF NOT EXISTS review_only BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('Migration complete — all tables created.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
