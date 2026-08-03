# HTTP Header Reference Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a statically generated, internally linked reference index and 45 complete HTTP response-header guides that support the HTTP Headers Checker without shipping long-form content in the React bundle.

**Architecture:** Use one Astro content collection for structured guide frontmatter and Markdown explanation, while `headerCatalog.ts` remains the source of canonical names, slugs, categories, and report summaries. Generate only catalog-backed routes at build time, validate one-to-one catalog/content coverage, and add tracked links only after all guide URLs exist.

**Tech Stack:** Astro 7 content collections and static routes, Markdown, TypeScript 5.7, Vitest 4, Tailwind CSS 4, PostHog.

## Global Constraints

- Complete `docs/superpowers/plans/2026-07-31-all-headers-scanner-foundation.md` first.
- Publish exactly the 45 catalog-backed guides approved in `docs/superpowers/specs/2026-07-31-all-headers-scanner-design.md`; observed custom headers must never create routes.
- Every guide must contain neutral meaning, response applicability, syntax, at least one valid example, use cases, common mistakes, security considerations where applicable, related headers, and primary references.
- Prefer governing standards and official documentation; use MDN as a practical secondary reference.
- Long-form guide content must remain in Astro build-time modules and must not be imported by React report islands.
- `/headers/`, `/headers/:slug/`, and `/http-headers-checker/` are indexable static HTML with self-canonicals; `/report/*` remains excluded and `noindex,nofollow`.
- Do not add FAQ structured data in this release.
- Unknown guide slugs must fall through to Cloudflare static `404-page` handling.
- Add no runtime or development dependency.
- Both implementation milestones are deployed together; do not push or deploy between the foundation and this plan.

## Content Contract

Every `src/content/headers/<slug>.md` file uses this frontmatter shape:

```yaml
---
headerName: cache-control
description: Explains how Cache-Control directives define reuse and storage rules for HTTP responses.
applicability: response
syntax: "Cache-Control: <directive>[, <directive>...]"
examples:
  - "Cache-Control: public, max-age=3600, stale-while-revalidate=60"
useCases:
  - Cache a public asset in browsers and shared caches.
  - Require revalidation before a stale response is reused.
commonMistakes:
  - Treating no-cache as an instruction not to store a response.
  - Caching personalized responses as public content.
securityConsiderations: Incorrect caching can expose personalized or sensitive responses to other users.
relatedHeaders:
  - age
  - expires
  - etag
  - vary
references:
  - label: RFC 9111 — HTTP Caching
    url: https://www.rfc-editor.org/rfc/rfc9111
  - label: MDN — Cache-Control
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
---

## Meaning and behavior

Finished header-specific protocol explanation.

## Implementation notes

Finished developer guidance for verifying the field in real responses.
```

The literal Cache-Control document is authored in Task 3 with original prose in place of the two short example paragraphs. Every Markdown body contains both headings and at least 180 words of useful explanation; the shared Astro template renders every structured frontmatter field.

## File Structure

- Create `src/content.config.ts`: `headers` collection loader and strict schema.
- Create `src/lib/headerContentContract.ts` and `.test.ts`: source and exact-inventory validation.
- Create `src/content/headers/*.md`: 45 curated documents.
- Create `src/components/astro/HeaderReferenceIndex.astro`: grouped directory.
- Create `src/components/astro/HeaderGuidePage.astro`: semantic guide presentation.
- Create `src/pages/headers/index.astro` and `[slug].astro`: static index and guides.
- Create `src/lib/headerReferenceSeoContract.test.ts`: static SEO contracts.
- Create `src/lib/analyticsLinks.ts` and `.test.ts`: bounded static-link tracking.
- Modify checker, report, homepage, footer, and layout: complete internal-link graph and analytics.

---

