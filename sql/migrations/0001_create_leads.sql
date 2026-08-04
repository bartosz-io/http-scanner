CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK(length(email) BETWEEN 3 AND 254),
  message TEXT CHECK(message IS NULL OR length(message) <= 2000),
  scanned_url TEXT NOT NULL,
  report_hash TEXT NOT NULL,
  report_url TEXT NOT NULL,
  score REAL NOT NULL CHECK(score >= 0 AND score < 80),
  consent_version TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(email_status IN ('pending', 'sent', 'failed')),
  email_error TEXT CHECK(email_error IS NULL OR length(email_error) <= 100),
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email_status ON leads(email_status, created_at DESC);
