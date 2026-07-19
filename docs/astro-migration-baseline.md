# Astro migration M0 baseline

Captured: 2026-07-19 11:24 UTC

Environment: production `https://httpscanner.com`

Branch: `codex/astro-migration`

This document records the externally visible contracts that the Astro migration must preserve. All requests were read-only. No scan was started and no delete token was used or stored.

## Public test report

| Field | Value |
|---|---|
| Hash | `9249232fefb9a1c0455ba007d7784f6c` |
| URL | `https://hosted.nl` |
| Source | Existing public `/api/reports` response |
| Delete token | Not collected |

The hash is suitable for read-only local and production smoke tests. Tests must not delete or mutate this report.

## HTTP baseline

### Homepage

Request: `GET /`

| Property | Observed value |
|---|---|
| Status | `200` |
| Content-Type | `text/html` |
| Cache | `cf-cache-status: HIT`, `cache-control: public, max-age=0, must-revalidate` |
| Title | `Http Scanner` |
| Rendered body | Empty `<div id="root"></div>` plus JS and CSS assets |
| Canonical/description | Not present |

This confirms that production currently serves an SPA shell without indexable application content in the initial HTML.

### Reports collection API

Request: `GET /api/reports?limit=2&sort=-created_at`

| Property | Observed value |
|---|---|
| Status | `200` |
| Content-Type | `application/json` |
| CORS | `access-control-allow-origin: *` |
| Response shape | `{ items: ReportListItemDTO[], next?: string }` |
| Item fields | `hash`, `url`, `created_at`, `score`, `report_url` |
| Pagination observation | Response contained 10 items even though the request used `limit=2` |

The migration must not change this API contract. The limit behavior is recorded as existing behavior, not as a desired Astro behavior.

### Single report API

Request: `GET /api/report/9249232fefb9a1c0455ba007d7784f6c`

| Property | Observed value |
|---|---|
| Status | `200` |
| Content-Type | `application/json` |
| CORS | `access-control-allow-origin: *` |
| Top-level fields | `hash`, `url`, `created_at`, `score`, `headers`, `share_image_url` |
| Header groups | `detected`, `missing`, `leaking` |
| Sensitive delete token | Not present |

### Social share page

Request: `GET /share/9249232fefb9a1c0455ba007d7784f6c`

| Property | Observed value |
|---|---|
| Status | `200` |
| Content-Type | `text/html; charset=UTF-8` |
| Metadata | Open Graph, Twitter Card and site name present |
| Current redirect | `/#/report/9249232fefb9a1c0455ba007d7784f6c` |
| Current fallback link | `/#/report/9249232fefb9a1c0455ba007d7784f6c` |

M3 will preserve the metadata contract and change only the destination to the normal `/report/:hash` URL.

### Report browser routes

| Request | Status | Observed behavior |
|---|---:|---|
| `GET /report/9249232fefb9a1c0455ba007d7784f6c` | `404` | Plain `404 Not Found` from the Worker |
| `GET /#/report/9249232fefb9a1c0455ba007d7784f6c` | `200` | Server receives `/` and returns the homepage SPA shell |

This is the central routing defect addressed by M3: backend-generated normal report URLs currently return 404 when opened directly.

## Explicit PostHog event contract

### Browser events

| Event | Properties | Source |
|---|---|---|
| `scan submitted` | `url` | `src/hooks/useScanForm.ts` |
| `scan failed` | `url`, `error_message`, `error_code` | `src/hooks/useScanForm.ts` |
| `report viewed` | `url`, `score`, `hash` | `src/components/report/ReportView.tsx` |
| `report shared` | `platform`, `hash`, `score` | `src/components/report/SharingSection.tsx` |
| `delete report initiated` | `hash` | `src/components/report/DeleteSection.tsx` |
| `delete report failed` | `hash`, `error_message` | `src/hooks/useReportDelete.ts` |

Current browser initialization uses PostHog defaults dated `2026-01-30` and enables tracing headers for the current host and localhost. Automatic events produced by the PostHog SDK are outside the explicit application event contract and must be checked for duplicates during M5.

### Worker events

| Event | Properties | Source |
|---|---|---|
| `scan rate limited` | `url` | `worker/impl/controllers/ScanController.ts` |
| `url scanned` | `url`, `score`, `detected_headers`, `missing_headers`, `leaking_headers` | `worker/impl/controllers/ScanController.ts` |
| `report deleted` | `hash` | `worker/impl/controllers/DeleteReportController.ts` |
| exception capture | exception plus derived distinct ID | `worker/index.ts` for mapped errors with status at least 500 |

Worker distinct ID precedence is `X-POSTHOG-DISTINCT-ID`, `CF-Connecting-IP`, the first `x-forwarded-for` address, then `anonymous`.

## Dependency audit baseline

`npm audit` reported 21 existing findings: 2 low, 5 moderate, 14 high and 0 critical. Vitest itself was not listed as vulnerable. Direct packages in the report include:

| Package | Baseline version | M1 disposition |
|---|---:|---|
| `@cloudflare/vite-plugin` | `1.0.8` | Remove from the frontend when Astro owns the build |
| `react-router-dom` | `7.5.1` | Remove after normal routes replace the hash router |
| `vite` | `6.3.1` | Replace/update through the supported Astro toolchain |
| `hono` | `4.7.7` | Upgrade to a current compatible 4.x release and retest API contracts |
| `wrangler` | `4.12.0` | Upgrade to a current compatible release before cutover |

No automatic `npm audit fix` was run because dependency upgrades must be isolated and verified against the Worker contracts.

## M0 verification commands

```text
npm run test
npm run lint
npm run build
git diff --check
```

The command results are recorded in the M0 milestone row of `docs/astro-migration-plan.md` after verification.

## M0 verification result

| Check | Result |
|---|---|
| `npm run test` | 3 files, 31 tests passed |
| `npm run lint` | 0 errors; 3 pre-existing Fast Refresh warnings in UI components |
| `npm run build` | Passed; existing bundle-size warning for the 740 kB client chunk |
| `git diff --check` | Passed |
