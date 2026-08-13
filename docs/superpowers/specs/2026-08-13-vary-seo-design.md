# Vary SEO Design

Date: 2026-08-13  
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)  
Status: approved on 2026-08-13

## 1. Goal

Expand the existing `/headers/vary/` reference into a CORS-first caching guide that explains when and why a dynamic `Access-Control-Allow-Origin` response needs `Vary: Origin`. The page should give readers a correct mental model of HTTP cache variant selection, demonstrate the common failure caused by reusing an origin-specific response for another request origin, and provide a framework-neutral diagnostic sequence across the browser, CDN or proxy, and origin server.

The guide remains a reference for the general `Vary` response field. After the CORS scenario, it should cover `Accept-Encoding`, `Accept-Language`, cache fragmentation, validators, and the precise meaning of `Vary: *`. Correct protocol boundaries and clear causal explanations take priority over content length or keyword repetition.

## 2. Evidence and strategic role

### GSC evidence

Source: `outputs/httpscanner.com-Performance-on-Search-2026-08-07/`, covering 2026-05-24 through 2026-08-05.

`/headers/vary/` does not appear in the page-level export. Two query rows each have one impression, zero clicks, and average position 8:

- `mdn cors access-control-allow-origin wildcard credentials vary origin`;
- `mdn vary origin access-control-allow-origin`.

These rows are low-volume, MDN-qualified supporting evidence rather than a clean non-brand baseline for the page. The stronger reason to proceed is the roadmap: `Vary` is the final P1 task in the CORS authority wave and explains the cache boundary repeatedly referenced by the expanded CORS guides.

### Strategic role

The page should own the practical connection between dynamic origin selection and shared HTTP caching. It should help a developer answer:

> “Why does my CORS response work for one origin and fail for another only after caching, and what exactly does `Vary: Origin` fix?”

The differentiator is a single two-origin cache sequence that separates four independent responsibilities:

- the origin allowlist decides which requesting origins may receive CORS permission;
- `Access-Control-Allow-Origin` communicates that permission for one response;
- `Vary: Origin` controls whether an HTTP cache may reuse that stored response for a later request with another `Origin` value;
- `Access-Control-Max-Age` controls a separate browser CORS-preflight cache.

## 3. Sources of technical truth

Resolve technical conflicts in this order:

1. [RFC 9110 section 12.5.5 — Vary](https://www.rfc-editor.org/rfc/rfc9110.html#field.vary)
2. [RFC 9111 section 4.1 — Calculating Cache Keys with Vary](https://www.rfc-editor.org/rfc/rfc9111.html#name-calculating-cache-keys)
3. [Fetch Standard — CORS protocol and HTTP caches](https://fetch.spec.whatwg.org/#cors-protocol-and-http-caches)
4. [Fetch Standard — CORS-preflight cache](https://fetch.spec.whatwg.org/#cors-preflight-cache)
5. [MDN — Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary)

The normative RFCs define `Vary` and HTTP cache matching. Fetch defines the CORS-specific recommendation and the separate preflight cache. MDN is a secondary readability and terminology check, not the authority when wording differs.

## 4. Non-goals

- Do not change the route, canonical behavior, generated title, frontmatter description, content collection, or shared `HeaderGuidePage.astro` renderer.
- Do not add JSON-LD, client directives, interactive components, diagrams, new routes, dependencies, or a cache/CORS rules engine.
- Do not add Express, Nginx, Apache, Cloudflare, Fastly, Varnish, API Gateway, or framework-specific configuration snippets.
- Do not redesign the established light code-card styling.
- Do not imply that `Vary` makes a response cacheable, sets freshness, validates an origin, grants CORS access, authenticates a caller, or authorizes application data.
- Do not claim that omitting `Vary: Origin` automatically leaks a response body across origins. Describe browser blocking and representation-mixing risks separately and conditionally.
- Do not recommend `Vary: Cookie` as a substitute for `Cache-Control: private` or `no-store` on personalized or sensitive responses.
- Do not imply that `Vary: *` is equivalent to `Cache-Control: no-store`.
- Do not deploy as part of implementation. Deployment requires separate explicit authorization.
- Do not claim GSC submission, observation, or uplift until those actions occur.

## 5. Positioning and search intent

Use a CORS troubleshooting-first narrative with a short general caching foundation. The page should satisfy these connected intents:

1. understand what `Vary` changes in HTTP cache matching;
2. decide when a dynamic `Access-Control-Allow-Origin` response needs `Vary: Origin`;
3. diagnose an origin-specific CORS failure that appears only after a cache hit;
4. distinguish a dynamic origin policy from a resource that always sends `*` or one static origin;
5. inspect the effective cache key across browser, CDN or proxy, and origin layers;
6. distinguish HTTP response caching from the browser's CORS-preflight cache;
7. use common `Vary` dimensions without unnecessary cache fragmentation;
8. understand `Vary: *`, `private`, and `no-store` without conflating them.

The article should move from one causal model to one concrete failure sequence, then to diagnostics and broader reference behavior. Avoid repeating the same warning under multiple headings.

## 6. Content architecture

Keep the existing frontmatter, `Meaning and behavior`, and `Implementation notes`, editing those two introductory sections only where necessary to remove duplication or sharpen correctness. Append the following seven sections in order.

### 6.1 `What Vary changes in cache matching`

Define the baseline in plain language:

- an HTTP cache key includes at least the request method and target URI;
- a stored response's `Vary` field names request fields that must match before that stored response can be reused without validation;
- `Vary` therefore expands the cache selection criteria commonly described as the effective cache key;
- it does not create freshness or make an otherwise uncacheable response cacheable;
- an absent nominated request field matches only another request where that field is absent, subject to the RFC's permitted normalization rules.

Use one compact general example:

```http
Vary: Accept-Encoding, Accept-Language
```

Explain that the cache may retain separate encoded and language representations for the same method and URI. Do not begin with internal implementation details or CDN vocabulary.

### 6.2 `Why dynamic Access-Control-Allow-Origin needs Vary: Origin`

Explain the decision rule before showing the failure:

- if the server selects a specific `Access-Control-Allow-Origin` value from the request's `Origin`, that request field influenced the response and must participate in cache matching;
- send `Vary: Origin` consistently on the applicable response variants, including variants where CORS permission is absent if the presence of `Access-Control-Allow-Origin` depends on `Origin`;
- validate the serialized origin against an explicit allowlist before returning it; `Vary: Origin` does not make reflection safe;
- if a resource always sends `Access-Control-Allow-Origin: *`, or always sends one static origin on CORS and non-CORS responses, and no other response property depends on `Origin`, the Fetch guidance does not require `Vary: Origin` for that CORS behavior.

Use this corrected response shape:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Cache-Control: public, max-age=300
Content-Type: application/json
Vary: Origin
```

State that `public, max-age=300` is deliberate teaching data used to make shared-cache reuse observable. It is not a universal recommendation for API responses.

### 6.3 `How a missing Vary: Origin breaks cached CORS responses`

Use one public, non-personalized resource throughout: `https://api.example/public-config`. Both `https://app.example` and `https://admin.example` are on the server's allowlist.

Show the broken sequence in one bounded HTTP block:

```http
GET /public-config HTTP/1.1
Host: api.example
Origin: https://app.example

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Cache-Control: public, max-age=300
Content-Type: application/json

GET /public-config HTTP/1.1
Host: api.example
Origin: https://admin.example

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Age: 42
Cache-Control: public, max-age=300
Content-Type: application/json
```

Explain each transition explicitly:

1. the first response is selected for `https://app.example` and stored without an `Origin` variation rule;
2. a later request has the same method and URI but a different `Origin`;
3. the cache reuses the stored response, illustrated by `Age: 42`, without contacting the origin server;
4. the browser compares the second request origin with the cached `Access-Control-Allow-Origin` value;
5. the values do not match, so the CORS check fails and script cannot read the response.

Reverse order can make the application origin fail instead. Do not claim that this header-only mismatch lets the second origin read the body; the mismatched CORS permission causes browser blocking. If the representation itself also varies by `Origin` and the cache key omits that dimension, the wrong representation can be delivered. Whether that becomes a disclosure depends on the complete cache policy, CORS response, authentication, authorization, and client context. Keep that separate from the deterministic CORS failure above.

Follow with the corrected second exchange. It must use the same target and show that `Vary: Origin` causes the request to miss the first origin-specific variant and obtain a matching response:

```http
GET /public-config HTTP/1.1
Host: api.example
Origin: https://admin.example

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://admin.example
Cache-Control: public, max-age=300
Content-Type: application/json
Vary: Origin
```

Mention rollout behavior: adding `Vary: Origin` to new responses does not necessarily remove an already stored response that omitted it. Purge, invalidate, or wait for the old entry to expire according to the actual cache deployment before judging the fix.

### 6.4 `Debug Vary and the effective cache key`

Provide an ordered diagnostic sequence:

1. reproduce with the same method and URL while changing only `Origin`;
2. inspect the final response after redirects, CDN or reverse-proxy rules, and application middleware;
3. compare `Access-Control-Allow-Origin`, `Vary`, `Age`, `Cache-Control`, and implementation-specific cache-status evidence;
4. verify that the origin application validates the request origin and emits the expected response before caching;
5. verify that each cache layer honors `Vary: Origin` or has an equivalent explicit cache-key configuration;
6. purge or expire variants created before the corrected policy;
7. repeat requests in both origin orders and confirm that each allowed origin receives its own matching permission;
8. test a disallowed origin and confirm that it does not receive CORS permission.

Include a small Markdown table with columns `Symptom`, `Likely layer`, and `Check`. Cover at least:

- the first origin works and the second fails only after a cache hit;
- the origin response is correct but the public response lacks or changes `Vary`;
- the header is present but cache behavior does not separate origins;
- a fix appears ineffective until an old cached entry expires;
- every request misses cache because the variation set is unnecessarily broad.

Use “effective cache key” as deployment language, while preserving the RFC model: a stored response's `Vary` value governs whether nominated request fields match. Do not promise that every CDN automatically honors every `Vary` field; tell readers to verify the actual cache configuration.

### 6.5 `HTTP response cache vs CORS preflight cache`

Separate the two mechanisms in a compact table:

| Mechanism | Stores | Controlled here by | Main purpose |
|---|---|---|---|
| HTTP cache | HTTP responses and representations | `Cache-Control`, freshness rules, validators, and `Vary` matching | Reuse a response when it is fresh or successfully validated and matches the request |
| CORS-preflight cache | Browser CORS permission entries | `Access-Control-Max-Age` and the Fetch preflight-cache rules | Avoid repeating eligible `OPTIONS` permission checks |

State explicitly:

- `Vary: Origin` does not set the lifetime of a preflight permission;
- `Access-Control-Max-Age` does not make an actual `GET` or other response fresh in an HTTP cache;
- clearing a CDN cache does not necessarily clear a browser's preflight cache;
- a developer can therefore fix one cache layer and still observe state retained by the other.

Avoid describing the preflight cache as an ordinary HTTP cache. Do not add detailed browser-specific maximum lifetimes.

### 6.6 `Common Vary patterns and cache fragmentation`

Explain only the most useful general patterns:

- `Vary: Accept-Encoding` separates compressed and uncompressed representations;
- `Vary: Accept-Language` separates language-selected representations;
- `Vary: Origin` separates responses whose CORS metadata or representation selection depends on the request origin;
- a comma-separated value can combine real dimensions, for example `Vary: Accept-Encoding, Origin`.

Explain cost clearly: every meaningful combination can reduce the cache hit rate and increase stored variants. Add only request fields that can influence selection. High-cardinality fields such as `User-Agent`, `Cookie`, or request identifiers can make reuse ineffective and should trigger a review of the representation and cache design, not automatic inclusion.

Explain that validators such as `ETag` must identify the selected representation correctly. A conditional request and its validator do not remove the need for correct variant selection.

### 6.7 `Vary: * vs private and no-store`

Define each mechanism without shorthand:

- a stored response whose `Vary` value contains `*` never matches a later request under RFC 9111;
- `Vary: *` does not prohibit storage and is not equivalent to `Cache-Control: no-store`;
- `Cache-Control: private` controls storage by shared caches while allowing private caches under the directive's rules;
- `Cache-Control: no-store` tells caches not to store the response under the directive's rules.

State that an origin server can generate `Vary: *`, while RFC 9110 says a proxy must not generate it. Do not recommend `Vary: *` as the routine solution for uncertain cache behavior. If a response is personalized, privileged, or unsafe to retain, choose an appropriate cache policy rather than attempting to enumerate identity-bearing fields in `Vary`.

Close with the security boundary: `Vary` protects response selection, not access control. Authentication, authorization, tenant isolation, origin allowlisting, safe response construction, and cacheability decisions remain independent requirements.

## 7. Accuracy and language guardrails

- Describe `Vary` as response metadata that affects later cache matching, not as a request header clients should set to choose content.
- Prefer “nominated request fields must match” over the oversimplification “the field value is always concatenated into a cache key.”
- Keep cache storage, freshness, matching, validation, and CORS checks as distinct steps.
- State that `Vary: Origin` is required by the dynamic response-selection condition, not by the mere presence of any CORS request.
- Explain the static exceptions exactly: no `Vary: Origin` is needed for CORS when `Access-Control-Allow-Origin` is always `*` or one static origin on every applicable response and nothing else varies by `Origin`.
- Never recommend blindly reflecting `Origin`. Validate against an explicit allowlist first.
- Do not call `Origin` an authentication credential or identity proof.
- Do not assert that `Age` is guaranteed to be present in every cache deployment; use it only as evidence in the teaching example and one possible production diagnostic.
- Do not equate a browser CORS failure with prevention of the underlying HTTP request or with server-side authorization.
- Do not imply that `Vary: Origin` alone makes publicly caching authenticated or user-specific responses safe.
- Do not conflate the HTTP cache with the Fetch CORS-preflight cache.
- Do not claim `Vary: *` prevents storage.

## 8. Frontmatter and internal linking

Preserve the existing `headerName`, description, applicability, syntax, examples, use cases, common mistakes, security consideration, and references unless a factual correction is required during implementation review.

Replace `relatedHeaders` with this exact ordered set:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-max-age
  - cache-control
  - etag
  - content-encoding
```

Use contextual internal links in the body where they answer the reader's next question:

- `Access-Control-Allow-Origin` for origin permission and allowlist behavior;
- `Access-Control-Max-Age` for browser preflight caching;
- `Cache-Control` for storage and freshness directives;
- `ETag` for representation validators;
- `Content-Encoding` for the common `Accept-Encoding` negotiation path;
- the HTTP Headers Checker CTA through the existing renderer.

Do not add a navigation component or CORS Journey hub in this task.

## 9. Source-contract testing

Add one focused Vitest contract to `src/lib/headerContentContract.test.ts`. Treat the Markdown as the published product artifact and protect behavior rather than arbitrary word count.

The contract should verify:

- the exact five-item `relatedHeaders` array using the existing complete-field parser;
- all seven approved H2 headings exist once and in order;
- the broken and corrected examples use the same `/public-config` target;
- the broken sequence contains both allowed request origins, reuses the first origin's `Access-Control-Allow-Origin`, includes cache evidence, and omits `Vary: Origin` from the cached response;
- the corrected response contains the second origin's matching `Access-Control-Allow-Origin` and `Vary: Origin`;
- the prose states that the deterministic outcome of the mismatched header is browser CORS failure, not automatic body disclosure;
- dynamic allowlist validation, static `*`/static-origin exceptions, stale-entry invalidation, and custom cache-key verification are present;
- `Vary`, `Cache-Control`, `Access-Control-Max-Age`, `private`, `no-store`, and `Vary: *` remain semantically distinct;
- the general examples cover `Accept-Encoding`, `Accept-Language`, combined dimensions, fragmentation, and variant-correct validators;
- the guide links to the approved related headers and mentions the HTTP Headers Checker.

Prefer structural parsing and bounded code-block assertions over loose whole-file phrase checks where practical. In particular, prove that `Vary: Origin` is absent from the broken cached-response example and present in the corrected example; a global `toContain` check is insufficient.

The implementation must demonstrate RED before production-content changes and GREEN afterward. The RED failure must concern the absent approved content contract rather than test syntax, fixture loading, or parser behavior.

## 10. Verification and visual QA

Before the implementation commit, run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected baseline:

- all Vitest files and tests pass;
- ESLint reports zero errors and introduces no warnings beyond the six existing unrelated warnings;
- Astro check reports zero errors, warnings, and hints;
- Astro emits 51 static pages, including `/headers/vary/`.

Inspect the generated HTML and the production-equivalent local page at desktop and `390 × 844` mobile widths. Confirm:

- all seven H2 sections render in the approved order;
- HTTP examples use the established light code-card design;
- request/response boundaries, blank lines, and repeated exchanges remain readable;
- long lines scroll inside code cards instead of widening the document;
- Markdown tables remain readable on mobile and do not cause document-level horizontal overflow;
- all related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save QA screenshots outside the repository under `/private/tmp/vary-desktop.png` and `/private/tmp/vary-mobile.png`. Reset viewport overrides and stop the local server after inspection.

## 11. Review workflow

Use independent task review with separate spec-compliance and code/content-quality verdicts. Then run a fresh whole-branch review focused on RFC and Fetch accuracy, causal clarity, cache/CORS boundary language, bounded source-contract quality, renderer compatibility, and adherence to the no-framework/no-deploy scope.

Resolve every Critical or Important finding. Any production-content correction must first have a failing regression assertion or demonstrated failure of an existing assertion, followed by focused GREEN and affected full verification.

## 12. Roadmap completion

Only after implementation, QA, and reviews are clean:

1. change `Vary` in Wave 1 from `QUEUED` to `DONE`;
2. add the design link to its roadmap row;
3. append a completed-task row with the concrete final implementation SHA;
4. state `Awaiting deployment and URL-filtered GSC baseline.`;
5. advance `## 12. Next task` to `Content-Security-Policy`, the first P1 task in Wave 2;
6. mark implementation-plan checkboxes only when their actions are factually complete;
7. commit the roadmap update separately.

Do not mark the Wave 1 exit criterion as achieved merely because all content tasks are complete. It additionally requires coherent internal links and at least two CORS URLs receiving impressions in a rolling 28-day window.

## 13. Measurement

After an explicitly authorized deployment:

- verify HTTP 200 on both the production and Workers URLs;
- verify the seven new sections, bounded examples, and internal links in production;
- record the Cloudflare Version ID and deployment date;
- inspect or submit `/headers/vary/` in GSC when available;
- begin a URL-filtered observation period without claiming uplift prematurely.

Evaluate rolling 28-day impressions, clicks, CTR, average position, query coverage, and checker referrals according to `SEO_PLAN.md`. Track `vary origin`, `vary header`, `vary accept-encoding`, CORS-cache troubleshooting, and `Access-Control-Max-Age` distinction intent, while treating MDN-qualified queries separately from clean non-brand demand.

## 14. Acceptance criteria

The task is complete when:

- the existing guide contains the approved seven-section CORS-first expansion;
- the two-origin example demonstrates one causal cache failure and its corrected variant without overstating disclosure risk;
- dynamic versus static `Access-Control-Allow-Origin` behavior is accurate;
- HTTP cache matching, freshness, validation, CORS checks, and preflight caching are clearly separated;
- `Vary: *`, `private`, and `no-store` are described precisely;
- the exact related-header list and bounded examples are protected structurally;
- RED → GREEN evidence exists;
- focused and full checks pass with no new warnings;
- desktop and mobile QA pass with the established light code cards;
- independent reviews have no unresolved Critical or Important findings;
- the roadmap records a factual implementation SHA and advances to `Content-Security-Policy`;
- no deployment or GSC claim is made without the corresponding action.
