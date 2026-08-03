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
  - cache-control
  - etag
  - content-encoding
  - access-control-allow-origin
references:
  - label: RFC 9110 Vary field
    url: https://www.rfc-editor.org/rfc/rfc9110#name-vary
  - label: MDN Vary
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
---
## Meaning and behavior

Vary lists request field names that influenced selection of a response representation beyond the request method and target URI. A cache uses those fields when deciding whether a stored response matches a later request. `Vary: Accept-Encoding`, for example, separates compressed and uncompressed variants. `Vary: Origin` is important when a server dynamically chooses a specific Access-Control-Allow-Origin value. The special value `*` means the response cannot be matched using ordinary request fields and effectively prevents normal reuse.

Vary does not itself make a response cacheable or define freshness; Cache-Control and other rules do that. It describes a cache-key dimension after selection. Omitting a meaningful dimension can serve the wrong language, encoding, CORS permission, or personalized representation. Adding needless high-cardinality dimensions can reduce hit rate and consume cache storage. Some CDNs use custom cache keys that must remain consistent with the origin's declared Vary behavior.

## Implementation notes

Document every request property used by content negotiation or authorization-sensitive selection. Add only the actual request fields that can change the representation, then configure reverse proxies and CDNs to honor equivalent keys. Test pairs of requests that differ in one dimension and verify that cached responses never cross boundaries. Pay special attention to Origin, Accept-Encoding, Accept-Language, and framework-added negotiation. Ensure validators such as ETag identify the correct variant. Avoid using Vary as a substitute for `private` or `no-store` when responses are truly user-specific and unsafe for shared caching.
