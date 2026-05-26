// src/config/database.js
// Sets up a PostgreSQL connection pool
// A "pool" means we keep multiple connections open and reuse them
// instead of opening/closing a new connection for every query (expensive!)

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'snaplink',
  user: process.env.DB_USER || 'snaplink',
  password: process.env.DB_PASSWORD || 'snaplink123',
  max: 20,          // max 20 simultaneous connections in the pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail if can't connect in 2s
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});

module.exports = pool;