### Task 1: Define and test the content collection contract

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/headerContentContract.ts`
- Create: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Produces Astro collection `headers`
- Produces `validateHeaderGuideSource(slug: string, source: string): string[]`
- Frontmatter types include `applicability`, `syntax`, `examples`, `useCases`, `commonMistakes`, `securityConsiderations`, `relatedHeaders`, and `references`

- [x] **Step 1: Write RED validator fixture tests**

Test one complete source fixture and fixtures with a missing required heading, mismatched `headerName`, fewer than 180 body words, a `client:` directive, and an unknown related-header slug. The complete fixture returns `[]`; every invalid fixture returns its specific error.

- [x] **Step 2: Run and confirm RED**

```bash
npm test -- src/lib/headerContentContract.test.ts
```

Expected: FAIL because the validator does not exist.

- [x] **Step 3: Implement the pure source validator**

The validator must accumulate errors and enforce all of these rules:

1. filename slug equals the `headerName:` frontmatter scalar;
2. both `## Meaning and behavior` and `## Implementation notes` exist;
3. body after the closing frontmatter delimiter has at least 180 words;
4. source contains neither `client:` nor `application/ld+json`;
5. every list item under `relatedHeaders:` resolves through `getHeaderCatalogEntry()`.

- [x] **Step 4: Define the Astro collection schema**

Create `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const nonEmptyList = z.array(z.string().min(1)).min(1);

const headers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/headers' }),
  schema: z.object({
    headerName: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(80).max(180),
    applicability: z.enum(['response', 'request-and-response']),
    syntax: z.string().min(5),
    examples: nonEmptyList,
    useCases: nonEmptyList.min(2),
    commonMistakes: nonEmptyList.min(2),
    securityConsiderations: z.string().min(30),
    relatedHeaders: z.array(z.string()).min(1),
    references: z.array(z.object({
      label: z.string().min(3),
      url: z.string().url(),
    })).min(1),
  }),
});

export const collections = { headers };
```

- [x] **Step 5: Run tests and Astro check**

```bash
npm test -- src/lib/headerContentContract.test.ts
npm run check
```

Expected: fixtures PASS and the empty collection configuration is valid.

- [x] **Step 6: Commit the content boundary**

```bash
git add src/content.config.ts src/lib/headerContentContract.ts src/lib/headerContentContract.test.ts
git commit -m "feat: define HTTP header content collection"
```

---

### Task 2: Author the 13 security and privacy guides

**Files:**
- Create: 13 Markdown files under `src/content/headers/`
- Modify: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Produces complete content for catalog category `Security and privacy`

- [x] **Step 1: Add a RED inventory test**

Read and validate every slug in this exact array:

```ts
const securityAndPrivacySlugs = [
  'content-security-policy', 'strict-transport-security',
  'x-content-type-options', 'x-frame-options', 'referrer-policy',
  'permissions-policy', 'cross-origin-opener-policy',
  'cross-origin-embedder-policy', 'cross-origin-resource-policy',
  'clear-site-data', 'origin-agent-cluster',
  'x-permitted-cross-domain-policies', 'x-dns-prefetch-control',
];
```

Run the focused test and expect 13 missing-file failures.

- [x] **Step 2: Author all documents using this factual matrix**

| Slug | Required syntax/example and distinction | Primary source |
|---|---|---|
| `content-security-policy` | `default-src 'self'; object-src 'none'`; enforcement vs report-only and directive semantics | CSP Level 3, MDN CSP |
| `strict-transport-security` | `max-age=31536000; includeSubDomains`; HTTPS-only processing, first visit, preload | RFC 6797 |
| `x-content-type-options` | `nosniff`; MIME sniffing control vs correct `Content-Type` | Fetch Standard |
| `x-frame-options` | `DENY`; `DENY` vs `SAMEORIGIN` and CSP `frame-ancestors` | HTML/Fetch, MDN |
| `referrer-policy` | `strict-origin-when-cross-origin`; origin vs full URL and downgrade behavior | Referrer Policy spec |
| `permissions-policy` | `camera=(), geolocation=(self)`; allowlists and iframe delegation | Permissions Policy spec |
| `cross-origin-opener-policy` | `same-origin`; browsing-context isolation and popup compatibility | HTML Standard |
| `cross-origin-embedder-policy` | `require-corp`; `require-corp` vs credentialless and dependency opt-in | HTML Standard |
| `cross-origin-resource-policy` | `same-origin`; same-origin/same-site/cross-origin distinctions | Fetch Standard |
| `clear-site-data` | `"cache", "cookies", "storage"`; destructive behavior and secure contexts | Clear Site Data spec |
| `origin-agent-cluster` | `?1`; process isolation is not access control | HTML Standard |
| `x-permitted-cross-domain-policies` | `none`; legacy Adobe policy behavior | Adobe specification |
| `x-dns-prefetch-control` | `off`; DNS privacy/performance vs preconnect | MDN |

