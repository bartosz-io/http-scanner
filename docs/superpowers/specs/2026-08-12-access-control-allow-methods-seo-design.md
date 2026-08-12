# Access-Control-Allow-Methods SEO Design

Date: 2026-08-12  
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)  
Status: approved in conversation on 2026-08-12; awaiting written-spec review

## 1. Goal

Expand the existing `/headers/access-control-allow-methods/` reference page into a framework-neutral CORS preflight troubleshooting guide. The page must explain how a browser proposes an actual request method, how the preflight response grants that method, why method-related preflights fail, and why CORS permission remains separate from route support and server authorization.

The task preserves the current URL, Astro content collection, generated title, frontmatter description, and `HeaderGuidePage.astro` rendering path. It introduces no route, component, checker, schema markup, dependency, or framework-specific configuration tutorial.

## 2. Evidence

### GSC evidence

Source: `outputs/httpscanner.com-Performance-on-Search-2026-08-07/`, covering 2026-05-24 through 2026-08-05.

`/headers/access-control-allow-methods/` does not appear in the page-level export and no clean query-level row targets the header directly. This is therefore a P1 cluster-building task rather than a P0 optimization backed by existing page-level impressions.

The roadmap makes it the next eligible Wave 1 task after `Access-Control-Allow-Credentials`. It fills the method-authorization step already referenced by the expanded `Access-Control-Allow-Origin` and `Access-Control-Max-Age` guides.

### Current SERP pattern

Current reference and troubleshooting results commonly cover:

- the relationship between `Access-Control-Request-Method` and `Access-Control-Allow-Methods`;
- complete `OPTIONS` preflight exchanges;
- browser errors such as “Method PUT is not allowed by Access-Control-Allow-Methods”;
- missing CORS fields on preflight responses;
- the distinction between CORS-safelisted methods and requests that avoid preflight;
- wildcard behavior with and without credentials;
- the difference between `Access-Control-Allow-Methods` and `Allow`;
- framework or proxy layers that answer `OPTIONS` differently from the application route.

The opportunity is to provide the same troubleshooting depth without coupling the page to Express, Nginx, API Gateway, or another implementation stack.

## 3. Sources of technical truth

Resolve technical conflicts in this order:

1. [Fetch Standard — CORS-preflight fetch](https://fetch.spec.whatwg.org/#cors-preflight-fetch)
2. [Fetch Standard — CORS protocol and credentials](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials)
3. [Fetch Standard — methods](https://fetch.spec.whatwg.org/#methods)
4. [MDN — Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Methods)
5. [MDN — CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
6. [MDN — Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
7. [RFC 9110 — Allow](https://www.rfc-editor.org/rfc/rfc9110.html#name-allow)

The guide must describe Fetch behavior rather than infer protocol rules from one framework or browser console message. Any browser-specific method-normalization behavior is an implementation detail and does not belong in this iteration.

## 4. Approach decision

### Option A — minimal reference expansion

Add a short method list, one `OPTIONS` example, and a wildcard note.

Trade-off: small change, but insufficient for the observed troubleshooting intent and weak as a cluster destination.

### Option B — framework-neutral preflight troubleshooting guide

Add a coherent `fetch()` and raw HTTP exchange, error diagnosis, safelisted-method nuance, wildcard/credentials behavior, and clear boundaries between CORS, route support, and authorization.

Decision: use Option B. It provides durable technical coverage while preserving the established reference-page architecture.

### Option C — framework-specific configuration guide

Add Express, Nginx, API Gateway, or cloud-provider snippets.

Trade-off: broader implementation long-tail, but multiple stacks compete for space on one URL, configuration ages quickly, and copied global method lists can create unsafe policy.

## 5. Search intent

### Primary intent

Answer: “How does `Access-Control-Allow-Methods` approve a CORS preflight, and why does the browser say my method is not allowed?”

### Secondary intents

- What does `Access-Control-Request-Method` mean?
- Does `OPTIONS` need to appear in `Access-Control-Allow-Methods`?
- Why can a `POST` request still trigger a preflight?
- Is method matching case-sensitive?
- What does `Access-Control-Allow-Methods: *` mean with credentials?
- How is this field different from `Allow` and a `405 Method Not Allowed` response?
- Does permitting `PUT` or `DELETE` through CORS authorize the operation?

## 6. Content design

Preserve the existing `Meaning and behavior` and `Implementation notes` sections, refining wording only where required for accuracy and consistency. Append four focused sections.

### CORS preflight method exchange

Include a framework-neutral client example:

```js
fetch('https://api.example/items/42', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'updated' }),
});
```

Pair it with a raw preflight exchange:

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

Explain that:

- the browser generates the preflight and `Access-Control-Request-Method` from the intended actual request;
- the response must grant the proposed actual method and satisfy the origin and requested-header checks;
- `OPTIONS` is the preflight transport method, not automatically the method being requested for the actual operation;
- after a successful preflight, the browser can send the actual `PUT`, which still needs normal server controls;
- a failed preflight prevents the browser from sending that non-simple actual request, while non-browser clients are not governed by browser CORS enforcement.

### Common Access-Control-Allow-Methods errors

Cover these failure modes:

- the response omits `Access-Control-Allow-Methods` when the proposed non-safelisted method needs permission;
- the requested method is absent from the returned list;
- method spelling or casing does not match the required Fetch comparison behavior;
- a proxy, redirect, authentication layer, or generic error handler answers `OPTIONS` without the required CORS fields;
- the server adds the right method to the actual response but not the preflight response;
- the developer adds `OPTIONS` to the list but still omits the actual proposed method;
- one permissive global list advertises operations that individual resources do not safely expose cross-origin;
- a stale CORS-preflight cache delays observation of a changed method policy.

The diagnostic sequence should tell readers to inspect the preflight `OPTIONS` request, identify its `Origin`, `Access-Control-Request-Method`, and optional `Access-Control-Request-Headers`, then inspect the exact public response before debugging the later route handler.

### Wildcard, credentials, and safelisted methods

Explain that `Access-Control-Allow-Methods: *` has wildcard semantics only for requests without credentials. When the request credentials mode is `include`, `*` is treated as the literal method name `*`, so credentialed APIs should return explicit permitted methods.

Explain that `GET`, `HEAD`, and `POST` are CORS-safelisted methods. This does not mean every request using one of them avoids preflight: non-safelisted request headers or a non-safelisted `Content-Type` can still trigger preflight. Conversely, the guide must not imply that adding these method names to the response makes an otherwise non-simple request simple.

Avoid a universal “list every method” recommendation. The response should reflect the narrow cross-origin operations supported by the target resource and trusted origin policy.

### Access-Control-Allow-Methods vs Allow and authorization

Explain that:

- `Access-Control-Allow-Methods` is browser CORS permission metadata for a preflight;
- `Allow` describes methods supported by a resource and is associated with general HTTP semantics such as `OPTIONS` and `405`;
- a resource can advertise or support a method in HTTP terms while not granting it to a cross-origin browser caller;
- a CORS grant does not prove the route exists, authenticate the caller, authorize the target object, validate the body, or provide CSRF protection;
- the actual method must enforce the same server-side controls for browser and non-browser callers.

## 7. Technical boundaries

- `Access-Control-Request-Method` names one proposed actual request method; `Access-Control-Allow-Methods` returns a comma-separated method list.
- Do not tell developers to set `Access-Control-Request-Method` manually in browser JavaScript; the browser controls CORS preflight fields.
- `OPTIONS` is the method used for the preflight request and is not a substitute for granting the proposed actual method.
- `GET`, `HEAD`, and `POST` are CORS-safelisted methods, but method alone does not determine whether the full request is CORS-safelisted.
- Wildcard method semantics depend on credentials mode; with credentials included, `*` is a literal method name.
- Method matching must follow Fetch rules. Avoid broad statements that all method comparison is universally case-insensitive.
- A successful preflight is permission for browser CORS processing, not proof of route support or application authorization.
- A failed preflight blocks the non-simple actual request in a conforming browser; do not generalize that statement to simple requests or non-browser clients.
- `Access-Control-Max-Age` can retain earlier method grants, so policy changes may not appear immediately in a browser.
- Do not recommend putting CORS middleware before authentication as a universal rule. Preflight handling can be unauthenticated only when the returned policy is safe and reveals no protected data.

## 8. Internal linking

Set the guide's `relatedHeaders` to:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-headers
  - access-control-allow-credentials
  - access-control-max-age
```

Reasons:

- `Access-Control-Allow-Origin` grants the requesting origin;
- `Access-Control-Allow-Headers` grants non-safelisted request field names announced by the same preflight;
- `Access-Control-Allow-Credentials` explains credentialed CORS and wildcard restrictions;
- `Access-Control-Max-Age` explains reuse and delayed expiration of preflight method permission.

Existing incoming links from `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`, and `Access-Control-Max-Age` remain. No navigation-component change is required.

## 9. Metadata decision

Keep the generated title:

`Access-Control-Allow-Methods HTTP Header — Syntax & Examples | HTTP Scanner`

Keep the current frontmatter description. No page-level GSC evidence demonstrates a snippet problem, so this iteration should build cluster depth and indexing signals before testing metadata.

## 10. Testing design

Follow the established source-contract pattern in `src/lib/headerContentContract.test.ts`.

Add one focused test that reads `access-control-allow-methods.md` and asserts meaningful coverage of:

- `## CORS preflight method exchange`;
- `## Common Access-Control-Allow-Methods errors`;
- `## Wildcard, credentials, and safelisted methods`;
- `## Access-Control-Allow-Methods vs Allow and authorization`;
- `method: 'PUT'`;
- `OPTIONS /items/42 HTTP/1.1`;
- `Access-Control-Request-Method: PUT`;
- `Access-Control-Allow-Methods: GET, PUT`;
- `Access-Control-Request-Headers: content-type` and matching allowed-header permission;
- `Access-Control-Allow-Origin: https://app.example` and `Vary: Origin`;
- the distinction between `OPTIONS` and the proposed actual method;
- safelisted method nuance for `GET`, `HEAD`, and `POST`;
- wildcard behavior under credentials mode `include`;
- exact method matching without a blanket case-insensitive claim;
- the distinction from `Allow` and `405`;
- independent authentication, object-level authorization, validation, and CSRF protection;
- preflight-cache effects through `Access-Control-Max-Age`.

The test should also protect the exact four-item related-header block because the previous CORS task identified that omission as a non-blocking regression-test gap.

### TDD sequence

1. Add the focused source-contract test.
2. Run it and verify RED from missing sections and distinctions.
3. Expand the Markdown minimally until the focused test passes.
4. Refine wording while keeping the focused and CORS-category contracts green.
5. Run the complete test suite, lint, production build, and `git diff --check`.
6. Inspect the rendered page on desktop and at `390 × 844`, including internal horizontal scrolling for the preflight exchange.

## 11. Acceptance criteria

- The existing URL and canonical behavior are unchanged.
- The page clearly targets preflight method permission and troubleshooting.
- The `fetch()` example and raw HTTP exchange describe the same `PUT` operation.
- The guide distinguishes the preflight `OPTIONS` method from the proposed actual method.
- Wildcard and credentials behavior is technically correct.
- Safelisted methods are not confused with a guarantee that the complete request avoids preflight.
- Custom and non-safelisted method matching is described without an unsafe universal casing simplification.
- `Access-Control-Allow-Methods`, `Allow`, route support, and server authorization remain distinct.
- The four related-header links render and resolve.
- The focused contract demonstrates RED then GREEN and protects the exact related-header list.
- Full tests, lint, Astro check/build, and diff checks pass without new errors or warnings.
- Desktop and narrow examples use the established light code-card design without page overflow.
- Independent technical review has no unresolved Critical or Important findings.
- The implementation plan and `SEO_PLAN.md` are marked complete only after implementation verification.
- Deployment is performed only after explicit user authorization.

## 12. Measurement

Baseline for the 2026-08-07 export:

- page-level clicks: not present in export;
- page-level impressions: not present in export;
- direct query-level impressions: not present in export.

After deployment:

1. inspect or submit `/headers/access-control-allow-methods/` in GSC;
2. record the deployment and observation start date in `SEO_PLAN.md`;
3. compare URL-filtered clicks, impressions, CTR, and average position after 14 and 21 days;
4. monitor non-brand impressions for `access control allow methods`, `method not allowed CORS`, `OPTIONS preflight`, `Access-Control-Request-Method`, and wildcard/credentials intent;
5. record checker referrals from the landing page;
6. preserve the URL and iterate instead of creating a competing preflight-method guide.

An early success is page-level appearance in GSC plus continued growth of rolling 28-day impressions across the CORS cluster. Metadata testing becomes eligible only after the page reaches positions 4–10 with CTR below 4%.
