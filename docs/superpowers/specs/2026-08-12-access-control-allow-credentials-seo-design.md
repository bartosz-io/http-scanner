# Access-Control-Allow-Credentials SEO Design

Date: 2026-08-12  
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)  
Status: approved in conversation on 2026-08-12; awaiting written-spec review

## 1. Goal

Expand the existing `/headers/access-control-allow-credentials/` reference page into the next focused CORS-cluster guide. The page must explain how credentialed CORS works, provide a complete framework-neutral client and response example, and help developers distinguish CORS failures from cookie-policy, CSRF, authentication, and authorization problems.

The task preserves the current URL, Astro content collection, generated title, frontmatter description, and `HeaderGuidePage.astro` rendering path. It introduces no new route, component, checker, schema markup, or framework-specific configuration tutorial.

## 2. Evidence

### GSC evidence

Source: `outputs/httpscanner.com-Performance-on-Search-2026-08-07/`, covering 2026-05-24 through 2026-08-05.

The page does not yet appear in the page-level GSC export, so this is a P1 cluster-building task rather than a direct P0 page-level optimization. Query-level evidence already exists around the mechanism:

| Query | Impressions | Position |
|---|---:|---:|
| `mdn access-control-allow-credentials wildcard origin credentials` | 1 | 9 |
| `mdn cors credentialed requests access-control-allow-origin wildcard credentials include` | 1 | 9 |
| `credentials include` | 1 | 9 |
| `mdn access-control-allow-origin wildcard credentials` | 1 | 10 |

These queries are low-volume and several contain `mdn`, so they are supporting evidence rather than a clean non-brand baseline. The stronger reason to proceed is the roadmap position: `Access-Control-Allow-Credentials` is the next P1 guide in Wave 1 and completes the credentialed-response path already introduced by the expanded `Access-Control-Allow-Origin` and `Set-Cookie` pages.

### Current SERP pattern

Current reference and troubleshooting results commonly cover:

- the only enabling value, case-sensitive `true`;
- `fetch()` with `credentials: "include"`;
- explicit origins instead of `Access-Control-Allow-Origin: *`;
- browser errors for missing or invalid credential permission;
- the difference between simple and preflighted credentialed requests;
- cookie and third-party-cookie restrictions;
- CSRF risk and independent server authorization.

The opportunity is to combine those topics in a technically precise, framework-neutral guide that connects directly to the live HTTP Headers Checker and the existing CORS cluster.

## 3. Sources of technical truth

Resolve technical conflicts in this order:

