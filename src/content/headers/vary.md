---
headerName: vary
description: Vary tells caches which request fields influenced a response selection so stored representations are not reused for incompatible requests.
applicability: response
syntax: "Vary: <request-field-name>[, ...] | *"
examples:
  - "Vary: Accept-Encoding"
  - "Vary: Accept-Language, Origin"
useCases:
  - Keep compressed and uncompressed response variants in distinct cache entries.
  - Separate negotiated language or CORS responses based on relevant request fields.
commonMistakes:
  - Omitting Origin when dynamically returning a specific Access-Control-Allow-Origin value.
  - Adding high-cardinality fields such as User-Agent without understanding cache fragmentation.
securityConsiderations: Missing a request field that changes personalized or privileged content can cause cross-user cache disclosure; an overly broad key can destroy cache efficiency.
relatedHeaders:
  - access-control-allow-origin
  - access-control-max-age
  - cache-control
  - etag
  - content-encoding
references:
  - label: RFC 9110 Vary field
    url: https://www.rfc-editor.org/rfc/rfc9110#name-vary
  - label: RFC 9111 cache keys with Vary
    url: https://www.rfc-editor.org/rfc/rfc9111#name-calculating-cache-keys
  - label: Fetch Standard CORS and HTTP caches
    url: https://fetch.spec.whatwg.org/#cors-protocol-and-http-caches
  - label: MDN Vary
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
---
## Meaning and behavior

`Vary` lists request field names that might have influenced how the origin selected a response representation beyond the request method and target URI. When an HTTP cache considers a stored response for reuse, the nominated fields from the new request must match those from the request that produced the stored response, unless the cache validates that response with the origin.

This matching rule keeps language, encoding, and origin-specific variants separate. `Vary` does not create freshness or make an otherwise uncacheable response cacheable; storage and freshness follow [Cache-Control](/headers/cache-control/) and the other HTTP caching rules. The special value `*` means a stored response cannot match a later request.

## Implementation notes

Identify every request field that can influence representation selection and emit a consistent `Vary` value on every applicable variant. Keep custom CDN or reverse-proxy cache keys aligned with the response metadata. Test request pairs that differ in one dimension, including a missing field versus a present field, and verify the public response after every intermediary rather than inspecting only the application server.

Use [ETag](/headers/etag/) and other validators for the selected representation, not as a substitute for variant matching. Avoid high-cardinality dimensions that destroy useful reuse. For personalized, privileged, or tenant-specific responses, choose an appropriate cache policy instead of assuming that a larger `Vary` list makes shared caching safe.

## What Vary changes in cache matching

An HTTP cache key contains at least the request method and target URI. A stored response's `Vary` field adds request fields that must match before that stored response can be reused without validation. This is commonly described as expanding the effective cache key, although the protocol rule is about matching the nominated fields.

```http
Vary: Accept-Encoding, Accept-Language
```

This response can have separate compressed and language-selected variants for the same method and URI. Under RFC 9111, permitted normalization can account for equivalent field values, but an absent nominated field matches only another request where that field is absent.

`Vary` describes selection. It does not decide whether a cache may store the response, how long the response stays fresh, or whether a stale response can be reused or validated.

## Why dynamic Access-Control-Allow-Origin needs Vary: Origin

When a server selects a specific [Access-Control-Allow-Origin](/headers/access-control-allow-origin/) value from the request's `Origin`, that request field influenced the response. The response must therefore nominate `Origin` for HTTP cache matching:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Cache-Control: public, max-age=300
Content-Type: application/json
Vary: Origin
```

Validate the serialized origin against an explicit allowlist before returning it. `Vary: Origin` does not make reflection safe, grant permission, or authenticate the caller. `Origin` is neither authentication nor proof of application identity.

Emit `Vary: Origin` consistently on applicable variants, including a response without `Access-Control-Allow-Origin` when the presence of that permission depends on the request origin. If a resource always sends `Access-Control-Allow-Origin: *`, or always sends one static origin on CORS and non-CORS responses, and no other response property depends on `Origin`, the Fetch guidance does not require `Vary: Origin` for that CORS behavior.

The explicit `Cache-Control: public, max-age=300` above is teaching data that makes shared-cache reuse visible. It is not a universal caching recommendation for APIs.

## How a missing Vary: Origin breaks cached CORS responses

Assume `https://app.example` and `https://admin.example` are both allowed to read the same public, non-personalized resource at `https://api.example/public-config`. The first request can populate a shared cache without telling it that `Origin` affected the response:

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

The second request has the same method and URI, so a cache that has no `Origin` variation rule can reuse the first response. `Age: 42` illustrates that reuse; it is one possible diagnostic signal, not a header guaranteed by every cache deployment. The browser then compares `https://admin.example` with the cached `Access-Control-Allow-Origin: https://app.example`. They do not match, so script cannot read the response.

