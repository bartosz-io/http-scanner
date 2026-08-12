# Access-Control-Allow-Methods SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing `Access-Control-Allow-Methods` reference page into a framework-neutral CORS preflight method troubleshooting guide and complete its roadmap entry.

**Architecture:** Preserve the existing Astro content collection and dynamic `/headers/[slug]/` route. Add four intent-specific Markdown sections and one related-header link to the existing source, protected by a focused Vitest source contract; after independent review and full verification, update the SEO roadmap and this plan with factual completion data.

**Tech Stack:** Astro 5 content collections, Markdown, TypeScript, Vitest 4, ESLint, static Astro build.

## Global Constraints

- Preserve `/headers/access-control-allow-methods/` and its canonical behavior.
- Preserve the existing Astro content collection and `HeaderGuidePage.astro` rendering path.
- Keep the current generated title and frontmatter description.
- Do not add JSON-LD, client directives, interactive components, new routes, dependencies, or framework-specific configuration snippets.
- Use only framework-neutral `fetch()` and raw HTTP examples.
- Do not tell developers to set `Access-Control-Request-Method` or other CORS preflight request fields manually in browser JavaScript.
- Distinguish the preflight `OPTIONS` transport method from the proposed actual method.
- Do not imply that every `GET`, `HEAD`, or `POST` avoids preflight; the complete request determines CORS-safelisted status.
- Describe wildcard method behavior correctly: `*` has wildcard semantics only without credentials and is a literal method name when credentials mode is `include`.
- Follow Fetch method-matching rules without claiming that all method comparison is universally case-insensitive.
- Keep `Access-Control-Allow-Methods`, `Allow`, route support, authentication, object-level authorization, validation, and CSRF protection distinct.
- Every production-content change must follow a demonstrated RED → GREEN test cycle.
- Preserve unrelated user changes and the six existing lint warnings; introduce no new warnings.
- Do not deploy without explicit user authorization.

---

### Task 1: Expand the Access-Control-Allow-Methods guide

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`
- Modify: `src/content/headers/access-control-allow-methods.md`

**Interfaces:**
- Consumes: the existing Markdown frontmatter contract, `validateHeaderGuideSource(slug: string, source: string): string[]`, the shared `HeaderGuidePage.astro` renderer, and the established source-contract test pattern.
- Produces: an expanded framework-neutral guide with four related headers and a focused regression contract covering method preflight behavior, errors, wildcard/credentials semantics, safelisted-method nuance, and security boundaries.

- [ ] **Step 1: Add the failing source-contract test**

Insert this test in `src/lib/headerContentContract.test.ts` immediately after the existing `Access-Control-Allow-Credentials` SEO test:

```ts
it('keeps Access-Control-Allow-Methods aligned with CORS method troubleshooting intent', () => {
  const source = readFileSync(
    new URL(
      'src/content/headers/access-control-allow-methods.md',
      PROJECT_ROOT
    ),
    'utf8'
  );

  for (const phrase of [
    '## CORS preflight method exchange',
    '## Common Access-Control-Allow-Methods errors',
    '## Wildcard, credentials, and safelisted methods',
    '## Access-Control-Allow-Methods vs Allow and authorization',
    "method: 'PUT'",
    'OPTIONS /items/42 HTTP/1.1',
    'Access-Control-Request-Method: PUT',
    'Access-Control-Request-Headers: content-type',
    'Access-Control-Allow-Origin: https://app.example',
    'Access-Control-Allow-Methods: GET, PUT',
    'Access-Control-Allow-Headers: Content-Type',
    'Vary: Origin',
    'preflight transport method',
    '`GET`, `HEAD`, and `POST` are CORS-safelisted methods',
    'non-safelisted request headers or a non-safelisted `Content-Type`',
    'credentials mode is `include`',
    'literal method name `*`',
    'Method matching follows the Fetch rules',
    '`Allow` describes methods supported by an HTTP resource',
    '`405 Method Not Allowed`',
    'object-level authorization',
    'CSRF protection',
    '`Access-Control-Max-Age`',
    '  - access-control-allow-origin\n  - access-control-allow-headers\n  - access-control-allow-credentials\n  - access-control-max-age',
  ]) {
    expect(source).toContain(phrase);
  }
});
```

The production change that makes this test pass is the presence of the four new sections, exact related-header block, coherent method exchange, and required technical distinctions in `access-control-allow-methods.md`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Methods"
```

