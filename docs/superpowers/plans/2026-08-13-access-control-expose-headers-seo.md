# Access-Control-Expose-Headers SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing `Access-Control-Expose-Headers` reference into a security-first guide to exposing bounded cross-origin download metadata and complete its SEO roadmap entry.

**Architecture:** Preserve the existing Astro content collection, dynamic `/headers/[slug]/` route, and shared `HeaderGuidePage.astro` renderer. Add seven intent-specific Markdown sections and two related-header links to the existing guide, protected by a focused Vitest source contract that structurally binds one credentialed `fetch()` example to its raw HTTP request/response; after independent review and full verification, update the SEO roadmap and this plan with factual completion data.

**Tech Stack:** Astro 5 content collections, Markdown, TypeScript, Vitest 4, ESLint, static Astro build.

## Global Constraints

- Preserve `/headers/access-control-expose-headers/` and its canonical behavior.
- Preserve the existing Astro content collection and `HeaderGuidePage.astro` rendering path.
- Keep the current generated title and frontmatter description.
- Do not add JSON-LD, client directives, interactive components, new routes, dependencies, or a CORS rules engine.
- Use only framework-neutral `fetch()` and raw HTTP examples.
- Keep the Fetch response visible to JavaScript distinct from the complete internal network response.
- Preserve the exact seven-name CORS-safelisted response-header set from the current Fetch Standard.
- Describe `*` as a wildcard only when credentials mode is not `include`; with `include`, it is a literal field name.
- Never claim that explicit listing or wildcard exposure makes `Set-Cookie` or `Set-Cookie2` readable.
- Keep cookie processing, `HttpOnly`, credentials mode, `Access-Control-Allow-Credentials`, authorization, value sanitization, request-header permission, and response-header exposure distinct.
- Do not imply that CORS limits direct HTTP clients or other non-browser observers.
- Every production-content change must follow a demonstrated RED → GREEN test cycle.
- Preserve unrelated user changes and the six existing lint warnings; introduce no new warnings.
- Do not deploy without explicit user authorization.

---

