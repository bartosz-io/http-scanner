# Access-Control-Expose-Headers SEO Design

Date: 2026-08-13  
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)  
Status: awaiting user review

## 1. Goal

Expand the existing `/headers/access-control-expose-headers/` reference into a security-first guide to choosing which cross-origin response metadata browser JavaScript may read. The page should explain the common symptom that a response field is visible in browser network tooling while `response.headers.get()` returns `null`, then teach the reader to expose only the bounded metadata the approved frontend actually needs.

The 2026-08-07 GSC export contains no page- or query-level signal for this header. This is therefore a P1 CORS-cluster authority task rather than a response to proven demand on the URL. Its role is to complete the response-visibility stage after the origin, credentials, method, request-header, and preflight-cache guides while creating a coherent internal path toward `Vary` and the future CORS Journey hub.

## 2. Non-goals

- Do not change the route, canonical URL behavior, generated title, or current frontmatter description.
- Do not add JSON-LD, client directives, interactive components, new routes, dependencies, or a CORS rules engine.
- Do not add Express, Nginx, Apache, framework, CDN-vendor, or cloud-provider configuration snippets.
- Do not redesign the shared header-guide renderer or established light code-card styling.
- Do not imply that `Access-Control-Expose-Headers` permits request fields, repairs a failed CORS exchange, authenticates an origin, authorizes data access, sanitizes values, or restricts non-browser HTTP clients.
- Do not imply that `Set-Cookie` can become readable to browser JavaScript through an explicit list or wildcard.
- Do not deploy as part of implementation. Deployment requires separate explicit authorization.
- Do not claim GSC observation, submission, or uplift until those actions occur.

## 3. Positioning and search intent

The page uses a security-first narrative rather than a purely diagnostic or specification-first structure. It should satisfy these connected intents:

1. decide which response metadata a permitted cross-origin frontend actually needs;
2. understand why a field can appear in DevTools while `response.headers.get()` returns `null`;
3. implement an explicit exposure list for a cross-origin file download;
4. understand the exact CORS-safelisted response-header set;
5. understand wildcard behavior with and without credentials;
6. understand why `Set-Cookie` is never exposed to browser JavaScript;
7. keep response-field visibility separate from authorization, sanitization, request-header permission, and non-browser access.

The differentiator is a coherent download exchange embedded in a metadata-minimization and trust-boundary explanation. The page should answer not only “how do I make this field readable?” but also “should this frontend be allowed to read this value?”

## 4. Content architecture

Keep the existing frontmatter, `Meaning and behavior`, and `Implementation notes`. Append these seven sections in order.

### 4.1 `Expose only the response metadata your frontend needs`

Open with the security decision. `Access-Control-Expose-Headers` expands the header names retained in the CORS-filtered response that a permitted frontend can inspect. Exposure should follow a concrete application requirement, not a desire to mirror every field visible on the network.

Recommend a bounded, case-insensitive list of field names. Warn against exposing metadata merely because it is present, including:

- internal routing or upstream identity;
- server and framework versions;
- debug details or trace topology;
- identifiers that enable correlation across users, sessions, or services;
- rate-limit or quota values that reveal account state unnecessarily;
- sensitive filenames or storage metadata.

Make the risk proportional and precise: exposure is not automatically a vulnerability, but it increases the data surface available to every browser application allowed by the effective CORS policy. The server must authorize the underlying response and construct each field value safely before exposure is considered.

### 4.2 `Cross-origin download with Content-Disposition and ETag`

Use one credentialed file-download example throughout the guide. Browser code at `https://app.example` requests a PDF from `https://files.example`:

```js
const response = await fetch('https://files.example/reports/quarterly.pdf', {
  credentials: 'include',
});

const disposition = response.headers.get('Content-Disposition');
const etag = response.headers.get('ETag');
const setCookie = response.headers.get('Set-Cookie');
```

Show the matching successful actual response:

