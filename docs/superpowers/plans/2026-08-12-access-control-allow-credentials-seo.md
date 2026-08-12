# Access-Control-Allow-Credentials SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing `Access-Control-Allow-Credentials` reference page into a framework-neutral credentialed-CORS troubleshooting guide and complete its roadmap entry.

**Architecture:** Preserve the existing Astro content collection and dynamic `/headers/[slug]/` route. Add three intent-specific Markdown sections and one related-header link to the existing source, protected by a focused Vitest source contract; after independent review and full verification, update the SEO roadmap and this plan with factual completion data.

**Tech Stack:** Astro 5 content collections, Markdown, TypeScript, Vitest 4, ESLint, static Astro build.

## Global Constraints

- Preserve `/headers/access-control-allow-credentials/` and its canonical behavior.
- Preserve the existing Astro content collection and `HeaderGuidePage.astro` rendering path.
- Keep the current generated title and frontmatter description.
- Do not add JSON-LD, client directives, interactive components, new routes, dependencies, or framework-specific configuration snippets.
- Use framework-neutral `fetch()` and raw HTTP examples only.
- The only enabling value is the case-sensitive token `true`; recommend omission instead of `false` when credentials are unnecessary.
- Do not claim that the header itself causes a browser to send credentials.
- Do not claim that every credentialed request requires preflight or that a conforming preflight contains credentials.
- Do not claim that CORS authenticates users, performs object-level authorization, overrides browser cookie policy, or protects against CSRF.
- Dynamic origin selection must require exact allowlist validation and `Vary: Origin` or equivalent cache-key separation.
- Every production-content change must follow a demonstrated RED → GREEN test cycle.
- Preserve unrelated user changes and the six existing lint warnings; introduce no new warnings.
- Do not deploy without explicit user authorization.

---

### Task 1: Expand the Access-Control-Allow-Credentials guide

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`
- Modify: `src/content/headers/access-control-allow-credentials.md`

**Interfaces:**
- Consumes: the existing Markdown frontmatter contract, `validateHeaderGuideSource(slug: string, source: string): string[]`, the shared `HeaderGuidePage.astro` renderer, and the established source-contract test pattern.
- Produces: an expanded framework-neutral guide with four related headers and a focused regression contract covering credentialed-CORS behavior and security boundaries.

- [ ] **Step 1: Add the failing source-contract test**

Insert this test in `src/lib/headerContentContract.test.ts` immediately after the existing `Access-Control-Max-Age` SEO test:

```ts
it('keeps Access-Control-Allow-Credentials aligned with credentialed CORS troubleshooting intent', () => {
  const source = readFileSync(
    new URL(
      'src/content/headers/access-control-allow-credentials.md',
      PROJECT_ROOT
    ),
    'utf8'
  );

  for (const phrase of [
    '## Credentialed CORS request and response',
    '## Common Access-Control-Allow-Credentials errors',
    '## Cookies, SameSite, CSRF, and authorization',
    "credentials: 'include'",
    'Access-Control-Allow-Origin: https://app.example',
    'Access-Control-Allow-Credentials: true',
    'Vary: Origin',
    'SameSite=None',
    'case-sensitive token `true`',
    'omit the field rather than sending `false`',
    '`Access-Control-Allow-Origin: *`',
    'preflight itself does not include credentials',
    'simple credentialed request can be sent without a preflight',
    'third-party cookie',
    'CSRF protection',
    'object-level authorization',
  ]) {
    expect(source).toContain(phrase);
  }
});
```

The production change that makes this test pass is the presence of the three new sections and their required technical distinctions in `access-control-allow-credentials.md`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Credentials"
```

Expected: FAIL because the new headings, `fetch()` example, raw response fields, and troubleshooting phrases are absent. Confirm the failure is an assertion about missing content rather than a syntax or fixture error.

- [ ] **Step 3: Extend the related-header cluster**

Replace the current `relatedHeaders` block in `src/content/headers/access-control-allow-credentials.md` with:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-max-age
  - set-cookie
  - vary
```

Do not change the current `headerName`, description, applicability, syntax, examples, use cases, mistakes, security consideration, or references in frontmatter.

- [ ] **Step 4: Append the credentialed request and response section**

Append this section after the existing `Implementation notes` paragraph:

````markdown
## Credentialed CORS request and response

Browser code opts into a credentialed cross-origin fetch through its request configuration. The response header does not switch credentials on by itself:

```js
fetch('https://api.example/account', {
  credentials: 'include',
});
```

After validating the request `Origin` against an exact allowlist, the API can return that permitted origin together with credential permission:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Vary: Origin
Set-Cookie: session=example; Secure; HttpOnly; SameSite=None
Content-Type: application/json

{"account":"example"}
```

The cookie attributes above are illustrative, not a universal session policy. A simple credentialed request can be sent without a preflight. If the actual response lacks a matching explicit origin or the case-sensitive token `true`, the browser can withhold that response from the calling script even though the server received and processed the request.