The deterministic result here is a browser CORS failure, not automatic disclosure of the response body. Reversing request order can make the application origin fail instead. If the representation itself also varies by `Origin` and the cache key omits that dimension, the wrong representation can be delivered. Whether that becomes a disclosure depends on the complete cache policy, CORS response, authentication, authorization, and client context.

With `Vary: Origin` already present on the stored variants, the second request cannot reuse the first origin-specific response without validation. It obtains a matching response instead:

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

Adding `Vary: Origin` to future responses does not remove an already stored response that omitted it. Purge or invalidate that entry, or wait for it to expire according to the real cache deployment, before judging the correction.

## Debug Vary and the effective cache key

Reproduce the problem with the same method and URL while changing only `Origin`. Test both origin orders so the result does not depend on which variant populated the cache first. Then inspect each layer in sequence:

1. Compare `Access-Control-Allow-Origin`, `Vary`, `Age`, `Cache-Control`, and any implementation-specific cache-status evidence on the final public response.
2. Verify that redirects, authentication responses, errors, middleware, and the origin application all emit the intended fields.
3. Confirm that the origin validates the requesting origin before returning a specific permission.
4. Confirm that every cache layer honors `Vary: Origin` or uses an equivalent explicit cache-key configuration.
5. Remove variants stored before the corrected policy, then repeat the two allowed-origin requests.
6. Test a disallowed origin and confirm that it receives no CORS permission.

| Symptom | Likely layer | Check |
|---|---|---|
| First origin works; second fails only after a hit | Shared HTTP cache | Compare `Age`, cache status, `Access-Control-Allow-Origin`, and `Vary` in both request orders |
| Origin response is correct; public response lacks or changes `Vary` | Proxy, CDN, or middleware | Inspect the response at each boundary and its field-rewrite rules |
| `Vary: Origin` is present; origins still share a variant | Effective cache-key configuration | Verify the cache honors `Vary` or explicitly includes `Origin` |
| The fix works only after waiting or purging | Previously stored response | Invalidate entries created without the corrected variation rule |
| Every request misses | Excessive variation | Remove fields that do not influence representation selection |

Do not assume a response field alone proves the effective deployment behavior. Some cache configurations override standard matching, so verify the actual cache key and hit/miss result.

## HTTP response cache vs CORS preflight cache

The HTTP response cache and the browser's CORS-preflight cache solve different problems:

| Mechanism | Stores | Controlled here by | Main purpose |
|---|---|---|---|
| HTTP cache | HTTP responses and representations | `Cache-Control`, freshness rules, validators, and `Vary` matching | Reuse a matching response when freshness or validation permits |
| CORS-preflight cache | Browser CORS permission entries | [Access-Control-Max-Age](/headers/access-control-max-age/) and Fetch preflight-cache rules | Avoid repeating eligible `OPTIONS` permission checks |

`Vary: Origin` does not set the lifetime of a preflight permission. `Access-Control-Max-Age` does not make the actual response fresh in an HTTP cache. Clearing a CDN cache does not necessarily clear a browser preflight cache, so a correction in one layer can leave observable state in the other.

Do not debug the preflight cache as if it were an ordinary shared HTTP cache. Inspect the actual response cache and the browser's preflight decision independently.

## Common Vary patterns and cache fragmentation

`Vary: Accept-Encoding` separates compressed and uncompressed representations and connects to the selected [Content-Encoding](/headers/content-encoding/). `Vary: Accept-Language` separates language-selected representations. `Vary: Origin` separates responses whose CORS metadata or representation selection depends on the request origin. Real dimensions can be combined, for example `Vary: Accept-Encoding, Origin`.

Each meaningful combination can reduce cache hit rate and increase the number of stored variants. Add only request fields that influence selection. High-cardinality fields such as `User-Agent`, `Cookie`, or request identifiers can make reuse ineffective and should trigger a review of the representation and cache design rather than automatic inclusion.

Conditional requests do not remove this requirement: validators such as `ETag` must identify the selected representation correctly, and the cache still needs the right variant before it can validate or reuse that representation.

## Vary: * vs private and no-store

A stored response whose `Vary` value contains `*` never matches a later request under RFC 9111. `Vary: *` does not prohibit storage and is not equivalent to `Cache-Control: no-store`. RFC 9110 says a proxy must not generate `Vary: *`; an origin server can generate it when request aspects outside an expressible field list influenced selection.

`Cache-Control: private` controls storage by shared caches while allowing private caches under the directive's rules. `Cache-Control: no-store` tells caches not to store the response. Use those cache directives when the storage policy is the real concern instead of using `Vary: *` as a routine fallback.

Personalized, privileged, or tenant-specific data needs explicit cacheability decisions. `Vary: Cookie` or `Vary: Origin` does not replace authentication, authorization, tenant isolation, or an appropriate `private` or `no-store` policy. `Vary` protects response selection, not access control.

Use the [HTTP Headers Checker](/http-headers-checker/) to inspect the public response, then compare it with the origin and cache configuration before changing policy.