Expected: FAIL because the new headings, client/preflight exchange, wildcard and safelisted-method distinctions, and exact four-item related-header block are absent. Confirm the failure is an assertion about missing content rather than a syntax or fixture error.

- [ ] **Step 3: Extend the related-header cluster**

Replace the current `relatedHeaders` block in `src/content/headers/access-control-allow-methods.md` with:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-headers
  - access-control-allow-credentials
  - access-control-max-age
```

Do not change the current `headerName`, description, applicability, syntax, examples, use cases, mistakes, security consideration, or references in frontmatter.

- [ ] **Step 4: Append the CORS preflight method exchange section**

Append this section after the existing `Implementation notes` paragraph:

````markdown
## CORS preflight method exchange

Browser code defines the intended actual request. The browser—not application JavaScript—creates the CORS preflight fields when that request requires permission:

```js
fetch('https://api.example/items/42', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'updated' }),
});
```

For this request, a preflight and successful response can look like:

```http
OPTIONS /items/42 HTTP/1.1
Host: api.example
Origin: https://app.example
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: GET, PUT
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

`OPTIONS` is the preflight transport method. `PUT` is the proposed actual method and must be permitted by `Access-Control-Allow-Methods`; adding only `OPTIONS` to that response does not grant the later operation. The origin and any requested field names must also pass their respective CORS checks.

After a successful preflight, the browser can send the actual `PUT`. That route must still authenticate the caller, authorize the target object, validate the body, and enforce any CSRF protection appropriate to its credential model. A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not constrain non-browser clients.
````

- [ ] **Step 5: Append the method troubleshooting section**

Append this section immediately after `CORS preflight method exchange`:

````markdown
## Common Access-Control-Allow-Methods errors

When the console reports that `PUT`, `PATCH`, or another method is not allowed, inspect the preflight before debugging the actual route. Confirm the `OPTIONS` request contains the expected `Origin`, `Access-Control-Request-Method`, and optional `Access-Control-Request-Headers`, then inspect the exact public response returned to the browser.

The preflight fails when the required method is missing from `Access-Control-Allow-Methods`, the field is absent, or another required CORS check fails. A proxy, redirect, authentication layer, CDN rule, or generic error handler may answer `OPTIONS` without the fields added by application middleware. Setting the right CORS fields only on the later response does not repair the preflight.

Method matching follows the Fetch rules; do not assume every custom method is matched case-insensitively. Return the canonical method tokens supported by the route and test the exact requested spelling. Avoid one broad global list that advertises administrative or destructive operations on resources that do not safely expose them cross-origin. If a changed policy appears stale, inspect `Access-Control-Max-Age` because the browser may reuse an earlier preflight grant.
````

- [ ] **Step 6: Append the wildcard and safelisted-method section**

Append this section immediately after `Common Access-Control-Allow-Methods errors`:

````markdown
## Wildcard, credentials, and safelisted methods

`Access-Control-Allow-Methods: *` has wildcard semantics only for requests without credentials. When the request credentials mode is `include`, Fetch treats `*` as the literal method name `*`, so a credentialed API should return the explicit methods it permits.

`GET`, `HEAD`, and `POST` are CORS-safelisted methods, but the method is only one part of the safelist. A request using one of them can still require preflight because of non-safelisted request headers or a non-safelisted `Content-Type`. Listing a method in `Access-Control-Allow-Methods` grants a successful preflight dimension; it does not transform a non-simple request into a simple request.

