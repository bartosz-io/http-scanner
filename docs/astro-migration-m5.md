# Astro migration M5 verification

Captured: 2026-07-23

Branch: `codex/astro-migration`

M5 completes the analytics boundary for the Astro islands. Browser event
capture no longer depends on a React context shared by the legacy root SPA.
Existing event names and event-specific properties remain unchanged, while
browser events now also receive stable acquisition attribution for the current
tab session.

The Astro output remains parallel in `dist-astro/`; production cutover and
dependency cleanup still belong to M6.

## Analytics architecture

- `src/lib/posthogClient.ts` remains the only browser entrypoint for explicit
  application events.
- The legacy `PostHogProvider` was removed from `src/main.tsx`; no
  `PostHogProvider` or `usePostHog` usage remains under `src/`.
- The `@posthog/react` package remains installed only until the M6 legacy
  entrypoint and dependency cleanup.
- `capture_pageview: true` explicitly captures one initial pageview for each
  Astro document.
- The existing `posthog.__loaded` guard prevents a second initialization in
  the same document.
- There is no manual `$pageview` capture in application source.

The established funnel is still:

```text
landing page → scan submitted → url scanned → report viewed
```

`url scanned` remains the scan-success event produced by the Worker. No
competing `scan success` event was introduced.

## Acquisition attribution

Every explicit browser event now includes:

| Property | Value |
|---|---|
| `landing_page` | first document `origin + pathname`, without query or hash |
| `landing_path` | first document pathname |
| `referrer` | referrer `origin + pathname`, or `null` |

The first valid value is stored in namespaced `sessionStorage` and reused on
the report document. Storage denial or malformed stored data cannot block
event capture. Event-specific properties such as `url`, `score`, `hash`,
`platform`, `error_message` and `error_code` retain their existing names and
values.

Local development uses different origins for the Astro server and Worker
(`localhost:4322` and `localhost:8787`), so the cross-document persistence is
verified by a same-origin unit test. Production serves both documents from
`httpscanner.com`, where `sessionStorage` is shared as intended.

## Secret protection

PostHog receives a `before_send` filter that:

- removes object properties whose name contains `token`, case-insensitively;
- recursively filters nested objects and arrays;
- removes token-like query parameters from absolute and relative URLs;
- covers automatic SDK properties such as `$current_url`, not only explicit
  application properties;
- preserves the SDK-owned `properties.token` transport field required by
  PostHog ingestion.

The delete-token warning, compatibility renderer and delete confirmation input
also use both `ph-no-capture` and `ph-mask`.

During the browser flow, the scan returned a token-bearing report URL. The
report island retained the token in memory for the one-time warning and
replaced the address-bar URL with clean `/report/:hash` before analytics
initialization. The delete input exposed both privacy classes in the hydrated
DOM. The token value is intentionally not recorded in this document.

## PostHog audit

The connected PostHog project `Http Scanner` was inspected read-only before
implementation. Its actual taxonomy contains the established browser events
`scan submitted`, `scan failed`, `report viewed`, `report shared` and
`delete report initiated`, plus Worker events `url scanned` and
`report deleted`. Existing event-specific properties match the M0 contract.

The initial audit exposed two client-delivery defects:

1. the Astro client used the legacy `VITE_PUBLIC_POSTHOG_*` names, while Astro
   only exposes `PUBLIC_*` variables to browser code;
2. the privacy filter recursively removed the SDK-owned
   `properties.token`, causing PostHog to reject each event before transport.

The browser variables now use `PUBLIC_POSTHOG_PROJECT_TOKEN` and
`PUBLIC_POSTHOG_HOST`. The privacy filter preserves only the SDK transport
token at the top level of the event properties while continuing to remove
application token fields and token-bearing URL parameters.

A fresh local flow was observed in the hosted `Http Scanner` project with one
correlated distinct ID:

```text
$pageview → scan submitted → url scanned → report viewed
```

The corresponding report `$pageview` was also delivered. A query across that
flow returned zero events whose `$current_url` contained `token=`.

## Browser verification

After restarting Astro to clear a stale Vite optimized-dependency cache:

| Check | Result |
|---|---|
| Homepage hydration | complete document, scanner island interactive, no console warnings/errors |
| Astro client configuration | public PostHog token present in the emitted browser bundle |
| PostHog transport | SDK debug log sends `$pageview`; no missing-token rejection |
| Scan flow | `https://example.com` submitted through Astro and processed by local Worker |
| Report hydration | report rendered through direct Worker route, no console warnings/errors |
| Token URL | query token removed; final address is clean `/report/:hash` |
| Token warning | token available in memory and rendered once |
| Delete input | exactly one input with `ph-no-capture ph-mask` |
| Hosted funnel | `$pageview`, `scan submitted`, `url scanned`, `report viewed` received |
| Analytics URL privacy | zero token-bearing `$current_url` values in the verified flow |

The initial `504 Outdated Optimize Dep` from the first Astro daemon was a
development cache error. A clean daemon restart removed it, and the fresh
browser run produced no hydration errors.

## Automated verification

| Check | Result |
|---|---|
| `npm test` | 13 files, 73 tests passed |
| `npm run lint` | 0 errors; 7 known legacy warnings |
| `npm run check` | 0 Astro or TypeScript diagnostics |
| `npm run build:astro` | Passed; 4 static pages emitted |
| `npm run build:legacy` | Passed with the existing client chunk-size warning |
| Focused M5 tests | 4 files, 18 tests passed |

No production deployment, D1 migration, report deletion or dependency removal
was performed.

## Remaining M6 verification

- remove the legacy Vite entrypoint and now-unused dependencies, including
  `@posthog/react`;
- run the complete desktop/mobile cutover matrix through local Wrangler;
- deploy preview/production and repeat the live client delivery smoke test;
- inspect the production funnel and verify that no token-bearing URL appears
  in PostHog.
