-- migrations/001_create_tables.sql
-- This creates all the tables we need
-- Run this once when setting up the database

-- URLs table: stores each short URL
CREATE TABLE IF NOT EXISTS urls (
  id              SERIAL PRIMARY KEY,          -- auto-incrementing integer ID
  short_code      VARCHAR(50) NOT NULL,        -- the short code e.g. "aB3kR9z"
  original_url    TEXT NOT NULL,              -- the full original URL
  user_id         INTEGER,                    -- optional: for future user accounts
  click_count     INTEGER NOT NULL DEFAULT 0, -- cached click counter (fast reads)
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ,
  last_accessed   TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT urls_short_code_unique UNIQUE (short_code)
);

-- INDEX on short_code: THE MOST IMPORTANT INDEX
-- Every redirect lookup queries by short_code
-- Without this index: PostgreSQL scans every row = O(n) = slow
-- With this index: B-tree lookup = O(log n) = fast even with millions of rows
-- 
-- INTERVIEW TIP: PostgreSQL automatically creates an index for UNIQUE constraints,
-- so we don't need a separate CREATE INDEX for short_code — it's already indexed!
-- But for original_url we add one manually:

CREATE INDEX IF NOT EXISTS idx_urls_original_url 
  ON urls (original_url);

CREATE INDEX IF NOT EXISTS idx_urls_created_at 
  ON urls (created_at DESC);  -- for "list by newest" queries

-- Analytics table: every click is a row here
CREATE TABLE IF NOT EXISTS analytics (
  id          SERIAL PRIMARY KEY,
  url_id      INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  ip_address  VARCHAR(45),      -- IPv4 (15 chars) or IPv6 (45 chars)
  user_agent  TEXT,             -- browser info
  referer     TEXT,             -- where the click came from
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying analytics by URL (most common analytics query)
CREATE INDEX IF NOT EXISTS idx_analytics_url_id 
  ON analytics (url_id);

-- Index for time-based queries (e.g. "clicks in last 7 days")
CREATE INDEX IF NOT EXISTS idx_analytics_clicked_at 
  ON analytics (clicked_at DESC);

-- Composite index: url_id + clicked_at for the daily breakdown query
-- INTERVIEW TIP: Composite indexes work left-to-right
-- This index helps: WHERE url_id = X AND clicked_at >= Y
CREATE INDEX IF NOT EXISTS idx_analytics_url_id_clicked_at 
  ON analytics (url_id, clicked_at DESC);
