# Access-Control-Allow-Headers SEO Design

Date: 2026-08-12  
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)  
Status: approved in conversation on 2026-08-12; awaiting written-spec review

## 1. Goal

Expand the existing `/headers/access-control-allow-headers/` reference into a framework-neutral troubleshooting guide for CORS request-header preflight failures. The page should target the practical intent behind errors such as “Request header field Authorization is not allowed by Access-Control-Allow-Headers” while preserving the existing URL, metadata, content collection, renderer, and visual system.

The 2026-08-07 GSC export contains no page- or query-level signal for this header. This is therefore a P1 CORS-cluster authority task, not a response to proven demand on the URL. Its purpose is to complete the browser preflight journey after `Access-Control-Allow-Methods` and create a strong internal path to the next guide, `Access-Control-Expose-Headers`.

## 2. Non-goals

- Do not change the route, canonical URL behavior, generated title, or current frontmatter description.
- Do not add JSON-LD, client directives, interactive components, new routes, or dependencies.
- Do not add Express, Nginx, Apache, framework, CDN-vendor, or cloud-provider configuration snippets.
- Do not redesign the shared header-guide renderer or code highlighting.
- Do not imply that CORS validates header values, authenticates callers, authorizes operations, or constrains non-browser clients.
- Do not deploy as part of implementation. Deployment requires separate explicit authorization.
- Do not claim GSC observation or submission until it occurs.

## 3. Search intent and positioning

The page should satisfy four connected intents:

1. understand how `Access-Control-Request-Headers` and `Access-Control-Allow-Headers` participate in preflight;
2. fix the browser error that a request header field is not allowed;
3. understand wildcard, credentials, `Authorization`, and CORS-safelisted value restrictions;
4. distinguish permission for request-header names from value validation and response-header exposure.

The guide remains a neutral protocol reference. Its differentiator is one coherent browser-to-server exchange plus precise troubleshooting and security boundaries, not framework recipes.

## 4. Content architecture

Keep the existing frontmatter, `Meaning and behavior`, and `Implementation notes`. Append these four sections in order.

### 4.1 `CORS preflight request-header exchange`

Start with browser code that defines the intended actual request:

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

State explicitly that application JavaScript defines the intended method and request fields, but the browser creates `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers` when preflight is required. Developers should not try to set those browser-controlled preflight fields manually.

Show the matching raw HTTP exchange:

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

Explain that the preflight announces normalized request-field names, not future field values. The actual `POST` is sent only after the origin, method, and requested field names pass their respective CORS checks. The actual route must still authenticate the bearer token, authorize the operation, parse and validate the JSON body, apply body-size limits, and enforce any other server policy.

### 4.2 `Fix “Request header field … is not allowed”`

Make this the primary troubleshooting section. Tell the reader to inspect the browser-generated `OPTIONS` request and the exact public response, then compare every name in `Access-Control-Request-Headers` with what is authorized by `Access-Control-Allow-Headers`.

Cover these failure modes:

- the response field is absent when a requested non-safelisted field name needs authorization;
- one requested name, commonly `authorization`, `content-type`, `x-api-key`, or another custom field, is missing;
- CORS fields are attached only to the later actual response rather than the preflight response;
- a proxy, redirect, authentication layer, CDN, or generic error handler answers `OPTIONS` before the intended CORS policy runs;
- the client mistakenly sends response fields such as `Access-Control-Allow-Origin` or `Access-Control-Allow-Headers` as request headers, causing those names themselves to appear in the preflight request;
- an earlier grant or denial appears stale because the preflight result is cached through `Access-Control-Max-Age`.

Header-name matching is ASCII case-insensitive, so diagnostics should compare names rather than presentation casing. The guide should recommend a bounded allowlist. Reflection is acceptable only after every requested name has been checked against that allowlist; arbitrary reflection is not an authorization policy.

### 4.3 `Wildcard, Authorization, and safelisted value restrictions`

Explain all of the following without collapsing them into one rule:

- `Access-Control-Allow-Headers: *` has wildcard semantics for requests without credentials;
- when credentials mode is `include`, `*` is treated as the literal field name `*`, so required names must be listed explicitly;
- `Authorization` is a non-wildcard request-header name and must always be listed explicitly, including for requests without credentials;
- an application-supplied `Authorization` field does not by itself mean Fetch credentials mode is `include`; these are separate concepts even though both affect the wildcard discussion;
- CORS-safelisted request-header names are ordinarily allowed without being listed, but only while their values satisfy the Fetch safelist restrictions;
- `Content-Type` is safelisted only for the permitted media-type essences (`application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`) and applicable byte restrictions, so `Content-Type: application/json` participates in the preflight example;
- listing a safelisted field name in `Access-Control-Allow-Headers` can authorize it beyond its additional safelist restrictions; this does not make the value valid for the application.

Recommend explicit field names for credentialed or security-sensitive APIs. Do not recommend broad wildcard policies merely to silence browser errors.

### 4.4 `Allowed names vs trusted values and response exposure`

Clarify that `Access-Control-Allow-Headers` authorizes request-field names for a browser CORS check. It does not validate a bearer token, media type, API key, tenant identifier, signature, tracing value, or custom metadata.

Warn against allowing client-controlled forwarding, internal identity, or routing fields merely because trusted proxy middleware normally sets them. The server must reject or overwrite such values at the correct trust boundary.

Distinguish request direction from response direction: `Access-Control-Allow-Headers` does not make response fields readable to JavaScript. `Access-Control-Expose-Headers` controls access to non-safelisted response fields and should be the next internal journey step.

