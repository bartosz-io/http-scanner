# Access-Control-Allow-Headers SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing `Access-Control-Allow-Headers` reference into a framework-neutral CORS request-header preflight troubleshooting guide and complete its roadmap entry.

**Architecture:** Preserve the existing Astro content collection and dynamic `/headers/[slug]/` route. Add four intent-specific Markdown sections and two related-header links to the existing source, protected by a focused Vitest source contract that reuses the complete-frontmatter-list parser; after independent review and full verification, update the SEO roadmap and this plan with factual completion data.

**Tech Stack:** Astro 5 content collections, Markdown, TypeScript, Vitest 4, ESLint, static Astro build.

## Global Constraints

- Preserve `/headers/access-control-allow-headers/` and its canonical behavior.
- Preserve the existing Astro content collection and `HeaderGuidePage.astro` rendering path.
- Keep the current generated title and frontmatter description.
- Do not add JSON-LD, client directives, interactive components, new routes, dependencies, or framework-specific configuration snippets.
- Use only framework-neutral `fetch()` and raw HTTP examples.
- Do not tell developers to set `Origin`, `Access-Control-Request-Method`, or `Access-Control-Request-Headers` manually in browser JavaScript.
- Distinguish the preflight `OPTIONS` transport method from the actual `POST`.
- Do not equate a CORS-safelisted request-header name with an unrestricted value.
- Describe wildcard behavior with both the credentials-mode limitation and the special `Authorization` rule.
- State that an application-supplied `Authorization` field does not by itself set Fetch credentials mode to `include`.
- Keep request-name permission, value validation, proxy trust, authentication, authorization, response exposure, and non-browser enforcement distinct.
- Every production-content change must follow a demonstrated RED → GREEN test cycle.
- Preserve unrelated user changes and the six existing lint warnings; introduce no new warnings.
- Do not deploy without explicit user authorization.

---

### Task 1: Expand the Access-Control-Allow-Headers guide

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`
- Modify: `src/content/headers/access-control-allow-headers.md`

**Interfaces:**
- Consumes: `getOpeningFrontmatter(source: string): string | undefined`, `parseFrontmatterList(frontmatter: string, field: string): string[]`, the existing Markdown frontmatter contract, `validateHeaderGuideSource(slug: string, source: string): string[]`, and the shared `HeaderGuidePage.astro` renderer.
- Produces: an expanded framework-neutral guide with five exact related headers and a focused regression contract covering request-header preflight behavior, browser errors, wildcard/credentials/Authorization semantics, safelisted-value restrictions, response exposure, and security boundaries.

- [x] **Step 1: Add the failing source-contract test**

Insert this test in `src/lib/headerContentContract.test.ts` immediately after the existing `Access-Control-Allow-Methods` SEO test:

```ts
it('keeps Access-Control-Allow-Headers aligned with CORS request-header troubleshooting intent', () => {
  const source = readFileSync(
    new URL(
      'src/content/headers/access-control-allow-headers.md',
      PROJECT_ROOT
    ),
    'utf8'
  );
  const frontmatter = getOpeningFrontmatter(source);
  const expectedRelatedHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-credentials',
    'access-control-expose-headers',
    'access-control-max-age',
  ];
  const headings = [
    '## CORS preflight request-header exchange',
    '## Fix “Request header field … is not allowed”',
    '## Wildcard, Authorization, and safelisted value restrictions',
    '## Allowed names vs trusted values and response exposure',
  ];

  expect(frontmatter).toBeDefined();
  expect(frontmatter?.match(/^relatedHeaders:/gm)).toHaveLength(1);
  expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual(
    expectedRelatedHeaders
  );

  const bypassSource = source.replace(
    '  - access-control-max-age\nreferences:',
    '  - access-control-max-age\n\n  # This comment must not hide another item.\n  - set-cookie\nreferences:'
  );
  const bypassFrontmatter = getOpeningFrontmatter(bypassSource);

  expect(
    parseFrontmatterList(bypassFrontmatter ?? '', 'relatedHeaders')
  ).toEqual([...expectedRelatedHeaders, 'set-cookie']);

  const headingOffsets = headings.map((heading) => source.indexOf(heading));
  expect(headingOffsets.every((offset) => offset >= 0)).toBe(true);
  expect(headingOffsets).toEqual([...headingOffsets].sort((a, b) => a - b));

  for (const phrase of [
    "Authorization: 'Bearer token'",
    "'Content-Type': 'application/json'",
    'OPTIONS /items HTTP/1.1',
    'Access-Control-Request-Method: POST',
    'Access-Control-Request-Headers: authorization, content-type',
    'Access-Control-Allow-Origin: https://app.example',
    'Access-Control-Allow-Methods: POST',
    'Access-Control-Allow-Headers: Authorization, Content-Type',
    'Vary: Origin',
    'browser—not application JavaScript—creates `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers`',
    'announces request-field names, not the future field values',
    'compare every name in `Access-Control-Request-Headers` with the names authorized by `Access-Control-Allow-Headers`',
    'Setting the right CORS fields only on the later actual response does not repair the preflight',
    'client mistakenly sends response fields such as `Access-Control-Allow-Origin` or `Access-Control-Allow-Headers` as request headers',
    'Header-name matching is ASCII case-insensitive',
    'bounded case-insensitive allowlist',
    '`Access-Control-Max-Age` because the browser may reuse an earlier preflight result',
    '`Access-Control-Allow-Headers: *` has wildcard semantics for requests without credentials',
    'credentials mode is `include`, `*` is only the literal field name `*`',
    '`Authorization` is a non-wildcard request-header name and must always be listed explicitly',
    'does not by itself set Fetch credentials mode to `include`',
    '`Content-Type` is safelisted only when its media type is `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`',
    '`Content-Type: application/json` therefore participates in this preflight',
    'Listing a safelisted field name can authorize it beyond the additional safelist restrictions',
    'does not validate a bearer token, media type, API key, tenant identifier, signature, tracing value, or custom metadata',
    'forwarding, internal identity, or routing fields',
    '`Access-Control-Expose-Headers` controls access to non-safelisted response fields',
    'A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not block direct HTTP clients.',
    'Authentication, authorization, validation, rate limiting, and CSRF defenses remain server responsibilities.',
  ]) {
    expect(source).toContain(phrase);
  }
});
```

The production change that makes this test pass is the complete four-section guide, exact five-item related-header field, coherent client/preflight exchange, and all approved technical and security distinctions. The heading-offset assertion protects section order. The mutated-source assertion proves that a blank line and YAML comment cannot hide an extra related-header item from the parser.

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Headers"
```

