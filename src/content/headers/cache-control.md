---
headerName: cache-control
description: Cache-Control carries directives that define whether and for how long browsers and shared caches may store, reuse, or revalidate a response.
applicability: request-and-response
syntax: "Cache-Control: <directive>[, <directive>...]"
examples:
  - "Cache-Control: public, max-age=3600, stale-while-revalidate=60"
  - "Cache-Control: private, no-cache"
useCases:
  - Cache a versioned public asset in browsers and shared intermediaries.
  - Require validation before reusing a personalized response already stored by a browser.
commonMistakes:
  - Treating no-cache as an instruction not to store a response instead of a revalidation requirement.
  - Marking personalized or authenticated content public without a deliberate cache key and privacy review.
securityConsiderations: Incorrect cacheability or keying can expose one user's sensitive representation to another user through a browser, proxy, or CDN.
relatedHeaders:
  - age
  - expires
  - etag
  - last-modified
  - vary
references:
  - label: RFC 9111 HTTP Caching
    url: https://www.rfc-editor.org/rfc/rfc9111
  - label: MDN Cache-Control
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
---
## Meaning and behavior

Cache-Control is the primary standard field for expressing response caching policy. Freshness directives such as `max-age` define how long a stored response can be reused without contacting the origin. `public` permits storage by shared caches even when a response might otherwise be restricted, while `private` limits storage to a private cache such as a browser. `no-store` asks caches not to store the message. `no-cache` allows storage but requires successful validation before reuse, a frequently misunderstood distinction.

Other directives refine revalidation, stale use, transformations, and shared-cache behavior. Cache-Control interacts with Age, validators such as ETag and Last-Modified, request directives, authorization, cache keys, and Vary. A syntactically strong header cannot compensate for a CDN cache key that ignores user-specific inputs. Multiple directives need to form a coherent policy; contradictory or duplicated values can produce conservative or implementation-dependent handling.

## Implementation notes

Classify responses as public, private, or non-storable before choosing directives. Use long freshness for immutable versioned assets and deliberate short freshness plus validators for content that changes. For personalized data, verify both browser and shared-cache behavior with multiple accounts. Inspect the entire chain: application, framework, reverse proxy, CDN, and browser. Test 200, 304, redirects, errors, and authenticated requests. Record Age and cache-status diagnostics where available, but do not expose internal identifiers. Treat invalidation as an operational capability and avoid relying on an emergency purge to correct a fundamentally unsafe cache key.
