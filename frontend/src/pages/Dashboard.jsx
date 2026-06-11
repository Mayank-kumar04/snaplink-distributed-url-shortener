import React, { useState, useEffect } from 'react';
import { getUrls, getStats } from '../utils/api';
import UrlCard from '../components/UrlCard';
import './Dashboard.css';

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [page]);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [urlData, statsData] = await Promise.all([getUrls(page, 10), getStats()]);
      setUrls(urlData.urls);
      setTotalPages(urlData.totalPages);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(shortCode) {
    setUrls(prev => prev.filter(u => u.short_code !== shortCode));
    if (stats) setStats(prev => ({ ...prev, total_urls: Math.max(0, parseInt(prev.total_urls) - 1).toString() }));
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header fade-up">
        <h1>Dashboard</h1>
        <p className="text-muted">All your shortened URLs</p>
      </div>

      {stats && (
        <div className="stats-row fade-up">
          {[
            { label: 'Total URLs',    value: stats.total_urls },
            { label: 'Total Clicks',  value: stats.total_clicks },
            { label: 'Clicks Today',  value: stats.clicks_today },
            { label: 'URLs Today',    value: stats.urls_today },
          ].map(({ label, value }) => (
            <div className="stat-box" key={label}>
              <div className="stat-value text-accent">{parseInt(value).toLocaleString()}</div>
              <div className="stat-label text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-red mt-2">⚠ {error}</div>}

      {loading ? (
        <div className="loading-state"><span className="spinner" /> Loading…</div>
      ) : urls.length === 0 ? (
        <div className="empty-state">
          <p className="text-muted">No URLs yet.</p>
          <a href="/" className="btn btn-primary mt-2">Create your first →</a>
        </div>
      ) : (
        <div className="url-list">
          {urls.map(url => <UrlCard key={url.id} url={url} onDelete={handleDelete} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info text-muted">{page} / {totalPages}</span>
          <button className="btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
