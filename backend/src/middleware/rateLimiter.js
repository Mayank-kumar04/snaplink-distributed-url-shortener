// src/middleware/rateLimiter.js
// Prevents abuse by limiting how many requests an IP can make
// Uses express-rate-limit which stores counts in memory (or Redis for production)
//
// INTERVIEW TIP: Rate limiting is a crucial production concern
// Without it, one bad actor could create millions of short URLs or
// spam your redirect endpoint, taking down your service

const rateLimit = require('express-rate-limit');

// Limit URL creation: 10 per hour per IP
// This prevents people from using your service as a spam tool
const createUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour window
  max: 10,                    // max 10 requests per window
  message: {
    error: 'Too many URLs created from this IP. Please try again in an hour.',
  },
  standardHeaders: true,  // Return rate limit info in headers
  legacyHeaders: false,
});

// Limit API reads: 100 per minute per IP
// More generous since reading is less harmful than writing
const readLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { createUrlLimiter, readLimiter };
