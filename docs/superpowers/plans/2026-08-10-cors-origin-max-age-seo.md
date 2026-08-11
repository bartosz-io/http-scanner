# CORS Origin and Preflight Cache SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing `Access-Control-Allow-Origin` and `Access-Control-Max-Age` reference pages around their distinct GSC-backed search intents while strengthening the CORS internal-link cluster.

**Architecture:** Preserve the current Astro content-collection architecture and dynamic `/headers/[slug]/` route. Add intent-specific Markdown sections and related-header links to the two existing sources, protected by focused source-contract tests in Vitest. Complete each header as an independent TDD task and update the SEO roadmap only after both tasks and final verification pass.

**Tech Stack:** Astro 5 content collections, Markdown, TypeScript, Vitest 4, ESLint, static Astro build.

## Global Constraints

- Preserve `/headers/access-control-allow-origin/` and `/headers/access-control-max-age/` and their canonical URLs.
- Preserve the existing Astro content collection and `HeaderGuidePage.astro` rendering path.
- Do not add JSON-LD, client directives, interactive components, or new routes.
- Keep the current generated titles and frontmatter descriptions.
- Do not claim that CORS authenticates requests, authorizes users, blocks requests at the network boundary, or provides CSRF protection.
- Do not present one universal `Access-Control-Max-Age` value as correct for every application.
- Prefer the Fetch Standard over secondary sources when technical wording conflicts.
- Every production-content change must follow a demonstrated RED → GREEN test cycle.
- Preserve unrelated user changes and existing lint warnings; introduce no new warnings.

---

