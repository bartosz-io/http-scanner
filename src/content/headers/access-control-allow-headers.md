---
headerName: access-control-allow-headers
description: Access-Control-Allow-Headers names non-safelisted request fields a browser may include in the actual request after CORS preflight succeeds.
applicability: response
syntax: "Access-Control-Allow-Headers: <request-header-name>[, ...]"
examples:
  - "Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID"
useCases:
  - Permit an approved browser application to send Authorization or custom request metadata.
  - Return the narrow field set requested and supported by a particular API route.
commonMistakes:
  - Confusing allowed request fields with Access-Control-Expose-Headers for readable response metadata.
  - Reflecting arbitrary requested field names without considering what server middleware trusts them to mean.
securityConsiderations: Allowing a field does not validate its value; trusted proxy headers, identity assertions, and routing metadata must never become attacker-controlled through CORS.
relatedHeaders:
  - access-control-allow-methods
  - access-control-expose-headers
  - access-control-max-age
references:
  - label: Fetch Standard CORS protocol headers
    url: https://fetch.spec.whatwg.org/#http-new-header-syntax
  - label: MDN Access-Control-Allow-Headers
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Headers
---
## Meaning and behavior

Access-Control-Allow-Headers is returned during CORS preflight to approve request field names that are not CORS-safelisted. The browser announces proposed names in Access-Control-Request-Headers. The server's response must permit them, together with the origin and method, before the actual request is sent. This negotiation is about names rather than their future values. Safelisted fields under qualifying value restrictions can be used by simple requests without this preflight permission.

The field does not make a response field readable to script; Access-Control-Expose-Headers handles that opposite direction. It also does not validate Authorization tokens, Content-Type bodies, or custom metadata. A failed preflight generally prevents the planned non-simple browser request, but CORS is not protection against direct clients, and simple requests can still reach the server under their own rules.

## Implementation notes

Allow only request fields the route understands. Never accept client-supplied forwarding, internal identity, or routing fields merely because middleware expects them behind a trusted proxy. Validate every value after CORS processing. If reflecting requested names, compare them against a bounded case-insensitive allowlist first. Test allowed and denied combinations, duplicate names, unusual casing, safelisted value restrictions, credentials, and preflight cache behavior. Keep Content-Type parsing and body limits independent. When adding a custom field, update documentation and threat analysis rather than broadening a wildcard policy without review.
