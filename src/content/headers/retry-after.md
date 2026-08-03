---
headerName: retry-after
description: Retry-After tells a client how long to wait, or the HTTP date after which it may retry, commonly with temporary unavailability or rate limiting.
applicability: response
syntax: "Retry-After: <delay-seconds> | <HTTP-date>"
examples:
  - "Retry-After: 120"
  - "Retry-After: Mon, 03 Aug 2026 15:00:00 GMT"
useCases:
  - Tell clients when to retry after a temporary 503 service interruption.
  - Provide a backoff interval with a 429 Too Many Requests response.
commonMistakes:
  - Sending milliseconds where the delta form requires whole seconds.
  - Treating the field as a command clients must obey rather than advice requiring robust client backoff.
securityConsiderations: Do not expose internal recovery schedules unnecessarily, and combine retry guidance with real rate enforcement so abusive clients cannot bypass limits.
relatedHeaders:
  - location
  - cache-control
  - age
references:
  - label: RFC 9110 Retry-After
    url: https://www.rfc-editor.org/rfc/rfc9110#name-retry-after
  - label: RFC 6585 status 429
    url: https://www.rfc-editor.org/rfc/rfc6585#section-4
  - label: MDN Retry-After
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After
---
## Meaning and behavior

Retry-After provides retry timing advice. The delta form is a non-negative integer number of seconds after receipt, while the date form is an absolute HTTP date. It is commonly used with 503 Service Unavailable to describe temporary recovery and can accompany 429 Too Many Requests under RFC 6585. Redirect responses can also use it to indicate a minimum delay before following the Location target in applicable semantics.

The field does not guarantee that service will be available at the stated time and does not force a client to wait. Clients need their own bounded exponential backoff, jitter, cancellation, and maximum-attempt policy. An absent value does not mean immediate aggressive retry is safe. Shared caches and clocks can affect an absolute date, while delta-seconds avoids some synchronization problems.

## Implementation notes

Choose a conservative delay derived from capacity or rate-policy state, expressed in whole seconds. Avoid revealing sensitive queue depth or incident schedules. Enforce limits server-side regardless of client compliance and scope rate buckets correctly by identity, tenant, or other trusted key. Test 429 and 503 paths, date parsing, clock skew, CDN caching, concurrent clients, and recovery before or after the estimate. Clients should honor a reasonable value while applying jitter to prevent a synchronized retry surge. Combine with clear machine-readable error bodies where safe, but do not leak account existence or internal infrastructure detail.