### Task 1: Expand Access-Control-Allow-Origin

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`
- Modify: `src/content/headers/access-control-allow-origin.md`

**Interfaces:**
- Consumes: `validateHeaderGuideSource(slug: string, source: string): string[]` and the existing Markdown frontmatter contract.
- Produces: an expanded `access-control-allow-origin.md` guide with four related headers and a focused source-contract regression test.

- [ ] **Step 1: Add the failing source-contract test**

Insert this test inside `describe('HTTP header guide source contract', ...)`, after the existing Set-Cookie SEO test:

```ts
it('keeps Access-Control-Allow-Origin aligned with CORS troubleshooting intent', () => {
  const source = readFileSync(
    new URL(
      'src/content/headers/access-control-allow-origin.md',
      PROJECT_ROOT
    ),
    'utf8'
  );

  for (const phrase of [
    '## Access-Control-Allow-Origin values',
    '## Common CORS origin errors',
    '## Credentials, dynamic origins, and caching',
    'Access-Control-Allow-Origin: *',
    'Access-Control-Allow-Credentials: true',
    'Vary: Origin',
    'serialized `null` origin',
    'comma-separated list',
    'request can reach the server even when browser script cannot read the response',
    'exact allowlist',
  ]) {
    expect(source).toContain(phrase);
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Origin"
```

Expected: FAIL because the three new headings and required troubleshooting phrases are absent from the current guide.

- [ ] **Step 3: Add the related-header link**

Extend the existing frontmatter block to this exact set without removing current neighbors:

```yaml
relatedHeaders:
  - access-control-allow-credentials
  - access-control-allow-methods
  - access-control-max-age
  - vary
```

- [ ] **Step 4: Add the intent-specific Markdown sections**

Append the following content after the existing `Implementation notes` paragraph:

````markdown
## Access-Control-Allow-Origin values

`Access-Control-Allow-Origin` accepts one serialized origin, the wildcard `*`, or the serialized `null` origin. An explicit origin contains a scheme, host, and non-default port when one is present. The field is not a comma-separated list and does not support a standard subdomain pattern such as `https://*.example.com`. A server that supports several trusted callers must validate the request `Origin` against an exact allowlist and return the one permitted origin for that response.

Use the wildcard only when the response is intentionally public and browser code does not need credentials:

```http
Access-Control-Allow-Origin: *
```

Avoid using `Access-Control-Allow-Origin: null` as a general trust rule. Sandboxed documents and resources using some non-hierarchical schemes can have a serialized `null` origin, so an attacker may be able to create a document that matches it.

## Common CORS origin errors

The browser error “No 'Access-Control-Allow-Origin' header is present” means the response did not grant the requesting page access to read it. Check the final response returned for the failing route, including redirects and errors, and compare the page's complete origin—scheme, host, and port—with the server allowlist.

CORS governs browser response exposure. A simple cross-origin request can reach the server even when browser script cannot read the response, and the server may already have processed a state-changing operation. Authentication, authorization, input validation, and CSRF protection must therefore run independently of the CORS result.

## Credentials, dynamic origins, and caching

A credentialed response cannot be shared with browser code through the wildcard. Return a validated explicit origin and opt into credentials deliberately:

```http
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Vary: Origin
```

Do not copy the incoming `Origin` into the response before exact allowlist validation. When the selected `Access-Control-Allow-Origin` value changes with the request origin, include `Vary: Origin` and configure shared caches or CDNs with an equivalent cache-key dimension. CORS permission still does not prove that the caller is authenticated or allowed to access the requested object.
````

- [ ] **Step 5: Run the focused and category contract tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Origin"
npm test -- src/lib/headerContentContract.test.ts -t "validates every CORS guide"
```

Expected: both commands PASS.

- [ ] **Step 6: Review Task 1 technical boundaries**

Confirm from the rendered source and test that:

- wildcard access is limited to non-credentialed response sharing;
- explicit origins require exact allowlist validation;
- `null`, comma-separated lists, and wildcard subdomains are not recommended as origin-selection mechanisms;
- browser response exposure is distinguished from request delivery and server authorization;
- `Vary: Origin` is included for dynamic origin selection.

Run:

```bash
git diff --check
git diff -- src/content/headers/access-control-allow-origin.md src/lib/headerContentContract.test.ts
```

Expected: no whitespace errors and no unrelated changes.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/content/headers/access-control-allow-origin.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Access-Control-Allow-Origin guide"
```

---

### Task 2: Expand Access-Control-Max-Age

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`
- Modify: `src/content/headers/access-control-max-age.md`

**Interfaces:**
- Consumes: the source-contract test structure established in Task 1 and the existing Markdown frontmatter contract.
- Produces: an expanded `access-control-max-age.md` guide with four related headers and a focused source-contract regression test.

- [ ] **Step 1: Add the failing source-contract test**

Insert this test immediately after the Access-Control-Allow-Origin SEO test:

```ts
it('keeps Access-Control-Max-Age aligned with preflight-cache intent', () => {
  const source = readFileSync(
    new URL(
      'src/content/headers/access-control-max-age.md',
      PROJECT_ROOT
    ),
    'utf8'
  );

  for (const phrase of [
    '## How the CORS preflight cache works',
    '## Choosing an Access-Control-Max-Age value',
    '## Access-Control-Max-Age vs Cache-Control',
    'OPTIONS /api/items HTTP/1.1',
    'Access-Control-Max-Age: 600',
    'default is five seconds',
    'browser-imposed cap',
    'separate from the general HTTP cache',
    'delay browser adoption of a tightened preflight policy',
    'authorization on every actual request',
    'Cache-Control: max-age',
  ]) {
    expect(source).toContain(phrase);
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Max-Age"
```

Expected: FAIL because the new headings, complete preflight exchange, default behavior, and cache distinction are absent.

- [ ] **Step 3: Add the related-header link**

Extend the existing frontmatter block to this exact set:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-methods
  - access-control-allow-headers
  - cache-control
```

- [ ] **Step 4: Add the preflight-cache Markdown sections**

Append the following content after the existing `Implementation notes` paragraph:

````markdown
## How the CORS preflight cache works

A browser sends a CORS preflight as an `OPTIONS` request before an actual request that is not CORS-safelisted. The preflight identifies the requesting origin, proposed method, and any non-safelisted request headers. A successful response can grant those dimensions for later matching requests:

```http
OPTIONS /api/items HTTP/1.1
Origin: https://app.example
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 600
Vary: Origin
```

Here `600` represents ten minutes; it is an example rather than a universal recommendation. The preflight-cache entry depends on relevant dimensions such as origin, URL, credentials mode, method, and request-header permission. A different route or permission can therefore require another preflight.

## Choosing an Access-Control-Max-Age value

When the field is absent, the current documented default is five seconds. Browsers may enforce a browser-imposed cap or otherwise constrain the lifetime, so a very large server value does not guarantee equal behavior everywhere.

Use a shorter lifetime while introducing or changing a CORS policy so corrections propagate quickly. A longer lifetime can reduce repeated `OPTIONS` traffic for stable permissions, but it can delay browser adoption of a tightened preflight policy. Regardless of cached permission, the server must perform authentication and authorization on every actual request. Urgent revocation belongs in normal request authorization rather than waiting for browser cache entries to expire.

## Access-Control-Max-Age vs Cache-Control

The CORS preflight cache is separate from the general HTTP cache. `Access-Control-Max-Age` controls reuse of a successful browser preflight permission; it does not cache an API response body or make that body fresh. `Cache-Control: max-age` controls HTTP response freshness and does not grant CORS methods or request headers.

Changing or purging CDN caching does not guarantee that a user's preflight entry disappears. Test policy changes in real browsers and monitor `OPTIONS` volume instead of treating the two cache mechanisms as interchangeable.
````

- [ ] **Step 5: Run the focused and category contract tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Max-Age"
npm test -- src/lib/headerContentContract.test.ts -t "validates every CORS guide"
```

Expected: both commands PASS.

- [ ] **Step 6: Review Task 2 technical boundaries**

Confirm that:

- `600` is described as an example, not a universal recommendation;
- the five-second default and browser caps are presented as current client behavior;
- preflight permission and HTTP response freshness remain distinct;
- cached preflight permission never bypasses authorization;
- urgent policy revocation is enforced by the server.

Run:

```bash
git diff --check
git diff -- src/content/headers/access-control-max-age.md src/lib/headerContentContract.test.ts
```

Expected: no whitespace errors and no unrelated changes.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/content/headers/access-control-max-age.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Access-Control-Max-Age guide"
```

---

### Task 3: Integrate, review, and update the SEO roadmap

**Files:**
- Modify: `SEO_PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-10-cors-origin-max-age-seo.md`

**Interfaces:**
- Consumes: the two verified guide commits from Tasks 1 and 2.
- Produces: complete repository verification, reviewed changes, updated roadmap statuses, exact implementation commit references, and a checked implementation plan.

- [ ] **Step 1: Run the complete verification suite**

Run all commands from a clean command prompt after Task 2:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected:

- Vitest reports all test files and tests passing;
- ESLint exits successfully with no new warnings introduced by this task;
- Astro check reports zero errors, warnings, and hints;
- Astro builds both `/headers/access-control-allow-origin/` and `/headers/access-control-max-age/`;
- `git diff --check` prints no errors.

- [ ] **Step 2: Request technical code review**

Use `superpowers:requesting-code-review` with:

- description: expanded two GSC-backed CORS header guides and their source contracts;
- requirements: `docs/superpowers/specs/2026-08-10-cors-origin-max-age-seo-design.md`;
- base SHA: the commit immediately before Task 1;
- head SHA: the Task 2 commit.

Resolve every critical or important finding. If review changes production content, rerun the complete verification suite from Step 1.

- [ ] **Step 3: Capture exact implementation commits**

Run:

```bash
git log -2 --format='%h %s'
```

Expected: the two most recent feature commits are the exact Task 2 and Task 1 commits. Record only the concrete short SHAs returned by the command.

- [ ] **Step 4: Update SEO_PLAN.md**

Apply these factual changes using the exact SHAs returned in Step 3:

- change both active-queue statuses from `NEXT` to `DONE`;
- keep their P0 priorities, GSC baselines, and design links unchanged;
- add one completed-task-log row named `Access-Control-Allow-Origin and Access-Control-Max-Age SEO expansion`;
- put both exact implementation SHAs in the commit cell;
- set observation state to `Awaiting deployment and URL-filtered GSC baseline.`;
- replace section 12 with the next eligible task from the roadmap only after checking whether a newer GSC export exists; otherwise select `Access-Control-Allow-Credentials`.

- [ ] **Step 5: Verify roadmap documentation**

Run:

```bash
git diff --check
rg -n 'Access-Control-Allow-Origin|Access-Control-Max-Age|Awaiting deployment' SEO_PLAN.md
```

Expected:

- no whitespace errors;
- both roadmap rows show `DONE`;
- the completed log contains both exact implementation SHAs.

- [ ] **Step 6: Mark succeeded plan steps complete**

Change each checkbox for Tasks 1–2 and Task 3 Steps 1–6 from `[ ]` to `[x]` only after its action has succeeded. Leave a failed or externally blocked step unchecked and document it in the final handoff.

Run:

```bash
rg -n '\[ \]' docs/superpowers/plans/2026-08-10-cors-origin-max-age-seo.md
```

Expected: only the final roadmap commit step remains unchecked.

- [ ] **Step 7: Commit roadmap completion**

Immediately before staging, mark this Step 7 checkbox complete so the commit records the final plan state. Then run:

```bash
git add SEO_PLAN.md docs/superpowers/plans/2026-08-10-cors-origin-max-age-seo.md
git commit -m "docs: complete CORS header SEO task"
```

### Deployment handoff

Do not run a production deployment unless the user explicitly authorizes it. In the final handoff, provide the two URLs to deploy and inspect in GSC:

```text
https://httpscanner.com/headers/access-control-allow-origin/
https://httpscanner.com/headers/access-control-max-age/
```

After deployment, capture URL-filtered rolling 28-day GSC baselines and begin the 14-day and 21-day observation windows defined in the spec.

## Plan completion criteria

This implementation plan is complete when Tasks 1–3 are checked, all verification evidence is current, code review has no unresolved critical or important findings, the roadmap records exact commits, and the deployment/GSC follow-up is clearly handed off without an unauthorized production release.