1. [Fetch Standard — CORS protocol and credentials](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials)
2. [Fetch Standard — Access-Control-Allow-Credentials](https://fetch.spec.whatwg.org/#http-new-header-syntax)
3. [MDN — Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials)
4. [MDN — CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
5. [OWASP — CORS testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing)

Browser third-party-cookie behavior is a client privacy policy, not a CORS permission. Wording must avoid promising that a valid CORS response causes cookies to be stored or sent in every browser context.

## 4. Approach decision

### Option A — minimal reference expansion

Add short explanations of `true`, wildcard incompatibility, and `credentials: "include"`.

Trade-off: small change, but insufficient for troubleshooting intent and weak as a cluster destination.

### Option B — framework-neutral troubleshooting guide

Add a complete client and HTTP exchange, diagnostic sections, cookie-policy boundaries, and security distinctions while preserving the reference-page architecture.

Decision: use Option B. It provides the strongest balance of intent coverage, technical durability, and consistency with the existing header guides.

### Option C — framework-specific implementation tutorial

Add Express, Nginx, or other framework configurations.

Trade-off: broader long-tail coverage, but it mixes multiple implementation intents into one reference URL, creates maintenance burden, and can encourage unsafe copying without application context.

## 5. Search intent

### Primary intent

Answer: “How do I correctly use `Access-Control-Allow-Credentials`, and why is my credentialed cross-origin request failing?”

### Secondary intents

- What does `credentials: "include"` do on the client?
- Why is `Access-Control-Allow-Origin: *` rejected with credentials?
- Does every credentialed request require a preflight?
- Why are cookies still missing after the CORS headers look correct?
- Should the server send `Access-Control-Allow-Credentials: false`?
- Does enabling credentialed CORS authenticate the user or protect against CSRF?

## 6. Content design

Preserve the existing `Meaning and behavior` and `Implementation notes` sections, refining wording only where required for consistency. Append three focused sections.

### Credentialed CORS request and response

Include a framework-neutral client example:

```js
fetch('https://api.example/account', {
  credentials: 'include',
});
```

Pair it with a raw HTTP response containing:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Vary: Origin
Set-Cookie: session=example; Secure; HttpOnly; SameSite=None
Content-Type: application/json
```

State that the server must first validate the request `Origin` against an exact allowlist. The example cookie is illustrative and must not be presented as a universal cookie policy.

Explain both paths:

- a simple credentialed request can be sent without a preflight, after which the browser withholds the response from script if credential permission is invalid;
- a non-simple request may be preflighted, and the standard CORS preflight itself does not include credentials even though its response can authorize the later credentialed request.

### Common Access-Control-Allow-Credentials errors

Cover these failure modes:

- the field is missing from the relevant preflight or actual response;
- the value is `false`, `True`, `1`, `yes`, or anything other than case-sensitive `true`;
- `Access-Control-Allow-Origin` is `*` while credentials mode is `include`;
- the explicit origin does not exactly match scheme, host, and port;
- redirects, authentication failures, or error responses omit the required CORS fields;
- middleware is correct for the actual response but not for `OPTIONS`, or the reverse;
- the developer assumes that every credentialed request is automatically preflighted.

The troubleshooting sequence should tell readers to inspect the final public response, compare the browser console error with the network exchange, test both simple and preflighted requests, and verify allowed and denied origins.

### Cookies, SameSite, CSRF, and authorization

Explain that successful CORS permission does not override:

- cookie `SameSite`, `Secure`, domain, path, or expiration rules;
- browser third-party-cookie policies;
- server-side authentication and object-level authorization;
- CSRF protection for state-changing requests.

Make the boundary explicit: CORS governs browser access to a response and, for a successful preflight, whether the actual cross-origin request may proceed under the CORS protocol. It does not establish identity, decide application authorization, or make a state-changing endpoint safe from CSRF.

Recommend omitting `Access-Control-Allow-Credentials` when credentials are unnecessary rather than sending `false`.

## 7. Technical boundaries

- The only enabling value is the case-sensitive token `true`.
- The header does not cause the browser to send credentials by itself.
- Credential mode, request API configuration, cookie attributes, and browser privacy policy remain independent inputs.
- `Access-Control-Allow-Origin: *` cannot authorize response sharing for a request whose credentials mode is `include`.
- Dynamic explicit-origin responses require exact allowlist validation and `Vary: Origin` or an equivalent cache-key separation.
- A simple credentialed request can reach and change server state without preflight.
- A conforming CORS preflight does not contain credentials.
- CORS is not authentication, object-level authorization, or CSRF protection.
- Do not claim that every credential consists only of cookies; the Fetch credentials model also covers relevant authentication and TLS client-certificate behavior.
- Do not claim that valid CORS headers override browser third-party-cookie restrictions.

## 8. Internal linking

Set the guide's `relatedHeaders` to:

```yaml
relatedHeaders:
  - access-control-allow-origin
  - access-control-max-age
  - set-cookie
  - vary
```

Reasons:

- `Access-Control-Allow-Origin` defines which origin can read the credentialed response;
- `Access-Control-Max-Age` explains reuse of preflight permission;
- `Set-Cookie` covers cookie attributes and browser storage/sending rules;
- `Vary` protects dynamic-origin responses from incorrect shared-cache reuse.

Existing incoming links from `Access-Control-Allow-Origin` and `Set-Cookie` remain in place. No broader navigation changes are required.

## 9. Metadata decision

Keep the generated title:

`Access-Control-Allow-Credentials HTTP Header — Syntax & Examples | HTTP Scanner`

Keep the current frontmatter description. There is no page-level GSC evidence demonstrating a snippet problem, and the roadmap prioritizes cluster authority and intent coverage before metadata experimentation.

## 10. Testing design

Follow the established source-contract pattern in `src/lib/headerContentContract.test.ts`.

Add one focused test that reads `access-control-allow-credentials.md` and asserts meaningful coverage of:

- `## Credentialed CORS request and response`;
- `## Common Access-Control-Allow-Credentials errors`;
- `## Cookies, SameSite, CSRF, and authorization`;
- `credentials: 'include'`;
- `Access-Control-Allow-Origin: https://app.example`;
- `Access-Control-Allow-Credentials: true`;
- `Vary: Origin`;
- `Set-Cookie` with `SameSite=None` and `Secure`;
- the exact, case-sensitive `true` requirement and omission instead of `false`;
- the wildcard incompatibility;
- the statement that a conforming preflight does not include credentials;
- simple credentialed requests without preflight;
- third-party-cookie policy;
- independent CSRF protection and authorization.

### TDD sequence

1. Add the source-contract test.
2. Run the focused test and verify it fails because the new sections and distinctions are absent.
3. Expand the Markdown guide minimally until the focused test passes.
4. Refine wording while keeping the focused and CORS-category contracts green.
5. Run the complete test suite, lint, production build, and `git diff --check`.
6. Inspect the rendered page on desktop and a narrow viewport, including horizontal scrolling of the HTTP example.

## 11. Acceptance criteria

- The existing URL and canonical behavior are unchanged.
- The page clearly targets credentialed CORS implementation and troubleshooting.
- Client and server examples form one technically consistent exchange.
- The page covers simple and preflighted paths without claiming that all credentialed requests require preflight.
- Wildcard, exact-origin, case-sensitive `true`, and omission-versus-`false` behavior are correct.
- Cookie and browser privacy restrictions are separated from CORS permission.
- CSRF, authentication, and authorization remain independent security controls.
- The four related-header links render and resolve.
- The focused contract demonstrates RED then GREEN.
- Full tests, lint, Astro check/build, and diff checks pass without new errors or warnings.
- Desktop and narrow rendered examples use the established light code-card design without page overflow.
- Independent technical review has no unresolved critical or important findings.
- The implementation plan and `SEO_PLAN.md` are marked complete only after implementation verification.
- Deployment is performed only after explicit user authorization.

## 12. Measurement

Baseline for the 2026-08-07 export:

- page-level clicks: not present in export;
- page-level impressions: not present in export;
- query-level supporting impressions: four one-impression queries around positions 9–10, with several containing `mdn`.

After deployment:

1. inspect or submit `/headers/access-control-allow-credentials/` in GSC;
2. record the deployment and observation start date in `SEO_PLAN.md`;
3. compare URL-filtered clicks, impressions, CTR, and average position after 14 and 21 days;
4. monitor whether the page gains non-brand impressions for credentialed CORS, wildcard, cookie, and `credentials include` intent;
5. record checker referrals from the landing page;
6. preserve the URL and iterate rather than creating a competing credentials guide.

An early success is page-level appearance in GSC plus growth of the CORS cluster's rolling 28-day impressions. Metadata testing becomes eligible only after the page reaches positions 4–10 with CTR below 4%.