### Task 1: Expand the Access-Control-Expose-Headers guide

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`
- Modify: `src/content/headers/access-control-expose-headers.md`

**Interfaces:**
- Consumes: `getOpeningFrontmatter(source: string): string | undefined`, `parseFrontmatterList(frontmatter: string, field: string): string[]`, the Markdown frontmatter contract, `validateHeaderGuideSource(slug: string, source: string): string[]`, and the shared `HeaderGuidePage.astro` renderer.
- Produces: a seven-section security-first guide with five exact related headers and a focused regression contract covering bounded download-example identity, response visibility, the response safelist, wildcard/credentials semantics, forbidden cookie fields, and security boundaries.

- [ ] **Step 1: Add the failing source-contract test**

Insert this test in `src/lib/headerContentContract.test.ts` immediately after the existing `Access-Control-Allow-Headers` SEO test:

```ts
it('keeps Access-Control-Expose-Headers aligned with secure response-metadata exposure intent', () => {
  const source = readFileSync(
    new URL(
      'src/content/headers/access-control-expose-headers.md',
      PROJECT_ROOT
    ),
    'utf8'
  );
  const frontmatter = getOpeningFrontmatter(source);
  const expectedRelatedHeaders = [
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-allow-headers',
    'content-disposition',
    'set-cookie',
  ];
  const headings = [
    '## Expose only the response metadata your frontend needs',
    '## Cross-origin download with Content-Disposition and ETag',
    '## Fix “visible in Network, but response.headers.get() returns null”',
    '## CORS-safelisted response headers',
    '## Wildcard and credentialed requests',
    '## Why Set-Cookie cannot be exposed',
    '## Exposure is not authorization or data sanitization',
  ];

  expect(frontmatter).toBeDefined();
  expect(frontmatter?.match(/^relatedHeaders:/gm)).toHaveLength(1);
  expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual(
    expectedRelatedHeaders
  );

  const bypassSource = source.replace(
    '  - set-cookie\nreferences:',
    '  - set-cookie\n\n  # This comment must not hide another item.\n  - etag\nreferences:'
  );
  const bypassFrontmatter = getOpeningFrontmatter(bypassSource);

  expect(
    parseFrontmatterList(bypassFrontmatter ?? '', 'relatedHeaders')
  ).toEqual([...expectedRelatedHeaders, 'etag']);

  const headingOffsets = headings.map((heading) => source.indexOf(heading));
  expect(headingOffsets.every((offset) => offset >= 0)).toBe(true);
  expect(headingOffsets).toEqual([...headingOffsets].sort((a, b) => a - b));

  const javascriptBlocks = [...source.matchAll(/```js\r?\n([\s\S]*?)\r?\n```/g)];
  const httpBlocks = [...source.matchAll(/```http\r?\n([\s\S]*?)\r?\n```/g)];

  expect(javascriptBlocks).toHaveLength(1);
  expect(httpBlocks).toHaveLength(1);

  const javascriptBlock = javascriptBlocks[0]?.[1] ?? '';
  const httpBlock = httpBlocks[0]?.[1] ?? '';
  const fetchRequest = javascriptBlock.match(
    /fetch\('https:\/\/files\.example(?<path>\/[^']+)', \{\r?\n\s+credentials: '(?<credentials>[^']+)'/
  );
  const httpRequest = httpBlock.match(
    /^GET (?<path>\/\S+) HTTP\/1\.1[\s\S]*?^Origin: https:\/\/app\.example$/m
  );

  expect(fetchRequest?.groups?.path).toBe('/reports/quarterly.pdf');
  expect(fetchRequest?.groups?.credentials).toBe('include');
  expect(httpRequest?.groups?.path).toBe('/reports/quarterly.pdf');
  expect(fetchRequest?.groups?.path).toBe(httpRequest?.groups?.path);
  expect(javascriptBlock).toContain(
    "response.headers.get('Content-Disposition')"
  );
  expect(javascriptBlock).toContain("response.headers.get('ETag')");
  expect(javascriptBlock).toContain("response.headers.get('Set-Cookie')");

  for (const phrase of [
    'HTTP/1.1 200 OK',
    'Access-Control-Allow-Origin: https://app.example',
    'Access-Control-Allow-Credentials: true',
    'Access-Control-Expose-Headers: Content-Disposition, ETag',
    'Content-Type: application/pdf',
    'Content-Disposition: attachment; filename="quarterly-report.pdf"',
    'ETag: "report-v7"',
    'Set-Cookie: download_session=opaque; Secure; HttpOnly; SameSite=None',
    'Vary: Origin',
  ]) {
    expect(httpBlock).toContain(phrase);
  }

  for (const headerName of [
    '`Cache-Control`',
    '`Content-Language`',
    '`Content-Length`',
    '`Content-Type`',
    '`Expires`',
    '`Last-Modified`',
    '`Pragma`',
  ]) {
    expect(source).toContain(headerName);
  }

  for (const phrase of [
    'bounded, case-insensitive list of field names',
    'internal routing or upstream identity',
    'identifiers that enable correlation across users, sessions, or services',
    '`disposition` contains `attachment; filename="quarterly-report.pdf"`',
    '`etag` contains `"report-v7"`',
    '`setCookie` is `null`',
    'network tooling can display the internal network response while Fetch exposes a CORS-filtered response',
    'Both an absent field and a present-but-filtered field can make `Headers.get()` return `null`',
    '`Content-Disposition` and `ETag` are not in this safelist',
    'Do not confuse this response-header-name safelist with the CORS-safelisted request-header rules',
    'credentials mode is not `include`, `Access-Control-Expose-Headers: *` exposes all response header names except forbidden response-header names',
    'credentials mode is `include`, `*` is treated as the literal field name `*`',
    '`Set-Cookie` and legacy `Set-Cookie2` are forbidden response-header names',
    '`HttpOnly` protects a stored cookie from script access through cookie APIs',
    'do not duplicate session tokens or cookie values into an exposed custom response field',
    'does not authorize the request or decide which record the caller may receive',
    'does not redact or validate an exposed value',
    '`Access-Control-Allow-Headers` is the opposite request direction',
    'curl, server-to-server clients, proxies, extensions, or other non-browser tooling',
  ]) {
    expect(source).toContain(phrase);
  }
});
```

This test deliberately treats the published Markdown as the product artifact. The bounded JavaScript and HTTP assertions protect one coherent credentialed download rather than unrelated phrases scattered through the page. The mutated-frontmatter assertion proves that a blank line and YAML comment cannot hide an extra related-header item from the parser.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Expose-Headers"
```

Expected: FAIL because the current related-header list, seven headings, bounded download exchange, exact response safelist, wildcard rules, forbidden cookie boundary, and security distinctions are absent. Confirm the first failure concerns the missing approved contract rather than test syntax, fixture loading, or the parser.

- [ ] **Step 3: Replace the related-header cluster**

Replace the current `relatedHeaders` block in `src/content/headers/access-control-expose-headers.md` with:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-credentials
  - access-control-allow-headers
  - content-disposition
  - set-cookie
```

Do not change the existing `headerName`, description, applicability, syntax, examples, use cases, common mistakes, security consideration, or references.

- [ ] **Step 4: Append the metadata-minimization section**

Append after the existing `Implementation notes` paragraph:

```markdown
## Expose only the response metadata your frontend needs

`Access-Control-Expose-Headers` expands the field names retained in the CORS-filtered response that a permitted frontend can inspect. Exposure should follow a concrete application requirement, not a desire to mirror every field visible on the network.

Use a bounded, case-insensitive list of field names. Do not expose metadata merely because it is present. Review internal routing or upstream identity, server and framework versions, debug details, trace topology, identifiers that enable correlation across users, sessions, or services, account-specific quota state, sensitive filenames, and storage metadata before making any of them readable to cross-origin script.

Exposure is not automatically a vulnerability, but it increases the data surface available to every browser application permitted by the effective CORS policy. Authorize the underlying response and construct each field value safely before deciding whether the frontend should be able to read it.
```

- [ ] **Step 5: Append the bounded download section**

Append immediately after the metadata-minimization section:

````markdown
## Cross-origin download with Content-Disposition and ETag

An application at `https://app.example` can request a protected PDF from `https://files.example` and inspect only the response metadata selected by the server:

```js
const response = await fetch('https://files.example/reports/quarterly.pdf', {
  credentials: 'include',
});

const disposition = response.headers.get('Content-Disposition');
const etag = response.headers.get('ETag');
const setCookie = response.headers.get('Set-Cookie');
```

The matching actual request and successful response can look like:

```http
GET /reports/quarterly.pdf HTTP/1.1
Host: files.example
Origin: https://app.example
Cookie: download_session=opaque

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Disposition, ETag
Content-Type: application/pdf
Content-Disposition: attachment; filename="quarterly-report.pdf"
ETag: "report-v7"
Set-Cookie: download_session=opaque; Secure; HttpOnly; SameSite=None
Vary: Origin
```

After the CORS check succeeds, `disposition` contains `attachment; filename="quarterly-report.pdf"`, `etag` contains `"report-v7"`, and `setCookie` is `null`. `Set-Cookie` remains a forbidden response-header name even though the browser can process an allowed cookie independently of exposing that field to JavaScript.

This request uses credentials mode `include`, so the response uses the explicit origin and `Access-Control-Allow-Credentials: true`. `Vary: Origin` keeps shared-cache variants separate when the allowed origin can change. Those origin, credentials, and cache requirements are separate from the decision to expose `Content-Disposition` and `ETag`. The value `opaque` is a deliberate non-secret placeholder, not a live session identifier.
````

- [ ] **Step 6: Append the browser-debugging section**

Append immediately after the download section:

```markdown
## Fix “visible in Network, but response.headers.get() returns null”

Browser network tooling can display the internal network response while Fetch exposes a CORS-filtered response to application JavaScript. A successful response and readable body do not make every response field visible through the `Headers` API.

First confirm that the overall CORS exchange succeeds and the expected body is available. Inspect the exact final response after redirects, CDN rules, proxies, authentication, and error handling. Confirm that the desired field is present on that response. If its name is not CORS-safelisted, verify that the actual response—not only a preflight or another route or status variant—lists it in `Access-Control-Expose-Headers`.

Header-name matching is ASCII case-insensitive, although consistent spelling makes diagnostics clearer. Both an absent field and a present-but-filtered field can make `Headers.get()` return `null`, so compare the network response with the effective exposure policy instead of assuming one cause from the JavaScript result alone.
```

- [ ] **Step 7: Append the exact response-safelist section**

Append immediately after the debugging section:

```markdown
## CORS-safelisted response headers

After a successful CORS exchange, Fetch makes these response field names readable without repeating them in `Access-Control-Expose-Headers`:

- `Cache-Control`;
- `Content-Language`;
- `Content-Length`;
- `Content-Type`;
- `Expires`;
- `Last-Modified`;
- `Pragma`.

`Content-Disposition` and `ETag` are not in this safelist, so the download response exposes them explicitly. Do not confuse this response-header-name safelist with the CORS-safelisted request-header rules. The request safelist helps determine whether a request field can participate in a simple request under value restrictions; the response safelist determines which response names survive CORS filtering for script access.
```

- [ ] **Step 8: Append the wildcard section**

Append immediately after the response-safelist section:

```markdown
## Wildcard and credentialed requests

When credentials mode is not `include`, `Access-Control-Expose-Headers: *` exposes all response header names except forbidden response-header names. When credentials mode is `include`, `*` is treated as the literal field name `*`, not as a wildcard, so required names such as `Content-Disposition` and `ETag` must be listed explicitly.

Prefer explicit names even for non-credentialed security-sensitive APIs. A bounded list documents the frontend contract and prevents a newly added operational field from becoming script-readable by accident.

The exposure wildcard is separate from `Access-Control-Allow-Origin: *`. They are different response fields with different checks, although credentials mode affects both. Adding `Access-Control-Allow-Credentials: true` does not change the request's credentials mode; client code selects that mode.
```

- [ ] **Step 9: Append the forbidden-cookie section**

Append immediately after the wildcard section:

```markdown
## Why Set-Cookie cannot be exposed

`Set-Cookie` and legacy `Set-Cookie2` are forbidden response-header names under Fetch. A CORS-filtered response excludes them from browser JavaScript access even if `Set-Cookie` is explicitly named in `Access-Control-Expose-Headers`, wildcard semantics apply, the browser accepts the cookie, or the response includes `Access-Control-Allow-Credentials: true`.

`HttpOnly` protects a stored cookie from script access through cookie APIs, while the Fetch response-header prohibition applies to the `Set-Cookie` field name itself. Exposing `Set-Cookie` is not a way to discover whether a cookie was stored. Return required non-secret state through an intentionally designed response body or another explicitly exposed field, and do not duplicate session tokens or cookie values into an exposed custom response field.
```

- [ ] **Step 10: Append the final security-boundary section**

Append immediately after the forbidden-cookie section:

```markdown
## Exposure is not authorization or data sanitization

`Access-Control-Expose-Headers` controls which non-forbidden response field names browser script can inspect after a successful CORS exchange. It does not authorize the request or decide which record the caller may receive, and it does not redact or validate an exposed value. It cannot make a denied CORS response readable.

This response field also does not grant permission to send similarly named request fields. `Access-Control-Allow-Headers` is the opposite request direction: it authorizes proposed request-field names during CORS checks, while `Access-Control-Expose-Headers` governs response-field visibility to script.

CORS filtering does not conceal ordinary response fields from curl, server-to-server clients, proxies, extensions, or other non-browser tooling, and it does not guarantee that an intermediary preserved a field unchanged. Enforce authentication, authorization, tenant isolation, value validation, response minimization, and safe logging independently.
```

- [ ] **Step 11: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Expose-Headers"
npm test -- src/lib/headerContentContract.test.ts -t "validates every CORS guide"
```

Expected: both commands PASS. If either fails, correct the production Markdown while preserving the approved semantics; do not weaken assertions to accommodate missing coverage.

- [ ] **Step 12: Review Task 1 technical boundaries**

Read the complete guide and confirm:

- the JavaScript and raw HTTP blocks describe the same `/reports/quarterly.pdf` credentialed request;
- the response explicitly permits `https://app.example` and credentials before response exposure is discussed;
- `Content-Disposition` and `ETag` are readable while `Set-Cookie` remains `null`;
- all seven safelisted response names appear exactly once in the dedicated list;
- response safelisting is not confused with request safelisting;
- wildcard behavior changes only according to credentials mode;
- cookie processing, `HttpOnly`, and response-field visibility remain distinct;
- exposure is separate from authorization, sanitization, and non-browser visibility;
- no framework-specific, interactive, route, renderer, or dependency change was added.

Run:

```bash
git diff --check
git diff -- src/content/headers/access-control-expose-headers.md src/lib/headerContentContract.test.ts
```

Expected: no whitespace errors and no unrelated changes.

- [ ] **Step 13: Run the complete automated verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected:

- Vitest reports all test files and tests passing;
- ESLint exits with zero errors and only the six baseline warnings;
- Astro check reports zero errors, warnings, and hints;
- Astro emits 51 static pages, including `/headers/access-control-expose-headers/`;
- `git diff --check` prints no errors.

- [ ] **Step 14: Verify the generated and rendered page**

Confirm generated HTML contains the seven sections and bounded examples:

```bash
rg -n 'Expose only the response metadata|Cross-origin download|visible in Network|CORS-safelisted response headers|Wildcard and credentialed requests|Why Set-Cookie cannot be exposed|Exposure is not authorization|Content-Disposition|Set-Cookie' dist/headers/access-control-expose-headers/index.html
```

Expected: all seven headings and the intended download fields are present. Syntax highlighting can split exact code text across HTML spans, so inspect nearby generated context if one raw expression does not match.

Start the local site and inspect `/headers/access-control-expose-headers/` at a normal desktop viewport and at `390 × 844`. Confirm:

- the seven new sections render in order;
- JavaScript and HTTP examples use the established light code-card design;
- HTTP line breaks and quoted values remain readable;
- long code lines scroll inside their cards instead of widening the page;
- the page has no horizontal document overflow;
- all five related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save screenshots outside the repository as `/private/tmp/access-control-expose-headers-desktop.png` and `/private/tmp/access-control-expose-headers-mobile.png`. Reset any viewport override and stop the local server after verification.

- [ ] **Step 15: Commit Task 1**

```bash
git add src/content/headers/access-control-expose-headers.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Access-Control-Expose-Headers guide"
```

Record the exact final implementation commit for Task 2. If review later requires a focused content or test fix, the final implementation SHA becomes the newest commit that changes either scoped file.

---

### Task 2: Review, verify, and complete the SEO roadmap entry

**Files:**
- Modify: `SEO_PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-13-access-control-expose-headers-seo.md`

**Interfaces:**
- Consumes: the verified Task 1 implementation and acceptance criteria in `docs/superpowers/specs/2026-08-13-access-control-expose-headers-seo-design.md`.
- Produces: an independently reviewed implementation, a factual roadmap record, `Vary` as the next Wave 1 task, and a fully checked implementation plan.

- [ ] **Step 1: Request independent technical review of Task 1**

Prepare a review package from the commit immediately before Task 1 through the final Task 1 implementation commit. Give the reviewer the design spec, this task brief, implementation report, complete diff package, verification evidence, and Global Constraints.

Require two explicit verdicts:

1. spec compliance;
2. content and implementation quality.

The reviewer must classify findings as Critical, Important, or Minor and cite exact file/line evidence. Resolve every Critical or Important finding. Any production-content correction must begin with a new failing regression assertion or demonstrated failure of an existing assertion, followed by focused GREEN and affected Task 1 Steps 11–14.

- [ ] **Step 2: Run final whole-branch implementation review**

After task review is clean, request a fresh senior reviewer for the complete implementation diff. The reviewer must check:

- Fetch response filtering and exact safelist accuracy;
- wildcard and credentials-mode distinctions;
- `Set-Cookie`/`Set-Cookie2`, cookie processing, and `HttpOnly` boundaries;
- metadata minimization without unsupported risk claims;
- authorization, sanitization, request-direction, and non-browser boundaries;
- bounded JavaScript/HTTP example identity;
- complete related-header parsing and internal links;
- rendered-code behavior and no-framework/no-deploy scope.

Expected: no unresolved Critical or Important findings. Resolve real findings through the same RED → GREEN discipline and repeat affected verification.

- [ ] **Step 3: Run fresh final verification**

After review changes, run:

```bash
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Expected:

- all tests pass;
- lint has zero errors and only the six baseline warnings;
- Astro check/build succeeds and emits 51 pages;
- `git diff --check` is clean;
- only intended roadmap and plan-document updates remain uncommitted.

- [ ] **Step 4: Capture the exact final implementation commit**

Run:

```bash
git log --format='%h %s' -- src/content/headers/access-control-expose-headers.md src/lib/headerContentContract.test.ts
```

Expected: the first row identifies the final commit that changed the guide or its contract. Store that concrete short SHA for the roadmap update; do not assume it is the initial feature commit if review created a later focused fix.

- [ ] **Step 5: Update the Wave 1 status in SEO_PLAN.md**

In `Wave 1 — CORS authority`, change only the `Access-Control-Expose-Headers` status from `QUEUED` to `DONE`. Keep order, priority, and strategic role unchanged.

- [ ] **Step 6: Add the completed-task record**

Append one row to `## 11. Completed task log` with these cells:

- Task: `Access-Control-Expose-Headers SEO expansion`;
- Status: `` `DONE` ``;
- Commit: the concrete short SHA from Step 4;
- Observation state: `Awaiting deployment and URL-filtered GSC baseline.`

Do not claim a deployment date, production verification, or GSC submission before those actions occur.

- [ ] **Step 7: Advance the next task**

Replace the body of `## 12. Next task` with:

```markdown
No newer GSC export is available after the 2026-08-07 baseline. Execute the next eligible roadmap task for:

- `Vary`.

The task should cover dynamic `Access-Control-Allow-Origin`, shared-cache variant separation, `Vary: Origin`, wildcard-origin cases, cache-key debugging, and the distinction between HTTP caching and the CORS-preflight cache.
```

Do not promote the future CORS Journey here. It remains a separate consolidation feature to design after this reference expansion; `Vary` stays next in the ordered Wave 1 roadmap.

- [ ] **Step 8: Mark this implementation plan complete**

Change every completed task checkbox in this plan from `- [ ]` to `- [x]` only after its action and verification have succeeded.

- [ ] **Step 9: Verify the documentation diff**

Run:

```bash
git diff --check
git diff -- SEO_PLAN.md docs/superpowers/plans/2026-08-13-access-control-expose-headers-seo.md
```

Expected: only the factual status, completed-task row, next-task text, and evidence-backed checkbox changes described above.

- [ ] **Step 10: Commit the roadmap completion**

```bash
git add SEO_PLAN.md docs/superpowers/plans/2026-08-13-access-control-expose-headers-seo.md
git commit -m "docs: complete Access-Control-Expose-Headers SEO task"
```

- [ ] **Step 11: Confirm clean handoff state**

Run:

```bash
git status --short
git log -2 --format='%h %s'
```

Expected: clean worktree; the two newest commits are the roadmap-completion commit and the final Task 1 implementation commit. Do not deploy. Present merge/push/keep-branch choices according to the branch-finishing workflow.

---

## Post-merge deployment follow-up

This section is not part of implementation because deployment requires separate explicit authorization.

After an authorized production deploy:

1. verify HTTP 200 for both `https://httpscanner.com/headers/access-control-expose-headers/` and the Workers URL;
2. verify the seven new headings and both examples in production HTML;
3. inspect production rendering at desktop and mobile widths;
4. verify all five related-header links and the HTTP Headers Checker CTA;
5. record the Cloudflare Version ID and deployment date;
6. update the completed-task observation state without claiming GSC work that has not happened;
7. inspect or submit the URL in GSC and record the observation start date when completed.
