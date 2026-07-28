# Astro M6 Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Astro the only frontend build, remove the legacy Vite SPA, and prove the production-shaped Cloudflare Worker build locally before any external deployment.

**Architecture:** M1–M5 keep the parallel Astro build in `dist-astro`; M6
switches the only final frontend build to `dist`. Wrangler bundles
`worker/index.ts` and serves `dist` through the existing `ASSETS` binding.
Hono continues to own `/api/*`, `/share/*`, and `/report/*`; all other
document routes are served by Cloudflare Static Assets. Preview upload,
production deployment, and Search Console submission remain a separate
approval checkpoint after the local cutover is green.

**Tech Stack:** Astro 7, React 19 islands, TypeScript, Vitest, Cloudflare Workers Static Assets, Wrangler 4.

## Global Constraints

- Do not change API DTOs, D1 schema, R2 object format, report hashes, or event names.
- Keep the legacy `/#/report/:hash` client redirect for at least 90 days after production cutover.
- Do not deploy a preview or production version in the local-cutover checkpoint.
- Do not submit anything to Search Console in the local-cutover checkpoint.
- Do not commit or push; the user handles milestone commits in a separate step.
- Keep `vite` because Astro, Vitest, and `@tailwindcss/vite` still use the Vite toolchain; remove only legacy SPA-specific plugins.
- A rollback must remain possible by redeploying the previously active Cloudflare Worker version.

---

### Task 1: Add the legacy-frontend removal contract

**Files:**
- Create: `src/lib/legacyFrontendRemoval.test.ts`
- Consume: `package.json`

**Interfaces:**
- Consumes: repository paths and npm script/dependency names
- Produces: a regression contract proving Astro is the only frontend entrypoint

- [x] **Step 1: Write the failing contract**

Create a Node-environment Vitest test that:

```ts
const legacyFiles = [
  'index.html',
  'vite.config.ts',
  'tsconfig.node.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/App.css',
  'src/router.tsx',
  'src/components/HomePage.tsx',
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/NavigationMenu.tsx',
  'src/components/NotFoundPage.tsx',
  'src/components/RecentScansSection.tsx',
  'src/components/ScanSection.tsx',
  'src/components/ui/navigation-menu.tsx',
];

const legacyPackages = [
  '@cloudflare/vite-plugin',
  '@posthog/react',
  '@radix-ui/react-navigation-menu',
  '@vitejs/plugin-react-swc',
  'react-router-dom',
];
```

Assert that every legacy path is absent, every legacy package is absent from
both dependency groups, `scripts.build` runs the Astro production build,
`scripts.deploy` builds before Wrangler deploy, and no script name contains
`legacy`. Assert additionally that Astro emits the final frontend to `dist`
and Wrangler binds that same directory as Static Assets.

- [x] **Step 2: Run the test and confirm RED**

Run:

```bash
npm test -- src/lib/legacyFrontendRemoval.test.ts
```

Expected: FAIL because the legacy files, packages, and scripts still exist.

---

### Task 2: Switch npm commands and TypeScript references to Astro

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `astro.config.mjs`
- Modify: `wrangler.jsonc`
- Modify: `tsconfig.json`
- Delete: `tsconfig.node.json`

**Interfaces:**
- Consumes: `astro.config.mjs`, `wrangler.jsonc`, `tsconfig.astro.json`
- Produces: `npm run dev`, `npm run build`, `npm run preview`, `npm run deploy`, and `npm run deploy:dry`

- [x] **Step 1: Replace the legacy scripts**

Set the frontend lifecycle to:

```json
{
  "dev": "npm run dev:web",
  "dev:web": "ASTRO_TELEMETRY_DISABLED=1 astro dev",
  "dev:worker": "wrangler dev --config wrangler.jsonc --local --port 8787",
  "build": "npm run check && ASTRO_TELEMETRY_DISABLED=1 astro build",
  "check": "ASTRO_TELEMETRY_DISABLED=1 astro check --tsconfig tsconfig.astro.json && tsc -b",
  "test": "vitest run --config vitest.config.ts",
  "lint": "eslint .",
  "preview": "npm run build && ASTRO_TELEMETRY_DISABLED=1 astro preview",
  "deploy": "npm run build && wrangler deploy --config wrangler.jsonc",
  "deploy:dry": "npm run build && wrangler deploy --config wrangler.jsonc --dry-run",
  "cf-typegen": "wrangler types --config wrangler.jsonc --include-runtime false"
}
```

