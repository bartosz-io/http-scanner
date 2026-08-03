---
headerName: expires
description: Expires supplies an absolute HTTP date after which a stored response is considered stale unless a more specific Cache-Control directive overrides it.
applicability: response
syntax: "Expires: <HTTP-date>"
examples:
  - "Expires: Wed, 04 Aug 2027 12:00:00 GMT"
useCases:
  - Provide freshness information to legacy caches that do not understand modern Cache-Control directives.
  - Express an absolute expiry time for a response whose validity ends at a known moment.
commonMistakes:
  - Using a server-local timezone or a non-HTTP date format that recipients cannot parse.
  - Expecting Expires to override a Cache-Control max-age or s-maxage freshness directive.
securityConsiderations: An overly distant expiry can preserve sensitive or revoked content in caches, especially when invalidation and cache keys are not dependable.
relatedHeaders:
  - cache-control
  - age
  - etag
  - last-modified
references:
  - label: RFC 9111 Expires field
    url: https://www.rfc-editor.org/rfc/rfc9111#name-expires
  - label: MDN Expires
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expires
---
## Meaning and behavior

Expires is the traditional HTTP freshness field. It contains an absolute HTTP date after which a cached response is stale. A cache compares the value with Date and calculated age to decide whether reuse without validation remains permitted. An already-past value can make a response immediately stale, while an invalid date is treated conservatively. Because it is absolute, correct origin clocks and a valid IMF-fixdate representation matter.

Modern Cache-Control directives take precedence when both are present. `max-age` expresses freshness relative to response generation and avoids some clock problems; `s-maxage` can define separate shared-cache behavior. Expires remains useful for compatibility but should agree with the intended Cache-Control policy. It does not force deletion when time passes: a stale response can remain stored and may be revalidated or used under an explicitly permitted stale rule.

## Implementation notes

Prefer Cache-Control as the authoritative policy and generate a consistent Expires value only where legacy support is valuable. Use GMT HTTP dates and derive them from the same freshness lifetime to avoid contradictory signals. Test application, proxy, and CDN layers because each may rewrite dates. Pair cacheable changing content with ETag or Last-Modified so stale entries can be validated efficiently. Avoid long absolute expiry on user-specific data, signed URLs, or content requiring emergency revocation. Verify behavior with a real cache rather than checking the header text alone, and account for Date, Age, and request directives during analysis.
