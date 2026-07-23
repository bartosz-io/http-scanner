# Astro migration M3 verification

Captured: 2026-07-20

Branch: `codex/astro-migration`

M3 moves report rendering to a static Astro shell at `/report/` while Hono maps
every valid `/report/:hash` request to that shell. Report data and interactions
remain client-side React. The Astro output remains parallel in `dist-astro/`;
production builds and deploys still use the legacy artifact until M6.

## Runtime boundary

| Element | Rendering owner |
|---|---|
| SEO metadata, header, navigation, footer and loading fallback | Astro |
| Path and delete-token parsing | `ReportIsland`, client only |
| Report fetch, findings, sharing and deletion | React report components |
| `/report/:hash` validation and shell response | Hono Worker |
| Static HTML, CSS, JavaScript and images | Cloudflare `ASSETS` binding |

The dynamic shell follows the same Clean Architecture boundary as the API:

```text
worker/index.ts (composition root)
  -> createReportShellRoute(controller factory)
    -> ReportShellController
      -> FetchReportShellUseCase
        -> ReportShellGateway
          -> CloudflareReportShellGateway
            -> ASSETS binding
```

Only the infrastructure adapter and dependency-composition layer know the
Cloudflare binding. The output port, use case and controller do not depend on
`Fetcher`, `ASSETS` or the generated Worker `Env`.

The Worker runs first for `/api/*`, `/share/*` and `/report/*`. A valid report
hash receives the shared Astro shell with `X-Robots-Tag: noindex, nofollow`; an
invalid hash format receives a plain 404 without reading the asset binding.

## Token and analytics safety

- The report page disables the base-layout analytics bootstrap.
- `ReportIsland` stores a valid delete token and removes every `token` query
  parameter with `history.replaceState` in a layout effect.
- PostHog initializes only after that URL cleanup.
- The report API request contains only `/api/report/:hash`; the token remains
  available to the one-time warning and delete flow but is not sent to the API.
- The rendered token uses PostHog's no-capture and replay-mask classes.
- Report, share and delete events use the shared browser-safe analytics client
  and no longer require a React PostHog provider.

## Routing compatibility

- `/share/:hash` now redirects and links to `/report/:hash`.
- Error and successful-delete navigation returns to `/`.
- The legacy SPA route wraps the prop-based `ReportView` only to keep the legacy
  build working until cleanup in M6.

## Verification

| Check | Result |
|---|---|
| `npm run test` | 7 files, 44 tests passed |
| `npm run lint` | 0 errors; 7 known legacy warnings |
| `npm run check` | 0 Astro or TypeScript diagnostics |
| `npm run build:astro` | Passed; `/report/index.html` emitted to `dist-astro/` |
| `npm run build:legacy` | Passed; existing client and Worker remain buildable |
| Direct report request through Wrangler | 200, HTML shell, `X-Robots-Tag: noindex, nofollow` |
| Invalid report path through Wrangler | 404 before the asset binding |
| Browser hydration | Local D1 report rendered; console had 0 errors and 0 warnings |
| Token URL test | Token retained in UI, removed from URL; API request had no query token |
| Direct reload | Report rendered again at the normal URL without a hash router |
| Share HTML | Meta refresh and fallback link both target `/report/:hash` |
| Sitemap | Contains only `/`; excludes `/report/` and `/reports` |
| `git diff --check` | Passed |

The browser test used the local read-only report
`3b7313344566898763fdd1f2a54e228b`. No report was deleted and no database
migration was required.

## Local development

Build the static shell once, then run the Worker and Astro in separate terminals:

```sh
npm run build:astro
npm run dev:worker
```

```sh
npm run dev:web
```

Open the homepage at `http://localhost:4321`. During local development a valid
`/report/:hash` navigation is redirected to `http://localhost:8787`, because the
Worker owns dynamic report routing and serves the matching built Astro assets.
The `dev:worker` script names `wrangler.jsonc` explicitly so Wrangler does not
follow the legacy Cloudflare Vite build redirect in `.wrangler/deploy/config.json`.

When a different Worker port is needed, set `LOCAL_WORKER_ORIGIN` for the Astro
process, for example `LOCAL_WORKER_ORIGIN=http://localhost:8788 npm run dev:web`.