Each guide has at least two use cases, two mistakes, catalog-backed related fields, clear compatibility/deprecation notes, governing-standard link, and MDN link when available.

- [x] **Step 3: Validate and commit the batch**

```bash
npm test -- src/lib/headerContentContract.test.ts
npm run check
git add src/content/headers src/lib/headerContentContract.test.ts
git commit -m "content: add security and privacy header guides"
```

---

### Task 3: Author infrastructure, disclosure, and caching guides

**Files:**
- Create: 12 Markdown files under `src/content/headers/`
- Modify: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Produces 6 infrastructure/disclosure and 6 caching guides

- [x] **Step 1: Add and run a RED group inventory**

```ts
const infrastructureAndCachingSlugs = [
  'server', 'x-powered-by', 'x-aspnet-version', 'x-runtime', 'x-generator',
  'via', 'cache-control', 'age', 'expires', 'etag', 'last-modified', 'vary',
];
```

- [x] **Step 2: Author all 12 documents using this matrix**

| Slug | Required syntax/example and distinction | Primary source |
|---|---|---|
| `server` | `Server: nginx`; implementation metadata may be rewritten by intermediaries | RFC 9110 |
| `x-powered-by` | `X-Powered-By: Express`; non-standard disclosure, removal is not patching | framework docs |
| `x-aspnet-version` | `X-AspNet-Version: 4.0.30319`; non-standard ASP.NET disclosure | Microsoft docs |
| `x-runtime` | `X-Runtime: 0.042`; non-standard timing/framework metadata | Rails docs |
| `x-generator` | `X-Generator: Drupal 11`; non-standard CMS/build disclosure | vendor docs |
| `via` | `Via: 1.1 proxy.example`; intermediary trace semantics vs banners | RFC 9110 |
| `cache-control` | `public, max-age=3600`; `no-cache` revalidation vs `no-store` | RFC 9111 |
| `age` | `Age: 120`; cache residency estimate vs resource creation age | RFC 9111 |
| `expires` | HTTP date; absolute legacy freshness and Cache-Control precedence | RFC 9111 |
| `etag` | `ETag: "abc123"`; strong vs weak validators | RFC 9110 |
| `last-modified` | HTTP date; validator precision and `If-Modified-Since` | RFC 9110 |
| `vary` | `Vary: Accept-Encoding`; cache keys and `Vary: *` | RFC 9111 |

Non-standard guides must state that behavior is implementation-specific. Caching guides include interaction with a related validator or freshness field.

- [x] **Step 3: Validate and commit the batch**

```bash
npm test -- src/lib/headerContentContract.test.ts
npm run check
git add src/content/headers src/lib/headerContentContract.test.ts
git commit -m "content: add infrastructure and caching guides"
```

---

### Task 4: Author content and representation guides

**Files:**
- Create: 7 Markdown files under `src/content/headers/`
- Modify: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Produces catalog category `Content and representation`

- [x] **Step 1: Add and run a RED group inventory**

```ts
const representationSlugs = [
  'content-type', 'content-length', 'content-encoding', 'content-language',
  'content-disposition', 'content-location', 'accept-ranges',
];
```

- [x] **Step 2: Author all 7 documents using this matrix**

