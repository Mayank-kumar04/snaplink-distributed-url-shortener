import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnalytics } from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './Analytics.css';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">{label}</div>
      <div className="tooltip-value text-accent">{payload[0].value} clicks</div>
    </div>
  );
}

export default function Analytics() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getAnalytics(code);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  if (loading) return <div className="analytics-loading"><span className="spinner" /> Loading analytics…</div>;
  if (error) return <div className="analytics-error"><p className="text-red">⚠ {error}</p><Link to="/dashboard" className="btn mt-2">← Back</Link></div>;

  const { url, dailyClicks, topReferrers, recentClicks } = data;

  const chartData = dailyClicks.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: parseInt(d.clicks),
  }));

  return (
    <div className="analytics fade-up">
      <div className="analytics-header">
        <Link to="/dashboard" className="back-link text-muted">← Back</Link>
        <div className="analytics-title-row">
          <span className="code-display text-accent">{code}</span>
          <span className="badge">Analytics</span>
        </div>
        <a href={url.original_url} target="_blank" rel="noopener noreferrer" className="original-url-link text-muted">
          {url.original_url.slice(0, 80)}{url.original_url.length > 80 ? '…' : ''}
        </a>
      </div>

      <div className="analytics-stats">
        {[
          { label: 'Total Clicks', value: url.click_count },
          { label: 'Created',      value: new Date(url.created_at).toLocaleDateString() },
          { label: 'Last Click',   value: url.last_accessed ? new Date(url.last_accessed).toLocaleDateString() : 'Never' },
        ].map(({ label, value }) => (
          <div className="stat-box" key={label}>
            <div className="stat-value text-accent">{value}</div>
            <div className="stat-label text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Click chart */}
      <div className="card">
        <h3 className="chart-title">Clicks — Last 7 Days</h3>
        {chartData.length === 0 ? (
          <p className="text-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>No click data yet</p>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="clicks" stroke="#00ff88" strokeWidth={2} fill="url(#clickGradient)"
                  dot={{ fill: '#00ff88', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#00ff88' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Referrers */}
      <div className="card">
        <h3 className="chart-title">Top Referrers</h3>
        {topReferrers.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>No referrer data yet</p>
        ) : (
          <div className="referrer-list">
            {topReferrers.map((r, i) => {
              const pct = Math.round((r.count / topReferrers[0].count) * 100);
              return (
                <div className="referrer-row" key={i}>
                  <span className="referrer-source">{r.source}</span>
                  <div className="referrer-bar-wrap">
                    <div className="referrer-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="referrer-count text-muted">{r.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent clicks */}
      <div className="card">
        <h3 className="chart-title">Recent Clicks</h3>
        {recentClicks.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>No clicks yet</p>
        ) : (
          <div className="recent-clicks">
            <div className="table-header">
              <span>Time</span><span>Referrer</span><span>Browser</span>
            </div>
            {recentClicks.map((click, i) => (
              <div className="table-row" key={i}>
                <span className="text-muted" style={{ fontSize: 12 }}>{new Date(click.clicked_at).toLocaleString()}</span>
                <span style={{ fontSize: 12 }}>{click.referer || 'Direct'}</span>
                <span className="text-muted" style={{ fontSize: 11 }}>{(click.user_agent || 'Unknown').slice(0, 40)}…</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