State that a failed preflight prevents a conforming browser from sending this non-simple actual request, but does not block direct HTTP clients. Simple requests can also reach the server under their own rules. Authentication, authorization, validation, rate limiting, and CSRF defenses remain server responsibilities.

## 5. Related-header cluster

Replace the current related-header list with this exact ordered list:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-methods
  - access-control-allow-credentials
  - access-control-expose-headers
  - access-control-max-age
```

The order follows the troubleshooting journey: origin, method, credentials, response exposure, and cache lifetime. Tests must parse and compare the complete frontmatter field so an extra item hidden after a blank line or YAML comment cannot pass an apparent exact-list assertion.

## 6. Technical accuracy constraints

- Do not claim JavaScript sets `Access-Control-Request-Headers`; the browser creates it.
- Keep the preflight `OPTIONS` transport separate from the actual `POST`.
- Do not equate a safelisted field name with an unrestricted value.
- Do not describe wildcard behavior without both the credentials-mode limitation and the special `Authorization` rule.
- Do not imply header-name casing changes permission semantics.
- Keep name authorization separate from value parsing, authentication, authorization, proxy trust, and response exposure.
- Do not imply a successful preflight proves the actual route exists or will accept the request.
- Do not imply CORS protects an API from non-browser clients.

Primary semantics should be checked against the [Fetch Standard](https://fetch.spec.whatwg.org/#http-new-header-syntax), the [Fetch CORS-preflight algorithm](https://fetch.spec.whatwg.org/#cors-preflight-fetch), and [MDN Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Headers). The error-oriented section should align with [MDN’s missing-token diagnostic](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSMissingAllowHeaderFromPreflight).

## 7. Test design

Follow strict RED → GREEN TDD in `src/lib/headerContentContract.test.ts`.

The focused contract must protect:

- the four exact headings and their order;
- the `fetch()` request and matching `POST /items` preflight exchange;
- browser ownership of `Access-Control-Request-Headers`;
- the exact `authorization, content-type` request list and matching allow response;
- the primary browser error wording and preflight-response diagnostic path;
- the client mistake of sending `Access-Control-Allow-*` response fields as request fields;
- case-insensitive field-name matching and bounded allowlist behavior;
- non-credentialed wildcard semantics, credentialed literal-`*` behavior, and the explicit `Authorization` exception;
- safelisted-name value restrictions and `application/json` behavior;
- name authorization versus value validation and proxy trust;
- `Access-Control-Allow-Headers` versus `Access-Control-Expose-Headers`;
- failed-preflight suppression of the actual request and the non-browser limitation;
- the exact five-item `relatedHeaders` frontmatter array using the existing complete-field parser pattern.

The RED run must fail because approved content is absent, not because of a syntax, fixture, or parser error. After GREEN, run the focused guide test and the CORS-category content validation.

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
- Astro emits 51 static pages, including `/headers/access-control-allow-headers/`.

Verify the generated HTML contains all four sections and the intended exchange. Inspect the production-equivalent local page at desktop and `390 × 844` mobile widths. Confirm:

- JavaScript and HTTP examples use the established light code-card design;
- HTTP line breaks remain readable;
- long code lines scroll inside their cards rather than widening the document;
- the page has no horizontal document overflow;
- all five related-header links resolve;
- the HTTP Headers Checker CTA remains present.

Save QA screenshots outside the repository under `/private/tmp` and stop the local server after inspection.

## 9. Review workflow

Use independent task review with separate spec-compliance and quality verdicts. Then run a fresh whole-branch review focused on Fetch accuracy, security ambiguity, source-contract quality, exact related-header protection, renderer compatibility, and scope.

Resolve every Critical or Important finding. Any production-content correction must first have a failing regression assertion or demonstrated failure of an existing assertion, followed by focused GREEN and affected full verification.

## 10. Roadmap completion

Only after implementation, QA, and reviews are clean:

1. change `Access-Control-Allow-Headers` in Wave 1 from `QUEUED` to `DONE`;
2. append a completed-task row with the concrete final implementation SHA;
3. state `Awaiting deployment and URL-filtered GSC baseline.`;
4. advance `## 12. Next task` to `Access-Control-Expose-Headers`, covering response-header readability, the CORS-safelisted response-header set, wildcard/credentials behavior, `Set-Cookie` exclusion, and browser debugging;
5. mark implementation-plan checkboxes only when their actions are factually complete;
6. commit the roadmap update separately.

## 11. Measurement

After an explicitly authorized deployment:

- verify HTTP 200 on both the production and Workers URLs;
- verify the four new sections and both code blocks in production;
- record the Cloudflare Version ID and deployment date;
- submit or inspect the URL in GSC when available;
- begin a URL-filtered observation period without claiming uplift prematurely.

Evaluate rolling 28-day impressions, clicks, CTR, average position, query coverage, and checker referrals according to `SEO_PLAN.md`.

## 12. Acceptance criteria

The task is complete when:

- the existing guide contains the approved four-section troubleshooting expansion;
- the browser/client and raw HTTP examples describe the same request;
- wildcard, credentials, `Authorization`, and safelisted-value semantics are accurate;
- request-name permission, value trust, and response exposure are clearly separated;
- the exact related-header list is protected structurally;
- RED → GREEN evidence exists;
- focused and full checks pass with no new warnings;
- desktop/mobile QA passes with the established light code cards;
- independent task and whole-branch reviews have no unresolved Critical or Important findings;
- the roadmap records a factual completion SHA and advances to `Access-Control-Expose-Headers`;
- no deployment or GSC claim is made without the corresponding action.
