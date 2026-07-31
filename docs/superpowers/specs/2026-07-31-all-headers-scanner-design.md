# All Headers Scanner SEO Design

**Date:** 2026-07-31  
**Status:** Approved in conversation; pending written-spec review  
**Scope:** HTTP Headers Checker, neutral report view, header reference cluster

## Context

HTTP Scanner currently fetches and persists every response header that survives
the scanner-transport filter. Configured security headers are evaluated, known
information-disclosure headers are penalized, and all remaining present headers
are stored as `status: unknown` with zero score impact. The existing homepage
owns the `security headers checker` intent and the existing report defaults to a
security-focused presentation.

The next organic-growth surface must address a distinct intent: users who want
to inspect the response headers returned for a URL without receiving a security
score. It must reuse the existing request, API, D1 record, and report URL rather
than introduce a second scanner engine or duplicate persistence.

The approved product direction is broader than security headers alone. `HTTP
Scanner` remains the platform brand; Security Headers Checker and HTTP Headers
Checker are separate entry points into the same scan data.

## Goals

1. Publish an indexable `/http-headers-checker/` landing page for users who want
   to inspect HTTP response headers.
2. Add a neutral `All response headers` report view without changing the
   existing Security Analysis behavior.
3. Publish an indexable HTTP header reference cluster backed by useful,
   maintainable content rather than thin generated pages.
4. Reuse one outbound request, one report entity, one D1 row, and one report
   route for both scanner modes.
5. Measure organic acquisition and scan conversion separately for the two
   entry points.

## Non-goals

- A second scan endpoint, use case, or report table.
- Export to JSON, CSV, or raw HTTP in the first release.
- Comparing scans or tracking header changes over time.
- Masking `Set-Cookie` values in this release; existing behavior is preserved.
- Generating pages for arbitrary custom or vendor-specific headers observed in
  individual scans.
- Replacing Cloudflare Workers with a separate scanning runtime.
- Changing the security scoring model.

## Product Architecture

### Shared scan and persistence

Both landing pages submit to the existing `/api/scan` endpoint. The backend
continues to fetch once, analyze once, create one report, and persist the
existing `headers` JSON. No D1 migration is required.

The current analyzer already stores:

- configured security headers that are present;
- configured security headers that are missing;
- known information-disclosure headers that are present;
- all other present response headers with zero weight and `status: unknown`.

The new view is therefore a presentation of existing report data, not a new
domain concept or persistence format.

### Repeated response headers

The existing `Record<string, string>` contract keeps one normalized value per
header name. For headers that may legitimately appear multiple times, the fetch
adapter must preserve every value inside that string. In particular, Workers'
multi-value access for `Set-Cookie` is used and the values are stored in a
stable newline-separated representation. Other headers retain the Fetch
runtime's standards-based combined representation. This requires no schema
change and satisfies the approved decision to show complete, unmasked cookie
values in the first release.

### Scanner transport filtering

The scanner runs on Cloudflare Workers. Worker subrequests can receive
Cloudflare transport and cache headers that describe the scanner's request path
rather than the target application's own configuration. The current filtering
policy remains active in the first release.

`filterCloudflareHeaders` is renamed to `filterScannerTransportHeaders` to
describe the actual boundary. Its current behavior, including removal of a
`server: cloudflare` value, is preserved and locked by tests. The All Headers UI
states that known scanner-transport headers are excluded.

This means “all response headers” is defined as all headers observed after the
known scanner-infrastructure filter. It does not claim byte-for-byte access to
an origin response that bypasses intermediaries.

## Knowledge Boundaries

The current `headerGuides.ts` contains security-oriented risk and remediation
content. It is renamed to `headerSecurityGuides.ts` and its public API becomes:

- `HeaderSecurityGuide`;
- `getHeaderSecurityGuide()`;
- `listSecurityGuidedHeaders()`.

Three sources have separate responsibilities:

```text
headerCatalog.ts
├── canonical header name
├── slug
├── neutral category
└── short neutral explanation
        ↓
All Headers report and reference index

headerSecurityGuides.ts
├── risk
├── recommended value
├── remediation steps
└── security best practices
        ↓
Security Analysis

src/content/headers/*.md
├── syntax
├── examples
├── uses and semantics
├── common mistakes
├── security considerations when applicable
├── related headers
└── primary sources
        ↓
/headers/:slug/
```

The browser bundle imports only the lightweight catalog and the existing
security guidance required by the report. Long-form reference content remains
server/build-time Astro content and is not shipped with the React island.

## Initial Header Catalog

The first release contains 45 curated response-header entries. Every entry must
have a neutral catalog record and a complete content document before it is
included in the sitemap.

### Security and privacy

