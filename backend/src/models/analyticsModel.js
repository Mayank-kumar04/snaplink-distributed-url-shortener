// src/models/analyticsModel.js
// Tracks every click on a short URL
// Stores: which URL, when, from where (IP, browser, etc.)

const db = require('../config/database');

/**
 * Record a click event
 * Called every time someone uses a short URL
 */
async function recordClick({ urlId, ipAddress, userAgent, referer }) {
  const query = `
    INSERT INTO analytics (url_id, ip_address, user_agent, referer, clicked_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id
  `;
  const result = await db.query(query, [urlId, ipAddress, userAgent, referer]);
  return result.rows[0];
}

/**
 * Get analytics summary for a single URL
 * 
 * INTERVIEW TIP: We use multiple aggregations in one query
 * vs making 3 separate queries — much more efficient
 */
async function getUrlAnalytics(shortCode) {
  // First get the URL
  const urlQuery = `
    SELECT id, short_code, original_url, click_count, created_at, last_accessed
    FROM urls WHERE short_code = $1
  `;
  const urlResult = await db.query(urlQuery, [shortCode]);
  const url = urlResult.rows[0];
  if (!url) return null;

  // Get clicks over last 7 days (grouped by day)
  const dailyQuery = `
    SELECT 
      DATE(clicked_at) AS date,
      COUNT(*) AS clicks
    FROM analytics
    WHERE url_id = $1
      AND clicked_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(clicked_at)
    ORDER BY date ASC
  `;

  // Get top referrers
  const referrerQuery = `
    SELECT 
      COALESCE(referer, 'Direct') AS source,
      COUNT(*) AS count
    FROM analytics
    WHERE url_id = $1
    GROUP BY referer
    ORDER BY count DESC
    LIMIT 5
  `;

  // Get recent clicks
  const recentQuery = `
    SELECT ip_address, user_agent, referer, clicked_at
    FROM analytics
    WHERE url_id = $1
    ORDER BY clicked_at DESC
    LIMIT 10
  `;

  // Run all queries in parallel for speed
  // INTERVIEW TIP: Promise.all runs queries concurrently, not sequentially
  const [daily, referrers, recent] = await Promise.all([
    db.query(dailyQuery, [url.id]),
    db.query(referrerQuery, [url.id]),
    db.query(recentQuery, [url.id]),
  ]);

  return {
    url,
    dailyClicks: daily.rows,
    topReferrers: referrers.rows,
    recentClicks: recent.rows,
  };
}

/**
 * Get overall system statistics
 */
async function getSystemStats() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM urls WHERE is_active = true) AS total_urls,
      (SELECT COALESCE(SUM(click_count), 0) FROM urls) AS total_clicks,
      (SELECT COUNT(*) FROM analytics WHERE clicked_at >= NOW() - INTERVAL '24 hours') AS clicks_today,
      (SELECT COUNT(*) FROM urls WHERE created_at >= NOW() - INTERVAL '24 hours') AS urls_today
  `;
  const result = await db.query(query);
  return result.rows[0];
}

module.exports = { recordClick, getUrlAnalytics, getSystemStats };
