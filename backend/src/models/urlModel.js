// src/models/urlModel.js
// All database queries for URLs
// We use raw SQL (no ORM like Prisma/Sequelize) so you can see exactly what's happening
// This is also more impressive in interviews — you understand SQL deeply

const db = require('../config/database');

/**
 * Create a new short URL record
 * @param {Object} data - { shortCode, originalUrl, userId? }
 * @returns {Object} created URL record
 */
async function createUrl({ shortCode, originalUrl, userId = null }) {
  const query = `
    INSERT INTO urls (short_code, original_url, user_id, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `;
  // $1, $2, $3 = parameterized query — prevents SQL injection!
  const result = await db.query(query, [shortCode, originalUrl, userId]);
  return result.rows[0];
}

/**
 * Find a URL by its short code
 * 
 * INTERVIEW TIP: This query hits the INDEXED column short_code
 * PostgreSQL uses a B-tree index → O(log n) lookup instead of O(n) full scan
 * On a table with 1 million rows, that's ~20 comparisons vs 1,000,000
 */
async function findByShortCode(shortCode) {
  const query = `
    SELECT * FROM urls 
    WHERE short_code = $1 AND is_active = true
  `;
  const result = await db.query(query, [shortCode]);
  return result.rows[0] || null;
}

/**
 * Find a URL by original URL (to detect duplicates)
 */
async function findByOriginalUrl(originalUrl) {
  const query = `
    SELECT * FROM urls 
    WHERE original_url = $1 AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const result = await db.query(query, [originalUrl]);
  return result.rows[0] || null;
}

/**
 * Get all URLs with pagination
 * INTERVIEW TIP: Always paginate large queries — never SELECT * without LIMIT
 * @param {number} page - page number (1-indexed)
 * @param {number} limit - records per page
 */
async function getAllUrls(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT 
      u.*,
      COUNT(a.id) AS total_clicks
    FROM urls u
    LEFT JOIN analytics a ON a.url_id = u.id
    WHERE u.is_active = true
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  
  const countQuery = `SELECT COUNT(*) FROM urls WHERE is_active = true`;
  
  const [dataResult, countResult] = await Promise.all([
    db.query(query, [limit, offset]),
    db.query(countQuery)
  ]);
  
  return {
    urls: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  };
}

/**
 * Soft delete — mark as inactive instead of deleting
 * INTERVIEW TIP: Soft deletes preserve data for analytics and auditing
 */
async function deactivateUrl(shortCode) {
  const query = `
    UPDATE urls 
    SET is_active = false, updated_at = NOW()
    WHERE short_code = $1
    RETURNING *
  `;
  const result = await db.query(query, [shortCode]);
  return result.rows[0] || null;
}

/**
 * Increment click count atomically
 * INTERVIEW TIP: We use a single UPDATE so there's no race condition
 * (vs read count → add 1 → write back, which has a race condition)
 */
async function incrementClickCount(shortCode) {
  const query = `
    UPDATE urls 
    SET click_count = click_count + 1, last_accessed = NOW()
    WHERE short_code = $1
    RETURNING click_count
  `;
  const result = await db.query(query, [shortCode]);
  return result.rows[0]?.click_count;
}

module.exports = {
  createUrl,
  findByShortCode,
  findByOriginalUrl,
  getAllUrls,
  deactivateUrl,
  incrementClickCount,
};
