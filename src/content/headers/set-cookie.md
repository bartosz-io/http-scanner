---
headerName: set-cookie
description: Set-Cookie asks a user agent to store one cookie and its lifetime, scope, transport, script-access, and cross-site behavior attributes.
applicability: response
syntax: "Set-Cookie: <name>=<value>[; <attribute>[=<value>]]..."
examples:
  - "Set-Cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax"
  - "Set-Cookie: preferences=compact; Max-Age=2592000; Path=/; SameSite=Lax"
useCases:
  - Establish an authenticated session cookie with narrow scope and browser security attributes.
  - Persist a non-sensitive user preference for a controlled period.
commonMistakes:
  - Combining several cookies into one comma-separated field value even though Expires dates and cookie grammar make folding unsafe.
  - Omitting Secure, HttpOnly, SameSite, or restrictive scope from a sensitive session cookie.
securityConsiderations: Cookies can carry ambient authority; minimize scope and lifetime, prevent fixation, rotate session identifiers, and keep server-side authorization independent of attributes.
relatedHeaders:
  - clear-site-data
  - strict-transport-security
  - access-control-allow-credentials
references:
  - label: RFC 6265 HTTP State Management
    url: https://www.rfc-editor.org/rfc/rfc6265
  - label: Current cookies specification draft
    url: https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html
  - label: MDN Set-Cookie
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
---
## Meaning and behavior

Each Set-Cookie field asks a user agent to create, replace, or expire one cookie. The name and value are followed by attributes. `Max-Age` or `Expires` controls persistence, Domain and Path define request scope, Secure limits transmission to secure requests, HttpOnly prevents ordinary script access, and SameSite constrains cross-site attachment. Host-only cookies, created without Domain, are generally narrower than cookies shared with subdomains. Prefixes such as `__Host-` impose additional browser requirements that can make sensitive cookie scope easier to audit.

Multiple cookies must be sent as separate Set-Cookie field lines. They cannot be safely combined into an ordinary comma-separated list because cookie grammar and Expires dates use commas differently from list-based HTTP fields. Browsers also filter Set-Cookie from frontend JavaScript response APIs. The scanner reports observed Set-Cookie values unmasked in this release; those values were already present on the public response path, but shared reports should still be reviewed before distribution.

## Implementation notes

Use random, rotated session identifiers and keep session meaning on the server. Apply Secure and HttpOnly to authentication cookies, choose SameSite based on tested cross-site flows, and use the narrowest Domain and Path. Set explicit lifetime and revoke server sessions on logout rather than relying only on client expiry. Prevent session fixation after authentication and privilege changes. Test redirects, CORS credential mode, subdomains, embedded contexts, clock handling, duplicate names, and deletion with matching scope. Never place secrets in a cookie merely because HttpOnly hides them from ordinary script; browser requests still attach ambient cookies according to scope.