| Slug | Required syntax/example and distinction | Primary source |
|---|---|---|
| `content-type` | `text/html; charset=utf-8`; media type parameters vs sniffing | RFC 9110, RFC 6838 |
| `content-length` | decimal octets; absent with some framing/streaming; mismatch risks | RFC 9110 |
| `content-encoding` | `br`; representation coding vs transfer framing | RFC 9110 |
| `content-language` | `en-GB`; intended audience language vs all languages present | RFC 9110, BCP 47 |
| `content-disposition` | `attachment; filename="report.pdf"`; inline, filename safety, `filename*` | RFC 6266 |
| `content-location` | representation URI, not an automatic redirect | RFC 9110 |
| `accept-ranges` | `bytes`; advertised support and relation to range requests | RFC 9110 |

Include concrete mistakes involving compressed byte length, charset assumptions, unsafe filenames, or confusing response fields with request counterparts.

- [x] **Step 3: Validate and commit the batch**

```bash
npm test -- src/lib/headerContentContract.test.ts
npm run check
git add src/content/headers src/lib/headerContentContract.test.ts
git commit -m "content: add representation header guides"
```

---

### Task 5: Author the six CORS guides

**Files:**
- Create: 6 Markdown files under `src/content/headers/`
- Modify: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Produces catalog category `CORS`

- [ ] **Step 1: Add and run a RED group inventory**

```ts
const corsSlugs = [
  'access-control-allow-origin', 'access-control-allow-credentials',
  'access-control-allow-methods', 'access-control-allow-headers',
  'access-control-expose-headers', 'access-control-max-age',
];
```

- [ ] **Step 2: Author all six documents against the Fetch Standard**

| Slug | Required syntax/example and distinction |
|---|---|
| `access-control-allow-origin` | serialized origin or `*`; credential incompatibility; `Vary: Origin` |
| `access-control-allow-credentials` | exact `true`; browser exposure, not authentication |
| `access-control-allow-methods` | `GET, POST`; preflight response vs HTTP `Allow` |
| `access-control-allow-headers` | requested non-safelisted request fields vs exposed response fields |
| `access-control-expose-headers` | script-readable response fields vs request permission |
| `access-control-max-age` | preflight result cache vs HTTP freshness |

Each document references <https://fetch.spec.whatwg.org/> and its MDN page, explains simple vs preflighted requests, and never claims CORS prevents the network request from reaching a server.

- [ ] **Step 3: Validate and commit the batch**

```bash
npm test -- src/lib/headerContentContract.test.ts
npm run check
git add src/content/headers src/lib/headerContentContract.test.ts
git commit -m "content: add CORS header guides"
```

---

### Task 6: Complete cookies, control, linking, and timing content

**Files:**
- Create: 7 Markdown files under `src/content/headers/`
- Modify: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Completes the exact 45-document inventory

- [ ] **Step 1: Add the final RED group and full-inventory assertion**

```ts
const controlAndMetadataSlugs = [
  'set-cookie', 'www-authenticate', 'location', 'retry-after', 'link',
  'server-timing', 'timing-allow-origin',
];
```

Compare sorted Markdown basenames and extracted `headerName:` values with all sorted catalog slugs/names; require one-to-one equality. Extract every top-level `description:` value and assert all 45 descriptions are unique.

- [ ] **Step 2: Author all seven documents using this matrix**

| Slug | Required syntax/example and distinction | Primary source |
|---|---|---|
| `set-cookie` | two separate cookie field lines; expiry/scope/Secure/HttpOnly/SameSite; comma combining is unsafe | RFC 6265/current draft |
| `www-authenticate` | `Bearer realm="api"`; challenges and scheme parameters | RFC 9110, RFC 6750 |
| `location` | absolute or relative target; 3xx redirect vs 201 identifier | RFC 9110 |
| `retry-after` | delta-seconds or HTTP date; 503 and 429 use | RFC 9110, RFC 6585 |
| `link` | `</app.css>; rel=preload; as=style`; relations, parameters, multiple values | RFC 8288 |
| `server-timing` | `db;dur=53.2`; selected metrics, accuracy and privacy | Server Timing spec |
| `timing-allow-origin` | serialized origin; Resource Timing visibility vs CORS permission | Resource Timing spec |