1. `content-security-policy`
2. `strict-transport-security`
3. `x-content-type-options`
4. `x-frame-options`
5. `referrer-policy`
6. `permissions-policy`
7. `cross-origin-opener-policy`
8. `cross-origin-embedder-policy`
9. `cross-origin-resource-policy`
10. `clear-site-data`
11. `origin-agent-cluster`
12. `x-permitted-cross-domain-policies`
13. `x-dns-prefetch-control`

### Infrastructure and disclosure

14. `server`
15. `x-powered-by`
16. `x-aspnet-version`
17. `x-runtime`
18. `x-generator`
19. `via`

### Caching

20. `cache-control`
21. `age`
22. `expires`
23. `etag`
24. `last-modified`
25. `vary`

### Content and representation

26. `content-type`
27. `content-length`
28. `content-encoding`
29. `content-language`
30. `content-disposition`
31. `content-location`
32. `accept-ranges`

### CORS

33. `access-control-allow-origin`
34. `access-control-allow-credentials`
35. `access-control-allow-methods`
36. `access-control-allow-headers`
37. `access-control-expose-headers`
38. `access-control-max-age`

### Cookies and authentication

39. `set-cookie`
40. `www-authenticate`

### Redirects and response control

41. `location`
42. `retry-after`

### Linking and performance metadata

43. `link`
44. `server-timing`
45. `timing-allow-origin`

An observed header outside this catalog is displayed under `Other` with no
reference-page link. Detection alone never creates an indexable URL.

## Routes and Indexing

### HTTP Headers Checker

- URL: `/http-headers-checker/`
- Title: `HTTP Headers Checker — View Response Headers | HTTP Scanner`
- H1: `Free HTTP Headers Checker`
- Canonical: `https://httpscanner.com/http-headers-checker/`
- Rendering: static Astro HTML with the existing scanner as a React island.

The page contains the scanner above the fold followed by a practical guide:
what response headers are, how to inspect them, category explanations, an
example response, tool limitations, links to popular reference pages, a link to
Security Analysis, and an FAQ.

### Header reference index

- URL: `/headers/`
- Title: `HTTP Header Reference | HTTP Scanner`
- H1: `HTTP Response Header Reference`
- Canonical: `https://httpscanner.com/headers/`

The index lists every published entry grouped by neutral category. It links to
the checker and explains that arbitrary custom headers may appear in scan
results without receiving a dedicated reference page.

### Individual guides

- URL pattern: `/headers/:slug/`
- Example title: `Cache-Control HTTP Header — Syntax & Examples | HTTP Scanner`
- Example H1: `Cache-Control HTTP Header`
- Canonical: self-referencing production URL.

Each guide includes:

1. neutral meaning;
2. request/response applicability;
3. syntax;
4. at least one valid example;
5. common use cases;
6. common mistakes or misconceptions;
7. a separate security section where relevant;
8. related headers;
9. primary references, prioritizing RFCs and MDN;
10. a CTA to run the HTTP Headers Checker.

All landing, index, and guide pages are included in the sitemap. Existing
`/report/*`, `/reports`, and `/share/*` exclusions remain unchanged. Unknown
guide slugs return the existing real 404 response.

No FAQ structured data is required for the first release. Visible semantic FAQ
content is sufficient; structured data can be added later only when it matches
Google's current eligibility and the visible page content.

## Navigation and Internal Linking

- Add an `HTTP Headers` link to the primary navigation.
- Link the reference index from the checker, relevant guides, and footer.
- Link popular guides from `/http-headers-checker/`.
- Link a recognized header name in the All Headers report to its guide.
- Link each guide to related headers and back to the checker.
- Security-related guides also link to the homepage Security Headers Checker.
- The homepage links to the HTTP Headers Checker as a distinct tool, without
  creating `/security-headers-checker/` or changing the homepage canonical.

## Scanner Entry and Report URLs

`ScannerIsland` receives a presentation intent:

```ts
type ScannerResultView = 'security-analysis' | 'all-headers';
```

The homepage uses `security-analysis`. `/http-headers-checker/` uses
`all-headers`. Both submit the same `ScanRequestDTO` to the same API.

After success:

```text
Homepage                 → /report/:hash?token=...
HTTP Headers Checker     → /report/:hash?view=all-headers&token=...
```

The URL builder owns query construction so view and token order are stable and
encoded. Token sanitation removes only `token`, preserving
`view=all-headers`. Invalid or unknown view values fall back to Security
Analysis. Existing report links remain valid.

Reports stay `noindex,nofollow`; view parameters do not create SEO pages.

## Report UX

The report places a top-level view switch after the common report header:

```text
[ All response headers ] [ Security analysis ]
```

### All response headers

The view combines `detected` and `leaking`, keeps only `present === true`,
deduplicates by normalized name defensively, and sorts alphabetically.
Configured missing security headers are excluded.

It displays:

- total observed header count;
- category filter;
- name/value search;
- canonical header name;
- complete stored value;
- neutral category and short explanation;
- reference link when the catalog contains the header;
- `Other` and a neutral fallback for unknown headers;
- a note that known scanner-transport headers are excluded.

