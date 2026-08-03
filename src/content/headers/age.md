---
headerName: age
description: Age reports an estimate of how many seconds a response has resided in caches since it was generated or successfully validated upstream.
applicability: response
syntax: "Age: <non-negative seconds>"
examples:
  - "Age: 120"
useCases:
  - Confirm that a shared cache reused a stored response rather than contacting the origin.
  - Estimate remaining freshness when interpreted together with Cache-Control or Expires.
commonMistakes:
  - Reading Age as the creation age of the underlying resource or database record.
  - Assuming a zero or absent value proves that no cache participated in delivery.
securityConsiderations: Age is usually operational metadata, but surprising shared-cache reuse can reveal a dangerous caching policy for personalized content.
relatedHeaders:
  - cache-control
  - expires
  - via
  - etag
references:
  - label: RFC 9111 Age calculations
    url: https://www.rfc-editor.org/rfc/rfc9111#name-age-calculations
  - label: MDN Age
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Age
---
## Meaning and behavior

Age is a non-negative integer representing a cache's estimate, in seconds, of time since the response was generated or last validated by the origin chain. A shared cache updates the value when forwarding a stored response. It participates in the HTTP age calculation alongside Date, network delay, resident time, and upstream Age values. The result helps a recipient determine how much of a response's freshness lifetime has already elapsed.

The field does not describe when the business object was created, when a file was modified, or how long the current user has viewed it. An absent field does not prove a cache miss because some private caches and nonconforming intermediaries do not add it. A value of zero can mean a very recent stored response. Clock skew and multi-layer paths also make it an estimate rather than a precise trace.

## Implementation notes

Interpret Age only with Cache-Control, Expires, Date, validators, and knowledge of the intermediary path. Repeat requests and compare cache diagnostics to distinguish hits, revalidation, and origin delivery. Test multiple regions because each edge can have a separate stored copy. When Age appears on personalized responses, immediately verify cache keys and shared-cache eligibility with separate users. Do not generate Age manually at the application as a substitute for proper cache behavior. Preserve upstream values correctly when building an intermediary, and use internal cache logs for authoritative debugging rather than relying solely on one client observation.