Expected: FAIL because the related-header list, new headings, exchange, wildcard rules, error-resolution content, and security boundaries are absent. Confirm the first failure is an assertion about the missing approved contract rather than a syntax, fixture, or parser error.

- [x] **Step 3: Replace the related-header cluster**

Replace the current `relatedHeaders` block in `src/content/headers/access-control-allow-headers.md` with:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-methods
  - access-control-allow-credentials
  - access-control-expose-headers
  - access-control-max-age
```

Do not change the current `headerName`, description, applicability, syntax, examples, use cases, mistakes, security consideration, or references in frontmatter.

- [x] **Step 4: Append the request-header exchange section**

Append this section after the existing `Implementation notes` paragraph:

````markdown
## CORS preflight request-header exchange

Browser code defines the intended actual request. The browser—not application JavaScript—creates `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers` when that request requires a CORS preflight:

```js
fetch('https://api.example/items', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'new item' }),
});
```

For this request, a preflight and successful response can look like:

```http
OPTIONS /items HTTP/1.1
Host: api.example
Origin: https://app.example
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Authorization, Content-Type
Vary: Origin
```

`OPTIONS` is the preflight transport method; `POST` is the intended actual method. `Access-Control-Request-Headers` announces request-field names, not the future field values. The browser sends the actual request only after the origin, method, and requested names pass their respective CORS checks. Do not try to set the browser-controlled preflight fields manually from `fetch()`.

After a successful preflight, the actual route must still authenticate the bearer token, authorize the operation, parse and validate the JSON body, enforce body-size limits, and apply its other server policies. A successful CORS check is permission to proceed from browser code, not proof that the operation will succeed.
````

- [x] **Step 5: Append the browser-error troubleshooting section**

Append this section immediately after `CORS preflight request-header exchange`:

````markdown
## Fix “Request header field … is not allowed”

When the console reports that a request header field is not allowed by `Access-Control-Allow-Headers`, inspect the browser-generated `OPTIONS` request and the exact public response. Compare every name in `Access-Control-Request-Headers` with the names authorized by `Access-Control-Allow-Headers`. Every name announced there—such as `authorization`, `content-type`, `x-api-key`, or another custom field—must be authorized under the Fetch rules; `content-type` can appear because its proposed value is not safelisted.

The check fails when a required name is absent from the response policy or another CORS dimension fails. A proxy, redirect, authentication layer, CDN rule, or generic error handler may answer `OPTIONS` before the intended CORS middleware runs. Setting the right CORS fields only on the later actual response does not repair the preflight.

Another common mistake is that the client mistakenly sends response fields such as `Access-Control-Allow-Origin` or `Access-Control-Allow-Headers` as request headers. The browser then announces those names in its preflight, creating an error that cannot grant the client authority to choose the server's CORS policy. Remove those response fields from client code.

Header-name matching is ASCII case-insensitive, so compare names rather than presentation casing. If the server reflects requested names, validate every one against a bounded case-insensitive allowlist first; arbitrary reflection is not an authorization policy. If a corrected policy appears stale, inspect `Access-Control-Max-Age` because the browser may reuse an earlier preflight result.
````

- [x] **Step 6: Append the wildcard and safelist section**

Append this section immediately after `Fix “Request header field … is not allowed”`:

````markdown
## Wildcard, Authorization, and safelisted value restrictions

`Access-Control-Allow-Headers: *` has wildcard semantics for requests without credentials. When credentials mode is `include`, `*` is only the literal field name `*`, so required names must be listed explicitly. `Authorization` is a non-wildcard request-header name and must always be listed explicitly, including for requests without credentials.

An application-supplied `Authorization` field does not by itself set Fetch credentials mode to `include`; the field and credentials mode are separate concepts even though both matter when evaluating wildcard behavior.

CORS-safelisted request-header names are ordinarily allowed without being listed, but their values must satisfy additional Fetch restrictions. `Content-Type` is safelisted only when its media type is `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain` and its value satisfies the applicable byte restrictions. `Content-Type: application/json` therefore participates in this preflight.

Listing a safelisted field name can authorize it beyond the additional safelist restrictions, but it does not make the value valid for the application. Prefer explicit names for credentialed or security-sensitive APIs, and do not broaden the policy merely to silence a browser error.
````

- [x] **Step 7: Append the trust and response-exposure section**

Append this section immediately after `Wildcard, Authorization, and safelisted value restrictions`:

````markdown
## Allowed names vs trusted values and response exposure

`Access-Control-Allow-Headers` authorizes request-field names for a browser CORS check. It does not validate a bearer token, media type, API key, tenant identifier, signature, tracing value, or custom metadata. Validate each actual value at the application boundary and reject malformed or unauthorized requests normally.

Do not allow client-controlled forwarding, internal identity, or routing fields merely because trusted proxy middleware normally supplies them. Reject or overwrite those values at the correct trust boundary; a CORS allowlist does not turn an untrusted request field into trusted infrastructure metadata.

This field also does not expose response metadata to JavaScript. `Access-Control-Expose-Headers` controls access to non-safelisted response fields, which is the opposite direction from request-header permission.

A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not block direct HTTP clients. Simple requests can also reach the server under their own rules. Authentication, authorization, validation, rate limiting, and CSRF defenses remain server responsibilities.
````

- [x] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Headers"
npm test -- src/lib/headerContentContract.test.ts -t "validates every CORS guide"
```