A non-simple request may first trigger an `OPTIONS` exchange. A conforming CORS preflight itself does not include credentials, but its response can state whether the later actual request may use credentials. The preflight response and the actual response must each contain the CORS fields required for their role.
````

- [ ] **Step 5: Append the troubleshooting section**

Append this section immediately after `Credentialed CORS request and response`:

````markdown
## Common Access-Control-Allow-Credentials errors

The only enabling value is the case-sensitive token `true`. Values such as `false`, `True`, `1`, and `yes` do not opt into credentialed CORS. When credentials are unnecessary, omit the field rather than sending `false`.

A request whose credentials mode is `include` cannot share a response through `Access-Control-Allow-Origin: *`. Return the one validated origin instead, and include `Vary: Origin` when the selected value changes by request. Compare the complete origin—scheme, host, and port—rather than matching a suffix or blindly copying the incoming `Origin`.

When the browser reports an expected-`true` or wildcard-with-credentials error, inspect both the browser console and the final public network response. Check redirects, authentication failures, application errors, proxy responses, and CDN-served variants because they may bypass the middleware that adds CORS fields. For a preflighted flow, inspect both `OPTIONS` and the actual response; for a simple request, do not assume an `OPTIONS` request must appear. Test allowed and denied origins separately.
````

- [ ] **Step 6: Append the cookie and security-boundary section**

Append this section immediately after `Common Access-Control-Allow-Credentials errors`:

````markdown
## Cookies, SameSite, CSRF, and authorization

Valid CORS fields do not override cookie `SameSite`, `Secure`, domain, path, or expiration rules. Browser third-party cookie policies can also prevent storage or sending even when the server's CORS response is correct. Diagnose cookie eligibility independently from response exposure, and inspect the final `Set-Cookie` field without copying live session values into shared reports.

Credentialed CORS does not authenticate a caller or grant object-level authorization. Validate the session or other credential and authorize every requested object on the server. A simple state-changing request may reach the application even when the browser later hides its response, so state-changing endpoints still require independent CSRF protection such as an appropriate token strategy, cookie policy, and origin checks. Treat CORS, cookies, authentication, authorization, and CSRF as coordinated but separate controls.
````

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts -t "Access-Control-Allow-Credentials"
npm test -- src/lib/headerContentContract.test.ts -t "validates every CORS guide"
```

Expected: both commands PASS. If either fails, correct the production Markdown while preserving the approved wording and constraints; do not weaken the test to accommodate missing coverage.

- [ ] **Step 8: Review Task 1 technical boundaries**

Read the complete rendered source and confirm:

- `fetch()` and the HTTP response describe the same allowed origin flow;
- the example cookie is explicitly illustrative;
- simple and preflighted credentialed requests are distinguished;
- a conforming preflight is described as credential-free;
- exact `true`, omission instead of `false`, and wildcard incompatibility are explicit;
- cookie policy and third-party-cookie behavior are not presented as CORS guarantees;
- authentication, object-level authorization, and CSRF protection remain independent controls;
- no framework-specific or interactive implementation was added.

Run:

```bash
git diff --check
git diff -- src/content/headers/access-control-allow-credentials.md src/lib/headerContentContract.test.ts
```

Expected: no whitespace errors and no unrelated changes.

- [ ] **Step 9: Run the complete automated verification**

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
- Astro builds `/headers/access-control-allow-credentials/` among the static routes;
- `git diff --check` prints no errors.

- [ ] **Step 10: Verify the generated and rendered page**

First confirm that the build contains the new content and code blocks:

```bash
rg -n 'Credentialed CORS request and response|Common Access-Control-Allow-Credentials errors|Cookies, SameSite, CSRF, and authorization|credentials.*include|Access-Control-Allow-Credentials: true' dist/headers/access-control-allow-credentials/index.html
```

Expected: all three headings and both examples are present in the generated HTML.

Start the local site and inspect `/headers/access-control-allow-credentials/` in the in-app browser at a normal desktop viewport and at `390 × 844`. Confirm:

- the three new sections render in the intended order;
- JavaScript and HTTP examples use the established light code-card design;
- the raw HTTP response retains line breaks and readable padding;
- long code lines scroll inside their cards instead of widening the page;
- the page has no horizontal document overflow;
- all four related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save QA screenshots outside the repository under `/private/tmp/access-control-allow-credentials-desktop.png` and `/private/tmp/access-control-allow-credentials-mobile.png`. Reset any temporary viewport override and stop the local server after verification.

- [ ] **Step 11: Commit Task 1**

```bash
git add src/content/headers/access-control-allow-credentials.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Access-Control-Allow-Credentials guide"
```

Record the exact short SHA for Task 2.

---

### Task 2: Review, verify, and complete the SEO roadmap entry

**Files:**
- Modify: `SEO_PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-12-access-control-allow-credentials-seo.md`

**Interfaces:**
- Consumes: the verified Task 1 implementation commit and the acceptance criteria in `docs/superpowers/specs/2026-08-12-access-control-allow-credentials-seo-design.md`.
- Produces: an independently reviewed implementation, a factual `DONE` roadmap entry, the next Wave 1 task selection, and a fully checked implementation plan.

- [ ] **Step 1: Request independent technical review of Task 1**

Prepare a review package comparing the commit immediately before Task 1 with the Task 1 commit. Give the reviewer:

- design spec: `docs/superpowers/specs/2026-08-12-access-control-allow-credentials-seo-design.md`;
- this implementation plan;
- implementation diff and Task 1 verification evidence;
- all Global Constraints above.

Require two explicit verdicts:

1. spec compliance;
2. content and implementation quality.

The reviewer must classify findings as Critical, Important, or Minor and cite exact file/line evidence. Resolve every Critical or Important finding. Any production-content correction must use a new failing regression assertion or a demonstrated failure of an existing assertion before editing the Markdown, then rerun Task 1 Steps 7–10.

- [ ] **Step 2: Run final whole-branch review**

After the task review is clean, request a fresh reviewer for the complete diff from the pre-Task-1 base through current `HEAD`. The reviewer must check technical accuracy, unsafe ambiguity, scope, source-contract quality, internal linking, rendered-code behavior, and compliance with the no-framework/no-deploy constraints.

Expected: no unresolved Critical or Important findings. Resolve real findings through the same RED → GREEN discipline and repeat the affected verification.

- [ ] **Step 3: Run fresh final verification**

After all review changes, run from a clean command prompt:

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
- Astro check/build succeeds and emits the repository baseline of 51 pages;
- `git diff --check` is clean;
- only the intended roadmap and plan-document updates remain uncommitted.

- [ ] **Step 4: Capture the exact implementation commit**

Run:

```bash
git log -1 --format='%h %s'
```

Expected: the latest implementation commit is `feat: expand Access-Control-Allow-Credentials guide`. Store its exact short SHA for the roadmap update; do not insert a placeholder.

- [ ] **Step 5: Update the Wave 1 status in SEO_PLAN.md**

In the `Wave 1 — CORS authority` table, change only the `Access-Control-Allow-Credentials` status from `QUEUED` to `DONE`. Keep its order, priority, and strategic role unchanged.

- [ ] **Step 6: Add the completed-task record**

Append one row to `## 11. Completed task log` with these exact cells:

