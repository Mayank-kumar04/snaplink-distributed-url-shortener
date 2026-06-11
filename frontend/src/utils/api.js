const BASE = '/api';

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

export async function getUrls(page = 1, limit = 10) {
  const res = await fetch(`${BASE}/urls?page=${page}&limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch URLs');
  return data.data;
}

export async function getAnalytics(code) {
  const res = await fetch(`${BASE}/urls/${code}/analytics`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
  return data.data;
}

export async function deleteUrl(code) {
  const res = await fetch(`${BASE}/urls/${code}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete URL');
  return data;
}

export async function getStats() {
  const res = await fetch(`${BASE}/urls/stats`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data.data;
}