Return the narrow method set supported for the target resource and trusted origin policy. Do not list every method merely to silence a browser error.
````

- [ ] **Step 7: Append the Allow and authorization section**

Append this section immediately after `Wildcard, credentials, and safelisted methods`:

````markdown
## Access-Control-Allow-Methods vs Allow and authorization

`Access-Control-Allow-Methods` is browser CORS permission metadata returned for a preflight. `Allow` describes methods supported by an HTTP resource and commonly appears in general `OPTIONS` handling or a `405 Method Not Allowed` response. One field does not replace the other: a resource can support `PUT` while refusing to grant it to a particular cross-origin browser caller.

A CORS grant also does not prove that the route exists or that the caller may perform the operation. Apply authentication, object-level authorization, input validation, rate limits, and CSRF protection to the actual method just as you would for a same-origin or non-browser client. Keep CORS policy narrow, but treat server authorization as the authoritative enforcement boundary.
````

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Methods"
npm test -- src/lib/headerContentContract.test.ts -t "validates every CORS guide"
```

Expected: both commands PASS. If either fails, correct the production Markdown while preserving the approved wording and constraints; do not weaken the test to accommodate missing coverage.

- [ ] **Step 9: Review Task 1 technical boundaries**

Read the complete guide and confirm:

- `fetch()` and the HTTP exchange describe the same `PUT` operation;
- JavaScript does not manually set browser-controlled preflight fields;
- `OPTIONS` is distinguished from the proposed actual method;
- safelisted method names are not confused with complete-request safelisting;
- wildcard behavior changes under credentials mode `include`;
- custom-method matching has no blanket case-insensitive claim;
- `Allow`, route support, CORS permission, and server authorization remain distinct;
- preflight-cache effects are tied to `Access-Control-Max-Age`;
- no framework-specific or interactive implementation was added.

Run:

```bash
git diff --check
git diff -- src/content/headers/access-control-allow-methods.md src/lib/headerContentContract.test.ts
```

Expected: no whitespace errors and no unrelated changes.

- [ ] **Step 10: Run the complete automated verification**

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
- Astro builds `/headers/access-control-allow-methods/` among the 51 static routes;
- `git diff --check` prints no errors.

- [ ] **Step 11: Verify the generated and rendered page**

Confirm that the build contains the new sections and exchange:

```bash
rg -n 'CORS preflight method exchange|Common Access-Control-Allow-Methods errors|Wildcard, credentials, and safelisted methods|Access-Control-Allow-Methods vs Allow and authorization|Access-Control-Request-Method: PUT|Access-Control-Allow-Methods: GET, PUT' dist/headers/access-control-allow-methods/index.html
```

Expected: all four headings and both preflight method fields are present in generated HTML.

Start the local site and inspect `/headers/access-control-allow-methods/` in the in-app browser at a normal desktop viewport and at `390 × 844`. Confirm:

- the four new sections render in order;
- JavaScript and HTTP examples use the established light code-card design;
- the HTTP exchange retains line breaks and readable padding;
- long code lines scroll inside their cards instead of widening the page;
- the page has no horizontal document overflow;
- all four related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save QA screenshots outside the repository under `/private/tmp/access-control-allow-methods-desktop.png` and `/private/tmp/access-control-allow-methods-mobile.png`. Reset any viewport override and stop the local server after verification.

- [ ] **Step 12: Commit Task 1**

```bash
git add src/content/headers/access-control-allow-methods.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Access-Control-Allow-Methods guide"
```

Record the exact short SHA for Task 2.

---

### Task 2: Review, verify, and complete the SEO roadmap entry

**Files:**
- Modify: `SEO_PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-12-access-control-allow-methods-seo.md`

**Interfaces:**
- Consumes: the verified Task 1 implementation commit and the acceptance criteria in `docs/superpowers/specs/2026-08-12-access-control-allow-methods-seo-design.md`.
- Produces: an independently reviewed implementation, a factual roadmap record, the next Wave 1 task selection, and a fully checked implementation plan.

- [ ] **Step 1: Request independent technical review of Task 1**

Prepare a review package comparing the commit immediately before Task 1 with the Task 1 commit. Give the reviewer the design spec, this implementation plan, implementation diff, Task 1 verification evidence, and all Global Constraints.

Require two explicit verdicts:

1. spec compliance;
2. content and implementation quality.

The reviewer must classify findings as Critical, Important, or Minor and cite exact file/line evidence. Resolve every Critical or Important finding. Any production-content correction must use a new failing regression assertion or a demonstrated failure of an existing assertion before editing the Markdown, then rerun Task 1 Steps 8–11.

- [ ] **Step 2: Run final whole-branch implementation review**

After the task review is clean, request a fresh reviewer for the complete implementation diff. The reviewer must check Fetch accuracy, unsafe ambiguity, scope, source-contract quality, exact related-header protection, internal linking, rendered-code behavior, and no-framework/no-deploy compliance.

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
git log --format='%h %s' -- src/content/headers/access-control-allow-methods.md src/lib/headerContentContract.test.ts
```

