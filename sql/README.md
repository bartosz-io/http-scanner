# HTTP Scanner Database

## Overview

This directory contains the database schema and migrations for the HTTP Scanner application. The application uses Cloudflare D1, which is a serverless SQL database built on SQLite.

## Database Structure

The database follows a single-table design for the MVP:

### `reports` Table

| Column          | Type    | Constraints                                     | Description                                   |
|-----------------|---------|------------------------------------------------|-----------------------------------------------|
| hash            | TEXT    | PRIMARY KEY, UNIQUE, NOT NULL                  | 32‑character hex ID                           |
| url             | TEXT    | NOT NULL                                       | Fully normalized URL that was scanned         |
| created_at      | INTEGER | NOT NULL, DEFAULT (current timestamp)          | Unix epoch seconds                            |
| score           | INTEGER | NOT NULL, CHECK(score BETWEEN 0 AND 100)       | Aggregate security score                      |
| headers         | TEXT    | NOT NULL                                       | JSON string of all response headers           |
| deleteToken     | TEXT    | NOT NULL, CHECK(length(deleteToken) = 32)      | 32‑character hex token for deletion           |
| share_image_key | TEXT    | UNIQUE                                         | KV/R2 object key for the PNG share graphic    |

### Indices

- `idx_reports_created`: For reverse-chronological queries (dashboard, cleanup)
- `idx_reports_url_created`: For rate-limit lookup of the latest scan per URL

## Working with the Database

### Local Development

To execute SQL commands on the local development database:

```bash
npx wrangler d1 execute http_scanner_db --local --command "YOUR SQL COMMAND"
```

### Production

To execute SQL commands on the production database:

```bash
npx wrangler d1 execute http_scanner_db --remote --command "YOUR SQL COMMAND"
```

### Migrations

Migrations are stored in the `sql/migrations` directory. To apply migrations:

```bash
# Local development
npx wrangler d1 migrations apply http_scanner_db

# Production
npx wrangler d1 migrations apply http_scanner_db --remote
```

## Implementation Notes

- Apply consistent URL normalization (lower-case host, strip default ports, unify trailing slashes) before inserting rows to enable reliable 1-scan-per-domain checks.
- For future scale (millions of rows), consider yearly partitioning into separate D1 databases or archiving old rows to KV/R2.
- Access control is implemented in Cloudflare Worker logic since SQLite/D1 does not support native row-level security.
