---
headerName: content-location
description: Content-Location identifies a URI corresponding to the enclosed representation, which can differ from the effective request URI without redirecting the client.
applicability: request-and-response
syntax: "Content-Location: <URI-reference>"
examples:
  - "Content-Location: /documents/report.en.html"
useCases:
  - Identify the URI of a negotiated language or format representation returned for a broader resource.
  - Describe where a created or submitted representation can be referenced when its semantics support that statement.
commonMistakes:
  - Treating Content-Location as an automatic redirect equivalent to the Location field on a 3xx response.
  - Emitting a URI that does not actually identify the enclosed representation or leaks an internal storage path.
securityConsiderations: Values can disclose private identifiers or infrastructure paths and may influence cache interpretation, so they must be generated from public representation semantics.
relatedHeaders:
  - location
  - content-language
  - content-type
  - link
references:
  - label: RFC 9110 Content-Location
    url: https://www.rfc-editor.org/rfc/rfc9110#name-content-location
  - label: MDN Content-Location
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Location
---
## Meaning and behavior

Content-Location provides a URI reference for the particular representation enclosed in a message. That URI can be the effective request URI or a more specific identifier for a negotiated variant. For example, a request to a general document resource might return an English representation and identify `/documents/report.en.html` as its content location. The field is representation metadata and does not instruct the user agent to navigate anywhere.

Location has different semantics. On many 3xx responses it identifies a redirect target, and on a 201 response it can identify a created resource. Content-Location does not create that behavior merely because its value looks like a URL. It can affect how a recipient interprets representation identity and caching, so a value should be truthful and stable. Relative references resolve according to normal URI rules.

## Implementation notes

Emit the field only when the application can state a meaningful representation URI. Keep public URIs separate from filesystem paths, object keys, internal hostnames, and signed storage locations. When content negotiation selects language or format, align Content-Location with Content-Language, Content-Type, Vary, validators, and canonical-link strategy. Test relative resolution through proxies and alternate hosts. Do not use the field in place of a redirect when navigation is intended. Review caches and clients that consume representation metadata, and omit the field rather than publishing a speculative or misleading identifier.