Remove `dev:legacy`, `build:legacy`, and `preview:astro`.

- [x] **Step 2: Switch the final frontend output directory**

Change `astro.config.mjs` from the parallel M1–M5 output
`outDir: './dist-astro'` to the final `outDir: './dist'`. Change
`wrangler.jsonc` from `assets.directory: './dist-astro'` to
`assets.directory: './dist'`.

- [x] **Step 3: Remove the Vite-config TypeScript project**

Move the compiler options inherited by `tsconfig.worker.json` directly into
that Worker config. Delete the `tsconfig.node.json` reference from
`tsconfig.json`, then delete `tsconfig.node.json`. Keep the application and
Worker project references.

- [x] **Step 4: Remove legacy-only packages**

Run:

```bash
npm uninstall @cloudflare/vite-plugin @posthog/react @radix-ui/react-navigation-menu @vitejs/plugin-react-swc react-router-dom
```

Expected: `package.json` and `package-lock.json` no longer contain those direct
dependencies. Do not uninstall `vite`.

---

### Task 3: Delete the legacy SPA entrypoint and dead React shell

**Files:**
- Delete: `index.html`
- Delete: `vite.config.ts`
- Delete: `src/main.tsx`
- Delete: `src/App.tsx`
- Delete: `src/App.css`
- Delete: `src/router.tsx`
- Delete: `src/components/HomePage.tsx`
- Delete: `src/components/Header.tsx`
- Delete: `src/components/Footer.tsx`
- Delete: `src/components/NavigationMenu.tsx`
- Delete: `src/components/NotFoundPage.tsx`
- Delete: `src/components/RecentScansSection.tsx`
- Delete: `src/components/ScanSection.tsx`
- Delete: `src/components/ui/navigation-menu.tsx`
- Delete when the import audit remains empty: `src/assets/Cloudflare_Logo.svg`
- Delete when the import audit remains empty: `src/assets/react.svg`

**Interfaces:**
- Consumes: the Task 1 removal list
- Produces: a frontend source tree containing only Astro pages, layouts, islands, and their shared React components

- [x] **Step 1: Re-run the import audit**

Run:

```bash
rg -n "react-router-dom|@posthog/react|@cloudflare/vite-plugin|@vitejs/plugin-react-swc|@radix-ui/react-navigation-menu" src worker astro.config.mjs vitest.config.ts --glob '!src/lib/legacyFrontendRemoval.test.ts'
```

Expected before deletion: matches only in legacy files.

- [x] **Step 2: Delete the confirmed legacy files**

Delete exactly the paths listed in this task. Preserve `ScanForm`,
`ScanFormFeedback`, `ScansTable`, `ReportView`, hooks, and UI primitives used
by Astro islands.

- [x] **Step 3: Confirm the import audit is empty**

Run the Task 3 Step 1 command again.

Expected: no matches.

- [x] **Step 4: Run the removal contract and full unit suite**

Run:

```bash
npm test -- src/lib/legacyFrontendRemoval.test.ts
npm test
```

Expected: the focused contract and all tests pass.

---

### Task 4: Update operator documentation for the single build

**Files:**
- Modify: `README.md`
- Modify: `docs/astro-migration-plan.md`
- Create: `docs/astro-migration-m6.md`

**Interfaces:**
- Consumes: final npm scripts and M6 acceptance matrix
- Produces: exact local-development, production-build, dry-run, and rollback instructions

- [x] **Step 1: Update the README**

Document:

```text
Terminal 1: npm run dev:worker
Terminal 2: npm run dev
Production build: npm run build
Production-shaped local runtime: npm run build, then npm run dev:worker
Dry deployment build: npm run deploy:dry
```

Replace references to Vite/hash routing with Astro static pages, React islands,
normal paths, and Cloudflare Workers Static Assets.

- [x] **Step 2: Mark M6 as in progress**

In `docs/astro-migration-plan.md`, check only the locally completed M6 items.
Keep preview upload, production deployment, post-deploy smoke testing, and
Search Console submission unchecked.

- [x] **Step 3: Create the M6 evidence document**

Record:

- removed files and direct dependencies;
- exact verification commands and results;
- desktop/mobile acceptance-matrix results;
- HTML-without-JavaScript evidence;
- Worker log evidence for `/api`, `/share`, and `/report`;
- the dry-run bundle result;
- the still-pending external deployment checkpoint.

Do not include delete tokens, PostHog project tokens, or private report data.

---

