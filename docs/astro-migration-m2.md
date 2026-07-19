# Astro migration M2 verification

Captured: 2026-07-19

Branch: `codex/astro-migration`

M2 replaces the internal Astro probe with the real static homepage and a working
`/reports` page. The Astro output remains parallel in `dist-astro/`; production
deploys still use the legacy artifact until the report shell and cutover stages.

## Static page boundary

| Element | Rendering owner |
|---|---|
| SEO metadata, header, navigation and footer | Astro |
| Homepage copy and security-header explanation | Astro |
| Scan form and feedback | `ScannerIsland`, `client:load` |
| Homepage report list | `RecentScansIsland`, `client:visible` |
| `/reports` list, refresh and pagination | `ReportsIsland`, `client:load` |

The homepage has one H1. Product branding in the header is a normal home link,
and no published navigation points at the removed `/about` or `/how-it-works`
placeholders.

## Routing and analytics

- New navigation and report links use normal paths without `/#/`.
- A validated scan result maps to `/report/:hash?token=...`.
- `useScanForm` captures its existing PostHog events through the browser-safe
  client instead of requiring a React provider.
- The base layout redirects supported legacy hash routes before initializing
  analytics, so a delete token is not captured from the legacy URL.
- `/reports` is `noindex,nofollow` and excluded from the generated sitemap.

The dev proxy keys are anchored to `/api` and `/share`. This prevents `/share`
from accidentally matching the frontend module path `/shared/reportHash.ts`, a
collision found and fixed during the browser hydration test.

## Verification

| Check | Result |
|---|---|
| `npm run test` | 4 files, 36 tests passed |
| `npm run lint` | 0 errors; 9 known legacy warnings |
| `npm run check` | 0 Astro or TypeScript diagnostics |
| `npm run build:astro` | Passed; homepage and `/reports` emitted to `dist-astro/` |
| `npm run build:legacy` | Passed; existing client and Worker remain buildable |
| Static homepage HTML | Title, description, canonical, one H1, explanatory copy and form are present |
| Sitemap | Contains `/` and excludes `/reports` |
| `/reports` browser test | Local Worker data rendered; refresh and normal report links enabled |
| Homepage browser test | Form hydration enabled submission; recent data loaded after scrolling into view |
| Legacy redirect | `/#/reports` replaced the browser URL with `/reports` |
| `git diff --check` | Passed |

A local `example.com` submission reached the Worker and rendered the existing
`SCAN_TIMEOUT` feedback path when outbound scanning timed out in the local
runtime. The successful destination builder is covered by unit tests; the report
page itself intentionally remains M3 scope.