Expected: both commands PASS. If either fails, correct the production Markdown while preserving the approved semantics; do not weaken the assertions to accommodate missing coverage.

- [x] **Step 9: Review Task 1 technical boundaries**

Read the complete guide and confirm:

- `fetch()` and the HTTP exchange describe the same `POST /items` operation;
- JavaScript does not set browser-controlled preflight fields;
- `OPTIONS` is distinguished from the actual `POST`;
- the announced request-field names are not confused with their values;
- wildcard behavior is accurate without and with credentials;
- `Authorization` is explicitly required and is not conflated with credentials mode;
- safelisted names remain subject to value restrictions;
- `Content-Type: application/json` is correctly treated as requiring preflight authorization because its value is not safelisted;
- field-name permission is distinct from value validation, proxy trust, and response exposure;
- failed-preflight and non-browser boundaries are explicit;
- no framework-specific or interactive implementation was added.

Run:

```bash
git diff --check
git diff -- src/content/headers/access-control-allow-headers.md src/lib/headerContentContract.test.ts
```

Expected: no whitespace errors and no unrelated changes.

- [x] **Step 10: Run the complete automated verification**

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
- Astro emits 51 static pages, including `/headers/access-control-allow-headers/`;
- `git diff --check` prints no errors.

- [x] **Step 11: Verify the generated and rendered page**

Confirm generated HTML contains the new sections and exchange:

```bash
rg -n 'CORS preflight request-header exchange|Request header field|Wildcard, Authorization, and safelisted value restrictions|Allowed names vs trusted values and response exposure|Access-Control-Request-Headers|Access-Control-Allow-Headers' dist/headers/access-control-allow-headers/index.html
```

Expected: all four headings and both request/response header fields are present. Syntax highlighting can split field text across HTML spans, so inspect nearby generated context if one exact raw-text expression does not match.

Start the local site and inspect `/headers/access-control-allow-headers/` at a normal desktop viewport and at `390 × 844`. Confirm:

- the four new sections render in order;
- JavaScript and HTTP examples use the established light code-card design;
- the HTTP exchange retains line breaks and readable padding;
- long code lines scroll inside their cards instead of widening the page;
- the page has no horizontal document overflow;
- all five related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save QA screenshots outside the repository under `/private/tmp/access-control-allow-headers-desktop.png` and `/private/tmp/access-control-allow-headers-mobile.png`. Reset any viewport override and stop the local server after verification.