```http
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

Explain the observable results after a successful CORS check:

- `disposition` contains `attachment; filename="quarterly-report.pdf"`;
- `etag` contains `"report-v7"`;
- `setCookie` is `null` because `Set-Cookie` is a forbidden response-header name.

State that the response uses an explicit origin and `Access-Control-Allow-Credentials: true` because this Fetch request uses credentials mode `include`. `Vary: Origin` is needed when the allowed origin can vary and a shared cache may store the response. Keep these origin, credentials, and cache requirements distinct from response-header exposure itself.

The example must not display a real session identifier or imply that reading `Set-Cookie` is required for cookie processing. A compatible browser can process an allowed cookie independently of exposing the field to JavaScript.

### 4.3 `Fix “visible in Network, but response.headers.get() returns null”`

Explain that browser network tooling can display the internal network response while Fetch exposes a CORS-filtered response to application JavaScript. A successful response and readable body do not make every response field visible through the `Headers` API.

Provide this diagnostic sequence:

1. confirm that the overall CORS exchange succeeds and the expected body is available;
2. inspect the exact final response, after redirects, CDN rules, proxies, authentication, and error handling;
3. confirm the desired field is actually present on that final response;
4. check whether its name belongs to the CORS-safelisted response-header set;
5. otherwise confirm the actual response lists its name in `Access-Control-Expose-Headers`;
6. verify the exposure field was not attached only to a preflight response or another route/status variant;
7. remember that header-name matching is ASCII case-insensitive even though application spelling should remain consistent.

Distinguish an absent field from a present-but-filtered field. Both can make `Headers.get()` return `null`, so debugging must inspect the network response and the effective CORS exposure policy together.

### 4.4 `CORS-safelisted response headers`

List the exact current Fetch safelist:

- `Cache-Control`;
- `Content-Language`;
- `Content-Length`;
- `Content-Type`;
- `Expires`;
- `Last-Modified`;
- `Pragma`.

Explain that these response-header names are readable after a successful CORS exchange without being repeated in `Access-Control-Expose-Headers`. `Content-Disposition` and `ETag` are not in this safelist, so the download example must expose them explicitly.

Do not confuse this response-header-name safelist with the CORS-safelisted request-header rules. The request safelist answers whether a request field can participate in a simple request under value restrictions; the response safelist answers which response names survive CORS filtering for script access.

### 4.5 `Wildcard and credentialed requests`

Explain both cases explicitly:

- for a request whose credentials mode is not `include`, `Access-Control-Expose-Headers: *` exposes all response header names except forbidden response-header names;
- when credentials mode is `include`, `*` is treated as the literal field name `*`, not as a wildcard, so required names such as `Content-Disposition` and `ETag` must be listed explicitly.

Recommend explicit names even for non-credentialed security-sensitive APIs because a bounded list documents the intended frontend contract and avoids exposing newly added operational fields by accident.

Keep the exposure wildcard separate from `Access-Control-Allow-Origin: *`. They are different response fields with different checks, although credentials mode affects both. Do not imply that adding `Access-Control-Allow-Credentials: true` changes a request's credentials mode; the client request determines that mode.

### 4.6 `Why Set-Cookie cannot be exposed`

State that `Set-Cookie` and legacy `Set-Cookie2` are forbidden response-header names under Fetch. A CORS-filtered response excludes them from browser JavaScript access even when:

- `Set-Cookie` is explicitly named in `Access-Control-Expose-Headers`;
- `Access-Control-Expose-Headers: *` has wildcard semantics;
- the cookie is otherwise accepted and processed by the browser;
- the response uses `Access-Control-Allow-Credentials: true`.

Clarify the security and API boundaries:

- `HttpOnly` protects a stored cookie from script access through cookie APIs, but the Fetch response-header prohibition applies to the `Set-Cookie` field name itself;
- exposing `Set-Cookie` is not a method for discovering whether a cookie was stored;
- frontend code should receive any required non-secret state through an intentionally designed response body or another explicitly exposed, non-sensitive field;
- do not duplicate session tokens or cookie values into an exposed custom response field.

### 4.7 `Exposure is not authorization or data sanitization`

Close with explicit boundaries. `Access-Control-Expose-Headers` controls which non-forbidden response field names a browser script can inspect after a successful CORS exchange. It does not:

- authorize the request or decide which record the caller may receive;
- redact or validate an exposed value;
- make a denied CORS response readable;
- grant permission to send similarly named request fields;
- conceal ordinary response fields from curl, server-to-server clients, proxies, extensions, or other non-browser tooling;
- guarantee that an intermediary did not add, remove, or rewrite a field.

Require authentication, authorization, tenant isolation, value validation, response minimization, and safe logging independently. Link `Access-Control-Allow-Headers` as the opposite request direction: it authorizes proposed request-field names during CORS checks, while `Access-Control-Expose-Headers` governs response-field visibility to script.

## 5. Related-header cluster

Replace the current related-header list with this exact ordered list:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-credentials
  - access-control-allow-headers
  - content-disposition
  - set-cookie
```

