---
headerName: access-control-allow-credentials
description: Access-Control-Allow-Credentials with the exact value true permits a browser to expose a CORS response when the request credentials mode includes credentials.
applicability: response
syntax: "Access-Control-Allow-Credentials: true"
examples:
  - "Access-Control-Allow-Credentials: true"
useCases:
  - Allow an approved web origin to read an API response requested with cookies.
  - Support browser HTTP authentication or client credentials in a narrowly configured CORS flow.
commonMistakes:
  - Using values such as false, yes, or 1 even though only the case-sensitive token true enables behavior.
  - Treating the field as authentication or as permission to use Access-Control-Allow-Origin wildcard.
securityConsiderations: Credentialed cross-origin reads can expose private user data, so origin allowlists, CSRF defenses, cookie attributes, and server authorization must all be correct.
relatedHeaders:
  - access-control-allow-origin
  - set-cookie
  - vary
references:
  - label: Fetch Standard CORS credentials
    url: https://fetch.spec.whatwg.org/#cors-protocol-and-credentials
  - label: MDN Access-Control-Allow-Credentials
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials
---
## Meaning and behavior

Access-Control-Allow-Credentials is a CORS response field with one enabling value: the case-sensitive token `true`. It participates when a browser request's credentials mode includes credentials, such as cookies or HTTP authentication. Together with a matching Access-Control-Allow-Origin value, it allows browser script to receive the response. The field does not cause a client to send credentials by itself; request configuration, cookie policy, SameSite behavior, and browser rules determine that.

Credentialed CORS cannot use `Access-Control-Allow-Origin: *` for response sharing. The server must return a permitted serialized origin. Simple credentialed requests can reach the server without a preflight, while non-simple requests may be preflighted. In either case, CORS controls browser exposure and does not authenticate the caller or stop non-browser clients. A blocked response can still correspond to a state-changing request that the server processed.

## Implementation notes

Enable credentials only for endpoints and origins that require them. Validate the Origin against an exact allowlist and return `Vary: Origin` when permission changes dynamically. Require normal authentication and object-level authorization on every request. Protect state-changing operations from CSRF using suitable tokens, SameSite cookie strategy, and origin checks rather than relying on CORS alone. Test cookies with real SameSite, Secure, domain, and path settings. Exercise allowed and denied origins, simple POSTs, preflights, expired sessions, redirects, and error responses. Omit the field rather than sending `false`, which has no disabling semantics beyond absence.