It does not display score, points, pass/fail/missing state, security remediation,
or the score-sharing image. Export and comparison controls are excluded from the
first release.

### Security Analysis

The existing score, sharing, detected/missing/leaking tabs, guidance, and
remediation remain functionally unchanged. The rename to
`headerSecurityGuides.ts` must not change its output.

### Shared report behavior

Both views retain the report URL/date header, delete-token warning, deletion
control, loading and error states, and the single fetched report. Switching
views does not refetch or rescan. The URL is updated so the selected view is
shareable.

## Analytics

Existing scan and report events gain bounded, non-sensitive properties:

```ts
scanner_mode: 'security-headers' | 'all-headers'
report_view: 'security-analysis' | 'all-headers'
```

Track:

- organic landing sessions for `/http-headers-checker/`, `/headers/`, and guide
  pages;
- landing view to scan submission;
- scan submission to report view;
- report-view switches;
- guide-to-checker clicks;
- report-to-guide clicks;
- Google Search Console clicks, impressions, CTR, and average position per
  landing-page group.

The primary 28-day outcome is organic sessions beginning in the new cluster and
the proportion of those sessions that submit a scan. GSC and analytics metrics
remain separate rather than being combined.

## Error and Edge Behavior

- Invalid report `view` values default to Security Analysis.
- Unknown observed headers use `Other` and have no guide link.
- An empty present-header list renders a neutral empty state.
- Unknown guide slugs render a real 404.
- Existing scan validation, timeout, rate-limit, and not-found flows are reused.
- `Set-Cookie` values remain unchanged in this release.
- No scanner-transport header is silently reintroduced while renaming the
  filter.

## Testing Strategy

### Data contracts

- Header names and slugs are unique.
- Categories belong to the allowed category union.
- Every initial-catalog entry has one content document.
- Every content document maps to one catalog entry.
- Every guide has syntax, a valid example, use cases, related-header validation,
  and at least one primary source.
- The 18 existing security-guidance entries remain available after the rename.

### Pure behavior

- All Headers selection combines present detected and leaking headers.
- Missing entries are excluded.
- Defensive deduplication and alphabetical sorting are deterministic.
- Known entries receive category, explanation, and guide link.
- Unknown entries receive `Other` and no link.
- Report URL creation preserves the selected view and valid token.
- Sanitization removes only the token.
- Invalid views fall back to Security Analysis.
- Scanner transport filtering retains the existing behavior under its new name.

### SEO contracts

- Checker, index, and all 45 guides build to static HTML.
- Each indexable page has one H1, unique title/description, self-canonical, and
  useful visible content.
- New pages appear in the sitemap.
- Reports remain excluded and `noindex`.
- No custom header name can generate a route dynamically.
- Internal links resolve to generated pages.

### Full verification

- Focused unit and contract tests.
- Full `npm test`.
- `npm run lint` with no new errors.
- `npm run build` with zero Astro/TypeScript diagnostics.
- Generated-output checks for representative checker and guide pages.
- Browser QA on desktop and mobile for both scanner entry points, contextual
  default report views, view switching without refetch, token sanitation,
  search, category filters, guide links, 404 behavior, and horizontal overflow.

## Delivery Milestones

### Milestone 1: Product foundation

- Rename the security guide module and API without behavior changes.
- Add the lightweight neutral catalog and validation.
- Add report-view URL parsing and contextual scanner intent.
- Add All Headers report UI.
- Publish `/http-headers-checker/` and wire navigation/analytics.

### Milestone 2: Reference cluster

- Add the Astro content collection and schema.
- Author and source all 45 complete guides.
- Publish `/headers/` and `/headers/:slug/`.
- Add report, checker, guide, homepage, footer, and related-header links.
- Verify sitemap and generated content.

Both milestones ship together for the first public release of this feature so
the checker launches with its full reference cluster. The milestone split is an
implementation and review boundary, not a staggered production rollout.

## Policy References

- Cloudflare Workers cache behavior for `fetch()` subrequests:
  <https://developers.cloudflare.com/workers/reference/how-the-cache-works/>
- Cloudflare Worker subrequest identity and Ray IDs:
  <https://developers.cloudflare.com/logs/faq/worker-subrequests/>
- Google policy against scaled pages created primarily to manipulate rankings
  rather than help users:
  <https://developers.google.com/search/docs/essentials/spam-policies>

## Success Criteria

The design is complete when:

1. users entering from the homepage still receive the unchanged Security
   Analysis by default;
2. users entering from `/http-headers-checker/` receive All response headers by
   default from the same scan and report;
3. all 45 curated guides are statically generated, internally linked, useful,
   sourced, canonical, and included in the sitemap;
4. unknown observed headers remain usable in the report without generating SEO
   pages;
5. no D1 migration or second outbound request is introduced;
6. analytics distinguishes scanner intent and report view;
7. all automated and browser verification passes without regressions.
