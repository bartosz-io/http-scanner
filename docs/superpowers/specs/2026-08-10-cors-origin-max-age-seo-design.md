# Access-Control-Allow-Origin and Access-Control-Max-Age SEO Design

Date: 2026-08-10  
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)  
Status: approved on 2026-08-11

## 1. Goal

Improve the two existing CORS reference pages most likely to produce the next non-brand SEO gains:

- `/headers/access-control-allow-origin/`;
- `/headers/access-control-max-age/`.

The pages must form a coherent CORS foundation while retaining distinct search intent:

- `Access-Control-Allow-Origin` explains which browser origin may read a response and how to troubleshoot origin-sharing failures;
- `Access-Control-Max-Age` explains how long a browser may reuse a successful CORS preflight result.

No new URL, checker, content type, schema markup, or client-side component is introduced by this task.

## 2. Evidence

### Page-level GSC evidence

Source: `outputs/httpscanner.com-Performance-on-Search-2026-08-07/Strony.csv`, covering the three months ending 2026-08-05.

| Page | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| `/headers/access-control-allow-origin/` | 0 | 58 | 0% | 30.71 |
| `/headers/access-control-max-age/` | 0 | 33 | 0% | 25.33 |

Both URLs satisfy the roadmap's P0 rule: at least 30 impressions, position 11–35, and direct contribution to the active CORS cluster.

### Query-level GSC evidence

Source: `outputs/httpscanner.com-Performance-on-Search-2026-08-07/Zapytania.csv`.

| Query | Impressions | Position | Target page |
|---|---:|---:|---|
| `access control allow origin` | 4 | 56 | Access-Control-Allow-Origin |
| `access-control-allow-origin` | 3 | 57 | Access-Control-Allow-Origin |
| `access allow control origin` | 1 | 34 | Access-Control-Allow-Origin |
| `access-control-max-age` | 3 | 9.67 | Access-Control-Max-Age |
| `access control max age` | 1 | 11 | Access-Control-Max-Age |
| `access-control-max-age header` | 1 | 20 | Access-Control-Max-Age |

Low-volume queries mentioning wildcard origins, credentials, and `Vary: Origin` also appear around positions 8–10. They are secondary evidence only because several include `mdn` and do not represent clean non-brand demand.

### Current SERP pattern

The current SERP is dominated by reference and troubleshooting formats:

- concise syntax and directive definitions;
- wildcard versus explicit-origin behavior;
- credential errors;
- `Vary: Origin` cache correctness;
- missing-header troubleshooting;
- preflight `OPTIONS` examples;
- browser-specific preflight-cache behavior.

The strongest opportunity is not raw word count. It is a technically precise troubleshooting layer that connects the reference page to a live header inspection workflow.

## 3. Sources of technical truth

Implementation must use these sources and resolve conflicts in this order:

