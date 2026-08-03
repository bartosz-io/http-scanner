---
headerName: link
description: Link expresses typed relationships between the response context and other resources using target URIs, relation types, and optional parameters.
applicability: response
syntax: "Link: <target-URI>; rel=<relation-type>[; <parameter>=<value>]"
examples:
  - "Link: </app.css>; rel=preload; as=style"
  - "Link: <https://api.example/items?page=2>; rel=next"
useCases:
  - Advertise a preload relationship for a critical resource before document parsing discovers it.
  - Provide pagination, canonical, alternate, or other registered relationships in response metadata.
commonMistakes:
  - Omitting parameters such as as or crossorigin required for a preload to match its eventual request.
  - Parsing multiple link-values by naively splitting on commas inside quoted or URI syntax.
securityConsiderations: Only advertise trusted targets; speculative loading can leak navigation intent, send credentials according to request rules, or waste client resources.
relatedHeaders:
  - content-location
  - server-timing
  - cache-control
references:
  - label: RFC 8288 Web Linking
    url: https://www.rfc-editor.org/rfc/rfc8288
  - label: MDN Link
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link
---
## Meaning and behavior

Link attaches one or more typed relationships to the response context. Each link-value contains a target URI reference in angle brackets, a `rel` parameter, and optional attributes. Registered relations include `next`, `prev`, `alternate`, and `preload`, while extension relations can use URIs. Several link-values can be carried in repeated fields or a valid combined list. Correct parsing follows RFC 8288 grammar rather than blindly splitting text on commas.

The effect depends on the relation. Pagination metadata is descriptive, while preload can trigger speculative fetching when the user agent supports it. Preload matching considers destination information such as `as`, request mode, credentials, and resource URL; a mismatch can cause a duplicate download. Link is not the same as Location and does not automatically redirect the client. It can also complement, but not universally replace, equivalent HTML link elements.

## Implementation notes

Construct target URIs from trusted routing data and serialize parameters correctly. For preload, verify that `as`, media, type, and cross-origin mode match the eventual resource request. Measure whether the hint improves real loading rather than preloading too many low-priority assets. Test relative resolution through proxies, multiple fields, quoted parameters, caching, and early response delivery. Keep private URLs, signed object links, and internal hosts out of public metadata unless intentionally disclosed. For pagination or canonical relationships, ensure targets are stable, authorized, and consistent with document markup and search policy.
