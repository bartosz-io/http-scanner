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

## Cookie attributes in practice

`Secure` limits a cookie to HTTPS requests, while `HttpOnly` prevents ordinary JavaScript from reading it. `SameSite=Lax` is a useful default for many login sessions, but cross-site workflows may require `SameSite=None; Secure` and a deliberate review of the associated CSRF defenses. Use `Max-Age` when an explicit lifetime in seconds is convenient, or `Expires` when an absolute expiry date is required. For deletion, send an expired cookie with the same name, Domain, and Path as the cookie being removed.

Prefer host-only cookies by omitting `Domain` unless subdomain sharing is an explicit requirement. The `__Host-` prefix gives a stronger convention for sensitive cookies: it requires `Secure`, a `/` Path, and no Domain attribute. It does not replace server-side session invalidation or authorization checks, but it makes accidental widening of the cookie scope easier to detect.

## Cookies, CORS, and credentials

Cookies may be attached to cross-origin requests according to the browser’s credentials mode, cookie attributes, and request context. CORS primarily controls whether browser JavaScript may read the response; a cookie can still be sent when CORS rejects response exposure, including in some simple state-changing requests. For a credentialed `fetch`, an explicit trusted origin is required instead of `Access-Control-Allow-Origin: *`, and the response must opt into credentials with `Access-Control-Allow-Credentials: true` if the browser is to expose it to script. Treat this as a coordinated policy: `SameSite`, CORS, CSRF protection, and session authorization must be tested together. Inspect the `Set-Cookie` values returned by the final public response, but do not expose live session identifiers in screenshots, examples, or shared reports.