### Task 5: Verify the production-shaped Worker locally

**Files:**
- Verify: `dist/**`
- Verify: `wrangler.jsonc`
- Verify: `worker/index.ts`
- Update evidence: `docs/astro-migration-m6.md`

**Interfaces:**
- Consumes: `npm run build`, `npm run dev:worker`
- Produces: HTTP and Worker-log evidence for the M6 acceptance matrix

- [x] **Step 1: Run static gates**

Run:

```bash
npm run lint
npm run check
npm test
npm run build
git diff --check
```

Expected: zero errors; the seven documented lint warnings may remain.

- [x] **Step 2: Run Wrangler with the built Astro assets**

Run:

```bash
WRANGLER_LOG_PATH=/tmp/http-scanner-m6-worker.log npm run dev:worker
```

Expected: Worker listens on `http://localhost:8787` with `dist` bound as
`ASSETS`.

- [x] **Step 3: Verify server-rendered HTML and routing with HTTP requests**

Check:

- `/` returns 200 with canonical, title, description, H1, and scanner form in
  raw HTML;
- `/reports` returns 200 and `noindex`;
- an unknown path returns a real 404;
- `/api/reports` preserves its JSON contract;
- invalid `/report/:hash` does not produce a homepage response.

- [x] **Step 4: Create one local scan and verify dynamic routes**

Submit `https://example.com` through `/api/scan`, retain the returned hash and
delete token only in process memory, then check:

- `/api/report/:hash`;
- `/report/:hash`;
- `/report/:hash?token=...`;
- `/share/:hash`;
- report refresh;
- report HTML contains `noindex` and the Worker adds `X-Robots-Tag`.

Never print or persist the delete token.

- [x] **Step 5: Inspect Worker logs**

Confirm the local log contains successful requests for `/api/scan`,
`/api/report/:hash`, `/share/:hash`, and `/report/:hash`.

---

### Task 6: Run the browser acceptance matrix

**Files:**
- Update evidence: `docs/astro-migration-m6.md`

**Interfaces:**
- Consumes: the local Worker URL and scan fixture from Task 5
- Produces: desktop and mobile browser evidence

- [x] **Step 1: Verify desktop behavior**

At desktop viewport, verify homepage hydration, scan submission, report
navigation, direct report entry, refresh, token removal from the address bar,
reports list, load more when available, legacy hash redirect, unknown-route
404, and absence of hydration errors.

- [x] **Step 2: Verify mobile behavior**

At a 390x844 viewport, verify the homepage form, recent-scans table, report
header, score, header tabs, sharing section, and delete section remain within
the viewport without horizontal document overflow.

- [x] **Step 3: Verify analytics privacy**

Confirm the local funnel sends `$pageview`, `scan submitted`, `url scanned`,
and `report viewed`, and that no captured `$current_url` contains `token=`.

- [x] **Step 4: Record the results**

Update `docs/astro-migration-m6.md` with the tested origins, viewport, route
results, and console status. Do not include the report delete token.

---

### Task 7: Build the exact deployment bundle without deploying

**Files:**
- Verify: Wrangler dry-run output under `/tmp`
- Update evidence: `docs/astro-migration-m6.md`

**Interfaces:**
- Consumes: the final source tree and `wrangler.jsonc`
- Produces: the exact Worker/static-asset bundle that would be uploaded

- [x] **Step 1: Run Wrangler dry-run**

Run:

```bash
WRANGLER_LOG_PATH=/tmp/http-scanner-m6-dry.log \
  npx wrangler deploy --dry-run --outdir /tmp/http-scanner-m6-deploy
```

Expected: Wrangler bundles `worker/index.ts`, recognizes `dist` Static
Assets, and exits without creating a Cloudflare deployment.

- [x] **Step 2: Run the final quality gate**

Run:

```bash
npm run lint
npm run check
npm test
npm run build
git diff --check
```

Expected: all commands exit successfully; only documented non-error warnings
remain.

- [x] **Step 3: Stop at the external deployment checkpoint**

Report the completed local cutover and request a separate decision for:

1. `wrangler versions upload --preview-alias astro-m6`;
2. preview-URL smoke testing;
3. production deployment;
4. post-deploy PostHog verification;
5. Search Console homepage/sitemap submission.

Before that later production step, record the active deployment/version ID.
Cloudflare versions capture Worker code, static assets, bindings, and
compatibility settings, so the recorded version can be restored with
`wrangler rollback <VERSION_ID>`.
