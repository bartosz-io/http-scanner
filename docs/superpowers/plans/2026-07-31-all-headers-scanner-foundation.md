# All Headers Scanner Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an indexable HTTP Headers Checker and a neutral All response headers report view while reusing the existing scan, report, and D1 data flow.

**Architecture:** Keep one Worker fetch, one analysis, and one persisted report. Add a small shared frontend catalog for 45 known response headers, model report-view selection as a validated URL concern, and render the neutral view inside the existing React report island. Keep security guidance isolated from neutral header metadata.

**Tech Stack:** Astro 7 static output, React 19 islands, TypeScript 5.7, Vitest 4, Tailwind CSS 4, Cloudflare Workers, PostHog.

## Global Constraints

- Both scanner entry points must submit the existing `ScanRequestDTO` to `/api/scan`; do not add a second endpoint, Worker use case, fetch, report entity, or D1 migration.
- The homepage defaults to `security-analysis`; `/http-headers-checker/` defaults to `all-headers`.
- Reports remain `noindex,nofollow` and excluded from the sitemap.
- The All response headers view shows only present headers and never shows score, points, pass/fail/missing status, security remediation, or score-sharing UI.
- The Security Analysis view must retain its current score, sharing, tabs, guidance, and remediation behavior.
- Keep complete, unmasked `Set-Cookie` values and preserve repeated values using a newline-separated string.
- Preserve the current scanner-infrastructure filtering behavior, including removal of `server` values containing `cloudflare`; rename the boundary to scanner transport filtering.
- Unknown observed headers use category `Other`, receive neutral fallback copy, and do not generate a guide link.
- Add no runtime or development dependency.
- Use lowercase canonical names and slugs for all catalog keys.
- Use the approved product copy and metadata from `docs/superpowers/specs/2026-07-31-all-headers-scanner-design.md`.
- The reference links themselves are enabled by the follow-up reference-cluster plan so this milestone never ships broken `/headers/:slug/` links by itself.

## File Structure

- Create `worker/impl/services/responseHeaders.ts`: pure extraction and scanner-transport filtering functions.
- Create `worker/impl/services/responseHeaders.test.ts`: repeated-cookie and filtering regression tests.
- Rename `src/lib/headerGuides.ts` to `src/lib/headerSecurityGuides.ts`: security-only report guidance and renamed public API.
- Create `src/lib/headerSecurityGuides.test.ts`: rename/coverage regression contract.
- Create `src/lib/headerCatalog.ts`: the 45-entry neutral catalog and lookup helpers.
- Create `src/lib/headerCatalog.test.ts`: catalog uniqueness, category, slug, and inventory contracts.
- Create `src/lib/reportView.ts`: report-view parsing, analytics mapping, and neutral header projection.
- Create `src/lib/reportView.test.ts`: deterministic pure behavior tests.
- Modify `src/lib/reportLocation.ts` and `src/lib/reportLocation.test.ts`: view-aware report URLs and token-safe sanitization.
- Modify `src/components/islands/ScannerIsland.tsx`, `src/hooks/useScanForm.ts`, and both scanner pages: contextual result view and scan analytics.
- Create `src/components/report/ReportViewSwitch.tsx`: accessible top-level view selector.
- Create `src/components/report/AllHeadersSection.tsx`: neutral search/category UI.
- Create `src/components/report/AllHeaderCard.tsx`: neutral header value presentation.
- Modify `src/components/islands/ReportIsland.tsx` and `src/components/report/ReportView.tsx`: view state, URL synchronization, conditional report presentation, and analytics.
- Create `src/components/astro/HttpHeadersCheckerContent.astro`: static educational checker content.
- Create `src/pages/http-headers-checker/index.astro`: indexable checker landing page.
- Create `src/lib/httpHeadersCheckerSeoContract.test.ts`: static metadata, content, link, and island-placement contract.
- Modify `src/components/astro/SiteHeader.astro`, `src/components/astro/SiteFooter.astro`, `src/components/astro/HomepageSeoContent.astro`, and `src/lib/homepageSeoContract.test.ts`: discovery links between the two tools.

---

### Task 1: Preserve repeated headers and name the Worker filtering boundary accurately

**Files:**
- Create: `worker/impl/services/responseHeaders.ts`
- Create: `worker/impl/services/responseHeaders.test.ts`
- Modify: `worker/impl/services/FetchHttpService.ts`

