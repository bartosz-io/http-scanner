---
headerName: location
description: Location supplies a URI reference used as a redirect target on many 3xx responses or as the identifier of a newly created resource on 201.
applicability: response
syntax: "Location: <URI-reference>"
examples:
  - "Location: https://www.example.com/new-path"
  - "Location: /orders/12345"
useCases:
  - Redirect a client from an obsolete path to the current canonical resource.
  - Identify the resource created by a successful 201 response.
commonMistakes:
  - Building a redirect from untrusted input without an allowlist and creating an open redirect.
  - Confusing Location with Content-Location, which identifies the enclosed representation rather than directing navigation.
securityConsiderations: Validate redirect targets and generated identifiers to prevent phishing, credential leakage, response splitting, and disclosure of internal hosts or object keys.
relatedHeaders:
  - content-location
  - retry-after
  - link
references:
  - label: RFC 9110 Location
    url: https://www.rfc-editor.org/rfc/rfc9110#name-location
  - label: MDN Location
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Location
---
## Meaning and behavior

Location contains a URI reference whose meaning depends on the response status. For redirection responses it identifies the target to which the client can navigate, with method handling determined by the particular 3xx status. On a 201 Created response it identifies a specific resource created by the request. The value can be absolute or relative; a relative reference is resolved against the effective request URI according to URI rules.

Location is distinct from Content-Location. Content-Location describes the URI of an enclosed representation and does not automatically redirect a user agent. Redirect statuses also differ: 301 and 308 are permanent signals, 302 and 307 are temporary, and 303 instructs retrieval with GET semantics. Clients, caches, and search engines can retain or interpret these choices differently, so status and target must be designed together.

## Implementation notes

Generate targets from trusted route construction rather than concatenating Host, forwarding fields, or arbitrary return URLs. If user-selected destinations are required, parse them and enforce exact allowed schemes, hosts, and paths. Prevent control characters and response splitting. Avoid leaking private service names, signed storage URLs, or predictable identifiers in 201 responses. Test relative resolution, query and fragment handling, proxy host normalization, every redirect status, POST behavior, caches, and loops. Keep authorization on the destination; a redirect does not grant access. For canonical migrations, update internal links and monitor chains rather than leaving multiple hops indefinitely.
