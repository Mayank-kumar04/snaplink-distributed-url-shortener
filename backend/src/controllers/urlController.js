// src/controllers/urlController.js
// Business logic for all URL operations
// This is where Redis caching happens — the most interview-worthy code

const validator = require('validator');
const urlModel = require('../models/urlModel');
const analyticsModel = require('../models/analyticsModel');
const redisClient = require('../config/redis');
const { generateShortCode, isValidShortCode, validateCustomAlias } = require('../utils/hashUtils');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 86400; // 24 hours

// Redis key prefix — good practice to namespace keys
// If you have multiple apps using same Redis, keys won't collide
const CACHE_PREFIX = 'url:';

/**
 * POST /api/urls
 * Create a new short URL
 */
async function createShortUrl(req, res) {
  try {
    const { originalUrl, customAlias } = req.body;

    // 1. Validate the URL
    if (!originalUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!validator.isURL(originalUrl, { require_protocol: true })) {
      return res.status(400).json({ error: 'Invalid URL. Must include http:// or https://' });
    }

    // 2. Validate custom alias if provided
    let shortCode;
    if (customAlias) {
      const { valid, error } = validateCustomAlias(customAlias);
      if (!valid) return res.status(400).json({ error });
      shortCode = customAlias;
    } else {
      shortCode = generateShortCode();
    }

    // 3. Check if this short code already exists (collision check)
    //    For custom aliases, this prevents duplicates
    //    For generated codes, collisions are astronomically rare but we check anyway
    const existing = await urlModel.findByShortCode(shortCode);
    if (existing) {
      if (customAlias) {
        return res.status(409).json({ error: 'This custom alias is already taken' });
      }
      // For generated codes, just try again (recursive would work too)
      shortCode = generateShortCode();
    }

    // 4. Create in PostgreSQL (source of truth)
    const newUrl = await urlModel.createUrl({ shortCode, originalUrl });

    // 5. Store in Redis cache immediately
    //    So the first redirect is also fast (no DB lookup needed)
    //    INTERVIEW TIP: This is "write-through" caching pattern
    try {
      await redisClient.setEx(
        `${CACHE_PREFIX}${shortCode}`,
        CACHE_TTL,
        JSON.stringify({ originalUrl, urlId: newUrl.id })
      );
    } catch (redisErr) {
      // If Redis fails, we still succeed — Redis is cache, not primary store
      console.warn('Redis write failed (non-fatal):', redisErr.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        shortCode,
        shortUrl: `${BASE_URL}/${shortCode}`,
        originalUrl,
        createdAt: newUrl.created_at,
      },
    });
  } catch (err) {
    console.error('createShortUrl error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /:code
 * Redirect to original URL
 * 
 * THE CRITICAL PATH — must be as fast as possible
 * This is where the Redis caching provides maximum value
 * 
 * INTERVIEW EXPLANATION — Cache-Aside Pattern:
 *   1. Check Redis first (fast, ~0.1ms)
 *   2. If found ("cache hit") → use cached URL
 *   3. If not found ("cache miss") → query PostgreSQL (~5ms)
 *   4. Store result in Redis for next time
 *   5. Redirect user
 */
async function redirectToUrl(req, res) {
  try {
    const { code } = req.params;

    // Basic validation
    if (!code || code.length > 50) {
      return res.status(400).json({ error: 'Invalid short code' });
    }

    let originalUrl, urlId;
    const cacheKey = `${CACHE_PREFIX}${code}`;

    // STEP 1: Try Redis cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        // CACHE HIT — serve from Redis, super fast!
        const data = JSON.parse(cached);
        originalUrl = data.originalUrl;
        urlId = data.urlId;
        console.log(`Cache HIT for ${code}`);
      }
    } catch (redisErr) {
      // Redis is down — gracefully fall through to DB
      console.warn('Redis read failed, falling back to DB:', redisErr.message);
    }

    // STEP 2: Cache miss — query PostgreSQL
    if (!originalUrl) {
      console.log(`Cache MISS for ${code} — querying DB`);
      const urlRecord = await urlModel.findByShortCode(code);

      if (!urlRecord) {
        return res.status(404).json({ error: 'Short URL not found' });
      }

      originalUrl = urlRecord.original_url;
      urlId = urlRecord.id;

      // STEP 3: Populate cache for next time ("lazy loading" / "cache-aside")
      try {
        await redisClient.setEx(
          cacheKey,
          CACHE_TTL,
          JSON.stringify({ originalUrl, urlId })
        );
      } catch (redisErr) {
        console.warn('Redis cache population failed:', redisErr.message);
      }
    }

    // STEP 4: Record analytics (async — don't wait for it, speeds up redirect)
    // Fire-and-forget: we don't await this so the user gets redirected immediately
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';

    Promise.all([
      urlModel.incrementClickCount(code),
      analyticsModel.recordClick({ urlId, ipAddress, userAgent, referer }),
    ]).catch(err => console.error('Analytics recording failed:', err.message));

    // STEP 5: Redirect! 301 = permanent, 302 = temporary
    // We use 302 so browsers don't cache it (allows analytics to work)
    return res.redirect(302, originalUrl);
  } catch (err) {
    console.error('redirectToUrl error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/urls
 * List all URLs with pagination
 */
async function listUrls(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const result = await urlModel.getAllUrls(page, limit);

    // Add full short URL to each record
    const urls = result.urls.map(url => ({
      ...url,
      shortUrl: `${BASE_URL}/${url.short_code}`,
    }));

    return res.json({ success: true, data: { ...result, urls } });
  } catch (err) {
    console.error('listUrls error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/urls/:code
 * Deactivate a short URL
 */
async function deleteUrl(req, res) {
  try {
    const { code } = req.params;
    const deleted = await urlModel.deactivateUrl(code);

    if (!deleted) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Remove from Redis cache too!
    try {
      await redisClient.del(`${CACHE_PREFIX}${code}`);
    } catch (redisErr) {
      console.warn('Redis delete failed:', redisErr.message);
    }

    return res.json({ success: true, message: 'URL deactivated' });
  } catch (err) {
    console.error('deleteUrl error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/urls/:code/analytics
 * Get click analytics for a URL
 */
async function getAnalytics(req, res) {
  try {
    const { code } = req.params;
    const data = await analyticsModel.getUrlAnalytics(code);

    if (!data) {
      return res.status(404).json({ error: 'URL not found' });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/stats
 * System-wide statistics
 */
async function getStats(req, res) {
  try {
    // Cache stats for 60 seconds — no need to recompute every request
    const cacheKey = 'system:stats';
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return res.json({ success: true, data: JSON.parse(cached) });
    } catch (_) {}

    const stats = await analyticsModel.getSystemStats();

    try {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(stats));
    } catch (_) {}

    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createShortUrl, redirectToUrl, listUrls, deleteUrl, getAnalytics, getStats };
