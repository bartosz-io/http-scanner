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
  - access-control-max-age
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

## Credentialed CORS request and response

Browser code opts into a credentialed cross-origin fetch through its request configuration. The response header does not switch credentials on by itself:

```js
fetch('https://api.example/account', {
  credentials: 'include',
});
```

After validating the request `Origin` against an exact allowlist, the API can return that permitted origin together with credential permission:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
Vary: Origin
Set-Cookie: session=example; Secure; HttpOnly; SameSite=None
Content-Type: application/json

{"account":"example"}
```

The cookie attributes above are illustrative, not a universal session policy. A simple credentialed request can be sent without a preflight. If the actual response lacks a matching explicit origin or the case-sensitive token `true`, the browser can withhold that response from the calling script even though the server received and processed the request.

A non-simple request may first trigger an `OPTIONS` exchange. A conforming CORS preflight itself does not include credentials, but its response can state whether the later actual request may use credentials. The preflight response and the actual response must each contain the CORS fields required for their role.

## Common Access-Control-Allow-Credentials errors

The only enabling value is the case-sensitive token `true`. Values such as `false`, `True`, `1`, and `yes` do not opt into credentialed CORS. When credentials are unnecessary, omit the field rather than sending `false`.

A request whose credentials mode is `include` cannot share a response through `Access-Control-Allow-Origin: *`. Return the one validated origin instead, and include `Vary: Origin` when the selected value changes by request. Compare the complete origin—scheme, host, and port—rather than matching a suffix or blindly copying the incoming `Origin`.

When the browser reports an expected-`true` or wildcard-with-credentials error, inspect both the browser console and the final public network response. Check redirects, authentication failures, application errors, proxy responses, and CDN-served variants because they may bypass the middleware that adds CORS fields. For a preflighted flow, inspect both `OPTIONS` and the actual response; for a simple request, do not assume an `OPTIONS` request must appear. Test allowed and denied origins separately.

## Cookies, SameSite, CSRF, and authorization

Valid CORS fields do not override cookie `SameSite`, `Secure`, domain, path, or expiration rules. Browser third-party cookie policies can also prevent storage or sending even when the server's CORS response is correct. Diagnose cookie eligibility independently from response exposure, and inspect the final `Set-Cookie` field without copying live session values into shared reports.

Credentialed CORS does not authenticate a caller or grant object-level authorization. Validate the session or other credential and authorize every requested object on the server. A simple state-changing request may reach the application even when the browser later hides its response, so state-changing endpoints still require independent CSRF protection such as an appropriate token strategy, cookie policy, and origin checks. Treat CORS, cookies, authentication, authorization, and CSRF as coordinated but separate controls.