- [x] **Step 12: Commit Task 1**

```bash
git add src/content/headers/access-control-allow-headers.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Access-Control-Allow-Headers guide"
```

Record the exact final implementation commit for Task 2. If review later requires a focused content/test fix, the final implementation SHA becomes the newest commit that changes either scoped file.

---

### Task 2: Review, verify, and complete the SEO roadmap entry

**Files:**
- Modify: `SEO_PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-12-access-control-allow-headers-seo.md`

**Interfaces:**
- Consumes: the verified Task 1 implementation and the acceptance criteria in `docs/superpowers/specs/2026-08-12-access-control-allow-headers-seo-design.md`.
- Produces: an independently reviewed implementation, a factual roadmap record, `Access-Control-Expose-Headers` as the next Wave 1 task, and a fully checked implementation plan.

- [x] **Step 1: Request independent technical review of Task 1**

Prepare a review package from the commit immediately before Task 1 through the final Task 1 implementation commit. Give the reviewer the design spec, this task brief, implementation report, full diff package, verification evidence, and Global Constraints.

Require two explicit verdicts:

1. spec compliance;
2. content and implementation quality.

The reviewer must classify findings as Critical, Important, or Minor and cite exact file/line evidence. Resolve every Critical or Important finding. Any production-content correction must begin with a new failing regression assertion or demonstrated failure of an existing assertion, followed by focused GREEN and affected Task 1 Steps 8–11.

- [x] **Step 2: Run final whole-branch implementation review**

After task review is clean, request a fresh senior reviewer for the complete implementation diff. The reviewer must check Fetch accuracy, wildcard/credentials/Authorization distinctions, safelisted-value semantics, unsafe trust ambiguity, source-contract quality, exact related-header parsing, internal linking, rendered-code behavior, and no-framework/no-deploy compliance.

Expected: no unresolved Critical or Important findings. Resolve real findings through the same RED → GREEN discipline and repeat affected verification.

- [x] **Step 3: Run fresh final verification**

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

- [x] **Step 4: Capture the exact final implementation commit**

Run:

```bash
git log --format='%h %s' -- src/content/headers/access-control-allow-headers.md src/lib/headerContentContract.test.ts
```

Expected: the first row identifies the final commit that changed the guide or its contract. Store that concrete short SHA for the roadmap update; do not assume it is the initial feature commit if review created a later focused fix.

- [x] **Step 5: Update the Wave 1 status in SEO_PLAN.md**

In `Wave 1 — CORS authority`, change only the `Access-Control-Allow-Headers` status from `QUEUED` to `DONE`. Keep order, priority, and strategic role unchanged.

- [x] **Step 6: Add the completed-task record**

Append one row to `## 11. Completed task log` with these cells:

- Task: `Access-Control-Allow-Headers SEO expansion`;
- Status: `` `DONE` ``;
- Commit: the concrete short SHA from Step 4;
- Observation state: `Awaiting deployment and URL-filtered GSC baseline.`

Do not claim a deployment date, production verification, or GSC submission before those actions occur.

- [x] **Step 7: Advance the next task**

Replace the body of `## 12. Next task` with:

```markdown
No newer GSC export is available after the 2026-08-07 baseline. Execute the next eligible roadmap task for:

- `Access-Control-Expose-Headers`.

The task should cover response-header readability, the CORS-safelisted response-header set, wildcard and credentials behavior, the `Set-Cookie` exclusion, and browser debugging.
```

- [x] **Step 8: Mark this implementation plan complete**

Change every completed task checkbox in this plan from `- [ ]` to `- [x]` only after its action and verification have succeeded.

- [x] **Step 9: Verify the documentation diff**

Run:

```bash
git diff --check
git diff -- SEO_PLAN.md docs/superpowers/plans/2026-08-12-access-control-allow-headers-seo.md
```

Expected: only the factual status, completed-task row, next-task text, and evidence-backed checkbox changes described above.

- [x] **Step 10: Commit the roadmap completion**

```bash
git add SEO_PLAN.md docs/superpowers/plans/2026-08-12-access-control-allow-headers-seo.md
git commit -m "docs: complete Access-Control-Allow-Headers SEO task"
```

- [x] **Step 11: Confirm clean handoff state**

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

1. verify HTTP 200 for both `https://httpscanner.com/headers/access-control-allow-headers/` and the Workers URL;
2. verify the four new headings and both examples in production HTML;
3. inspect production rendering at desktop and mobile widths;
4. record the Cloudflare Version ID and deployment date;
5. update the completed-task observation state without claiming GSC work that has not happened;
6. inspect or submit the URL in GSC and record the observation start date when completed.
