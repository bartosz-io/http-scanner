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
  - access-control-allow-credentials
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

## CORS preflight method exchange

Browser code defines the intended actual request. The browser—not application JavaScript—creates the CORS preflight fields when that request requires permission:

```js
fetch('https://api.example/items/42', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'updated' }),
});
```

For this request, a preflight and successful response can look like:

```http
OPTIONS /items/42 HTTP/1.1
Host: api.example
Origin: https://app.example
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: GET, PUT
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

`OPTIONS` is the preflight transport method. `PUT` is the proposed actual method and must be permitted by `Access-Control-Allow-Methods`; adding only `OPTIONS` to that response does not grant the later operation. The origin and any requested field names must also pass their respective CORS checks.

After a successful preflight, the browser can send the actual `PUT`. That route must still authenticate the caller, authorize the target object, validate the body, and enforce any CSRF protection appropriate to its credential model. A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not constrain non-browser clients.

## Common Access-Control-Allow-Methods errors

When the console reports that `PUT`, `PATCH`, or another method is not allowed, inspect the preflight before debugging the actual route. Confirm the `OPTIONS` request contains the expected `Origin`, `Access-Control-Request-Method`, and optional `Access-Control-Request-Headers`, then inspect the exact public response returned to the browser.

The preflight fails when the required method is missing from `Access-Control-Allow-Methods`, the field is absent, or another required CORS check fails. A proxy, redirect, authentication layer, CDN rule, or generic error handler may answer `OPTIONS` without the fields added by application middleware. Setting the right CORS fields only on the later response does not repair the preflight.

Method matching follows the Fetch rules; do not assume every custom method is matched case-insensitively. Return the canonical method tokens supported by the route and test the exact requested spelling. Avoid one broad global list that advertises administrative or destructive operations on resources that do not safely expose them cross-origin. If a changed policy appears stale, inspect `Access-Control-Max-Age` because the browser may reuse an earlier preflight grant.

## Wildcard, credentials, and safelisted methods

`Access-Control-Allow-Methods: *` has wildcard semantics only for requests without credentials. When the request credentials mode is `include`, Fetch treats `*` as the literal method name `*`, so a credentialed API should return the explicit methods it permits.

`GET`, `HEAD`, and `POST` are CORS-safelisted methods, but the method is only one part of the safelist. A request using one of them can still require preflight because of non-safelisted request headers or a non-safelisted `Content-Type`. Listing a method in `Access-Control-Allow-Methods` grants a successful preflight dimension; it does not transform a non-simple request into a simple request.

Return the narrow method set supported for the target resource and trusted origin policy. Do not list every method merely to silence a browser error.

## Access-Control-Allow-Methods vs Allow and authorization

`Access-Control-Allow-Methods` is browser CORS permission metadata returned for a preflight. `Allow` describes methods supported by an HTTP resource and commonly appears in general `OPTIONS` handling or a `405 Method Not Allowed` response. One field does not replace the other: a resource can support `PUT` while refusing to grant it to a particular cross-origin browser caller.

A CORS grant also does not prove that the route exists or that the caller may perform the operation. Apply authentication, object-level authorization, input validation, rate limits, and CSRF protection to the actual method just as you would for a same-origin or non-browser client. Keep CORS policy narrow, but treat server authorization as the authoritative enforcement boundary.