**Interfaces:**
- Consumes: standard `Headers` returned by the Worker `fetch()` subrequest
- Produces: `extractResponseHeaders(headers: Headers): Record<string, string>` and `filterScannerTransportHeaders(headers: Record<string, string>): Record<string, string>`

- [ ] **Step 1: Write failing extraction and filtering tests**

Create `worker/impl/services/responseHeaders.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  extractResponseHeaders,
  filterScannerTransportHeaders,
} from './responseHeaders';

describe('extractResponseHeaders', () => {
  it('normalizes names and keeps every Set-Cookie value on its own line', () => {
    const headers = new Headers();
    headers.append('Content-Type', 'text/html; charset=utf-8');
    headers.append('Set-Cookie', 'session=one; Secure; HttpOnly');
    headers.append('Set-Cookie', 'theme=dark; Secure');

    expect(extractResponseHeaders(headers)).toEqual({
      'content-type': 'text/html; charset=utf-8',
      'set-cookie': 'session=one; Secure; HttpOnly\ntheme=dark; Secure',
    });
  });
});

describe('filterScannerTransportHeaders', () => {
  it('removes the existing scanner transport set without mutating input', () => {
    const input = {
      'cache-control': 'max-age=60',
      'cf-ray': 'ray-id',
      'cf-cache-status': 'DYNAMIC',
      'alt-svc': 'h3=\":443\"',
      server: 'cloudflare',
    };

    expect(filterScannerTransportHeaders(input)).toEqual({
      'cache-control': 'max-age=60',
    });
    expect(input).toHaveProperty('cf-ray');
  });

  it('keeps a target server header that does not identify Cloudflare', () => {
    expect(filterScannerTransportHeaders({ server: 'nginx' })).toEqual({
      server: 'nginx',
    });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- worker/impl/services/responseHeaders.test.ts
```

Expected: FAIL because `responseHeaders.ts` does not exist.

- [ ] **Step 3: Add the pure adapter functions**

Create `worker/impl/services/responseHeaders.ts` with the exact transport set currently in `FetchHttpService`:

```ts
const SCANNER_TRANSPORT_HEADERS = new Set([
  'cf-ray',
  'cf-cache-status',
  'cf-mitigated',
  'cf-worker',
  'cf-edge-cache',
  'cf-connecting-ip',
  'cf-bgj',
  'cf-visitor',
  'cf-apo-via',
  'alt-svc',
]);

export function extractResponseHeaders(headers: Headers): Record<string, string> {
  const extracted: Record<string, string> = {};
  headers.forEach((value, name) => {
    extracted[name.toLowerCase()] = value;
  });

  const setCookieValues = headers.getSetCookie();
  if (setCookieValues.length > 0) {
    extracted['set-cookie'] = setCookieValues.join('\n');
  }

  return extracted;
}

export function filterScannerTransportHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name, value]) => {
      const normalizedName = name.toLowerCase();
      if (SCANNER_TRANSPORT_HEADERS.has(normalizedName)) return false;
      return !(
        normalizedName === 'server' &&
        value.toLowerCase().includes('cloudflare')
      );
    })
  );
}
```

In `FetchHttpService.ts`, remove `CLOUDFLARE_ADDED_HEADERS`, `extractHeaders`, and `filterCloudflareHeaders`; import the two functions and replace the current two-call extraction with:

```ts
const extractedHeaders = extractResponseHeaders(response.headers);
const filteredHeaders = filterScannerTransportHeaders(extractedHeaders);
```

- [ ] **Step 4: Run the focused test and type-check**

Run:

```bash
npm test -- worker/impl/services/responseHeaders.test.ts
npm run check
```

Expected: all focused tests PASS and both Astro/TypeScript checks exit 0.

- [ ] **Step 5: Commit the Worker adapter boundary**

```bash
git add worker/impl/services/FetchHttpService.ts worker/impl/services/responseHeaders.ts worker/impl/services/responseHeaders.test.ts
git commit -m "refactor: preserve scanner response headers"
```

---

### Task 2: Separate security guidance from neutral header knowledge

**Files:**
- Rename: `src/lib/headerGuides.ts` → `src/lib/headerSecurityGuides.ts`
- Create: `src/lib/headerSecurityGuides.test.ts`
- Modify: `src/components/report/HeaderCard.tsx`

**Interfaces:**
- Produces: `HeaderSecurityGuide`, `getHeaderSecurityGuide(headerName: HeaderEntry['name'])`, and `listSecurityGuidedHeaders(): string[]`
- Preserves: all 18 current guide records and their rendered security copy

