---
headerName: access-control-max-age
description: Access-Control-Max-Age tells a browser how many seconds it may cache a successful CORS preflight result before checking permission again.
applicability: response
syntax: "Access-Control-Max-Age: <delta-seconds>"
examples:
  - "Access-Control-Max-Age: 600"
useCases:
  - Reduce repeated OPTIONS traffic for stable cross-origin API permissions.
  - Use a short preflight lifetime while deploying or tightening a changing CORS policy.
commonMistakes:
  - Confusing the preflight result cache with HTTP response freshness controlled by Cache-Control.
  - Choosing a very long lifetime without accounting for browser caps or emergency policy revocation.
securityConsiderations: Long-lived grants delay browser adoption of tightened origin, method, or request-field policy, although server authorization must still reject forbidden operations.
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-methods
  - access-control-allow-headers
  - cache-control
references:
  - label: Fetch Standard CORS-preflight cache
    url: https://fetch.spec.whatwg.org/#cors-preflight-cache
  - label: MDN Access-Control-Max-Age
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age
---
## Meaning and behavior

Access-Control-Max-Age is a delta-seconds value on a successful preflight response. It tells the browser how long an applicable origin, URL, credentials mode, method, and request-field permission can remain in the CORS-preflight cache. During that period, a matching non-simple request can proceed without another OPTIONS exchange. Browsers can impose their own maximum and cache behavior, so a large server value does not guarantee identical retention everywhere.

The preflight cache is separate from the normal HTTP cache. Cache-Control freshness on an API response does not grant a CORS method, and Access-Control-Max-Age does not make response bodies fresh. CORS still controls browser behavior rather than authenticating requests. A simple request may reach the server without preflight, and non-browser clients do not rely on this cache. Server-side authorization remains authoritative on every actual request.

## Implementation notes

Choose a lifetime based on policy stability and acceptable revocation delay. During rollout, use a short duration so corrections propagate quickly. Increase it only after origin, method, header, and credential behavior is well tested. Account for browser-specific caps and do not assume clearing an HTTP CDN cache clears a user's preflight cache. Test allowed and denied changes over time, credentials modes, redirects, and multiple routes. When tightening policy urgently, enforce the restriction in normal request authorization immediately; waiting for preflight grants to expire is not a safe revocation mechanism. Monitor OPTIONS volume to balance latency against change control.

## How the CORS preflight cache works

A browser sends a CORS preflight as an `OPTIONS` request before an actual request that is not CORS-safelisted. The preflight identifies the requesting origin, proposed method, and any non-safelisted request headers. A successful response can grant those dimensions for later matching requests:

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

Here `600` represents ten minutes; it is an example rather than a universal recommendation. The preflight-cache entry depends on relevant dimensions such as origin, URL, credentials mode, method, and request-header permission. A different route or permission can therefore require another preflight.

## Choosing an Access-Control-Max-Age value

When the field is absent, the current documented default is five seconds. Browsers may enforce a browser-imposed cap or otherwise constrain the lifetime, so a very large server value does not guarantee equal behavior everywhere.

Use a shorter lifetime while introducing or changing a CORS policy so corrections propagate quickly. A longer lifetime can reduce repeated `OPTIONS` traffic for stable permissions, but it can delay browser adoption of a tightened preflight policy. Regardless of cached permission, the server must perform authentication and authorization on every actual request. Urgent revocation belongs in normal request authorization rather than waiting for browser cache entries to expire.

## Access-Control-Max-Age vs Cache-Control

The CORS preflight cache is separate from the general HTTP cache. `Access-Control-Max-Age` controls reuse of a successful browser preflight permission; it does not cache an API response body or make that body fresh. `Cache-Control: max-age` controls HTTP response freshness and does not grant CORS methods or request headers.

Changing or purging CDN caching does not guarantee that a user's preflight entry disappears. Test policy changes in real browsers and monitor `OPTIONS` volume instead of treating the two cache mechanisms as interchangeable.
