// src/utils/api.js
// All API calls to the backend live here
// This keeps components clean and makes it easy to change the base URL

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'; // Goes through Vite proxy to http://localhost:5000

/**
 * Create a new short URL
 * @param {string} originalUrl
 * @param {string} [customAlias]
 */
export async function createShortUrl(originalUrl, customAlias = '') {
  const res = await fetch(`${BASE}/urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalUrl, customAlias: customAlias || undefined }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create URL');
  return data.data;
}

/**
 * Get paginated list of all URLs
 */
export async function getUrls(page = 1, limit = 10) {
  const res = await fetch(`${BASE}/urls?page=${page}&limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch URLs');
  return data.data;
}

/**
 * Get analytics for a specific short code
 */
export async function getAnalytics(code) {
  const res = await fetch(`${BASE}/urls/${code}/analytics`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
  return data.data;
}

/**
 * Delete (deactivate) a URL
 */
export async function deleteUrl(code) {
  const res = await fetch(`${BASE}/urls/${code}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete URL');
  return data;
}

/**
 * Get system-wide stats
 */
export async function getStats() {
  const res = await fetch(`${BASE}/urls/stats`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data.data;
}