State explicitly that scanner reports keep observed `Set-Cookie` values unmasked in this release. Explain timing-field privacy implications.

- [ ] **Step 3: Validate exact inventory and commit**

```bash
npm test -- src/lib/headerContentContract.test.ts
npm run check
git add src/content/headers src/lib/headerContentContract.test.ts
git commit -m "content: complete HTTP response header guides"
```

Expected: exactly 45 unique content files and zero schema/source errors.

---

### Task 7: Generate the reference index and guide routes

**Files:**
- Create: `src/components/astro/HeaderReferenceIndex.astro`
- Create: `src/components/astro/HeaderGuidePage.astro`
- Create: `src/pages/headers/index.astro`
- Create: `src/pages/headers/[slug].astro`
- Create: `src/lib/headerReferenceSeoContract.test.ts`
- Modify: `src/lib/seoPolicy.test.ts`

**Interfaces:**
- Produces static `/headers/` and one `/headers/<catalog-slug>/` per document
- Consumes `getCollection('headers')`, `render(entry)`, and catalog lookup

- [ ] **Step 1: Write RED static-route contracts**

Assert approved index title/H1/canonical and guide title pattern. Assert `[slug].astro` uses `getStaticPaths`, `getCollection('headers')`, and catalog lookup. Assert neither Astro component contains `client:`. Add `/headers/` and representative guides to sitemap-policy include cases.

- [ ] **Step 2: Run and confirm RED**

```bash
npm test -- src/lib/headerReferenceSeoContract.test.ts src/lib/seoPolicy.test.ts
```

- [ ] **Step 3: Build the grouped index**

Use title `HTTP Header Reference | HTTP Scanner`, H1 `HTTP Response Header Reference`, canonical `/headers/`, and description `Learn what common HTTP response headers mean, how their syntax works, and how to interpret real values from caching, CORS, cookies, security, redirects, and more.` Group `listHeaderCatalogEntries()` in `HEADER_CATEGORIES` order; link every entry; add checker CTA and explain that custom headers may lack dedicated pages.

- [ ] **Step 4: Generate only catalog-backed guide paths**

Fail the build if any content ID/header name lacks a matching catalog entry. Use:

```ts
const title = `${catalogEntry.displayName} HTTP Header — Syntax & Examples | HTTP Scanner`;
const canonicalPath = `/headers/${catalogEntry.slug}/`;
```

Render one H1, summary, applicability, syntax, all examples/use cases/mistakes, security consideration, related catalog links, sources, Markdown content, checker CTA, and for security/privacy entries a homepage Security Headers Checker link. Pass `guide.data.description` to `BaseLayout` so every guide emits its unique meta description.

- [ ] **Step 5: Test, build, and commit routes**

```bash
npm test -- src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts src/lib/seoPolicy.test.ts
npm run build
git add src/components/astro/HeaderReferenceIndex.astro src/components/astro/HeaderGuidePage.astro src/pages/headers src/lib/headerReferenceSeoContract.test.ts src/lib/seoPolicy.test.ts
git commit -m "feat: publish HTTP header reference routes"
```

Expected: `dist/headers/index.html` plus 45 guide directories and sitemap entries.

---

### Task 8: Complete internal links and bounded analytics

**Files:**
- Create: `src/lib/analyticsLinks.ts`
- Create: `src/lib/analyticsLinks.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/report/AllHeaderCard.tsx`
- Modify: `src/components/report/AllHeadersSection.tsx`
- Modify: `src/components/report/ReportView.tsx`
- Modify: `src/components/astro/HttpHeadersCheckerContent.astro`
- Modify: `src/components/astro/SiteFooter.astro`
- Modify: `src/components/astro/HomepageSeoContent.astro`
- Modify: both new reference components and their SEO tests

**Interfaces:**
- Produces `TrackedLinkEvent` and `bindAnalyticsLinks(root: ParentNode = document): () => void`
- Enables report guide links only now that all guide pages exist

- [ ] **Step 1: Write RED bounded-event tests**