Expected: the first row identifies the final commit that changed the guide or its contract. It is normally `feat: expand Access-Control-Allow-Methods guide`, but it may be a later focused fix created from a valid review finding. Store that concrete short SHA for the roadmap update.

- [ ] **Step 5: Update the Wave 1 status in SEO_PLAN.md**

In `Wave 1 — CORS authority`, change only the `Access-Control-Allow-Methods` status from `QUEUED` to `DONE`. Keep order, priority, and strategic role unchanged.

- [ ] **Step 6: Add the completed-task record**

Append one row to `## 11. Completed task log` with these cells:

- Task: `Access-Control-Allow-Methods SEO expansion`;
- Status: `` `DONE` ``;
- Commit: the concrete short SHA from Step 4;
- Observation state: `Awaiting deployment and URL-filtered GSC baseline.`

Do not claim a deployment date or GSC submission before those actions occur.

- [ ] **Step 7: Advance the next task**

Replace the body of `## 12. Next task` with:

```markdown
No newer GSC export is available after the 2026-08-07 baseline. Execute the next eligible roadmap task for:

- `Access-Control-Allow-Headers`.

The task should cover preflight request-header authorization, `Access-Control-Request-Headers`, safelisted value restrictions, wildcard and credentials behavior, and browser error resolution.
```

- [ ] **Step 8: Mark this implementation plan complete**

Change every completed task checkbox in this plan from `- [ ]` to `- [x]` only after its action and verification have succeeded.

- [ ] **Step 9: Verify the documentation diff**

Run:

```bash
git diff --check
git diff -- SEO_PLAN.md docs/superpowers/plans/2026-08-12-access-control-allow-methods-seo.md
```

Expected: only the factual status, completed-task row, next-task text, and completed checkboxes described above.

- [ ] **Step 10: Commit the roadmap completion**

```bash
git add SEO_PLAN.md docs/superpowers/plans/2026-08-12-access-control-allow-methods-seo.md
git commit -m "docs: complete Access-Control-Allow-Methods SEO task"
```

- [ ] **Step 11: Confirm clean handoff state**

Run:

```bash
git status --short
git log -2 --format='%h %s'
```

Expected: clean worktree; the two newest commits are the roadmap-completion commit and Task 1 implementation commit. Do not deploy. Present merge/push/keep-branch choices according to the branch-finishing workflow.

---

## Post-merge deployment follow-up

This section is not part of implementation because deployment requires separate explicit authorization.

After an authorized production deploy:

1. verify HTTP 200 for both `https://httpscanner.com/headers/access-control-allow-methods/` and the Workers URL;
2. verify the four new headings in production HTML;
3. inspect production rendering of both code blocks;
4. record the Cloudflare Version ID;
5. update the completed-task observation state with the deployment date;
6. inspect or submit the URL in GSC and record the GSC observation start date when completed.
