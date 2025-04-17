## 1. Tables, Columns, Types, Constraints

### reports
| Column          | Type    | Constraints                                                         | Description                                                   |
|-----------------|---------|---------------------------------------------------------------------|---------------------------------------------------------------|
| hash            | TEXT    | PRIMARY KEY, UNIQUE, NOT NULL, CHECK(length(hash) = 32)             | 32‑character hex ID generated via `hex(randomblob(16))`       |
| url             | TEXT    | NOT NULL                                                            | Fully normalised URL that was scanned                         |
| created_at      | INTEGER | NOT NULL, DEFAULT (strftime('%s','now'))                            | Unix epoch seconds                                            |
| score           | INTEGER | NOT NULL, CHECK(score BETWEEN 0 AND 100)                            | Aggregate security score                                      |
| headers         | TEXT    | NOT NULL                                                            | JSON string of **all** response headers                       |            |
| deleteToken     | TEXT    | NOT NULL, CHECK(length(deleteToken) = 32)                           | 32‑character hex token, shown once to the creator             |
| share_image_key | TEXT    | UNIQUE                                                              | KV / R2 object key for the PNG share graphic                  |

## 2. Relationships
* Single‑table design for MVP.  
* `share_image_key` references an external object in Cloudflare KV/R2 (no foreign key enforced).

## 3. Indices
```sql
-- Reverse‑chronological queries (dashboard, cleanup)
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- Rate‑limit lookup: latest scan per URL
CREATE INDEX idx_reports_url_created ON reports(url, created_at DESC);
```

## 4. Row‑Level Security

SQLite / D1 does not support native RLS.
Access control is implemented in Cloudflare Worker logic:
* deleteToken is never returned to anonymous clients.
* Admin endpoints are protected via Cloudflare Access.

## 5. Additional Notes
* Apply consistent URL normalisation (lower‑case host, strip default ports, unify trailing slashes) before inserting rows; this enables reliable 1‑scan‑per‑domain checks.
* Hard DELETE removes the row; a Worker webhook immediately deletes the related PNG identified by share_image_key.
* For future scale (millions of rows), consider yearly partitioning into separate D1 databases or archiving old rows to KV/R2.