Define and test:

```ts
export type TrackedLinkEvent =
  | 'guide to checker clicked'
  | 'checker to guide clicked';

export function readTrackedLink(
  eventName: string | undefined,
  headerName?: string
): { eventName: TrackedLinkEvent; properties: Record<string, string> } | null;
```

Allowed events return only optional `header_name`; unknown events return `null`; arbitrary dataset keys are ignored. Delegated click handling finds the closest tracked anchor and calls `capturePostHogEvent` once.

- [ ] **Step 2: Implement one static-link binding**

Initialize `bindAnalyticsLinks()` in the existing BaseLayout analytics branch after `initializePostHog()`. Do not initialize PostHog twice.

- [ ] **Step 3: Add the exact internal-link graph**

- checker → index and popular guides `cache-control`, `content-type`, `set-cookie`, `content-security-policy`, `server-timing`, `access-control-allow-origin`;
- index → checker and every guide;
- guide → checker, related guides, and index;
- security/privacy guide → homepage;
- homepage → checker and security guides where names already appear;
- footer → checker and index;
- known report header → its guide; unknown header remains plain text.

Static anchors use the two bounded events. React report links capture `report to guide clicked` with only `header_name` and `report_view: 'all-headers'`; never send values, scanned URLs, arbitrary custom names, or tokens.

- [ ] **Step 4: Run contracts, check, and commit**

```bash
npm test -- src/lib/analyticsLinks.test.ts src/lib/httpHeadersCheckerSeoContract.test.ts src/lib/headerReferenceSeoContract.test.ts src/lib/allHeadersReportContract.test.ts
npm run check
git add src/lib/analyticsLinks.ts src/lib/analyticsLinks.test.ts src/layouts/BaseLayout.astro src/components/report/AllHeaderCard.tsx src/components/report/AllHeadersSection.tsx src/components/report/ReportView.tsx src/components/astro/HttpHeadersCheckerContent.astro src/components/astro/SiteFooter.astro src/components/astro/HomepageSeoContent.astro src/components/astro/HeaderReferenceIndex.astro src/components/astro/HeaderGuidePage.astro src/lib/httpHeadersCheckerSeoContract.test.ts src/lib/headerReferenceSeoContract.test.ts
git commit -m "feat: connect HTTP header discovery paths"
```

---

### Task 9: Verify the complete feature before one release

**Files:**
- Modify only when verification exposes a defect in either plan's owned files.

**Interfaces:**
- Verifies every accepted success criterion

- [ ] **Step 1: Run all automated checks**

```bash
npm test
npm run lint
npm run build
npm run deploy:dry
```

Expected: all commands exit 0 and no D1 migration is introduced.

- [ ] **Step 2: Verify generated inventory with a read-only Node script**

Assert checker and index HTML exist; exactly 45 catalog slug directories contain `index.html`; every guide has one H1, self-canonical, checker CTA, syntax, examples, sources, and useful content; sitemap contains checker + index + 45 guides exactly once and no `/report`, `/reports`, or `/share` URL.

- [ ] **Step 3: Verify local HTTP behavior**

Known representative guide URLs return 200. `/headers/not-a-real-header/` returns status 404 and the existing static 404 page. Report routes remain Worker-served and noindex.

- [ ] **Step 4: Run browser QA at 1440px and 375px**

Verify useful pre-JavaScript content; no overflow in directory/cards/code/long values; correct default scanner views; no report refetch on switching; working filters and back/forward; known report links vs unknown plain text; bounded analytics; keyboard focus/`aria-pressed`; real 404 behavior.

- [ ] **Step 5: Record the launch measurement baseline**

Record separate previous-28-day GSC clicks/impressions/CTR/position and PostHog organic landing sessions/scan submissions, launch date, and checker/index/guide URL groups. Schedule the first evaluation 28 days after indexing; primary outcome is organic sessions beginning in the new cluster and their scan-submission rate.

- [ ] **Step 6: Commit only real verification fixes or baseline documentation**

Do not create an empty commit, push, or deploy without an explicit user request.
