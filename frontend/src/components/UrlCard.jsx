import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUrl } from '../utils/api';
import './UrlCard.css';

export default function UrlCard({ url, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const shortUrl = `${window.location.origin}/${url.short_code}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm('Deactivate this link?')) return;
    setDeleting(true);
    try {
      await deleteUrl(url.short_code);
      onDelete(url.short_code);
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  const displayUrl = url.original_url.length > 55
    ? url.original_url.slice(0, 55) + '…'
    : url.original_url;

  const createdDate = new Date(url.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="url-card fade-up">
      <div className="url-card-main">
        <div className="url-card-codes">
          <span className="short-code text-accent">{url.short_code}</span>
          <span className="original-url text-muted" title={url.original_url}>{displayUrl}</span>
        </div>
        <div className="url-card-meta">
          <span className="meta-item">
            <span className="meta-value">{url.total_clicks ?? url.click_count ?? 0}</span>
            <span className="meta-label">clicks</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">{createdDate}</span>
          </span>
        </div>
      </div>
      <div className="url-card-actions">
        <button className="btn" onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy'}</button>
        <button className="btn" onClick={() => navigate(`/analytics/${url.short_code}`)}>Stats</button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? '…' : 'Del'}</button>
      </div>
    </div>
  );
}
