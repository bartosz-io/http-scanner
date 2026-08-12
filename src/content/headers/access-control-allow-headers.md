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
  - access-control-allow-origin
  - access-control-allow-methods
  - access-control-allow-credentials
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

## CORS preflight request-header exchange

Browser code defines the intended actual request. The browser—not application JavaScript—creates `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers` when that request requires a CORS preflight:

```js
fetch('https://api.example/items', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'new item' }),
});
```

For this request, a preflight and successful response can look like:

```http
OPTIONS /items HTTP/1.1
Host: api.example
Origin: https://app.example
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Authorization, Content-Type
Vary: Origin
```

`OPTIONS` is the preflight transport method; `POST` is the intended actual method. `Access-Control-Request-Headers` announces request-field names, not the future field values. The browser sends the actual request only after the origin, method, and requested names pass their respective CORS checks. Do not try to set the browser-controlled preflight fields manually from `fetch()`.

After a successful preflight, the actual route must still authenticate the bearer token, authorize the operation, parse and validate the JSON body, enforce body-size limits, and apply its other server policies. A successful CORS check is permission to proceed from browser code, not proof that the operation will succeed.

## Fix “Request header field … is not allowed”

When the console reports that a request header field is not allowed by `Access-Control-Allow-Headers`, inspect the browser-generated `OPTIONS` request and the exact public response. Then compare every name in `Access-Control-Request-Headers` with the names authorized by `Access-Control-Allow-Headers`. Every name announced there—such as `authorization`, `content-type`, `x-api-key`, or another custom field—must be authorized under the Fetch rules; `content-type` can appear because its proposed value is not safelisted.

The check fails when a required name is absent from the response policy or another CORS dimension fails. A proxy, redirect, authentication layer, CDN rule, or generic error handler may answer `OPTIONS` before the intended CORS middleware runs. Setting the right CORS fields only on the later actual response does not repair the preflight.

Another common mistake is that the client mistakenly sends response fields such as `Access-Control-Allow-Origin` or `Access-Control-Allow-Headers` as request headers. The browser then announces those names in its preflight, creating an error that cannot grant the client authority to choose the server's CORS policy. Remove those response fields from client code.

Header-name matching is ASCII case-insensitive, so compare names rather than presentation casing. If the server reflects requested names, validate every one against a bounded case-insensitive allowlist first; arbitrary reflection is not an authorization policy. If a corrected policy appears stale, inspect `Access-Control-Max-Age` because the browser may reuse an earlier preflight result.

## Wildcard, Authorization, and safelisted value restrictions

`Access-Control-Allow-Headers: *` has wildcard semantics for requests without credentials. When credentials mode is `include`, `*` is only the literal field name `*`, so required names must be listed explicitly. `Authorization` is a non-wildcard request-header name and must always be listed explicitly, including for requests without credentials.

An application-supplied `Authorization` field does not by itself set Fetch credentials mode to `include`; the field and credentials mode are separate concepts even though both matter when evaluating wildcard behavior.

CORS-safelisted request-header names are ordinarily allowed without being listed, but their values must satisfy additional Fetch restrictions. `Content-Type` is safelisted only when its media type is `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain` and its value satisfies the applicable byte restrictions. `Content-Type: application/json` therefore participates in this preflight.

Listing a safelisted field name can authorize it beyond the additional safelist restrictions, but it does not make the value valid for the application. Prefer explicit names for credentialed or security-sensitive APIs, and do not broaden the policy merely to silence a browser error.

## Allowed names vs trusted values and response exposure

`Access-Control-Allow-Headers` authorizes request-field names for a browser CORS check. It does not validate a bearer token, media type, API key, tenant identifier, signature, tracing value, or custom metadata. Validate each actual value at the application boundary and reject malformed or unauthorized requests normally.

Do not allow client-controlled forwarding, internal identity, or routing fields merely because trusted proxy middleware normally supplies them. Reject or overwrite those values at the correct trust boundary; a CORS allowlist does not turn an untrusted request field into trusted infrastructure metadata.

This field also does not expose response metadata to JavaScript. `Access-Control-Expose-Headers` controls access to non-safelisted response fields, which is the opposite direction from request-header permission.

A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not block direct HTTP clients. Simple requests can also reach the server under their own rules. Authentication, authorization, validation, rate limiting, and CSRF defenses remain server responsibilities.
