// migrations/run.js
// Runs all SQL migration files in order
// Usage: node migrations/run.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'snaplink',
  user: process.env.DB_USER || 'snaplink',
  password: process.env.DB_PASSWORD || 'snaplink123',
});

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Get all .sql files, sorted by name (so 001_... runs before 002_...)
  const migrationsDir = path.join(__dirname);
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`  Running: ${file}`);
    try {
      await pool.query(sql);
      console.log(`  ✅ ${file} done`);
    } catch (err) {
      console.error(`  ❌ ${file} failed:`, err.message);
      process.exit(1);
    }
  }

  console.log('✅ All migrations complete!');
  await pool.end();
}

runMigrations();
