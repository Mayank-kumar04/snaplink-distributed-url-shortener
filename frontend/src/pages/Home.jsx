import React, { useState } from 'react';
import { createShortUrl } from '../utils/api';
import './Home.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAlias, setShowAlias] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const data = await createShortUrl(url, alias);
      setResult(data); setUrl(''); setAlias('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="home">
      <div className="hero fade-up">
        <div className="hero-tag badge">URL Shortener</div>
        <h1 className="hero-title">Make it <span className="text-accent">short.</span></h1>
        <p className="hero-sub text-muted">Paste any URL. Get a sharp link. Track every click.</p>
      </div>

      <form className="shorten-form card fade-up" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            className="input url-input"
            type="text"
            placeholder="https://your-very-long-url.com/goes/here"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !url}>
            {loading ? <span className="spinner" /> : 'Shorten →'}
          </button>
        </div>

        <div className="alias-toggle">
          <button type="button" className="alias-toggle-btn text-muted" onClick={() => setShowAlias(v => !v)}>
            {showAlias ? '− Custom alias' : '+ Custom alias'}
          </button>
        </div>

        {showAlias && (
          <div className="alias-row fade-up">
            <span className="alias-prefix text-muted">snaplink.io/</span>
            <input
              className="input alias-input"
              type="text" placeholder="my-custom-name"
              value={alias} onChange={e => setAlias(e.target.value)} maxLength={50}
            />
          </div>
        )}

        {error && <div className="form-error text-red fade-up">⚠ {error}</div>}
      </form>

      {result && (
        <div className="result-card card fade-up">
          <div className="result-label badge">Ready</div>
          <div className="result-url-row">
            <span className="result-short-url">{result.shortUrl}</span>
            <button className="btn btn-primary copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="result-original text-muted">
            → {result.originalUrl.slice(0, 70)}{result.originalUrl.length > 70 ? '…' : ''}
          </div>
        </div>
      )}

      <div className="how-it-works mt-4 fade-up">
        <h3 className="section-label text-muted">How it works</h3>
        <div className="steps">
          {[
            ['01', 'Hash',    'nanoid generates a unique 7-char base62 code (62⁷ = 3.5 trillion combos)'],
            ['02', 'Cache',   'Stored in Redis instantly — first redirect is just as fast as the thousandth'],
            ['03', 'Persist', 'Saved to PostgreSQL with a B-tree index on short_code for O(log n) lookups'],
            ['04', 'Track',   'Every click is recorded — IP, referrer, timestamp — for analytics'],
          ].map(([num, title, desc]) => (
            <div className="step" key={num}>
              <span className="step-num text-accent">{num}</span>
              <div>
                <div className="step-title">{title}</div>
                <div className="step-desc text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
