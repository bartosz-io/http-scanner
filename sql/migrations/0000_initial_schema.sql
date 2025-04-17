-- D1 SQLite initialization script for HTTPScanner.com (MVP)
-- Enable foreign‑key checks (good practice, though no FKs in current schema)
PRAGMA foreign_keys = ON;

-- =========================================================
-- Table: reports
-- =========================================================
CREATE TABLE IF NOT EXISTS reports (
  hash             TEXT PRIMARY KEY,  -- 32-char hex ID
  url              TEXT NOT NULL,     -- normalized URL
  created_at       INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),  -- Unix epoch
  score            INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),  -- 0-100 aggregate
  headers          TEXT NOT NULL,     -- JSON string
  deleteToken      TEXT NOT NULL CHECK(length(deleteToken) = 32),  -- 32-char hex
  share_image_key  TEXT UNIQUE        -- KV/R2 PNG key
);

-- =========================================================
-- Indices
-- =========================================================
-- Reverse‑chronological queries (dashboard, cleanup)
CREATE INDEX IF NOT EXISTS idx_reports_created
  ON reports(created_at DESC);

-- Rate‑limit lookup: latest scan per URL
CREATE INDEX IF NOT EXISTS idx_reports_url_created
  ON reports(url, created_at DESC);