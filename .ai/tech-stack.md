# Tech stack – HTTPScanner.com (Cloudflare‑native)

## Front‑end
- Cloudflare Pages – static SPA hosting on the global edge CDN  
- Vite + React 19 + TypeScript 5 – fast bundling and strong typing  
- Tailwind CSS 4 + shadcn/ui – utility‑first styling and ready‑made UI components  
- Hash routing (`/#/report/<id>`) – no server‑side SSR, simpler deployment  

## Edge / Back‑end
- Cloudflare Workers (JavaScript/TypeScript, wrangler v3)  
  - header analysis (HEAD → GET fallback, 3 attempts × 15 s)  
  - 0–100 scoring via `weights.json`, handling `headers‑leak.json`  
  - POST endpoints `/api/scan`, `/api/report/delete`  
- Security & rate limiting: Cloudflare WAF (1 SCAN/domain/h, 5 DELETE/IP/h)

## Persistence
- Cloudflare D1 (serverless SQLite)  
  - `reports` table (hash, deleteToken, url, score, headers, leaking, timestamps)  
- Cloudflare KV (or R2)  
  - storage of generated share PNG graphics (cache‑control 30 days)

## DevOps / CI · CD
- GitHub Actions  
  - lint → unit tests → Playwright e2e → wrangler publish  
  - automatic “Pages Preview” for every PR  
- Single repository, single Cloudflare ecosystem (Pages + Workers + D1/KV)

## Monitoring & Admin
- Static dashboard `/admin` (Cloudflare Pages) protected by Cloudflare Access  
  - metrics from D1 (scans, median TTS, DELETEs), timeout list  
- Worker logs + Logpush → Logflare (30‑day retention)

## Security
- Custom headers:  
  - Content‑Security‑Policy: `default-src 'self'`  
  - Referrer‑Policy: `same-origin`  
  - Permissions‑Policy: restrictive (e.g., `geolocation=()`, `camera=()`)  
  - Strict‑Transport‑Security: 2 years, preload  
- Opt‑out endpoint `.well‑known/httpscanner-ignore`  
- 32‑hex DELETE token validated by WAF (exact length, hex‑only)

## Estimated Costs (MVP)
- Cloudflare Pages free tier  
- Workers Paid plan (USD 5/mo) – extended CPU; D1 (USD 5/mo after free quota)  
- KV/R2 storage: under USD 1/mo for ≤ 1 GB of graphics