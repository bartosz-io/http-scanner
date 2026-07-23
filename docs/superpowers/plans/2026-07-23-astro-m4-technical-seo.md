# Astro M4 Technical SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete M4 by giving the Astro site consistent canonical metadata, a controlled sitemap and robots policy, a real static 404 response, and safe browser caching for fingerprinted assets.

**Architecture:** Astro remains the owner of static HTML and SEO metadata. A small framework-neutral SEO policy module supplies the production site origin and sitemap inclusion rule to `astro.config.mjs`; Cloudflare Static Assets serves Astro's `404.html` through `not_found_handling: "404-page"` and applies immutable caching only to Astro's fingerprinted `/_astro/*` files. Worker-first routes remain limited to `/api/*`, `/share/*`, and `/report/*`.

**Tech Stack:** Astro 7 static output, TypeScript, Vitest, Cloudflare Workers Static Assets, Wrangler 4.

## Global Constraints

- The canonical site origin is exactly `https://httpscanner.com`.
- `/report`, `/report/*`, `/reports`, and `/share/*` must not appear in the sitemap.
- Error and report pages must remain `noindex`.
- Unknown static routes must return the generated `404.html` with HTTP 404, never homepage HTML with HTTP 200.
- Only fingerprinted `/_astro/*` assets receive one-year immutable browser caching.
- HTML keeps Cloudflare's revalidation behavior.
- No future checker routes or pages are introduced in M4.
- Existing Worker route layering and the M3 `ASSETS` gateway remain unchanged.

---

### Task 1: Central SEO and sitemap policy

**Files:**
- Create: `src/lib/seoPolicy.test.ts`
- Create: `src/lib/seoPolicy.ts`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: `SITE_ORIGIN: 'https://httpscanner.com'`.
- Produces: `shouldIncludeInSitemap(page: string): boolean`.
- Consumes: Astro sitemap integration's absolute page URL.

- [x] **Step 1: Write the failing policy tests**

```ts
import { describe, expect, it } from 'vitest';
import { SITE_ORIGIN, shouldIncludeInSitemap } from './seoPolicy';

describe('SEO policy', () => {
  it('uses the production origin for canonical URLs and sitemap entries', () => {
    expect(SITE_ORIGIN).toBe('https://httpscanner.com');
  });

  it.each([
    'https://httpscanner.com/report',
    'https://httpscanner.com/report/',
    'https://httpscanner.com/report/3b7313344566898763fdd1f2a54e228b',
    'https://httpscanner.com/reports',
    'https://httpscanner.com/reports/',
    'https://httpscanner.com/share/3b7313344566898763fdd1f2a54e228b',
  ])('excludes non-indexable URL %s', (page) => {
    expect(shouldIncludeInSitemap(page)).toBe(false);
  });

  it.each([
    'https://httpscanner.com/',
    'https://httpscanner.com/security-headers-checker/',
  ])('includes indexable URL %s', (page) => {
    expect(shouldIncludeInSitemap(page)).toBe(true);
  });
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm run test -- src/lib/seoPolicy.test.ts`

Expected: FAIL because `./seoPolicy` does not exist.

- [x] **Step 3: Implement the minimal policy**

```ts
export const SITE_ORIGIN = 'https://httpscanner.com';

const NON_INDEXABLE_PATHS = ['/report', '/reports', '/share'] as const;

export function shouldIncludeInSitemap(page: string): boolean {
  const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';
  return !NON_INDEXABLE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
```

- [x] **Step 4: Connect Astro to the policy**

Replace the literal `site` and inline sitemap filter in `astro.config.mjs`:

```js
import { SITE_ORIGIN, shouldIncludeInSitemap } from './src/lib/seoPolicy.ts';

export default defineConfig({
  site: SITE_ORIGIN,
  integrations: [
    react(),
    sitemap({
      filter: shouldIncludeInSitemap,
    }),
  ],
});
```

- [x] **Step 5: Run the focused test and Astro check**

Run: `npm run test -- src/lib/seoPolicy.test.ts && npm run check`

Expected: policy tests pass and Astro reports zero diagnostics.

### Task 2: Static crawler and cache contracts

**Files:**
- Create: `src/lib/staticSeoAssets.test.ts`
- Create: `public/robots.txt`
- Create: `public/_headers`

**Interfaces:**
- Produces: `/robots.txt` copied unchanged into `dist-astro/robots.txt`.
- Produces: `/_headers` copied into the asset manifest and interpreted by Cloudflare.

