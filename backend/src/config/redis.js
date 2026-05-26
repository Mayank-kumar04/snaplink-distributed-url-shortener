// src/config/redis.js
// Sets up the Redis client
// Redis is an in-memory key-value store — perfect for caching
// Think of it like a super-fast dictionary: key → value

const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      // Exponential backoff: wait longer between each retry attempt
      // Interview tip: this prevents overwhelming the server with retry storms
      return Math.min(retries * 100, 3000);
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('connect', () => console.log('✅ Redis connected'));
client.on('error', (err) => console.error('❌ Redis error:', err.message));
client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

// Connect immediately
(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
    // App still works without Redis — just slower (falls back to PostgreSQL)
  }
})();

module.exports = client;