- [ ] **Step 1: Write a failing public-API and inventory contract**

Create `src/lib/headerSecurityGuides.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getHeaderSecurityGuide,
  listSecurityGuidedHeaders,
} from './headerSecurityGuides';

describe('security header guides', () => {
  it('preserves all 18 existing security-oriented entries', () => {
    expect(listSecurityGuidedHeaders().sort()).toEqual([
      'clear-site-data',
      'content-security-policy',
      'cross-origin-embedder-policy',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy',
      'origin-agent-cluster',
      'permissions-policy',
      'referrer-policy',
      'server',
      'strict-transport-security',
      'x-aspnet-version',
      'x-content-type-options',
      'x-dns-prefetch-control',
      'x-frame-options',
      'x-generator',
      'x-permitted-cross-domain-policies',
      'x-powered-by',
      'x-runtime',
    ]);
  });

  it('looks up names case-insensitively through the renamed API', () => {
    expect(getHeaderSecurityGuide('Content-Security-Policy')?.risk).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rename the module and symbols, then confirm the contract turns GREEN**

Use `git mv`, rename `HeaderGuideResource` to `HeaderSecurityGuideResource`, `HeaderGuide` to `HeaderSecurityGuide`, `HeaderGuideRegistry` to `HeaderSecurityGuideRegistry`, `headerGuides` to `headerSecurityGuides`, `getHeaderGuide` to `getHeaderSecurityGuide`, and `listGuidedHeaders` to `listSecurityGuidedHeaders`. Update `HeaderCard.tsx` to import and call the renamed lookup. Do not edit any guide values.

Run:

```bash
npm test -- src/lib/headerSecurityGuides.test.ts
npm run check
```

Expected: 2 tests PASS and no missing imports.

- [ ] **Step 3: Commit the behavior-preserving rename**

```bash
git add src/lib/headerGuides.ts src/lib/headerSecurityGuides.ts src/lib/headerSecurityGuides.test.ts src/components/report/HeaderCard.tsx
git commit -m "refactor: isolate security header guidance"
```

---

### Task 3: Add the neutral 45-header catalog

**Files:**
- Create: `src/lib/headerCatalog.ts`
- Create: `src/lib/headerCatalog.test.ts`

**Interfaces:**
- Produces: `HEADER_CATEGORIES`, `HeaderCategory`, `HeaderCatalogEntry`, `headerCatalog`, `getHeaderCatalogEntry(name: string)`, and `listHeaderCatalogEntries()`
- Catalog entry shape: `{ name: string; displayName: string; slug: string; category: HeaderCategory; summary: string }`

- [ ] **Step 1: Write the failing catalog contract**

Create `src/lib/headerCatalog.test.ts` with the approved 45-name array copied from the design spec and these assertions:

```ts
import { describe, expect, it } from 'vitest';
import {
  HEADER_CATEGORIES,
  getHeaderCatalogEntry,
  listHeaderCatalogEntries,
} from './headerCatalog';

const expectedNames = [
  'content-security-policy', 'strict-transport-security',
  'x-content-type-options', 'x-frame-options', 'referrer-policy',
  'permissions-policy', 'cross-origin-opener-policy',
  'cross-origin-embedder-policy', 'cross-origin-resource-policy',
  'clear-site-data', 'origin-agent-cluster',
  'x-permitted-cross-domain-policies', 'x-dns-prefetch-control',
  'server', 'x-powered-by', 'x-aspnet-version', 'x-runtime',
  'x-generator', 'via', 'cache-control', 'age', 'expires', 'etag',
  'last-modified', 'vary', 'content-type', 'content-length',
  'content-encoding', 'content-language', 'content-disposition',
  'content-location', 'accept-ranges', 'access-control-allow-origin',
  'access-control-allow-credentials', 'access-control-allow-methods',
  'access-control-allow-headers', 'access-control-expose-headers',
  'access-control-max-age', 'set-cookie', 'www-authenticate', 'location',
  'retry-after', 'link', 'server-timing', 'timing-allow-origin',
].sort();

