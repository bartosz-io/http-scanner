# Tech‑stack – HTTPScanner.com (Cloudflare‑native)

## Front‑end
- Cloudflare Pages – statyczny hosting SPA na edge global CDN  
- Vite + React 19 + TypeScript 5 – szybki bundling i silne typowanie  
- Tailwind CSS 4 + shadcn/ui – utility‑first styling & gotowe komponenty UI  
- Hash routing (`/#/report/<id>`) – brak serwerowego SSR, prostszy deploy  

## Edge / Back‑end
- Cloudflare Workers (JavaScript/TypeScript, wrangler v3)  
  - analiza nagłówków (HEAD → GET fallback, 3 próby × 15 s)  
  - scoring 0–100 z `weights.json`, obsługa `headers‑leak.json`  
  - endpointy POST `/api/scan`, `/api/report/delete`  
- Security & Rate‑limit: Cloudflare WAF (1 SCAN/domain/ h, 5 DELETE/IP/ h)

## Persistencja
- Cloudflare D1 (serverless SQLite)  
  - tabela `reports` (hash, deleteToken, url, score, headers, leaking, timestamps)  
- Cloudflare KV (lub R2)  
  - przechowywanie wygenerowanych grafik share PNG (cache‑control 30 dni)

## DevOps / CI · CD
- GitHub Actions  
  - lint → testy jednostkowe → Playwright e2e → wrangler publish  
  - automatyczne „Pages Preview” dla każdego PR  
- Jedno repo, jeden ekosystem Cloudflare Pages + Workers + D1/KV

## Monitoring & Admin
- Dashboard statyczny `/admin` (Cloudflare Pages), chroniony Cloudflare Access  
  - metryki z D1 (skany, median TTS, DELETE), lista timeoutów  
- Logi Workers + Logpush → Logflare (retencja 30 dni)

## Bezpieczeństwo
- Własne nagłówki:  
  - Content‑Security‑Policy: `default-src 'self'`  
  - Referrer‑Policy: `same-origin`  
  - Permissions‑Policy: restrykcyjna (np. `geolocation=()`, `camera=()`)  
  - Strict‑Transport‑Security: 2 lata, preload  
- Endpoint opt‑out `.well‑known/httpscanner-ignore`  
- Token DELETE 32‑hex weryfikowany w WAF (exact length, hex‑only)

## Szacunkowe koszty (MVP)
- Cloudflare Pages free tier  
- Workers Paid plan (5 USD/mc) – wydłużony CPU + D1 (5 USD/mc po darmowym limicie)  
- KV/R2 storage: poniżej 1 USD/mc przy ≤ 1 GB grafik