1. [Fetch Standard — CORS protocol](https://fetch.spec.whatwg.org/#http-new-header-syntax)
2. [Fetch Standard — CORS-preflight cache](https://fetch.spec.whatwg.org/#cors-preflight-cache)
3. [MDN — Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin)
4. [MDN — Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age)
5. [MDN — CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
6. [OWASP — CORS testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing)

Browser cap values are implementation details, not protocol guarantees. If included, they must be attributed as current behavior and accompanied by the statement that browsers may impose or change their own limits.

## 4. Approach decision

### Option A — minimal keyword expansion

Add a short paragraph containing query variants and preserve the rest of each guide.

Trade-off: smallest change, but insufficient for troubleshooting intent and weak internal-cluster reinforcement.

### Option B — metadata-first optimization

Customize titles and descriptions before expanding body content.

Trade-off: useful when a page already ranks in positions 4–10 with low CTR. These pages primarily have a ranking and intent-depth problem, so metadata-first work is premature.

### Option C — intent-specific guide expansion with cluster links

Expand each guide around its own mechanism, add practical exchanges and troubleshooting, reinforce related-header links, and protect key distinctions with tests.

Decision: use Option C. Keep the current generated titles and frontmatter descriptions during this iteration. Reconsider snippets only after a page reaches Top 10 with insufficient CTR.

## 5. Shared design constraints

- Preserve the current URLs and canonical behavior.
- Preserve the existing Astro content collection and `HeaderGuidePage.astro` rendering path.
- Do not add JSON-LD to Markdown guide sources; the content contract prohibits it.
- Do not add client-side components or framework-specific interactive examples.
- Do not claim that CORS authenticates requests, authorizes users, blocks requests at the network boundary, or provides CSRF protection.
- Do not present one universal production value as correct for every application.
- Keep framework-specific implementation tutorials out of these reference pages; those belong in later cluster guides.
- Use exact header names and valid HTTP examples.
- Explain the distinction between a request reaching a server and browser JavaScript being allowed to read the response.

## 6. Access-Control-Allow-Origin page design

### Primary intent

Answer: “What does the Access-Control-Allow-Origin response header do, which value should I use, and why is the browser reporting a CORS origin error?”

### Secondary intents

- `Access-Control-Allow-Origin: *` versus an explicit origin;
- wildcard with credentials;
- missing `Access-Control-Allow-Origin` browser error;
- dynamic origin allowlists;
- `Vary: Origin` and shared caches;
- why multiple origins or `https://*.example.com` do not work as a standard field value;
- why `null` is unsafe as a general allowlist choice;
- simple requests versus preflighted requests;
- CORS versus authentication, authorization, CSRF, and network access control.

### Required content sections

The existing `Meaning and behavior` and `Implementation notes` sections remain. Add the following H2 sections after them:

1. `## Access-Control-Allow-Origin values`
2. `## Common CORS origin errors`
3. `## Credentials, dynamic origins, and caching`

### Required examples

Include two response examples with explanations:

```http
Access-Control-Allow-Origin: *
```

This example is limited to intentionally public, non-credentialed response sharing.

```http
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Vary: Origin
```

This example demonstrates a validated explicit origin in a credentialed flow. It must not imply that reflecting any incoming `Origin` is safe.

### Technical boundaries

The page must explicitly state all of the following:

- the field controls whether browser code from an origin may access the response;
- a simple cross-origin request may reach and change server state even when browser code cannot read the response;
- the standard response value is one serialized origin, `*`, or `null`; it is not a comma-separated list or subdomain-pattern language;
- `*` is incompatible with credentialed response sharing;
- `null` should not be used as a general trusted origin because hostile documents can have a serialized `null` origin;
- a dynamic exact-origin response requires validation against an allowlist;
- a response selected by request `Origin` requires `Vary: Origin` for compatible shared caching;
- CORS does not replace endpoint authentication, object-level authorization, input validation, or CSRF defenses.

### Frontmatter

Keep the current description, syntax, examples, and security consideration unless implementation reveals an accuracy defect.

Add `access-control-max-age` to `relatedHeaders` so the next-task pair is connected in the rendered sidebar. Preserve:

- `access-control-allow-credentials`;
- `access-control-allow-methods`;
- `vary`.

## 7. Access-Control-Max-Age page design

### Primary intent

Answer: “What does Access-Control-Max-Age cache, how does it affect CORS preflight requests, and what value should an API choose?”

### Secondary intents

- CORS preflight and `OPTIONS`;
- why the browser keeps sending or stops sending preflights;
- `Access-Control-Max-Age: 600` and other delta-second values;
- the default five-second behavior when the field is absent;
- browser-imposed maximums;
- the preflight cache versus the normal HTTP cache;
- `Access-Control-Max-Age` versus `Cache-Control: max-age`;
- policy rollout and emergency revocation;
- why server authorization must run on every actual request.

### Required content sections

The existing `Meaning and behavior` and `Implementation notes` sections remain. Add the following H2 sections after them:

1. `## How the CORS preflight cache works`
2. `## Choosing an Access-Control-Max-Age value`
3. `## Access-Control-Max-Age vs Cache-Control`

### Required example

Include one coherent preflight exchange:

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

The explanation must state that `600` is an example ten-minute lifetime, not a universal recommendation.

### Technical boundaries

The page must explicitly state all of the following:

- the field caches successful CORS preflight permission, not response bodies;
- the browser's preflight cache is separate from its general HTTP cache;
- the cache entry depends on relevant dimensions including origin, URL, credentials mode, method, and request-header permission;
- browsers may cap or otherwise constrain the server-provided lifetime;
- the default value is five seconds when the field is absent, according to current MDN documentation;
- shorter values suit changing policy; longer values reduce repeated `OPTIONS` traffic but delay browser adoption of tightened preflight policy;
- a cached preflight permission does not bypass authentication or authorization on the actual request;
- urgent revocation must be enforced by normal request authorization instead of waiting for browser caches to expire;
- `Access-Control-Max-Age` and `Cache-Control: max-age` govern different caches and are not interchangeable.

### Frontmatter

Keep the current description and primary example `Access-Control-Max-Age: 600`.

Add `access-control-allow-origin` to `relatedHeaders`. Preserve:

- `access-control-allow-methods`;
- `access-control-allow-headers`;
- `cache-control`.

## 8. Internal linking design

The rendered guide layout already provides:

- a parent link to `/headers/`;
- a global sidebar CTA to `/http-headers-checker/`;
- links generated from each guide's `relatedHeaders`.

This task changes only the related-header sets described above. It does not duplicate the existing checker CTA inside every new section.

After implementation, the intended path is:

```text
HTTP Headers Checker
  -> Access-Control-Allow-Origin
      -> Access-Control-Allow-Credentials
      -> Vary
      -> Access-Control-Max-Age
  -> Access-Control-Max-Age
      -> Access-Control-Allow-Methods
      -> Access-Control-Allow-Headers
      -> Cache-Control
```

No new navigation component is required.

## 9. Metadata decision

Keep the current generated titles:

- `Access-Control-Allow-Origin HTTP Header — Syntax & Examples | HTTP Scanner`;
- `Access-Control-Max-Age HTTP Header — Syntax & Examples | HTTP Scanner`.

Keep the current frontmatter descriptions because they clearly state each header's purpose and remain within the collection length contract.

Reason: current positions indicate insufficient authority and intent coverage rather than a proven snippet problem. A metadata experiment becomes eligible when a page reaches positions 4–10 and remains below 4% CTR.

## 10. Testing design

Follow the established source-contract pattern in `src/lib/headerContentContract.test.ts`.

### Access-Control-Allow-Origin contract

Add one test that reads `access-control-allow-origin.md` and asserts meaningful coverage of:

- `Access-Control-Allow-Origin: *`;
- `Access-Control-Allow-Credentials: true`;
- `Vary: Origin`;
- serialized `null` origin risk;
- one-origin/no-comma-separated-list behavior;
- the statement that a request can reach the server when browser script cannot read the response;
- exact allowlist validation.

### Access-Control-Max-Age contract

Add one test that reads `access-control-max-age.md` and asserts meaningful coverage of:

- `OPTIONS /api/items`;
- `Access-Control-Max-Age: 600`;
- default five-second behavior;
- browser caps;
- separate CORS-preflight and HTTP caches;
- policy-revocation delay;
- authorization on every actual request;
- `Cache-Control: max-age` distinction.

### TDD sequence

1. Add both source-contract tests.
2. Run the focused test and verify both new tests fail for missing content.
3. Expand the two Markdown guides minimally until the contracts pass.
4. Refactor wording while keeping focused tests green.
5. Run the complete test suite, lint, and production build.

Tests must verify technical distinctions, not merely the isolated presence of header names.

## 11. Error and safety handling

- If authoritative sources disagree with a planned statement, prefer the Fetch Standard and revise this spec before implementation.
- If a browser-specific limit cannot be confirmed, omit the number and retain the portable statement that browser caps differ.
- If a required example encourages broad origin reflection or weak authorization, reject the example during review.
- If content overlap starts turning the two pages into a generic CORS tutorial, keep shared context brief and link to the neighboring guide rather than duplicating it.
- If the content contract requires unrelated architecture changes, stop and revise the plan instead of widening this task.

## 12. Acceptance criteria

The task is complete when all of the following are true:

- both existing URLs and canonicals remain unchanged;
- each page serves the distinct primary intent defined above;
- every required section and example is present;
- every technical-boundary statement is accurate;
- the related-header links connect the two pages without removing their existing core neighbors;
- two new source-contract tests have demonstrated RED before implementation and GREEN afterward;
- all existing header content contracts pass;
- the full test suite passes;
- lint reports no new errors or warnings caused by this task;
- the production build succeeds and generates both routes;
- technical review has no unresolved critical or important findings;
- the implementation plan is fully checked off;
- `SEO_PLAN.md` records the implementation commit and changes both headers from `NEXT` to `DONE`;
- both deployed URLs are inspected or submitted in GSC;
- a URL-filtered rolling 28-day GSC baseline is recorded for future comparison.

## 13. Measurement plan

Before deployment, capture comparable URL-filtered 28-day values for clicks, impressions, CTR, and average position. The existing three-month export is directional evidence and must not be compared directly with a future 14-day or 21-day window.

Evaluate each URL after 14 and 21 days.

### Access-Control-Allow-Origin success signals

- impressions grow relative to the captured rolling baseline;
- average position moves from the low 30s toward Top 20;
- exact and troubleshooting queries expand beyond the current handful of impressions;
- at least one non-brand click is a stretch signal, not a release requirement.

### Access-Control-Max-Age success signals

- exact-match queries retain or improve their early Top 10/Top 20 visibility;
- page-level impressions grow beyond the current low-volume test phase;
- average page position moves below 20;
- the page does not begin ranking primarily for generic `Cache-Control max-age` intent.

At day 21, record one decision per URL: `HOLD`, `ITERATE`, `PROMOTE CLUSTER`, or `DEPRIORITIZE`.

## 14. Files expected in implementation

- Modify: `src/content/headers/access-control-allow-origin.md`
- Modify: `src/content/headers/access-control-max-age.md`
- Modify: `src/lib/headerContentContract.test.ts`
- Modify after successful implementation: `SEO_PLAN.md`
- Created after spec approval: `docs/superpowers/plans/2026-08-10-cors-origin-max-age-seo.md`

No other production file is expected to change.
