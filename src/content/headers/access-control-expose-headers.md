---
headerName: access-control-expose-headers
description: Access-Control-Expose-Headers expands the response field names that browser scripts may read from a successful cross-origin response.
applicability: response
syntax: "Access-Control-Expose-Headers: <response-header-name>[, ...]"
examples:
  - "Access-Control-Expose-Headers: ETag, Content-Disposition, X-Request-ID"
useCases:
  - Let browser code read ETag for application-level concurrency or cache behavior.
  - Expose safe download metadata such as Content-Disposition to an approved cross-origin application.
commonMistakes:
  - Using it to permit request fields instead of Access-Control-Allow-Headers.
  - Exposing internal diagnostics, identifiers, or infrastructure metadata that browser code does not need.
securityConsiderations: Exposed fields become readable by permitted origins and can reveal identifiers, timing, topology, or sensitive operational detail beyond the response body.
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-credentials
  - access-control-allow-headers
  - content-disposition
  - set-cookie
references:
  - label: Fetch Standard CORS protocol headers
    url: https://fetch.spec.whatwg.org/#http-new-header-syntax
  - label: MDN Access-Control-Expose-Headers
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers
---
## Meaning and behavior

Access-Control-Expose-Headers lists response field names that browser script may read beyond the CORS-safelisted response fields. A cross-origin fetch can succeed at the network and CORS levels while JavaScript still sees only a limited metadata set. Exposing `ETag` or `Content-Disposition` makes those selected values available through response header APIs. This field affects response visibility; it does not permit the client to send similarly named request fields.

The exposure takes effect only as part of a successful CORS exchange with a permitted origin. It does not make a denied response readable, authenticate the script, or prevent the request from reaching the server. Wildcard behavior depends on credentials mode under Fetch rules, so an explicit bounded list is often clearer for credentialed APIs. The response body and exposed metadata should be reviewed together because a seemingly harmless identifier can enable correlation.

## Implementation notes

Inventory exactly which response metadata the browser application consumes. Expose only those names and avoid server versions, internal trace topology, debug data, rate-limit keys tied to identity, or sensitive filenames. Test actual JavaScript access from allowed and denied origins, with and without credentials. Verify casing and duplicate behavior through proxies. Keep Access-Control-Allow-Headers separate for request permission. When an application stops using a field, remove it from the exposure list. Remember that non-browser clients can already read ordinary HTTP response fields, so this policy is specifically about the browser CORS boundary rather than universal secrecy.

## Expose only the response metadata your frontend needs

`Access-Control-Expose-Headers` expands the field names retained in the CORS-filtered response that a permitted frontend can inspect. Exposure should follow a concrete application requirement, not a desire to mirror every field visible on the network.

Use a bounded, case-insensitive list of field names. Do not expose metadata merely because it is present. Review internal routing or upstream identity, server and framework versions, debug details, trace topology, identifiers that enable correlation across users, sessions, or services, account-specific quota state, sensitive filenames, and storage metadata before making any of them readable to cross-origin script.

Exposure is not automatically a vulnerability, but it increases the data surface available to every browser application permitted by the effective CORS policy. Authorize the underlying response and construct each field value safely before deciding whether the frontend should be able to read it.

## Cross-origin download with Content-Disposition and ETag

An application at `https://app.example` can request a protected PDF from `https://files.example` and inspect only the response metadata selected by the server:

```js
const response = await fetch('https://files.example/reports/quarterly.pdf', {
  credentials: 'include',
});

const disposition = response.headers.get('Content-Disposition');
const etag = response.headers.get('ETag');
const setCookie = response.headers.get('Set-Cookie');
```

The matching actual request and successful response can look like:

```http
GET /reports/quarterly.pdf HTTP/1.1
Host: files.example
Origin: https://app.example
Cookie: download_session=opaque

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

After the CORS check succeeds, `disposition` contains `attachment; filename="quarterly-report.pdf"`, `etag` contains `"report-v7"`, and `setCookie` is `null`. `Set-Cookie` remains a forbidden response-header name even though the browser can process an allowed cookie independently of exposing that field to JavaScript.

This request uses credentials mode `include`, so the response uses the explicit origin and `Access-Control-Allow-Credentials: true`. `Vary: Origin` keeps shared-cache variants separate when the allowed origin can change. Those origin, credentials, and cache requirements are separate from the decision to expose `Content-Disposition` and `ETag`. The value `opaque` is a deliberate non-secret placeholder, not a live session identifier.

## Fix “visible in Network, but response.headers.get() returns null”

Browser network tooling can display the internal network response while Fetch exposes a CORS-filtered response to application JavaScript. A successful response and readable body do not make every response field visible through the `Headers` API.

First confirm that the overall CORS exchange succeeds and the expected body is available. Inspect the exact final response after redirects, CDN rules, proxies, authentication, and error handling. Confirm that the desired field is present on that response. If its name is not CORS-safelisted, verify that the actual response—not only a preflight or another route or status variant—lists it in `Access-Control-Expose-Headers`.

Header-name matching is ASCII case-insensitive, although consistent spelling makes diagnostics clearer. Both an absent field and a present-but-filtered field can make `Headers.get()` return `null`, so compare the network response with the effective exposure policy instead of assuming one cause from the JavaScript result alone.

## CORS-safelisted response headers

After a successful CORS exchange, Fetch makes these response field names readable without repeating them in `Access-Control-Expose-Headers`: `Cache-Control`, `Content-Language`, `Content-Length`, `Content-Type`, `Expires`, `Last-Modified`, `Pragma`.

`Content-Disposition` and `ETag` are not in this safelist, so the download response exposes them explicitly. Do not confuse this response-header-name safelist with the CORS-safelisted request-header rules. The request safelist helps determine whether a request field can participate in a simple request under value restrictions; the response safelist determines which response names survive CORS filtering for script access.

## Wildcard and credentialed requests

When credentials mode is not `include`, `Access-Control-Expose-Headers: *` exposes all response header names except forbidden response-header names. When credentials mode is `include`, `*` is treated as the literal field name `*`, not as a wildcard, so required names such as `Content-Disposition` and `ETag` must be listed explicitly.

Prefer explicit names even for non-credentialed security-sensitive APIs. A bounded list documents the frontend contract and prevents a newly added operational field from becoming script-readable by accident.

The exposure wildcard is separate from `Access-Control-Allow-Origin: *`. They are different response fields with different checks, although credentials mode affects both. Adding `Access-Control-Allow-Credentials: true` does not change the request's credentials mode; client code selects that mode.

## Why Set-Cookie cannot be exposed

`Set-Cookie` and legacy `Set-Cookie2` are forbidden response-header names under Fetch. A CORS-filtered response excludes them from browser JavaScript access even if `Set-Cookie` is explicitly named in `Access-Control-Expose-Headers`, wildcard semantics apply, the browser accepts the cookie, or the response includes `Access-Control-Allow-Credentials: true`.

`HttpOnly` protects a stored cookie from script access through cookie APIs, while the Fetch response-header prohibition applies to the `Set-Cookie` field name itself. Exposing `Set-Cookie` is not a way to discover whether a cookie was stored. Return required non-secret state through an intentionally designed response body or another explicitly exposed field, and do not duplicate session tokens or cookie values into an exposed custom response field.

## Exposure is not authorization or data sanitization

`Access-Control-Expose-Headers` controls which non-forbidden response field names browser script can inspect after a successful CORS exchange. It does not authorize the request or decide which record the caller may receive, and it does not redact or validate an exposed value. It cannot make a denied CORS response readable.

This response field also does not grant permission to send similarly named request fields. `Access-Control-Allow-Headers` is the opposite request direction: it authorizes proposed request-field names during CORS checks, while `Access-Control-Expose-Headers` governs response-field visibility to script.

CORS filtering does not conceal ordinary response fields from curl, server-to-server clients, proxies, extensions, or other non-browser tooling, and it does not guarantee that an intermediary preserved a field unchanged. Enforce authentication, authorization, tenant isolation, value validation, response minimization, and safe logging independently.
