---
headerName: access-control-allow-methods
description: Access-Control-Allow-Methods lists HTTP methods a browser may use for the actual request after a successful CORS preflight exchange.
applicability: response
syntax: "Access-Control-Allow-Methods: <method>[, <method>...]"
examples:
  - "Access-Control-Allow-Methods: GET, POST"
useCases:
  - Permit a trusted cross-origin application to perform selected non-simple API methods.
  - Answer a preflight with the narrow method set supported by a resource.
commonMistakes:
  - Listing every method globally even when individual resources implement a much smaller set.
  - Confusing this CORS field with Allow, which describes methods supported by an HTTP resource.
securityConsiderations: The field is browser permission metadata, not server authorization; every advertised method still needs authentication, authorization, validation, and CSRF analysis.
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-headers
  - access-control-max-age
references:
  - label: Fetch Standard CORS-preflight fetch
    url: https://fetch.spec.whatwg.org/#cors-preflight-fetch
  - label: MDN Access-Control-Allow-Methods
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Methods
---
## Meaning and behavior

Access-Control-Allow-Methods appears in a CORS preflight response and lists methods permitted for a subsequent actual request. When browser script proposes a non-safelisted method such as PUT or DELETE, the browser sends OPTIONS with Access-Control-Request-Method. The response must grant that method, along with origin and any requested-header permissions, before the browser proceeds. GET, HEAD, and some POST requests can qualify as simple requests and may not require this method negotiation.

The field differs from the standard Allow response field. Allow describes methods a resource supports and commonly appears with 405 or OPTIONS semantics; Access-Control-Allow-Methods is specifically browser CORS permission. Neither field authenticates a user. CORS failure can prevent browser script from continuing, but direct clients are not constrained, and simple requests may already have reached the resource.

## Implementation notes

Generate the list from the actual route's supported cross-origin operations rather than a global permissive constant. Normalize method comparison according to Fetch rules and avoid granting administrative methods to broad origins. Configure OPTIONS handling before authentication middleware only when the resulting policy remains safe and carries no protected data. Test each allowed and denied method, simple requests, preflight caching, redirects, and errors. Keep endpoint authorization identical whether the request comes from a browser or another client. If methods change, review Access-Control-Max-Age because browsers may retain an earlier preflight grant.
