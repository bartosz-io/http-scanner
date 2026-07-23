# Astro migration M4 verification

Captured: 2026-07-23

Branch: `codex/astro-migration`

M4 completes the technical SEO and static error-handling layer for the Astro
build. The public site now has one production origin, a tested sitemap policy,
crawler instructions, a generated 404 page, and explicit immutable caching for
Astro's fingerprinted assets.

The Astro output remains parallel in `dist-astro/`; production builds and
deploys still use the legacy artifact until M6.

## Metadata and sitemap policy

- `SITE_ORIGIN` defines `https://httpscanner.com` once and supplies Astro's
  `site` setting.
- `BaseLayout.astro` and `SeoHead.astro` remain the central metadata boundary
  for titles, descriptions, canonical URLs, Open Graph fields and `noindex`.
- `shouldIncludeInSitemap()` excludes `/report`, `/report/*`, `/reports`,
  `/share` and `/share/*`, independent of a trailing slash.
- `/report/`, `/reports` and the 404 page retain `noindex`.
- The generated sitemap contains only the current indexable homepage. No
  planned checker route is published early.

## Crawler and cache behavior

`public/robots.txt` is copied to the deployment output and:

- allows the public site;
- disallows report, reports-list and share paths;
- advertises `https://httpscanner.com/sitemap-index.xml`.

`public/_headers` applies:

```text
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

The rule is limited to Astro's fingerprinted output. HTML keeps the Cloudflare
Static Assets default `Cache-Control: public, max-age=0, must-revalidate` and
ETag validation.

## Static 404 behavior

- Astro emits `dist-astro/404.html` from `src/pages/404.astro`.
- The page uses the shared site layout and contains
  `robots=noindex,nofollow`.
- `assets.not_found_handling` is set to `404-page` in `wrangler.jsonc`.
- A request for `/does-not-exist` through local Wrangler returned the custom
  page with HTTP 404, not the homepage with HTTP 200.
- Worker-first routing remains limited to `/api/*`, `/share/*` and
  `/report/*`; no new Worker coupling was introduced.

## Verification

| Check | Result |
|---|---|
| `npm run test` | 10 files, 57 tests passed |
| `npm run lint` | 0 errors; 7 known legacy warnings |
| `npm run check` | 0 Astro or TypeScript diagnostics |
| `npm run build:astro` | Passed; `404.html`, `robots.txt`, `_headers` and sitemap emitted |
| `npm run build:legacy` | Passed; existing client and Worker remain buildable |
| Unknown URL through Wrangler | 404 and custom `Page not found` HTML |
| Homepage cache | `public, max-age=0, must-revalidate` |
| Fingerprinted `/_astro/*` cache | `public, max-age=31536000, immutable` |
| Sitemap | Contains only `https://httpscanner.com/` |
| Sitemap exclusion tests | `/report`, `/reports` and `/share` variants excluded |

No deployment, D1 migration or production-state mutation was performed.

## Local verification

Build the static output, then run the Worker:

```sh
npm run build:astro
npm run dev:worker
```

Verify the custom error response:

```sh
curl -sS -o /tmp/http-scanner-404.html -w '%{http_code}\n' \
  http://localhost:8787/does-not-exist
rg 'Page not found' /tmp/http-scanner-404.html
```

Verify cache headers:

```sh
curl -sSI http://localhost:8787/
m4_asset_path="$(rg --files dist-astro/_astro | head -n 1)"
curl -sSI "http://localhost:8787/${m4_asset_path#dist-astro/}"
```

Verify the generated sitemap:

```sh
rg '<loc>' dist-astro/sitemap-0.xml
```