describe('header catalog', () => {
  it('contains the exact approved inventory with unique names and slugs', () => {
    const entries = listHeaderCatalogEntries();
    expect(entries.map(({ name }) => name).sort()).toEqual(expectedNames);
    expect(new Set(entries.map(({ name }) => name)).size).toBe(entries.length);
    expect(new Set(entries.map(({ slug }) => slug)).size).toBe(entries.length);
  });

  it('uses only approved categories and complete neutral metadata', () => {
    for (const entry of listHeaderCatalogEntries()) {
      expect(HEADER_CATEGORIES).toContain(entry.category);
      expect(entry.slug).toBe(entry.name);
      expect(entry.displayName.length).toBeGreaterThan(1);
      expect(entry.summary.length).toBeGreaterThan(40);
      expect(entry.summary).not.toMatch(/pass|fail|missing|score|penalty/i);
    }
  });

  it('looks up canonical names case-insensitively', () => {
    expect(getHeaderCatalogEntry('Cache-Control')?.slug).toBe('cache-control');
    expect(getHeaderCatalogEntry('X-Custom-Thing')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the contract and confirm RED**

```bash
npm test -- src/lib/headerCatalog.test.ts
```

Expected: FAIL because the catalog module does not exist.

- [ ] **Step 3: Implement the typed catalog**

Use these exact categories and labels:

```ts
export const HEADER_CATEGORIES = [
  'Security and privacy',
  'Infrastructure and disclosure',
  'Caching',
  'Content and representation',
  'CORS',
  'Cookies and authentication',
  'Redirects and response control',
  'Linking and performance metadata',
] as const;

export type HeaderCategory = (typeof HEADER_CATEGORIES)[number];
```

Create one entry for each name in the test. Use title-cased protocol spelling for `displayName`, keep `slug === name`, assign the category from the design inventory, and write a one-sentence neutral description of what the field communicates or controls. Store the records in a `satisfies Record<string, HeaderCatalogEntry>` object and return a stable array from `listHeaderCatalogEntries()`.

- [ ] **Step 4: Run the catalog test and full type-check**

```bash
npm test -- src/lib/headerCatalog.test.ts
npm run check
```

Expected: 3 tests PASS and no type errors.

- [ ] **Step 5: Commit the neutral catalog**

```bash
git add src/lib/headerCatalog.ts src/lib/headerCatalog.test.ts
git commit -m "feat: add neutral HTTP header catalog"
```

---

### Task 4: Model report-view URLs and contextual scanner intent

**Files:**
- Create: `src/lib/reportView.ts`
- Create: `src/lib/reportView.test.ts`
- Modify: `src/lib/reportLocation.ts`
- Modify: `src/lib/reportLocation.test.ts`
- Modify: `src/components/TableRow.tsx`

**Interfaces:**
- Produces: `ScannerResultView = 'security-analysis' | 'all-headers'`, `ScannerMode = 'security-headers' | 'all-headers'`, `parseReportView(search: string): ScannerResultView`, `getScannerMode(view: ScannerResultView): ScannerMode`, and `createReportViewUrl(pathname: string, search: string, view: ScannerResultView): string`
- Changes: `createReportPath(hash: string, options?: { deleteToken?: string; view?: ScannerResultView }): string`
- Extends: `BrowserReportLocation` with `view: ScannerResultView`

- [ ] **Step 1: Write RED tests for parsing, fallback, URL creation, and sanitation**

In `reportView.test.ts`, assert:

```ts
expect(parseReportView('?view=all-headers')).toBe('all-headers');
expect(parseReportView('')).toBe('security-analysis');
expect(parseReportView('?view=unknown')).toBe('security-analysis');
expect(getScannerMode('security-analysis')).toBe('security-headers');
expect(getScannerMode('all-headers')).toBe('all-headers');
expect(createReportViewUrl('/report/hash', '?source=scan', 'all-headers'))
  .toBe('/report/hash?source=scan&view=all-headers');
expect(createReportViewUrl('/report/hash', '?view=all-headers&source=scan', 'security-analysis'))
  .toBe('/report/hash?source=scan');
```

Update `reportLocation.test.ts` to require:

```ts
expect(createReportPath(REPORT_HASH, {
  deleteToken: DELETE_TOKEN,
  view: 'all-headers',
})).toBe(`/report/${REPORT_HASH}?view=all-headers&token=${DELETE_TOKEN}`);
```

Also update browser-location expectations so sanitation removes `token` but returns `view: 'all-headers'` and preserves `?view=all-headers`.

- [ ] **Step 2: Run both files and confirm RED**

```bash
npm test -- src/lib/reportView.test.ts src/lib/reportLocation.test.ts
```

Expected: FAIL for missing view helpers and the old path-builder signature.

- [ ] **Step 3: Implement view helpers and update all path callers**

Keep `view=security-analysis` out of report URLs because it is the default. For `all-headers`, append `view` before `token` in `createReportPath`. Preserve unrelated safe parameters in sanitation and view switching. Update `TableRow.tsx` to call `createReportPath(scan.hash)` and update the scanner caller in Task 5 to use the options object.

- [ ] **Step 4: Run focused tests, all call-site tests, and type-check**

```bash
npm test -- src/lib/reportView.test.ts src/lib/reportLocation.test.ts src/lib/analyticsPrivacy.test.ts
npm run check
```

Expected: all tests PASS; token stripping still preserves `view`.

- [ ] **Step 5: Commit report intent routing**

```bash
git add src/lib/reportView.ts src/lib/reportView.test.ts src/lib/reportLocation.ts src/lib/reportLocation.test.ts src/components/TableRow.tsx
git commit -m "feat: add report presentation URLs"
```

---

### Task 5: Carry scanner intent through redirect and analytics

**Files:**
- Modify: `src/components/islands/ScannerIsland.tsx`
- Modify: `src/components/ScanForm.tsx`
- Modify: `src/hooks/useScanForm.ts`
- Modify: `src/pages/index.astro`
- Test: `src/lib/homepageSeoContract.test.ts`

**Interfaces:**
- Changes: `ScannerIslandProps = { resultView?: ScannerResultView }`, defaulting to `security-analysis`
- Changes: `useScanForm(scannerMode: ScannerMode)`; `scan submitted` and `scan failed` gain `scanner_mode`

- [ ] **Step 1: Extend the homepage contract before implementation**

Change the homepage assertion from `<ScannerIsland client:load />` to:

```ts
expect(homepageSource).toContain(
  '<ScannerIsland resultView="security-analysis" client:load />'
);
```

Add a source contract that `ScannerIsland.tsx` derives and passes `scannerMode` into `ScanForm`, its report redirect passes both `deleteToken` and `view` into `createReportPath`, and `useScanForm.ts` includes `scanner_mode: scannerMode` in both scan events.

- [ ] **Step 2: Run the contract and confirm RED**

```bash
npm test -- src/lib/homepageSeoContract.test.ts
```

Expected: FAIL because the contextual prop is absent.

- [ ] **Step 3: Implement the contextual scanner**

Use this component boundary:

```ts
interface ScannerIslandProps {
  resultView?: ScannerResultView;
}

export const ScannerIsland: React.FC<ScannerIslandProps> = ({
  resultView = 'security-analysis',
}) => {
  const scannerMode = getScannerMode(resultView);
  const handleScanSuccess = (response: ScanResponseDTO) => {
    window.location.assign(createReportPath(response.hash, {
      deleteToken: response.deleteToken,
      view: resultView,
    }));
  };

  return (
    <ScanForm
      scannerMode={scannerMode}
      onScanSuccess={handleScanSuccess}
      onScanStart={handleScanStart}
      onScanError={handleScanError}
    />
  );
};
```

Add `scannerMode: ScannerMode` to `ScanFormProps`, call the only `useScanForm(scannerMode)` instance inside `ScanForm`, and let `ScannerIsland` continue to own the redirect. Add `scanner_mode: scannerMode` to `scan submitted` and `scan failed`.

Set the homepage island explicitly:

```astro
<ScannerIsland resultView="security-analysis" client:load />
```

- [ ] **Step 4: Run tests and type-check**

```bash
npm test -- src/lib/homepageSeoContract.test.ts src/lib/reportLocation.test.ts
npm run check
```

Expected: contracts PASS and there is still one POST per form submission.

- [ ] **Step 5: Commit scanner intent propagation**

```bash
git add src/components/islands/ScannerIsland.tsx src/components/ScanForm.tsx src/hooks/useScanForm.ts src/pages/index.astro src/lib/homepageSeoContract.test.ts
git commit -m "feat: propagate scanner presentation intent"
```

---

### Task 6: Build the pure All response headers projection

**Files:**
- Modify: `src/lib/reportView.ts`
- Modify: `src/lib/reportView.test.ts`

**Interfaces:**
- Produces: `ReportHeaderGroups = { detected: HeaderEntry[]; missing: HeaderEntry[]; leaking: HeaderEntry[] }`, `AllResponseHeader`, and `selectAllResponseHeaders(groups: ReportHeaderGroups): AllResponseHeader[]`
- `AllResponseHeader`: `{ name; displayName; value; category: HeaderCategory | 'Other'; summary; guideSlug?: string }`

- [ ] **Step 1: Add RED projection tests**

Test a fixture containing present detected headers, a missing configured header, one leaking header duplicated in detected, and one unknown custom header. Assert the exact result:

```ts
expect(selectAllResponseHeaders(groups)).toEqual([
  {
    name: 'cache-control',
    displayName: 'Cache-Control',
    value: 'public, max-age=60',
    category: 'Caching',
    summary: expect.any(String),
    guideSlug: 'cache-control',
  },
  {
    name: 'server',
    displayName: 'Server',
    value: 'nginx',
    category: 'Infrastructure and disclosure',
    summary: expect.any(String),
    guideSlug: 'server',
  },
  {
    name: 'x-custom-trace',
    displayName: 'X-Custom-Trace',
    value: 'trace-1',
    category: 'Other',
    summary: 'This response header is not yet covered by the HTTP Scanner reference.',
  },
]);
```

Also assert alphabetical sorting, case-insensitive deduplication, exclusion of `present: false`, and preservation of newline-separated `Set-Cookie`.

- [ ] **Step 2: Run and confirm RED**

```bash
npm test -- src/lib/reportView.test.ts
```

Expected: FAIL because the projection does not exist.

- [ ] **Step 3: Implement the minimal deterministic projection**

Normalize names to lowercase, iterate `detected` then `leaking`, accept only `present === true`, keep the first value for a duplicate normalized name, enrich known names from `headerCatalog`, generate a title-cased fallback display name, and sort with `name.localeCompare`.

- [ ] **Step 4: Run projection and catalog tests**

```bash
npm test -- src/lib/reportView.test.ts src/lib/headerCatalog.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit the report projection**

```bash
git add src/lib/reportView.ts src/lib/reportView.test.ts
git commit -m "feat: project neutral response headers"
```

---

### Task 7: Add the neutral report UI and shareable view switch

**Files:**
- Create: `src/components/report/ReportViewSwitch.tsx`
- Create: `src/components/report/AllHeadersSection.tsx`
- Create: `src/components/report/AllHeaderCard.tsx`
- Modify: `src/components/islands/ReportIsland.tsx`
- Modify: `src/components/report/ReportView.tsx`
- Modify: `src/types/reportTypes.ts`
- Create: `src/lib/allHeadersReportContract.test.ts`

**Interfaces:**
- `ReportViewSwitchProps = { value: ScannerResultView; onChange(view: ScannerResultView): void }`
- `AllHeadersSectionProps = { headers: AllResponseHeader[]; linkGuides?: boolean }`; keep `linkGuides` false until the reference cluster exists
- `ReportViewProps` gains `view: ScannerResultView` and `onViewChange(view: ScannerResultView): void`

- [ ] **Step 1: Write a RED source contract for the presentation boundary**

In `allHeadersReportContract.test.ts`, read the three new component sources and `ReportView.tsx`; assert the visible labels `All response headers`, `Security analysis`, `Search response headers`, `All categories`, `Other`, and `Known scanner-transport headers are excluded`. Assert `ReportView.tsx` renders `ScoreSection`, `SharingSection`, and `HeadersSection` only in its `security-analysis` branch, and `AllHeadersSection` only in its `all-headers` branch.

- [ ] **Step 2: Run and confirm RED**

```bash
npm test -- src/lib/allHeadersReportContract.test.ts
```

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the accessible switch and neutral list**

Use two real `<button type="button">` elements with `aria-pressed`, not the security status tabs. `AllHeadersSection` must:

- show `{headers.length} response headers observed`;
- provide a case-insensitive name/value search input;
- derive category buttons from the categories present plus `All categories`;
- show an empty state for zero observed headers and a separate no-match state;
- render complete values with `FormattedHeaderValue` and `whitespace-pre-wrap`;
- render category and neutral summary only;
- omit points, security status, missing headers, recommendations, and export controls;
- display the scanner-transport exclusion note.

Do not render `/headers/:slug/` anchors yet; accept `linkGuides={false}` so Task 8 in the reference-cluster plan can enable them atomically with the generated pages.

- [ ] **Step 4: Keep one fetched report while synchronizing the URL**

In `ReportIsland`, initialize view from `parseBrowserReportLocation`, keep it in state, listen for `popstate`, and implement:

```ts
const handleViewChange = (nextView: ScannerResultView) => {
  window.history.pushState(
    window.history.state,
    '',
    createReportViewUrl(window.location.pathname, window.location.search, nextView)
  );
  setView(nextView);
  capturePostHogEvent('report view switched', { report_view: nextView });
};
```

Pass `view` and `handleViewChange` into the already-mounted `ReportView`. In `ReportView`, add `report_view: view` to `report viewed`, put `ReportHeader`, token warning, switch, and deletion outside the conditional branch, and compute the neutral projection with `useMemo`. Do not call `useReportData` from either child branch.

- [ ] **Step 5: Run focused tests and type-check**

```bash
npm test -- src/lib/allHeadersReportContract.test.ts src/lib/reportView.test.ts src/lib/reportLocation.test.ts
npm run check
```

Expected: all tests PASS and React/TypeScript diagnostics are empty.

- [ ] **Step 6: Commit the report presentation**

```bash
git add src/components/report/ReportViewSwitch.tsx src/components/report/AllHeadersSection.tsx src/components/report/AllHeaderCard.tsx src/components/islands/ReportIsland.tsx src/components/report/ReportView.tsx src/types/reportTypes.ts src/lib/allHeadersReportContract.test.ts
git commit -m "feat: add all response headers report view"
```

---

### Task 8: Publish the static HTTP Headers Checker landing page

**Files:**
- Create: `src/components/astro/HttpHeadersCheckerContent.astro`
- Create: `src/pages/http-headers-checker/index.astro`
- Create: `src/lib/httpHeadersCheckerSeoContract.test.ts`
- Modify: `src/components/astro/SiteHeader.astro`
- Modify: `src/components/astro/SiteFooter.astro`
- Modify: `src/components/astro/HomepageSeoContent.astro`
- Modify: `src/lib/homepageSeoContract.test.ts`
- Modify: `src/lib/seoPolicy.test.ts`

**Interfaces:**
- Produces: static `/http-headers-checker/` with `<ScannerIsland resultView="all-headers" client:load />`
- Metadata: title `HTTP Headers Checker — View Response Headers | HTTP Scanner`, H1 `Free HTTP Headers Checker`, canonical `/http-headers-checker/`

- [ ] **Step 1: Write the RED SEO and discovery contract**

The new contract must read both Astro source files and assert:

```ts
expect(pageSource).toContain(
  "const title = 'HTTP Headers Checker — View Response Headers | HTTP Scanner';"
);
expect(pageSource).toContain('Free HTTP Headers Checker');
expect(pageSource).toContain('canonicalPath="/http-headers-checker/"');
expect(pageSource).toContain(
  '<ScannerIsland resultView="all-headers" client:load />'
);
expect(pageSource.indexOf('<ScannerIsland')).toBeLessThan(
  pageSource.indexOf('<HttpHeadersCheckerContent />')
);
```

Assert the static content contains these headings: `What are HTTP response headers?`, `How to check HTTP headers`, `Response header categories`, `Example HTTP response headers`, `What this checker can and cannot show`, and `HTTP headers checker FAQ`. Assert it contains no `FAQPage`, no `application/ld+json`, and no `client:` directive. Assert SiteHeader, SiteFooter, and homepage SEO content link to `/http-headers-checker/`. Add the new URL to the indexable cases in `seoPolicy.test.ts`.

- [ ] **Step 2: Run contracts and confirm RED**

```bash
npm test -- src/lib/httpHeadersCheckerSeoContract.test.ts src/lib/homepageSeoContract.test.ts src/lib/seoPolicy.test.ts
```

Expected: FAIL because the page and discovery links do not exist.

- [ ] **Step 3: Create the scanner-first static page**

Use the same hero structure and logo treatment as `index.astro`, with this description:

```ts
const description = 'Check all HTTP response headers returned by any public website. Search header names and values, understand common fields, and inspect the result for free.';
```

Hero paragraph:

```text
Enter any public URL to inspect the HTTP response headers observed by our scanner. Search the complete values, group common headers by purpose, and open a neutral result with no account required.
```

Place the all-headers scanner immediately after it.

- [ ] **Step 4: Add the complete static explanation**

In `HttpHeadersCheckerContent.astro`, write visible English copy under the six required headings. It must explicitly explain:

- response headers are metadata sent by a server or intermediary with an HTTP response;
- the flow is enter URL → one server-side request → inspect the stored result;
- categories cover caching, content representation, CORS, cookies/authentication, redirects, linking/performance, security/privacy, and infrastructure;
- the example contains a status line plus `Content-Type`, `Cache-Control`, `Content-Encoding`, `Vary`, and `Server-Timing` values in a `<pre><code>` block;
- the checker follows redirects and shows the final successful response;
- values reflect what the Cloudflare Worker observed, not a guaranteed direct origin response;
- known scanner-transport headers are excluded;
- custom headers can appear under Other even without published explanations;
- this neutral view is not a vulnerability assessment, while the homepage Security Headers Checker provides security analysis;
- FAQs answer whether the tool is free, whether headers are changed, whether cookies are shown, why browser DevTools may differ, and whether custom headers are supported.

Do not link `/headers/` or individual guides until the follow-up plan publishes them.

- [ ] **Step 5: Add discovery links without cannibalizing homepage intent**

Add primary navigation label `HTTP Headers` pointing to `/http-headers-checker/`; keep `Home` and `Reports`. Add footer link label `HTTP Headers Checker`. Add one contextual homepage sentence after the scanner-oriented explanation:

```astro
<p>
  Need the complete response instead of a security score?
  <a href="/http-headers-checker/">View all HTTP response headers</a>.
</p>
```

Do not change the homepage title, H1, or canonical.

- [ ] **Step 6: Run focused tests and build**

```bash
npm test -- src/lib/httpHeadersCheckerSeoContract.test.ts src/lib/homepageSeoContract.test.ts src/lib/seoPolicy.test.ts
npm run build
```

Expected: tests PASS; Astro emits `dist/http-headers-checker/index.html`; the build sitemap contains the checker and still excludes reports.

- [ ] **Step 7: Commit the indexable checker landing**

```bash
git add src/components/astro/HttpHeadersCheckerContent.astro src/pages/http-headers-checker/index.astro src/lib/httpHeadersCheckerSeoContract.test.ts src/components/astro/SiteHeader.astro src/components/astro/SiteFooter.astro src/components/astro/HomepageSeoContent.astro src/lib/homepageSeoContract.test.ts src/lib/seoPolicy.test.ts
git commit -m "feat: publish HTTP headers checker landing"
```

---

### Task 9: Verify the foundation milestone end to end

**Files:**
- Modify only if verification exposes a defect in files owned by Tasks 1–8.

**Interfaces:**
- Verifies: same API request and report record, contextual default views, no report refetch on switching, analytics dimensions, responsive UI, and static SEO output

- [ ] **Step 1: Run the full automated suite**

```bash
npm test
npm run lint
npm run build
```

Expected: all tests PASS, ESLint reports no new errors, and build exits 0.

- [ ] **Step 2: Inspect generated SEO output**

```bash
rg -n "Free HTTP Headers Checker|canonical|all-headers" dist/http-headers-checker/index.html
rg -n "http-headers-checker" dist/sitemap-*.xml
rg -n "report/|reports|share/" dist/sitemap-*.xml
```

Expected: checker metadata/content exists, checker is in the sitemap, and the final command has no matches.

- [ ] **Step 3: Run local browser QA with both servers**

Start `npm run dev:worker` and `npm run dev:web`. Verify desktop and mobile:

1. `/` submits one network request and redirects to Security Analysis.
2. `/http-headers-checker/` submits one network request and redirects to `?view=all-headers` while retaining the delete token only in memory after sanitation.
3. All response headers shows present detected + leaking headers, complete values, search, category filters, unknown header fallback, and transport note.
4. Switching views updates the URL and DOM without a second `/api/report/:hash` request or `/api/scan` request.
5. Browser back/forward restores the selected view.
6. Score/sharing/security recommendations never appear in All response headers and remain unchanged in Security Analysis.
7. Invalid `?view=anything` opens Security Analysis.
8. No horizontal overflow appears at 375px viewport width.

- [ ] **Step 4: Inspect PostHog requests locally**

Confirm `scan submitted`/`scan failed` includes bounded `scanner_mode`, `report viewed` includes bounded `report_view`, and `report view switched` contains only `report_view`. Confirm the delete token does not appear in captured URLs or custom properties.

- [ ] **Step 5: Commit only verification fixes, if any**

If verification required changes, use `git diff --name-only`, confirm every listed path belongs to Tasks 1–8, stage those paths individually, and commit them with message `fix: complete all headers scanner foundation`.

If no files changed, do not create an empty commit.