- [x] **Step 1: Write failing source-contract tests**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static SEO assets', () => {
  it('publishes crawler rules and the sitemap location', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /report/');
    expect(robots).toContain('Disallow: /reports');
    expect(robots).toContain('Disallow: /share/');
    expect(robots).toContain('Sitemap: https://httpscanner.com/sitemap-index.xml');
  });

  it('caches only fingerprinted Astro assets immutably', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    expect(headers).toBe(
      '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n'
    );
  });
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm run test -- src/lib/staticSeoAssets.test.ts`

Expected: FAIL with `ENOENT` for `public/robots.txt`.

- [x] **Step 3: Add crawler rules**

```text
User-agent: *
Allow: /
Disallow: /report/
Disallow: /reports
Disallow: /share/

Sitemap: https://httpscanner.com/sitemap-index.xml
```

- [x] **Step 4: Add immutable hashed-asset caching**

```text
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

- [x] **Step 5: Run the focused test**

Run: `npm run test -- src/lib/staticSeoAssets.test.ts`

Expected: both static asset contract tests pass.

### Task 3: Real Astro and Cloudflare 404 behavior

**Files:**
- Create: `src/pages/404.astro`
- Create: `src/lib/notFoundConfig.test.ts`
- Modify: `wrangler.jsonc`

**Interfaces:**
- Produces: `dist-astro/404.html`.
- Produces: Cloudflare asset configuration `not_found_handling: "404-page"`.
- Consumes: existing `BaseLayout` metadata and site chrome.

- [x] **Step 1: Write failing 404 configuration tests**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static 404 configuration', () => {
  it('configures Cloudflare to serve the generated 404 page', () => {
    const config = readFileSync('wrangler.jsonc', 'utf8');
    expect(config).toMatch(/"not_found_handling":\s*"404-page"/);
  });

  it('defines a noindex Astro 404 page', () => {
    const page = readFileSync('src/pages/404.astro', 'utf8');
    expect(page).toContain('noindex');
    expect(page).toContain('Page not found');
    expect(page).toContain('href="/"');
  });
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm run test -- src/lib/notFoundConfig.test.ts`

Expected: FAIL because the Wrangler option and Astro page do not exist.

- [x] **Step 3: Add the static Astro 404 page**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout
  title="Page Not Found — HTTP Scanner"
  description="The requested page could not be found."
  canonicalPath="/404"
  noindex
>
  <section class="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
    <div class="max-w-md space-y-6 text-center">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 class="text-4xl font-bold tracking-tight">Page not found</h1>
      <p class="text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <a
        href="/"
        class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Return to home
      </a>
    </div>
  </section>
</BaseLayout>
```

- [x] **Step 4: Enable Cloudflare's SSG 404 mode**

Add the option inside the existing `assets` object in `wrangler.jsonc`:

```jsonc
"not_found_handling": "404-page",
```

- [x] **Step 5: Run the focused test and production build**

Run: `npm run test -- src/lib/notFoundConfig.test.ts && npm run build:astro`

Expected: tests pass, Astro reports zero diagnostics, and `dist-astro/404.html` exists.

### Task 4: M4 integration verification and milestone evidence

**Files:**
- Create: `docs/astro-migration-m4.md`
- Modify: `docs/astro-migration-plan.md`

**Interfaces:**
- Consumes: the complete M4 output from Tasks 1–3.
- Produces: reproducible M4 verification instructions and updated milestone status.

- [x] **Step 1: Build and run the local Worker**

Run: `npm run build:astro`

Run in a separate terminal: `npm run dev:worker`

Expected: Wrangler serves the built `dist-astro` assets on port 8787.

- [x] **Step 2: Verify HTTP and generated SEO behavior**

Run:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8787/does-not-exist
curl -sS http://localhost:8787/does-not-exist | rg 'Page not found'
curl -sSI http://localhost:8787/ | rg -i '^cache-control: public, max-age=0, must-revalidate'
m4_asset_path="$(rg --files dist-astro/_astro | head -n 1)"
curl -sSI "http://localhost:8787/${m4_asset_path#dist-astro/}" | rg -i '^cache-control: public, max-age=31536000, immutable'
rg -n '<loc>' dist-astro/sitemap-0.xml
```

Expected: unknown route is 404 with the custom page; HTML is revalidatable; the hashed asset is immutable; sitemap contains only `/`.

- [x] **Step 3: Run the full quality gate**

Run:

```bash
npm run test
npm run lint
npm run build:astro
npm run build:legacy
```

Expected: all tests and both builds pass; lint has no errors.

- [x] **Step 4: Record milestone evidence**

Create `docs/astro-migration-m4.md` with the implemented routes, metadata policy, crawler/cache behavior, exact commands, and observed status/header results. Mark each M4 checklist item complete and set the tracking-table status to `complete` in `docs/astro-migration-plan.md`.

- [x] **Step 5: Leave the changes ready for review**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only M4 files are modified or untracked. Do not commit or push until explicitly requested.