- Task: `Access-Control-Allow-Credentials SEO expansion`;
- Status: `` `DONE` ``;
- Commit: the concrete short SHA printed in Step 4;
- Observation state: `Awaiting deployment and URL-filtered GSC baseline.`

The rendered Markdown row must contain the concrete SHA directly and must not contain a symbolic placeholder.

Do not claim a deployment date or GSC submission before those actions occur.

- [ ] **Step 7: Advance the next task**

Replace the body of `## 12. Next task` with:

```markdown
No newer GSC export is available after the 2026-08-07 baseline. Execute the next eligible roadmap task for:

- `Access-Control-Allow-Methods`.

The task should cover preflight method authorization, `OPTIONS` troubleshooting, exact method matching, and credentialed-request interactions.
```

- [ ] **Step 8: Mark this implementation plan complete**

In `docs/superpowers/plans/2026-08-12-access-control-allow-credentials-seo.md`, change every completed task checkbox from `- [ ]` to `- [x]` only after its associated action and verification have actually succeeded.

- [ ] **Step 9: Verify the documentation diff**

Run:

```bash
git diff --check
git diff -- SEO_PLAN.md docs/superpowers/plans/2026-08-12-access-control-allow-credentials-seo.md
```

Expected: the diff contains only the factual status, completed-task row, next-task text, and completed checkboxes described above.

- [ ] **Step 10: Commit the roadmap completion**

```bash
git add SEO_PLAN.md docs/superpowers/plans/2026-08-12-access-control-allow-credentials-seo.md
git commit -m "docs: complete Access-Control-Allow-Credentials SEO task"
```

- [ ] **Step 11: Confirm clean handoff state**

Run:

```bash
git status --short
git log -2 --format='%h %s'
```

Expected: clean worktree; the two newest commits are the roadmap-completion commit and the exact Task 1 implementation commit. Do not deploy. Present merge/push/keep-branch choices according to the branch-finishing workflow.

---

## Post-merge deployment follow-up

This section is intentionally not part of the implementation tasks because deployment requires separate explicit authorization.

After an authorized production deploy:

1. verify HTTP 200 for both `https://httpscanner.com/headers/access-control-allow-credentials/` and the Workers URL;
2. verify the three new headings in the production HTML;
3. inspect the production rendering of both code blocks;
4. record the Cloudflare Version ID;
5. update the completed-task observation state with the deployment date;
6. inspect or submit the URL in GSC and record the GSC observation start date when completed.
