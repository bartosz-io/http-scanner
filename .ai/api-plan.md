# REST API Plan — Synchronous Version

## 1. Resources

| Resource | Backing Table | Notes |
|----------|---------------|-------|
| **Report** | reports | Single scan result; identified by 32‑char `hash` |
| **Admin statistics** | live aggregation over reports | Access restricted via Cloudflare Access |

---

## 2. Endpoints

[DONE] ### 2.1 Run Scan (synchronous)
| Item | Value |
|------|-------|
| Method / Path | **POST** `/scan` |
| Description | Perform a full scan of a public URL and return the complete report in the same response. |
| Request JSON | `{ "url": "https://example.com" }` |
| Success 200 | ```{ "hash":"ab12…ef","url":"https://example.com","created_at":1713369600,"score":87,"headers":{"detected":[…],"missing":[…],"leaking":[…]},"share_image_url":"https://cdn.cloudflare.r2/…/ab12ef.png" }``` |
| Error 400 | Invalid or non‑HTTP/HTTPS URL |
| Error 429 | Rate‑limit: this domain was scanned in the last hour |
| Error 504 | Scan exceeded 45 s (3 attempts × 15 s) |
| Notes | Client receives the finished report immediately; no polling. |

---

[DONE] ### 2.2 Fetch Existing Report
| Item | Value |
|------|-------|
| Method / Path | **GET** `/report/{hash}` |
| Description | Retrieve a previously generated report (useful for shared links). |
| Success 200 | *Same JSON structure as above* |
| Error 404 | Unknown hash or report deleted |

---

[DONE] ### 2.3 Delete Report
| Item | Value |
|------|-------|
| Method / Path | **POST** `/report/delete` |
| Request JSON | `{ "hash":"ab12…ef", "deleteToken":"7fa4…9c" }` |
| Success 204 | Report (and PNG) deleted |
| Error 401 | Token/hash mismatch |
| Error 429 | More than 5 delete attempts per IP per hour |

---

[DONE] ### 2.4 Admin – Summary Stats *(protected)*
| Item | Value |
|------|-------|
| Method / Path | **GET** `/admin/stats` |
| Query | `from`, `to` (epoch seconds, optional) |
| Success 200 | `{ "total_scans":1234,"unique_domains":987,"timeout_errors":5 }` |
| Error 401 | Not authenticated via Cloudflare Access |

---

[TODO] ### 2.5 Paginated Reports *(public)*
| Method / Path | **GET** `/reports` |
| Query params | `limit` 20–100, `cursor`, `sort=created_at|score` (`-` for desc) |
| Success 200 | `{ "items":[{ "hash":"ab12…","url":"https://…" }], "next":"cursor123" }` |

---

## 3. Authentication & Authorization

| Scope | Mechanism |
|-------|-----------|
| Public endpoints (`/scan`, `/report/*`, `/report/delete`) | Anonymous; Cloudflare WAF applies rate limits |
| Admin endpoints (`/admin/*`) | Cloudflare Access with GitHub SSO |

---

## 4. Validation & Business Logic

| Rule | Enforcement |
|------|-------------|
| URL must be HTTP/HTTPS, ≤ 2048 chars, normalised | Worker validation before scan |
| 1 scan per domain per hour | Query `reports` by `url, created_at DESC` |
| Score range 0–100 | DB `CHECK` constraint |
| deleteToken 32‑hex | Checked before hard delete |
| PNG cleanup | Worker deletes KV/R2 key after hard delete |

---

## 5. Performance & Security Notes
* **Request latency**: 8–15 s typical, capped at 45 s.  
* Worker wall‑clock < 100 s (Cloudflare limit); response size ≤ 10 KB JSON.  
* WAF rules: **1 SCAN/domain/hour**, **5 DELETE/IP/hour**.  
* HTTPS enforced; CSP, HSTS, Referrer‑Policy via Cloudflare Pages.  
* All writes are POST; reads are GET.