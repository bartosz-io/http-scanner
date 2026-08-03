---
headerName: last-modified
description: Last-Modified reports the origin server's best estimate of when a selected representation last changed and can act as a cache validator.
applicability: response
syntax: "Last-Modified: <HTTP-date>"
examples:
  - "Last-Modified: Mon, 03 Aug 2026 10:15:00 GMT"
useCases:
  - Revalidate static or document content using If-Modified-Since.
  - Provide a human-readable modification estimate when a reliable timestamp exists.
commonMistakes:
  - Emitting the current response time instead of the representation's modification time.
  - Assuming one-second date precision can distinguish rapid successive representation changes.
securityConsiderations: Modification times can disclose publishing or deployment activity, and stale timestamps can cause caches to reuse content after a security-relevant change.
relatedHeaders:
  - etag
  - cache-control
  - expires
  - vary
references:
  - label: RFC 9110 Last-Modified
    url: https://www.rfc-editor.org/rfc/rfc9110#name-last-modified
  - label: MDN Last-Modified
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified
---
## Meaning and behavior

Last-Modified is an HTTP date representing the origin's best knowledge of when the selected representation changed. A client can send that date in If-Modified-Since during a later request. If the representation has not changed according to HTTP conditional rules, the server can return 304 and let the client reuse its stored body. The timestamp is a validator, not necessarily the creation time of a resource or the last modification of an underlying database row.

HTTP dates have one-second precision and origin clocks can be imperfect, so Last-Modified is generally a weaker validator than a well-designed strong ETag. Rapid changes, generated pages, and aggregated data can be difficult to represent accurately. The field can still be useful for static files and content with a trustworthy modification instant. Conditional precedence rules matter when both ETag and date validators appear.

## Implementation notes

Derive the value from the representation's actual revision and never generate a future date. Keep it stable across responses until meaningful content changes. Test If-Modified-Since, 304 responses, proxy revalidation, and variants selected by content negotiation. Pair the validator with Cache-Control or Expires to define when revalidation occurs. Consider whether publishing timestamps reveal operational information. For generated content without a reliable timestamp, omit the field rather than emitting the current time, which defeats caching. If changes can occur more frequently than date precision allows, add an ETag designed for the selected representation.