The order follows the security decision path: successful origin sharing, credentialed response requirements, the opposite request-header direction, the primary download use case, and the forbidden cookie boundary. Tests must parse and compare the complete frontmatter field so an extra item hidden after a blank line or YAML comment cannot pass an apparent exact-list assertion.

## 6. Technical accuracy constraints

- Treat the Fetch response visible to JavaScript as a CORS-filtered response, not as the complete internal network response.
- Require a successful CORS exchange before discussing exposure of the selected response fields.
- Keep the actual response and any preflight response separate; exposure belongs to the response whose fields script needs to read.
- Preserve the exact seven-name CORS-safelisted response-header set from the current Fetch Standard.
- Keep response safelisting separate from request-header safelisting and its value restrictions.
- Describe `*` as a wildcard only when credentials mode is not `include`; with `include`, it is a literal field name.
- Never claim that explicit listing or wildcard exposure makes `Set-Cookie` or `Set-Cookie2` readable.
- Do not conflate cookie processing, `HttpOnly`, credentials mode, `Access-Control-Allow-Credentials`, and response-header exposure.
- Do not imply that exposure validates or sanitizes values.
- Do not imply that CORS limits direct HTTP clients or other non-browser observers.

Primary semantics must be checked against the [Fetch Standard response-header definitions](https://fetch.spec.whatwg.org/#cors-safelisted-response-header-name), [forbidden response-header names](https://fetch.spec.whatwg.org/#forbidden-response-header-name), [CORS new-header syntax](https://fetch.spec.whatwg.org/#http-new-header-syntax), and [CORS processing algorithm](https://fetch.spec.whatwg.org/#main-fetch).

## 7. Test design

Follow strict RED → GREEN TDD in `src/lib/headerContentContract.test.ts`.

The focused source contract must protect:

- the seven exact headings and their order;
- the credentialed `fetch()` download URL and matching response context;
- the exact `Content-Disposition`, `ETag`, and `Set-Cookie` JavaScript reads;
- explicit origin, credentials, exposure list, download metadata, cookie, and `Vary: Origin` in one bounded HTTP example;
- the expected readable values for `Content-Disposition` and `ETag` and the `null` result for `Set-Cookie`;
- the DevTools/internal-response versus CORS-filtered-response explanation;
- the exact seven-name response safelist;
- `Content-Disposition` and `ETag` being outside that safelist;
- non-credentialed wildcard semantics and credentialed literal-`*` behavior;
- explicit-name guidance for the credentialed download;
- the `Set-Cookie` and `Set-Cookie2` forbidden-name rule under explicit and wildcard exposure;
- cookie processing, `HttpOnly`, and exposure as separate concepts;
- metadata minimization and unsafe operational-data examples;
- exposure versus authorization, sanitization, request-header permission, and non-browser visibility;
- the exact five-item `relatedHeaders` array using the existing complete-field parser pattern.

The bounded example assertion must prove that the JavaScript and HTTP blocks belong to the same `/reports/quarterly.pdf` flow rather than merely checking loose phrases elsewhere in the document. The RED run must fail because approved content is absent, not because of a syntax, fixture, or parser error. After GREEN, run the focused guide test and the CORS-category source validation.

## 8. Verification and QA

Before the implementation commit, run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected baseline:

- all Vitest files and tests pass;
- ESLint reports zero errors and only the six existing unrelated warnings;
- Astro check reports zero errors, warnings, and hints;
- Astro emits 51 static pages, including `/headers/access-control-expose-headers/`.

Verify the generated HTML contains all seven sections and both bounded examples. Inspect the production-equivalent local page at desktop and `390 × 844` mobile widths. Confirm:

- JavaScript and HTTP examples use the established light code-card design;
- HTTP line breaks and quoted values remain readable;
- long code lines scroll inside their cards rather than widening the document;
- the page has no horizontal document overflow;
- all five related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save QA screenshots outside the repository under `/private/tmp/access-control-expose-headers-desktop.png` and `/private/tmp/access-control-expose-headers-mobile.png`. Reset any viewport override and stop the local server after inspection.

## 9. Review workflow

Use independent task review with separate spec-compliance and quality verdicts. Then run a fresh whole-branch review focused on Fetch accuracy, security ambiguity, source-contract quality, bounded example identity, exact safelist and related-header protection, renderer compatibility, and no-framework/no-deploy scope.

Resolve every Critical or Important finding. Any production-content correction must first have a failing regression assertion or demonstrated failure of an existing assertion, followed by focused GREEN and affected full verification.

## 10. Roadmap completion

Only after implementation, QA, and reviews are clean:

1. change `Access-Control-Expose-Headers` in Wave 1 from `QUEUED` to `DONE`;
2. append a completed-task row with the concrete final implementation SHA;
3. state `Awaiting deployment and URL-filtered GSC baseline.`;
4. advance `## 12. Next task` to `Vary`, covering dynamic `Access-Control-Allow-Origin`, shared-cache variant separation, `Vary: Origin`, wildcard-origin cases, cache-key debugging, and the distinction between HTTP caching and the CORS-preflight cache;
5. mark implementation-plan checkboxes only when their actions are factually complete;
6. commit the roadmap update separately.

Do not mark the future CORS Journey as the immediate roadmap task. It remains a separate consolidation feature to design after this reference expansion; `Vary` stays next in the existing ordered Wave 1 roadmap.

## 11. Measurement

After an explicitly authorized deployment:

- verify HTTP 200 on both the production and Workers URLs;
- verify the seven new sections and both examples in production;
- record the Cloudflare Version ID and deployment date;
- submit or inspect the URL in GSC when available;
- begin a URL-filtered observation period without claiming uplift prematurely.

Evaluate rolling 28-day impressions, clicks, CTR, average position, query coverage, and checker referrals according to `SEO_PLAN.md`.

## 12. Acceptance criteria

The task is complete when:

- the existing guide contains the approved seven-section security-first expansion;
- the JavaScript and raw HTTP examples describe the same credentialed download;
- the exact response safelist, wildcard behavior, and forbidden `Set-Cookie` boundary are accurate;
- metadata exposure, authorization, sanitization, request direction, cookie processing, and non-browser visibility are clearly separated;
- the exact related-header list and bounded examples are protected structurally;
- RED → GREEN evidence exists;
- focused and full checks pass with no new warnings;
- desktop/mobile QA passes with the established light code cards;
- independent task and whole-branch reviews have no unresolved Critical or Important findings;
- the roadmap records a factual completion SHA and advances to `Vary`;
- no deployment or GSC claim is made without the corresponding action.
